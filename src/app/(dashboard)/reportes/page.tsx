'use client'

import React, { useState, useEffect } from 'react'
import {
  reporteExportAPI,
  sedesAPI,
  usuariosAPI,
  type Sede
} from '@/lib/api'
import {
  Box, Typography, Card, CardContent, Grid, Button, Alert,
  FormControl, InputLabel, Select, MenuItem,
  TextField, CircularProgress
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  People as PeopleIcon,
  LocalGasStation as GasIcon,
  Settings as ScaleIcon,
  CreditCard as CreditIcon,
  AccountBalance as DeudaIcon,
  AttachMoney as PaymentIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import * as XLSX from 'xlsx'

interface Filtros {
  fechaDesde: string
  fechaHasta: string
  sedeId: string
  repartidorId: string
}

interface ReporteCard {
  id: string
  titulo: string
  descripcion: string
  icon: React.ReactNode
  color: string
  fetcher: (filtros: any) => Promise<any>
  generator: (data: any, filtros: Filtros) => XLSX.WorkBook
}

// Helpers
function autoWidth(ws: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 }) as any[][]
  if (!data.length) return
  const colWidths: number[] = []
  data.forEach(row => {
    if (!Array.isArray(row)) return
    row.forEach((cell, i) => {
      const len = cell != null ? String(cell).length : 0
      colWidths[i] = Math.max(colWidths[i] || 0, Math.min(len + 2, 40))
    })
  })
  ws['!cols'] = colWidths.map(w => ({ wch: w }))
}

function addTitleRow(ws: XLSX.WorkSheet, titulo: string, filtros: Filtros, numCols: number) {
  const periodo = filtros.fechaDesde || filtros.fechaHasta
    ? `Período: ${filtros.fechaDesde || '...'} al ${filtros.fechaHasta || '...'}`
    : 'Sin filtro de fecha'
  XLSX.utils.sheet_add_aoa(ws, [[titulo], [periodo], []], { origin: 'A1' })
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }
  ]
}

function downloadWB(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename)
}

// ============ GENERADORES DE EXCEL ============

function genVentasCliente(data: any[], filtros: Filtros) {
  const wb = XLSX.utils.book_new()
  const headers = ['Cliente', 'Dirección', '# Pedidos', 'Total Comprado', 'Total Pagado', 'Total a Crédito', 'Saldo Actual', 'Límite Crédito']
  const rows = data.map((d: any) => [
    d.nombre, d.direccion, d.numPedidos,
    d.totalComprado, d.totalPagado, d.totalCredito,
    d.saldoActual, d.limiteCredito
  ])
  const totals = ['TOTALES', '', data.reduce((s: number, d: any) => s + d.numPedidos, 0),
    data.reduce((s: number, d: any) => s + d.totalComprado, 0),
    data.reduce((s: number, d: any) => s + d.totalPagado, 0),
    data.reduce((s: number, d: any) => s + d.totalCredito, 0),
    data.reduce((s: number, d: any) => s + d.saldoActual, 0), '']
  const ws = XLSX.utils.aoa_to_sheet([[], [], [], headers, ...rows, [], totals])
  addTitleRow(ws, 'REPORTE DE VENTAS POR CLIENTE', filtros, headers.length)
  autoWidth(ws)
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas por Cliente')
  return wb
}

function genLitrosPipa(data: any[], filtros: Filtros) {
  const wb = XLSX.utils.book_new()
  const headers = ['Fecha', 'Folio', 'Cliente', 'Operador', 'Ruta', 'Litros', 'Precio/L', 'Subtotal', 'Desc/L', 'Descuento Total', 'Total']
  const rows = data.map((d: any) => [
    d.fecha, d.folio, d.cliente, d.operador, d.ruta,
    d.litros, d.precioPorLitro, d.subtotal,
    d.descuentoPorLitro, d.descuentoTotal, d.total
  ])
  const totLitros = data.reduce((s: number, d: any) => s + (d.litros || 0), 0)
  const totDesc = data.reduce((s: number, d: any) => s + (d.descuentoTotal || 0), 0)
  const totVenta = data.reduce((s: number, d: any) => s + (d.total || 0), 0)
  const totals = ['TOTALES', '', '', '', '', totLitros, '', '', '', totDesc, totVenta]
  const ws = XLSX.utils.aoa_to_sheet([[], [], [], headers, ...rows, [], totals])
  addTitleRow(ws, 'REPORTE DE LITROS VENDIDOS EN PIPA', filtros, headers.length)
  autoWidth(ws)
  XLSX.utils.book_append_sheet(wb, ws, 'Litros Pipa')
  return wb
}

