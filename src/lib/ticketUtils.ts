import type { ConfiguracionTicket } from './api'

export interface PedidoTicket {
  numeroPedido: string
  fechaPedido: string
  horaPedido?: string
  ventaTotal?: number
  tipoServicio?: string
  cliente?: { nombre: string; apellidoPaterno?: string; apellidoMaterno?: string; calle?: string; numeroExterior?: string; colonia?: string; ciudad?: string; estado?: string }
  repartidor?: { nombres?: string; apellidoPaterno?: string; apellidoMaterno?: string }
  ruta?: { nombre?: string }
  pagos?: Array<{ tipo?: string; monto?: number; folio?: string; metodo?: { nombre?: string }; firmaCliente?: string }>
  productosPedido?: Array<{ cantidad?: number; precio?: number; precioUnitario?: number; subtotal?: number; descuento?: string; descuentoMonto?: number; descuentoAplicado?: number; producto?: { nombre?: string; cantidadKilos?: number } }>
  calculoPipas?: any
  descuentoTotal?: number
  formasPago?: any
}

function numberToWords(num: number): string {
  const integerPart = Math.floor(num)
  const decimalPart = Math.round((num - integerPart) * 100)
  return `${integerPart.toLocaleString('es-MX')} ${String(decimalPart).padStart(2, '0')}/100 M.N.`
}

