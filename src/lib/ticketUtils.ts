import type { ConfiguracionTicket } from './api'

export interface PedidoTicket {
  numeroPedido: string
  fechaPedido: string
  horaPedido?: string
  ventaTotal?: number
  tipoServicio?: string
  cliente?: { nombre: string; apellidoPaterno?: string; apellidoMaterno?: string; calle?: string; numeroExterior?: string; colonia?: string; ciudad?: string; estado?: string }
  repartidor?: { nombres?: string; apellidoPaterno?: string }
  ruta?: { nombre?: string }
  pagos?: Array<{ tipo?: string; monto?: number; folio?: string; metodo?: { nombre?: string } }>
  productosPedido?: Array<{ cantidad?: number; precioUnitario?: number; descuentoAplicado?: number; producto?: { nombre?: string } }>
  calculoPipas?: any
  descuentoTotal?: number
}


function numberToWords(num: number): string {
  const ones = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
  const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
  const integerPart = Math.floor(num)
  const decimalPart = Math.round((num - integerPart) * 100)
  if (integerPart === 0) return `CERO ${decimalPart}/100 M.N.`
  if (integerPart < 10) return `${ones[integerPart]} ${decimalPart}/100 M.N.`
  if (integerPart < 20) return `${teens[integerPart - 10]} ${decimalPart}/100 M.N.`
  if (integerPart < 100) {
    const tensDigit = Math.floor(integerPart / 10)
    const onesDigit = integerPart % 10
    if (onesDigit === 0) return `${tens[tensDigit]} ${decimalPart}/100 M.N.`
    return `${tens[tensDigit]} Y ${ones[onesDigit]} ${decimalPart}/100 M.N.`
  }
  return `${integerPart.toLocaleString('es-MX')} ${decimalPart}/100 M.N.`
}

