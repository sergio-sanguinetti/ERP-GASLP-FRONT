const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Roles cuyos pagos se consideran "de oficina" para el corte
const ROLES_OFICINA = ['oficina', 'planta', 'administrador', 'superAdministrador'];
// Tipos de forma de pago que entran al corte de oficina
const TIPOS_FORMA_PAGO = ['efectivo', 'tarjeta'];

/**
 * Construye la lista de nombres string de los usuarios con rol de oficina.
 * El campo usuario_registro en Pago guarda el nombre concatenado como string,
 * por lo que necesitamos construir la lista de posibles nombres para filtrar.
 */
async function _getNombresUsuariosOficina() {
  const usuarios = await prisma.usuario.findMany({
    where: { rol: { in: ROLES_OFICINA } },
    select: { nombres: true, apellidoPaterno: true, email: true }
  });
  const nombres = new Set();
  for (const u of usuarios) {
    const completo = `${u.nombres || ''} ${u.apellidoPaterno || ''}`.trim();
    if (completo) nombres.add(completo);
    if (u.nombres) nombres.add(u.nombres.trim());
    if (u.email) nombres.add(u.email);
  }
  return Array.from(nombres);
}

function _formatClienteNombre(c) {
  if (!c) return 'Cliente';
  if (c.nombreGrupo) return c.nombreGrupo;
  return [c.nombre, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(' ').trim() || 'Cliente';
}

function _resolverFolioNota(pago) {
  if (pago.tipo === 'abono_general' || !pago.notaCredito) return 'Abono general';
  return pago.notaCredito?.pedido?.numeroPedido || pago.notaCredito?.numeroNota || 's/folio';
}

function _clasificarFormasPago(formasPago) {
  const validas = (formasPago || []).filter(fp => {
    const tipo = (fp.formaPago?.tipo || '').toLowerCase();
    return TIPOS_FORMA_PAGO.includes(tipo);
  });
  const totalEfectivo = validas
    .filter(fp => (fp.formaPago?.tipo || '').toLowerCase() === 'efectivo')
    .reduce((s, fp) => s + Number(fp.monto || 0), 0);
  const totalTarjeta = validas
    .filter(fp => (fp.formaPago?.tipo || '').toLowerCase() === 'tarjeta')
    .reduce((s, fp) => s + Number(fp.monto || 0), 0);
  return { validas, totalEfectivo, totalTarjeta, total: totalEfectivo + totalTarjeta };
}

/**
 * Lista los pagos disponibles para incluir en un corte de oficina:
 * - En el rango de fechas
 * - Registrados por usuarios de rol oficina/planta/admin
 * - Con al menos una forma de pago efectivo o tarjeta
 * - Que no estén ya incluidos en otro corte de oficina
 */
async function getPagosDisponibles(fechaDesde, fechaHasta) {
  const desde = new Date(fechaDesde);
  const hasta = new Date(fechaHasta);
  // Si no trae hora, extender hasta fin del día
  if (hasta.getUTCHours() === 0 && hasta.getUTCMinutes() === 0 && hasta.getUTCSeconds() === 0) {
    hasta.setUTCHours(23, 59, 59, 999);
  }

  const nombresOficina = await _getNombresUsuariosOficina();

  // IDs de pagos ya incluidos en cortes existentes
  const yaAsignados = await prisma.corteOficinaPago.findMany({ select: { pagoId: true } });
  const yaAsignadosSet = new Set(yaAsignados.map(x => x.pagoId));

  const pagos = await prisma.pago.findMany({
    where: {
      fechaPago: { gte: desde, lte: hasta },
      usuarioRegistro: { in: nombresOficina.length ? nombresOficina : ['__sin_usuarios__'] },
      estado: { not: 'rechazado' },
    },
    include: {
      cliente: { select: { nombre: true, apellidoPaterno: true, apellidoMaterno: true, nombreGrupo: true } },
      notaCredito: {
        select: {
          id: true,
          numeroNota: true,
          importe: true,
          pedido: { select: { numeroPedido: true } }
        }
      },
      formasPago: {
        include: { formaPago: { select: { nombre: true, tipo: true } } }
      }
    },
    orderBy: { fechaPago: 'asc' }
  });

  const disponibles = [];
  for (const p of pagos) {
    if (yaAsignadosSet.has(p.id)) continue;

    const { validas, totalEfectivo, totalTarjeta, total } = _clasificarFormasPago(p.formasPago);
    if (validas.length === 0 || total <= 0) continue;

    const tipoPrincipal = totalEfectivo >= totalTarjeta ? 'efectivo' : 'tarjeta';
    const nombreFormas = validas.map(fp => fp.formaPago?.nombre || fp.formaPago?.tipo || '').filter(Boolean).join(' + ');
    const referencia = validas.map(fp => fp.referencia).filter(Boolean).join(', ');

    disponibles.push({
      id: p.id,
      fechaPago: p.fechaPago,
      horaPago: p.horaPago,
      clienteNombre: _formatClienteNombre(p.cliente),
      folioNota: _resolverFolioNota(p),
      formaPago: tipoPrincipal,
      formaPagoNombre: nombreFormas,
      monto: total,
      totalEfectivo,
      totalTarjeta,
      usuarioRegistro: p.usuarioRegistro || 'Oficina',
      estado: p.estado,
      referencia: referencia || null,
      observaciones: p.observaciones || null,
    });
  }

  // Totales agregados
  const totalEfectivo = disponibles.reduce((s, d) => s + (d.totalEfectivo || 0), 0);
  const totalTarjeta = disponibles.reduce((s, d) => s + (d.totalTarjeta || 0), 0);

  return {
    pagos: disponibles,
    totales: {
      total: totalEfectivo + totalTarjeta,
      efectivo: totalEfectivo,
      tarjeta: totalTarjeta,
      countEfectivo: disponibles.filter(d => (d.totalEfectivo || 0) > 0).length,
      countTarjeta: disponibles.filter(d => (d.totalTarjeta || 0) > 0).length,
      count: disponibles.length,
    }
  };
}

/**
 * Crea un corte de oficina con los pagos seleccionados.
 * Se hace en transacción para garantizar atomicidad.
 */
async function createCorte(data) {
  const {
    creadoPorId, creadoPorNombre, fechaDesde, fechaHasta,
    pagoIds, depositoPlanta, folioDepPlanta, depositoCajero, folioDepCajero,
    monedasExtra, efectivoExtra, observaciones, sedeId
  } = data;

  if (!creadoPorId || !creadoPorNombre) throw new Error('Falta información del usuario que crea el corte');
  if (!Array.isArray(pagoIds) || pagoIds.length === 0) throw new Error('No hay pagos seleccionados');

  // Verificar que ningún pago esté ya en otro corte
  const yaAsignados = await prisma.corteOficinaPago.findMany({
    where: { pagoId: { in: pagoIds } },
    select: { pagoId: true }
  });
  if (yaAsignados.length > 0) {
    throw new Error(`${yaAsignados.length} pago(s) ya están incluidos en otro corte`);
  }

  // Traer los pagos completos para snapshot
  const pagos = await prisma.pago.findMany({
    where: { id: { in: pagoIds } },
    include: {
      cliente: { select: { nombre: true, apellidoPaterno: true, apellidoMaterno: true, nombreGrupo: true } },
      notaCredito: {
        select: { numeroNota: true, pedido: { select: { numeroPedido: true } } }
      },
      formasPago: {
        include: { formaPago: { select: { nombre: true, tipo: true } } }
      }
    }
  });

  let totalEfectivo = 0;
  let totalTarjeta = 0;
  const pagosSnapshot = [];

  for (const p of pagos) {
    const { validas, totalEfectivo: te, totalTarjeta: tt, total } = _clasificarFormasPago(p.formasPago);
    if (validas.length === 0 || total <= 0) continue;

    totalEfectivo += te;
    totalTarjeta += tt;

    const tipoPrincipal = te >= tt ? 'efectivo' : 'tarjeta';
    const nombreFormas = validas.map(fp => fp.formaPago?.nombre || fp.formaPago?.tipo || '').filter(Boolean).join(' + ');
    const referencia = validas.map(fp => fp.referencia).filter(Boolean).join(', ');

    pagosSnapshot.push({
      pagoId: p.id,
      monto: total,
      formaPago: tipoPrincipal,
      formaPagoNombre: nombreFormas || null,
      usuarioRegistro: p.usuarioRegistro || 'Oficina',
      clienteNombre: _formatClienteNombre(p.cliente),
      folioNota: _resolverFolioNota(p),
      referencia: referencia || null,
      fechaPago: p.fechaPago,
    });
  }

  if (pagosSnapshot.length === 0) {
    throw new Error('Ninguno de los pagos seleccionados tiene formas de pago válidas para corte de oficina');
  }

  const totalGeneral = totalEfectivo + totalTarjeta;
  const efectivoEsperado = totalEfectivo;
  const efectivoDepositadoTotal =
    Number(depositoPlanta || 0) +
    Number(depositoCajero || 0) +
    Number(monedasExtra || 0) +
    Number(efectivoExtra || 0);
  const diferencia = efectivoDepositadoTotal - efectivoEsperado;

  const corte = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.corteOficina.create({
      data: {
        creadoPorId,
        creadoPorNombre,
        fechaDesde: new Date(fechaDesde),
        fechaHasta: new Date(fechaHasta),
        totalEfectivo,
        totalTarjeta,
        totalGeneral,
        depositoPlanta: Number(depositoPlanta || 0),
        folioDepPlanta: folioDepPlanta || null,
        depositoCajero: Number(depositoCajero || 0),
        folioDepCajero: folioDepCajero || null,
        monedasExtra: Number(monedasExtra || 0),
        efectivoExtra: Number(efectivoExtra || 0),
        diferencia,
        estado: 'pendiente',
        observaciones: observaciones || null,
        sedeId: sedeId || null,
      }
    });

    for (const snap of pagosSnapshot) {
      await tx.corteOficinaPago.create({
        data: { corteId: nuevo.id, ...snap }
      });
    }

    return nuevo;
  });

  return { ...corte, pagosIncluidos: pagosSnapshot.length };
}