export function generarHtmlTicketVenta(pedido: any, config: ConfiguracionTicket): string {
  const total = pedido.ventaTotal ?? 0
  const clientName = pedido.cliente
    ? `${pedido.cliente.nombre} ${pedido.cliente.apellidoPaterno ?? ''} ${pedido.cliente.apellidoMaterno ?? ''}`.trim()
    : 'Público General'
  const clientAddress = pedido.cliente
    ? [pedido.cliente.calle, pedido.cliente.numeroExterior, pedido.cliente.colonia].filter(x => x && x !== 'Por definir' && x !== 'Por definir S/N').join(', ')
    : ''
  const repartidorName = pedido.repartidor
    ? `${pedido.repartidor.nombres ?? ''} ${pedido.repartidor.apellidoPaterno ?? ''}`.trim()
    : 'Operador'

  const folio = pedido.numeroPedido || `PED-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0000`

  // Fecha formateada
  const fecha = new Date(pedido.fechaPedido)
  const esMedianoche = fecha.getUTCHours() === 0 && fecha.getUTCMinutes() === 0 && fecha.getUTCSeconds() === 0
  let formattedDate: string
  if (esMedianoche && pedido.numeroPedido && pedido.numeroPedido.length >= 12) {
    const raw = pedido.numeroPedido.replace('PED-', '').slice(0, 8)
    const anio = raw.slice(0, 4)
    const mes = raw.slice(4, 6)
    const dia = raw.slice(6, 8)
    formattedDate = `${dia}/${mes}/${anio}, ${pedido.horaPedido || '00:00'}`
  } else {
    formattedDate = fecha.toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'America/Mexico_City'
    })
  }

  // --- PRODUCTOS ---
  let productsHTML = ''
  const esPipas = pedido.tipoServicio === 'pipas' || pedido.tipoServicio === 'pipa'

  if (esPipas) {
    // Pipas: usar calculoPipas para litros y precio
    let cp = pedido.calculoPipas
    if (typeof cp === 'string') try { cp = JSON.parse(cp) } catch { cp = null }

    if (Array.isArray(cp)) {
      productsHTML = cp.map((carga: any, idx: number) => {
        const litros = parseFloat(carga.cantidadLitros || 0)
        const precio = parseFloat(carga.precioPorLitro || 0)
        const subtotal = litros * precio
        const descMonto = parseFloat(carga.descuentoPorLitro || 0) * litros
        return `<tr><td colspan="2" style="padding-top:6px;"><b>${litros.toFixed(2)}L</b> Carga ${cp.length > 1 ? (idx + 1) : ''}</td><td style="text-align:right;padding-top:6px;">$${subtotal.toFixed(2)}</td></tr>
          <tr><td colspan="3" class="small gray">&nbsp;&nbsp;<i>Precio: $${precio.toFixed(2)}/L</i></td></tr>
          ${descMonto > 0 ? `<tr><td colspan="2" class="small">&nbsp;&nbsp;Descuento:</td><td class="small" style="text-align:right;color:#333;">-$${descMonto.toFixed(2)}</td></tr>` : ''}`
      }).join('')
    } else if (cp) {
      const litros = parseFloat(cp.cantidadLitros || 0)
      const precio = parseFloat(cp.precioPorLitro || 0)
      const subtotal = litros * precio
      const descMonto = parseFloat(cp.descuentoPorLitro || 0) * litros
      productsHTML = `<tr><td colspan="2"><b>${litros.toFixed(2)}L</b> Carga</td><td style="text-align:right;">$${subtotal.toFixed(2)}</td></tr>
        <tr><td colspan="3" class="small gray">&nbsp;&nbsp;<i>Precio: $${precio.toFixed(2)}/L</i></td></tr>
        ${descMonto > 0 ? `<tr><td colspan="2" class="small">&nbsp;&nbsp;Descuento:</td><td class="small" style="text-align:right;color:#333;">-$${descMonto.toFixed(2)}</td></tr>` : ''}`
    } else if (pedido.productosPedido?.length) {
      // Fallback: usar productosPedido
      const pp = pedido.productosPedido[0]
      productsHTML = `<tr><td colspan="2"><b>${pp.cantidad}</b> Litro de Gas LP</td><td style="text-align:right;">$${total.toFixed(2)}</td></tr>`
    }
  } else {
    // Cilindros
    if (pedido.productosPedido && pedido.productosPedido.length > 0) {
      productsHTML = pedido.productosPedido.map((pp: any) => {
        const cant = pp.cantidad ?? 1
        const precio = pp.precio ?? pp.precioUnitario ?? 0
        const subtotalBruto = cant * precio
        const descMonto = pp.descuentoMonto ?? pp.descuentoAplicado ?? 0
        const subtotalNeto = pp.subtotal ?? Math.max(0, subtotalBruto - descMonto)
        const nombre = pp.producto?.nombre ?? 'Cilindro'

        let html = `<tr><td colspan="2">${cant} x ${nombre}</td><td style="text-align:right;">${descMonto > 0 ? `$${subtotalBruto.toFixed(2)}` : `$${subtotalNeto.toFixed(2)}`}</td></tr>`
        if (descMonto > 0) {
          html += `<tr><td colspan="2" class="small">&nbsp;&nbsp;Descuento (${pp.descuento || 'Aplicado'}):</td><td class="small" style="text-align:right;">-$${descMonto.toFixed(2)}</td></tr>`
        }
        return html
      }).join('')
    } else {
      productsHTML = `<tr><td colspan="2">1 Producto</td><td style="text-align:right;">$${total.toFixed(2)}</td></tr>`
    }
  }

  // --- DESCUENTO GLOBAL ---
  let discountHTML = ''
  const descTotal = pedido.descuentoTotal ?? 0
  if (descTotal > 0) {
    const tieneDescPorProducto = pedido.productosPedido?.some((pp: any) => (pp.descuentoMonto ?? pp.descuentoAplicado ?? 0) > 0)
    if (!tieneDescPorProducto) {
      discountHTML = `<tr class="discount-row"><td colspan="2">Descuento:</td><td style="text-align:right;">-$${descTotal.toFixed(2)}</td></tr>`
    }
  }

  // --- FORMAS DE PAGO ---
  let paymentHTML = ''
  let isCredit = false
  if (pedido.pagos && pedido.pagos.length > 0) {
    paymentHTML = pedido.pagos.map((p: any) => {
      const nombre = p.tipo === 'credito' ? 'CRÉDITO' : (p.metodo?.nombre ?? p.tipo ?? 'Pago').toUpperCase()
      if (nombre.includes('CRÉD') || nombre.includes('CRED')) isCredit = true
      const folioStr = p.folio ? ` (${p.folio})` : ''
      return `<tr><td colspan="2">${nombre}${folioStr}:</td><td style="text-align:right;">$${(p.monto ?? 0).toFixed(2)}</td></tr>`
    }).join('')
  } else if (total <= 0) {
    paymentHTML = `<tr><td colspan="3" style="text-align:center;"><i>Sin costo - 100% descuento</i></td></tr>`
  }

  // --- PAGARÉ para crédito ---
  let pagareHTML = ''
  if (isCredit) {
    pagareHTML = `
      <div style="margin-top:15px;border:2px solid #000;padding:8px;">
        <div style="text-align:center;font-weight:700;font-size:13px;margin-bottom:6px;">PAGARÉ</div>
        <div style="font-size:10px;line-height:1.4;">
          Recibí la mercancía descrita en este ticket a mi entera satisfacción y me comprometo a liquidar 
          el monto total de <b>$${total.toFixed(2)} (${numberToWords(total)})</b> a <b>GAS PROVIDENCIA</b> en el plazo acordado.
        </div>
        <div style="margin-top:30px;text-align:center;">
          <div style="border-top:1px solid #000;width:80%;margin:0 auto;padding-top:4px;font-size:9px;font-weight:700;">Nombre y firma</div>
        </div>
      </div>`
  }

  // --- FIRMA del cliente ---
  const signatureFromPago = pedido.pagos?.find((p: any) => p.firmaCliente)?.firmaCliente
  const signatureHTML = signatureFromPago && typeof signatureFromPago === 'string'
    ? `<div style="margin: 10px 0;"><p style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">Firma del cliente:</p><img src="${signatureFromPago}" alt="Firma" style="max-width: 100%; max-height: 80px; border: 1px solid #ccc; display: block;" /></div>`
    : ''

  // --- COMPANY INFO ---
  const companyInfo = {
    name: config.nombreEmpresa ?? 'GAS PROVIDENCIA',
    address: config.direccion ?? '',
    city: config.razonSocial ?? '*El Gas que Rinde lo que Cuesta*',
    phone: config.telefono ?? '4686863030',
    rfc: config.rfc ?? 'ERPGASLP001XXX',
    logo: config.logo,
    mostrarLogo: config.mostrarLogo ?? true,
    tamañoLogo: config.tamañoLogo ?? 'mediano',
    redesSociales: (config as any).redesSociales ?? {},
    textos: config.textos ?? {},
  }

  // --- HTML COMPLETO (formato idéntico a la app) ---
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8">
  <style>
    @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; } }
    body { font-family: Arial, Helvetica, sans-serif; max-width: 80mm; width: 80mm; margin: 0 auto; padding: 2px 4px; font-size: 13px; color: #000; line-height: 1.3; box-sizing: border-box; }
    * { box-sizing: border-box; }
    b, strong { font-weight: 700; }
    .header { text-align: center; margin-bottom: 0; padding: 0; }
    .zone { font-size: 10px; margin: 1px 0; font-weight: 600; }
    .slogan { font-size: 11px; font-style: italic; font-weight: 700; }
    .tel { font-size: 11px; font-weight: 700; }
    .rfc { font-size: 11px; font-weight: 700; }
    .dbl { border-top: 3px solid #000; margin: 4px 0; }
    .dash { border-top: 1px dashed #000; margin: 3px 0; }
    .title { text-align: center; font-size: 16px; font-weight: 700; margin: 3px 0; }
    .folio { text-align: center; font-size: 12px; font-weight: 700; }
    .info td { font-size: 12px; font-weight: 700; padding: 1px 0; }
    .info td:last-child { text-align: right; }
    .section { text-align: center; font-weight: 700; font-size: 12px; border-top: 2px solid #000; border-bottom: 1px solid #000; padding: 3px; margin: 3px 0; }
    .products { width: 100%; border-collapse: collapse; font-size: 12px; }
    .products td { padding: 2px 0; font-weight: 700; }
    .small { font-size: 10px; font-weight: 600; }
    .gray { color: #333; }
    .total-row td { font-size: 16px; font-weight: 700; padding-top: 3px; }
    .discount-row td { font-size: 11px; font-weight: 700; }
    .payment td { font-size: 12px; font-weight: 700; padding: 2px 0; }
    .operator { font-size: 12px; font-weight: 700; }
    .footer { text-align: center; font-size: 10px; margin-top: 8px; font-weight: 600; }
    .qr { text-align: center; margin-top: 6px; }
  </style></head><body>
    <div class="header">
      ${companyInfo.mostrarLogo && companyInfo.logo ? `<img src="${companyInfo.logo}" style="width:100px;height:auto;display:block;margin:0 auto;" />` : ''}
      ${companyInfo.address ? `<div class="zone">📍 ${companyInfo.address}</div>` : ''}
      <div class="slogan">${companyInfo.city}</div>
      <div class="tel">Tel: ${companyInfo.phone}</div>
      <div class="rfc">RFC: ${companyInfo.rfc}</div>
      ${companyInfo.redesSociales?.facebook || companyInfo.redesSociales?.instagram ? `
      <div style="font-size:9px;margin-top:4px;font-weight:700;">
        ${companyInfo.redesSociales.facebook ? `📘 FB: /${companyInfo.redesSociales.facebook}` : ''}
        ${companyInfo.redesSociales.facebook && companyInfo.redesSociales.instagram ? ' | ' : ''}
        ${companyInfo.redesSociales.instagram ? `📷 IG: @${companyInfo.redesSociales.instagram}` : ''}
      </div>` : ''}
      ${companyInfo.textos?.encabezado ? `<div style="font-size:9px;font-style:italic;margin-top:2px;">${companyInfo.textos.encabezado}</div>` : ''}
    </div>

    <div class="dbl"></div>
    <div class="title">TICKET DE VENTA</div>
    <div class="folio">Folio: ${folio}</div>
    <div class="dash"></div>

    <table class="info" width="100%">
      <tr><td>Fecha:</td><td>${formattedDate}</td></tr>
      <tr><td>Cliente:</td><td>${clientName}</td></tr>
      ${clientAddress ? `<tr><td>Dir:</td><td>${clientAddress.substring(0, 35)}</td></tr>` : ''}
    </table>

    <div class="dbl"></div>
    <div class="section">PRODUCTOS</div>

    <table class="products" width="100%">
      ${productsHTML}
    </table>

    <div class="dash"></div>
    ${discountHTML ? `<table class="products" width="100%">${discountHTML}</table>` : ''}
    <table class="products" width="100%">
      <tr class="total-row"><td colspan="2"><b>TOTAL A PAGAR:</b></td><td style="text-align:right;"><b>$${total.toFixed(2)}</b></td></tr>
    </table>
    <div class="dash"></div>

    <div class="section">FORMA DE PAGO</div>
    <table class="payment" width="100%">
      ${paymentHTML}
    </table>

    <div class="dbl"></div>
    <table width="100%"><tr>
      <td class="operator">Operador:</td>
      <td class="operator" style="text-align:right;">${repartidorName}</td>
    </tr></table>

    ${signatureHTML}
    ${pagareHTML}

    <div class="footer">
      <div style="font-style:italic;">Gracias por su compra!</div>
      ${companyInfo.textos?.piePagina ? `<div style="margin-top:2px;font-size:8px;">${(companyInfo.textos as any).piePagina}</div>` : ''}
      ${(companyInfo.textos as any)?.mensajeEspecial && (companyInfo.textos as any)?.mostrarMensaje ? `<div style="margin-top:4px;font-size:9px;font-weight:700;border:1px solid #000;padding:4px;">${(companyInfo.textos as any).mensajeEspecial}</div>` : ''}
    </div>

    <div style="text-align:center;font-size:8px;font-weight:700;margin-top:6px;">
      ${companyInfo.redesSociales?.facebook ? `FB: /${companyInfo.redesSociales.facebook}` : ''}
      ${companyInfo.redesSociales?.facebook && companyInfo.redesSociales?.instagram ? ' | ' : ''}
      ${companyInfo.redesSociales?.instagram ? `IG: @${companyInfo.redesSociales.instagram}` : ''}
    </div>

    <div class="qr">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('https://fugas-providencia.netlify.app/')}" 
        style="width:80px;"
        onerror="this.style.display='none';"
      />
    </div>
    <div style="text-align:center;font-size:8px;font-weight:700;margin-top:2px;">Atencion a fugas y pedidos</div>
  </body></html>`
}