export function generarHtmlTicketVenta(pedido: any, config: ConfiguracionTicket): string {
    const total = pedido.ventaTotal ?? 0
    const clientName = pedido.cliente
      ? `${pedido.cliente.nombre} ${pedido.cliente.apellidoPaterno ?? ''} ${pedido.cliente.apellidoMaterno ?? ''}`.trim()
      : 'Público en General'
    const clientAddress = pedido.cliente
      ? [pedido.cliente.calle, pedido.cliente.numeroExterior, pedido.cliente.colonia].filter(Boolean).join(', ')
      : ''
    const repartidorName = pedido.repartidor
      ? `${pedido.repartidor.nombres} ${pedido.repartidor.apellidoPaterno ?? ''} ${pedido.repartidor.apellidoMaterno ?? ''}`.trim()
      : 'Operador'
    const folio = pedido.numeroPedido || `F${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
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
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Mexico_City'
      })
    }

    let productsHTML = ''
    if (pedido.productosPedido && pedido.productosPedido.length > 0) {
      productsHTML = pedido.productosPedido
        .map((pp: any) => {
          const descuentoMonto = typeof pp.descuentoMonto === 'number' ? pp.descuentoMonto : 0
          const hasDescuento = descuentoMonto > 0
          const subtotal = (pp.subtotal ?? pp.cantidad * (pp.precio ?? 0)).toFixed(2)
          let row = `<tr>
              <td style="text-align: left; padding: 2px; font-size: 9px;">${pp.producto?.nombre ?? 'Producto'}</td>
              <td style="text-align: center; padding: 2px; font-size: 9px;">${pp.cantidad}</td>
              <td style="text-align: right; padding: 2px; font-size: 9px;">$${(pp.precio ?? 0).toFixed(2)}</td>
              <td style="text-align: right; padding: 2px; font-size: 9px;">$${subtotal}</td>
            </tr>`
          if (hasDescuento) {
            row += `<tr>
              <td colspan="3" style="text-align: right; padding: 1px 2px; font-size: 8px; color: #666;">Descuento ${pp.descuento || ''}</td>
              <td style="text-align: right; padding: 1px 2px; font-size: 8px; color: #666;">-$${descuentoMonto.toFixed(2)}</td>
            </tr>`
          }
          return row
        })
        .join('')
    } else {
      const label = pedido.tipoServicio === 'pipas' ? 'Litro de Gas LP' : 'Cilindro de Gas LP'
      productsHTML = `<tr>
        <td style="text-align: left; padding: 2px; font-size: 9px;">${label}</td>
        <td style="text-align: center; padding: 2px; font-size: 9px;">1</td>
        <td style="text-align: right; padding: 2px; font-size: 9px;">$${total.toFixed(2)}</td>
        <td style="text-align: right; padding: 2px; font-size: 9px;">$${total.toFixed(2)}</td>
      </tr>`
    }

    const paymentMethodsHTML =
      pedido.pagos
        ?.map(
          (p: any) =>
            `<p style="margin: 4px 0;">${p.tipo === 'credito' ? 'Uso de Crédito' : p.metodo?.nombre ?? 'Pago'}: $${(p.monto ?? 0).toFixed(2)}${p.folio ? ` (Folio: ${p.folio})` : ''}</p>`
        )
        .join('') ?? ''
    const signatureFromPago = pedido.pagos?.find((p: any) => p.firmaCliente)?.firmaCliente
    const signatureHTML =
      signatureFromPago && typeof signatureFromPago === 'string'
        ? `<div style="margin: 10px 0;"><p style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">Firma del cliente:</p><img src="${signatureFromPago}" alt="Firma" style="max-width: 100%; max-height: 80px; border: 1px solid #ccc; display: block;" /></div>`
        : ''

    const companyInfo = {
      name: config.nombreEmpresa ?? 'ERPGASLP',
      address: config.direccion ?? '',
      city: config.razonSocial ?? '',
      phone: config.telefono ? `Tel: ${config.telefono}` : '',
      email: config.email ?? '',
      sitioWeb: config.sitioWeb ?? '',
      rfc: config.rfc ?? '',
      logo: config.logo,
      mostrarLogo: config.mostrarLogo ?? true,
      tamañoLogo: config.tamañoLogo ?? 'mediano',
      textos: config.textos ?? {},
      diseño: config.diseño ?? { mostrarFecha: true, mostrarHora: true, mostrarCajero: true, mostrarCliente: true, colorPrincipal: '#1976d2', alineacion: 'centro' }
    }
    const qrData =
      config.urlQR && String(config.urlQR).trim()
        ? String(config.urlQR).trim()
        : JSON.stringify({
            folio,
            fecha: formattedDate,
            monto: total.toFixed(2),
            cliente: clientName,
            repartidor: repartidorName,
            tipo: 'venta'
          })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @media print { @page { margin: 0; size: 80mm auto; } body { margin: 0; max-width: 80mm; width: 80mm; } }
          body { font-family: Arial, sans-serif; max-width: 80mm; width: 80mm; margin: 0 auto; padding: 10px 8px; font-size: 11px; color: #000; box-sizing: border-box; }
          * { box-sizing: border-box; }
          .header { text-align: center; margin-bottom: 10px; }
          .company-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
          .separator { border-top: 1px solid #000; margin: 8px 0; }
          .title { text-align: center; font-size: 12px; font-weight: bold; margin: 8px 0; }
          .folio { text-align: center; font-size: 10px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; table-layout: fixed; }
          th { border-bottom: 2px solid #000; padding: 3px; font-size: 9px; font-weight: bold; text-align: left; }
          th.col-qty { text-align: center; width: 15%; }
          th.col-price, th.col-amount { text-align: right; width: 25%; }
          td { padding: 3px; font-size: 9px; }
          .total-row { display: flex; justify-content: space-between; margin: 8px 0; font-weight: bold; font-size: 12px; border-top: 1px solid #000; padding-top: 4px; }
          .total-words { text-align: center; font-style: italic; font-size: 9px; margin: 8px 0; }
          .footer { text-align: center; font-size: 10px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${companyInfo.mostrarLogo && companyInfo.logo ? `<img src="${companyInfo.logo}" style="max-width: ${companyInfo.tamañoLogo === 'pequeño' ? '60px' : companyInfo.tamañoLogo === 'mediano' ? '100px' : '140px'}; max-height: 80px; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;" />` : ''}
          <div class="company-name">${companyInfo.name}</div>
          ${companyInfo.address ? `<div>${companyInfo.address}</div>` : ''}
          ${companyInfo.city ? `<div>${companyInfo.city}</div>` : ''}
          ${companyInfo.phone ? `<div>${companyInfo.phone}</div>` : ''}
          ${companyInfo.email ? `<div>${companyInfo.email}</div>` : ''}
          ${companyInfo.rfc ? `<div><strong>RFC: ${companyInfo.rfc}</strong></div>` : ''}
        </div>
        <div class="separator"></div>
        <div class="title">TICKET VENTA</div>
        <div class="folio">Folio: ${folio}</div>
        ${companyInfo.diseño?.mostrarFecha ? `<p style="text-align: center; font-size: 11px;"><strong>Fecha:</strong> ${formattedDate}</p>` : ''}
        <div class="separator"></div>
        <div><p><strong>Cliente:</strong> ${clientName}</p>${clientAddress ? `<p><strong>Dirección:</strong> ${clientAddress}</p>` : ''}</div>
        <div class="separator"></div>
        <table>
          <thead><tr><th>Producto</th><th class="col-qty">Cant.</th><th class="col-price">Precio Unit.</th><th class="col-amount">Importe</th></tr></thead>
          <tbody>${productsHTML}</tbody>
        </table>
        <div class="separator"></div>
        <div class="total-row"><span>TOTAL:</span><span>$${total.toFixed(2)}</span></div>
        <div class="total-words">${numberToWords(total)}</div>
        <div class="separator"></div>
        ${paymentMethodsHTML ? `<div><p><strong>Forma de Pago:</strong></p>${paymentMethodsHTML}</div><div class="separator"></div>` : ''}
        ${signatureHTML}
        <p><strong>Repartidor(a):</strong> ${repartidorName}</p>
        <div class="separator"></div>
        <div class="footer"><p>Representación impresa de la factura electrónica</p><p>Gracias por su preferencia</p></div>
        <div style="text-align: center; margin: 10px 0;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" alt="QR" style="max-width: 150px; height: auto;" /><p style="font-size: 9px;">Folio: ${folio}</p></div>
      </body>
      </html>
    `
  }