/**
 * Lista cortes con filtros
 */
async function listCortes(filtros = {}) {
  const where = {};
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.desde || filtros.hasta) {
    where.createdAt = {};
    if (filtros.desde) where.createdAt.gte = new Date(filtros.desde);
    if (filtros.hasta) {
      const h = new Date(filtros.hasta);
      h.setUTCHours(23, 59, 59, 999);
      where.createdAt.lte = h;
    }
  }
  const cortes = await prisma.corteOficina.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { pagos: true } }
    }
  });
  return cortes;
}

/**
 * Detalle completo de un corte con todos sus pagos
 */
async function getCorte(id) {
  const corte = await prisma.corteOficina.findUnique({
    where: { id },
    include: {
      pagos: { orderBy: { fechaPago: 'asc' } }
    }
  });
  if (!corte) throw new Error('Corte no encontrado');
  return corte;
}

/**
 * Cierra un corte (pendiente -> validado)
 */
async function cerrarCorte(id) {
  const corte = await prisma.corteOficina.findUnique({ where: { id } });
  if (!corte) throw new Error('Corte no encontrado');
  if (corte.estado === 'validado') return corte;
  return await prisma.corteOficina.update({
    where: { id },
    data: { estado: 'validado', cerradoEn: new Date() }
  });
}

/**
 * Reabre un corte (validado -> pendiente). Solo el creador o admin.
 */
async function reabrirCorte(id, usuarioId, rolUsuario) {
  const corte = await prisma.corteOficina.findUnique({ where: { id } });
  if (!corte) throw new Error('Corte no encontrado');
  const esAdmin = ['administrador', 'superAdministrador'].includes(rolUsuario);
  const esCreador = corte.creadoPorId === usuarioId;
  if (!esAdmin && !esCreador) {
    throw new Error('Solo el creador del corte o un administrador puede reabrirlo');
  }
  return await prisma.corteOficina.update({
    where: { id },
    data: { estado: 'pendiente', cerradoEn: null }
  });
}

module.exports = {
  getPagosDisponibles,
  createCorte,
  listCortes,
  getCorte,
  cerrarCorte,
  reabrirCorte,
};