function genKilosCilindros(data: any[], filtros: Filtros) {
  const wb = XLSX.utils.book_new()
  const headers = ['Fecha', 'Folio', 'Cliente', 'Operador', 'Ruta', 'Producto', 'Cantidad', 'Kg/Unidad', 'Kg Totales', 'Precio Unit.', 'Descuento', 'Subtotal']
  const rows = data.map((d: any) => [
    d.fecha, d.folio, d.cliente, d.operador, d.ruta,
    d.producto, d.cantidad, d.kilosPorUnidad, d.kilosTotales,
    d.precioUnitario, d.descuento, d.subtotal
  ])
  const totKg = data.reduce((s: number, d: any) => s + (d.kilosTotales || 0), 0)
  const totCant = data.reduce((s: number, d: any) => s + (d.cantidad || 0), 0)
  const totSub = data.reduce((s: number, d: any) => s + (d.subtotal || 0), 0)
  const totals = ['TOTALES', '', '', '', '', '', totCant, '', totKg, '', '', totSub]
  const ws = XLSX.utils.aoa_to_sheet([[], [], [], headers, ...rows, [], totals])
  addTitleRow(ws, 'REPORTE DE KILOS VENDIDOS EN CILINDROS', filtros, headers.length)
  autoWidth(ws)
  XLSX.utils.book_append_sheet(wb, ws, 'Kilos Cilindros')
  return wb
}

function genCreditosAbiertos(data: any[], filtros: Filtros) {
  const wb = XLSX.utils.book_new()
  const headers = ['Nota', 'Cliente', 'Dirección', 'Ruta', 'Fecha Venta', 'Vencimiento', 'Importe', 'Saldo Pendiente', 'Días Vencida', 'Estado']
  const rows = data.map((d: any) => [
    d.nota, d.cliente, d.direccion, d.ruta, d.fechaVenta, d.vencimiento,
    d.importe, d.saldoPendiente, d.diasVencida, d.estado
  ])
  const totImporte = data.reduce((s: number, d: any) => s + (d.importe || 0), 0)
  const totSaldo = data.reduce((s: number, d: any) => s + (d.saldoPendiente || 0), 0)
  const totals = ['TOTALES', '', '', '', '', '', totImporte, totSaldo, '', '']
  const ws = XLSX.utils.aoa_to_sheet([[], [], [], headers, ...rows, [], totals])
  addTitleRow(ws, 'REPORTE DE CRÉDITOS ABIERTOS', filtros, headers.length)
  autoWidth(ws)
  XLSX.utils.book_append_sheet(wb, ws, 'Créditos Abiertos')
  return wb
}

function genDeudaGlobal(data: any, filtros: Filtros) {
  const wb = XLSX.utils.book_new()
  const resumen = data.resumen || {}
  const detalle = data.detalle || []
  // Hoja resumen
  const wsR = XLSX.utils.aoa_to_sheet([
    ['RESUMEN DE DEUDA GLOBAL'], [],
    ['Total Clientes con Deuda', resumen.totalClientes || 0],
    ['Deuda Total', resumen.totalDeuda || 0], []
  ])
  XLSX.utils.book_append_sheet(wb, wsR, 'Resumen')
  // Hoja detalle
  const headers = ['Cliente', 'Dirección', 'Ruta', 'Teléfono', 'Saldo Actual', 'Límite Crédito', 'Crédito Disponible', 'Notas Pendientes']
  const rows = detalle.map((d: any) => [
    d.cliente, d.direccion, d.ruta, d.telefono,
    d.saldoActual, d.limiteCredito, d.creditoDisponible, d.notasPendientes
  ])
  const totDeuda = detalle.reduce((s: number, d: any) => s + (d.saldoActual || 0), 0)
  const totals = ['TOTALES', '', '', '', totDeuda, '', '', '']
  const ws = XLSX.utils.aoa_to_sheet([[], [], [], headers, ...rows, [], totals])
  addTitleRow(ws, 'DETALLE DE DEUDA POR CLIENTE', filtros, headers.length)
  autoWidth(ws)
  XLSX.utils.book_append_sheet(wb, ws, 'Detalle Deuda')
  return wb
}

function genFormasPago(data: any, filtros: Filtros) {
  const wb = XLSX.utils.book_new()
  const resumen = data.resumen || []
  const detalle = data.detalle || []
  // Hoja resumen
  const headersR = ['Forma de Pago', 'Cantidad', 'Total']
  const rowsR = resumen.map((r: any) => [r.formaPago, r.cantidad, r.total])
  const totR = resumen.reduce((s: number, r: any) => s + (r.total || 0), 0)
  const wsR = XLSX.utils.aoa_to_sheet([[], [], [], headersR, ...rowsR, [], ['TOTAL', '', totR]])
  addTitleRow(wsR, 'RESUMEN POR FORMA DE PAGO', filtros, headersR.length)
  autoWidth(wsR)
  XLSX.utils.book_append_sheet(wb, wsR, 'Resumen')
  // Hoja detalle
  const headersD = ['Fecha', 'Folio', 'Cliente', 'Operador', 'Forma de Pago', 'Folio Pago', 'Monto', 'Total Pedido']
  const rowsD = detalle.map((d: any) => [
    d.fecha, d.folio, d.cliente, d.operador, d.formaPago, d.folioPago, d.monto, d.totalPedido
  ])
  const ws = XLSX.utils.aoa_to_sheet([[], [], [], headersD, ...rowsD])
  addTitleRow(ws, 'DETALLE DE FORMAS DE PAGO', filtros, headersD.length)
  autoWidth(ws)
  XLSX.utils.book_append_sheet(wb, ws, 'Detalle')
  return wb
}

function genRendimientoOperador(data: any[], filtros: Filtros) {
  const wb = XLSX.utils.book_new()
  const headers = ['Operador', 'Tipo', 'Rutas', '# Pedidos', 'Total Ventas', 'Litros (Pipas)', 'Promedio/Pedido']
  const rows = data.map((d: any) => [
    d.operador, d.tipo, d.rutas, d.numPedidos,
    d.totalVentas, d.totalLitros, d.promedioPorPedido
  ])
  const ws = XLSX.utils.aoa_to_sheet([[], [], [], headers, ...rows])
  addTitleRow(ws, 'RENDIMIENTO POR OPERADOR', filtros, headers.length)
  autoWidth(ws)
  XLSX.utils.book_append_sheet(wb, ws, 'Rendimiento')
  return wb
}

// ============ COMPONENTE PRINCIPAL ============

export default function ReportesPage() {
  const [filtros, setFiltros] = useState<Filtros>({
    fechaDesde: new Date().toISOString().slice(0, 8) + '01', // primer día del mes
    fechaHasta: new Date().toISOString().slice(0, 10), // hoy
    sedeId: '',
    repartidorId: ''
  })
  const [sedes, setSedes] = useState<Sede[]>([])
  const [operadores, setOperadores] = useState<any[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    sedesAPI.getAll().then(setSedes).catch(() => {})
    usuariosAPI.getAll().then((data: any) => {
      const users = Array.isArray(data) ? data : (data.usuarios || [])
      const reps = users.filter((u: any) => u.rol === 'repartidor' || u.rol === 'pipas' || u.rol === 'cilindros')
      setOperadores(reps)
    }).catch(() => {})
  }, [])

  const reportes: ReporteCard[] = [
    {
      id: 'ventas-cliente',
      titulo: 'Ventas por Cliente',
      descripcion: 'Cuánto compró, cuánto pagó y cuánto quedó a deber cada cliente.',
      icon: <PeopleIcon />,
      color: '#2196f3',
      fetcher: (f) => reporteExportAPI.ventasPorCliente(f),
      generator: genVentasCliente
    },
    {
      id: 'litros-pipa',
      titulo: 'Litros Pipa (Detalle)',
      descripcion: 'Litros vendidos en pipa con precio, descuento por litro y descuento total.',
      icon: <GasIcon />,
      color: '#4caf50',
      fetcher: (f) => reporteExportAPI.litrosPipa(f),
      generator: genLitrosPipa
    },
    {
      id: 'kilos-cilindros',
      titulo: 'Kilos Cilindros (Detalle)',
      descripcion: 'Kilos vendidos en cilindros sin convertir a litros. Detalle por producto.',
      icon: <ScaleIcon />,
      color: '#ff9800',
      fetcher: (f) => reporteExportAPI.kilosCilindros(f),
      generator: genKilosCilindros
    },
    {
      id: 'creditos-abiertos',
      titulo: 'Créditos Abiertos',
      descripcion: 'Todas las notas de crédito con saldo pendiente, días vencidos y estado.',
      icon: <CreditIcon />,
      color: '#f44336',
      fetcher: (f) => reporteExportAPI.creditosAbiertos(f),
      generator: genCreditosAbiertos
    },
    {
      id: 'deuda-global',
      titulo: 'Deuda Global',
      descripcion: 'Cuántos clientes deben y cuánto nos deben en total. Detalle por cliente.',
      icon: <DeudaIcon />,
      color: '#9c27b0',
      fetcher: (f) => reporteExportAPI.deudaGlobal(f),
      generator: genDeudaGlobal
    },
    {
      id: 'formas-pago',
      titulo: 'Formas de Pago',
      descripcion: 'Resumen y detalle de pagos por método: efectivo, transferencia, crédito, etc.',
      icon: <PaymentIcon />,
      color: '#00bcd4',
      fetcher: (f) => reporteExportAPI.formasPago(f),
      generator: genFormasPago
    },
    {
      id: 'rendimiento-operador',
      titulo: 'Rendimiento por Operador',
      descripcion: 'Ventas, pedidos, litros y promedio por cada operador/repartidor.',
      icon: <PersonIcon />,
      color: '#795548',
      fetcher: (f) => reporteExportAPI.rendimientoOperador(f),
      generator: genRendimientoOperador
    }
  ]

  const descargarReporte = async (reporte: ReporteCard) => {
    setLoading(reporte.id)
    setError(null)
    setSuccess(null)
    try {
      const params: any = {}
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
      if (filtros.sedeId) params.sedeId = filtros.sedeId
      if (filtros.repartidorId) params.repartidorId = filtros.repartidorId

      const data = await reporte.fetcher(params)
      const items = Array.isArray(data) ? data : (data.detalle || [])
      const count = items.length || (data.resumen ? 1 : 0)

      if (count === 0 && !data.resumen) {
        setError(`No hay datos para "${reporte.titulo}" con los filtros seleccionados.`)
        return
      }

      const wb = reporte.generator(data, filtros)
      const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      downloadWB(wb, `${reporte.id}_${fechaStr}.xlsx`)
      setSuccess(`${reporte.titulo}: ${Array.isArray(data) ? data.length : items.length} registros exportados`)
    } catch (e: any) {
      setError(`Error al generar "${reporte.titulo}": ${e.message}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant='h4' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon /> Reportes
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Selecciona filtros y descarga reportes en Excel
          </Typography>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='subtitle2' fontWeight='bold' gutterBottom>Filtros Globales</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <TextField fullWidth type='date' label='Fecha Desde' size='small'
                value={filtros.fechaDesde} onChange={e => setFiltros(p => ({ ...p, fechaDesde: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth type='date' label='Fecha Hasta' size='small'
                value={filtros.fechaHasta} onChange={e => setFiltros(p => ({ ...p, fechaHasta: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Sede</InputLabel>
                <Select value={filtros.sedeId} label='Sede' onChange={e => setFiltros(p => ({ ...p, sedeId: e.target.value }))}>
                  <MenuItem value=''>Todas</MenuItem>
                  {sedes.map(s => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Operador</InputLabel>
                <Select value={filtros.repartidorId} label='Operador' onChange={e => setFiltros(p => ({ ...p, repartidorId: e.target.value }))}>
                  <MenuItem value=''>Todos</MenuItem>
                  {operadores.map(o => (
                    <MenuItem key={o.id} value={o.id}>
                      {`${o.nombres || ''} ${o.apellidoPaterno || ''}`.trim()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Mensajes */}
      {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Tarjetas de reportes */}
      <Grid container spacing={2}>
        {reportes.map(r => (
          <Grid item xs={12} sm={6} md={4} key={r.id}>
            <Card sx={{ height: '100%', borderLeft: `4px solid ${r.color}`, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: r.color }}>{r.icon}</Box>
                  <Typography variant='subtitle1' fontWeight='bold'>{r.titulo}</Typography>
                </Box>
                <Typography variant='caption' color='text.secondary' sx={{ flex: 1, mb: 2 }}>
                  {r.descripcion}
                </Typography>
                <Button
                  variant='contained'
                  startIcon={loading === r.id ? <CircularProgress size={16} color='inherit' /> : <DownloadIcon />}
                  onClick={() => descargarReporte(r)}
                  disabled={loading !== null}
                  size='small'
                  sx={{ bgcolor: r.color, '&:hover': { bgcolor: r.color, filter: 'brightness(0.9)' } }}
                >
                  {loading === r.id ? 'Generando...' : 'Descargar Excel'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant='caption' color='text.secondary'>
          Los reportes se generan en tiempo real con los filtros seleccionados. Los montos están en MXN.
          El filtro de Operador aplica a reportes de ventas, litros, cilindros y formas de pago.
        </Typography>
      </Box>
    </Box>
  )
}
