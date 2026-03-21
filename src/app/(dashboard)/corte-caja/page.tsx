'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Paper, Alert,
  Divider, CircularProgress, Snackbar, LinearProgress
} from '@mui/material'
import {
  ArrowBack, CheckCircle, Edit, Print, Add, Visibility, Close,
  Warning, LockOpen, Refresh
} from '@mui/icons-material'
import { ventasAPI, sedesAPI, authAPI, usuariosAPI } from '@/lib/api'
import type { Sede } from '@/lib/api'

// ======================== TYPES ========================

interface ResumenFP { efectivo: number; transferencia: number; tarjeta: number; cheque: number; credito: number; deposito: number; otros: number }
interface CorteResumen {
  id: string; tipo: 'venta_dia' | 'abono'; dia: string; fecha: string; estado: 'pendiente' | 'validado'
  totalVentas: number; totalAbonos: number; totalEfectivo: number; totalLitros: number; totalProductosUnidades: number
  observaciones?: string
  repartidor: { id: string; nombres?: string; nombre?: string; apellidoPaterno?: string; tipoRepartidor: 'pipas' | 'cilindros'; sede?: string }
  depositos: any[]; detalles: any[]
  resumenFormasPagoVenta: Record<string, number> | null
  resumenFormasPagoAbono: Record<string, number> | null
}
interface ResumenDia {
  fecha: string; totalPedidos: number; totalCortes: number; diferencia: number
  countCortes: number; countValidados: number
  pipas: { id: string; repartidorId: string; nombre: string; estado: string; total: number; litros: number; resumenFP: ResumenFP }[]
  cilindros: { id: string; repartidorId: string; nombre: string; estado: string; total: number; kg10: number; kg20: number; kg30: number; totalCil: number; resumenFP: ResumenFP }[]
  formasPago: ResumenFP
}
interface PedidoDetalle {
  numero: number; pedidoId: string; detalleId?: string; clienteNombre: string; fecha: string
  total: number; litros: number; descuento: number
  formasPago: { tipo: string; monto: number }[]; formaPagoCorte?: string
  productos: { nombre: string; kg?: number; cantidad: number; precio: number; descuento: number; subtotal: number }[]
}
interface DesgloseCilindro { kg: number; nombre: string; esNuevo: boolean; unidades: number; monto: number; descuento: number }
interface CorteDetalle extends CorteResumen {
  stats: Record<string, number> | null; dailySales: any[] | null
  pedidos: PedidoDetalle[]; desgloseCilindros: DesgloseCilindro[] | null
  resumenFormasPago: Record<string, number>
}

// ======================== HELPERS ========================

const TIMEZONE_MX = 'America/Mexico_City'
function getHoyMx(): string { return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE_MX }) }
function fmt$(n: number): string { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0) }
function fmtFecha(fecha: string): string {
  try { const d = new Date(fecha + (fecha.length === 10 ? 'T12:00:00' : '')); return d.toLocaleDateString('es-MX', { timeZone: TIMEZONE_MX, day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return fecha }
}
function nombreRepartidor(r: any): string {
  if (!r) return '—'
  return `${r.nombres || r.nombre || ''} ${r.apellidoPaterno || ''}`.trim()
}

// ======================== CHIP ESTADO ========================
function ChipEstado({ estado }: { estado: string }) {
  if (estado === 'validado') return <Chip label="Validado" color="success" size="small" />
  return <Chip label="Pendiente" color="warning" size="small" />
}

// ======================== VISTA DASHBOARD ========================

const FP_ORDER: { key: keyof ResumenFP; label: string; color: string }[] = [
  { key: 'efectivo',      label: 'Efectivo',      color: '#1D9E75' },
  { key: 'tarjeta',       label: 'Tarjeta',        color: '#534AB7' },
  { key: 'transferencia', label: 'Transferencia',  color: '#378ADD' },
  { key: 'cheque',        label: 'Cheque',         color: '#D85A30' },
  { key: 'deposito',      label: 'Depósito',       color: '#888780' },
  { key: 'credito',       label: 'Crédito',        color: '#A32D2D' },
]

function VistaDashboard({ resumen, loading, fecha, onFechaChange, onVerDetalle, onCrearManual, onCerrarRapido, sedes, sedeId, sedeSeleccionada, esSuperAdmin, onSedeChange }: {
  resumen: ResumenDia | null; loading: boolean; fecha: string
  onFechaChange: (f: string) => void
  onVerDetalle: (id: string) => void
  onCrearManual: () => void
  onCerrarRapido: (id: string) => void
  sedes: Sede[]
  sedeId: string | null
  sedeSeleccionada: string | null
  esSuperAdmin: boolean
  onSedeChange: (id: string) => void
}) {
  if (loading) return <LinearProgress sx={{ mt: 2 }} />

  const fp = resumen?.formasPago || {} as ResumenFP
  const totalFP = FP_ORDER.reduce((s, c) => s + (fp[c.key] || 0), 0)
  const pct = resumen && resumen.totalPedidos > 0 ? Math.min(100, (resumen.totalCortes / resumen.totalPedidos) * 100) : 0
  const difColor = !resumen ? 'text.primary' : resumen.diferencia >= 0 ? '#1D9E75' : '#BA7517'

  return (
    <Box>
      {/* Header con fecha */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Corte de Caja</Typography>
          <Typography variant="caption" color="text.secondary">
            {fmtFecha(fecha)} · {(resumen?.pipas.length || 0) + (resumen?.cilindros.length || 0)} repartidores con corte
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField type="date" size="small" value={fecha} onChange={e => onFechaChange(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          <Button variant="outlined" size="small" onClick={() => onFechaChange(getHoyMx())}>Hoy</Button>
          <Button startIcon={<Add />} variant="outlined" size="small" onClick={onCrearManual}>Corte manual</Button>
        </Box>
      </Box>

      {/* Comparativo */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Total pedidos del día</Typography>
                <Typography variant="h6" fontWeight="bold">{fmt$(resumen?.totalPedidos || 0)}</Typography>
                <Typography variant="caption" color="text.secondary">{resumen?.countCortes || 0} pedidos entregados</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Acumulado cortes</Typography>
                <Typography variant="h6" fontWeight="bold" color="#1D9E75">{fmt$(resumen?.totalCortes || 0)}</Typography>
                <Typography variant="caption" color="text.secondary">{resumen?.countValidados || 0} validados</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Diferencia</Typography>
                <Typography variant="h6" fontWeight="bold" color={difColor}>
                  {resumen ? (resumen.diferencia >= 0 ? '+' : '') + fmt$(resumen.diferencia) : '—'}
                </Typography>
                <Typography variant="caption" color={difColor}>
                  {resumen && resumen.diferencia < 0 ? `${((resumen?.pipas.length || 0) + (resumen?.cilindros.length || 0))} repartidores con corte` : 'completo'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Cortes recibidos</Typography>
                <Typography variant="caption" fontWeight="bold">{pct.toFixed(1)}%</Typography>
              </Box>
              <Box sx={{ height: 8, bgcolor: 'grey.100', borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: pct >= 100 ? '#1D9E75' : '#BA7517', borderRadius: 4, transition: 'width 0.4s' }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {(resumen?.pipas.length || 0) + (resumen?.cilindros.length || 0)} / {(resumen?.pipas.length || 0) + (resumen?.cilindros.length || 0)} repartidores
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* KPIs formas de pago */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2.5 }}>
        {FP_ORDER.map(c => (
          <Box key={c.key} sx={{ bgcolor: 'grey.50', borderRadius: 1.5, p: 1.25 }}>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: fp[c.key] > 0 ? c.color : 'text.disabled' }}>{fmt$(fp[c.key] || 0)}</Typography>
          </Box>
        ))}
        <Box sx={{ bgcolor: 'grey.100', borderRadius: 1.5, p: 1.25, border: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</Typography>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{fmt$(totalFP)}</Typography>
        </Box>
      </Box>

      {/* Tablas Pipas + Cilindros */}
      <Grid container spacing={2}>

        {/* PIPAS */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>🚛</Typography>
                <Typography fontWeight="bold" variant="subtitle2">Pipas</Typography>
                <Chip label={`${resumen?.pipas.length || 0}`} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2" fontWeight="bold">{fmt$(resumen?.pipas.reduce((s, r) => s + r.total, 0) || 0)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(resumen?.pipas.reduce((s, r) => s + r.litros, 0) || 0).toFixed(0)} L
                </Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.75 }}><b>Repartidor</b></TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', py: 0.75 }}><b>Litros</b></TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', py: 0.75 }}><b>Total</b></TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.75 }}><b>Estado</b></TableCell>
                    <TableCell sx={{ width: 60 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resumen?.pipas || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '0.8rem' }}>Sin cortes de pipas</TableCell></TableRow>
                  ) : (resumen?.pipas || []).map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem', py: 1 }}>{r.nombre}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 1 }}>{r.litros.toFixed(0)} L</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 'bold', py: 1 }}>{fmt$(r.total)}</TableCell>
                      <TableCell align="center" sx={{ py: 1 }}><ChipEstado estado={r.estado} /></TableCell>
                      <TableCell align="center" sx={{ py: 1 }}>
                        <Tooltip title="Ver detalle"><IconButton size="small" onClick={() => onVerDetalle(r.id)}><Visibility sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        {r.estado === 'pendiente' && (
                          <Tooltip title="Cerrar corte"><IconButton size="small" color="success" onClick={() => onCerrarRapido(r.id)}><CheckCircle sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {(resumen?.pipas.length || 0) > 1 && (
                  <TableBody>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontSize: '0.72rem', fontWeight: 'bold', py: 0.75 }}>{resumen?.pipas.filter(r => r.estado === 'validado').length}/{resumen?.pipas.length} validados</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 'bold', py: 0.75 }}>{(resumen?.pipas.reduce((s, r) => s + r.litros, 0) || 0).toFixed(0)} L</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 'bold', py: 0.75 }}>{fmt$(resumen?.pipas.reduce((s, r) => s + r.total, 0) || 0)}</TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* CILINDROS */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>🔵</Typography>
                <Typography fontWeight="bold" variant="subtitle2">Cilindros</Typography>
                <Chip label={`${resumen?.cilindros.length || 0}`} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2" fontWeight="bold">{fmt$(resumen?.cilindros.reduce((s, r) => s + r.total, 0) || 0)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {resumen?.cilindros.reduce((s, r) => s + r.totalCil, 0) || 0} cil
                </Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.75 }}><b>Repartidor</b></TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', py: 0.75 }}><b>10 kg</b></TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', py: 0.75 }}><b>20 kg</b></TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', py: 0.75 }}><b>30 kg</b></TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', py: 0.75 }}><b>Total</b></TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.75 }}><b>Estado</b></TableCell>
                    <TableCell sx={{ width: 60 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resumen?.cilindros || []).length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '0.8rem' }}>Sin cortes de cilindros</TableCell></TableRow>
                  ) : (resumen?.cilindros || []).map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem', py: 1 }}>{r.nombre}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 1 }}>{r.kg10 || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 1 }}>{r.kg20 || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 1 }}>{r.kg30 || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 'bold', py: 1 }}>{fmt$(r.total)}</TableCell>
                      <TableCell align="center" sx={{ py: 1 }}><ChipEstado estado={r.estado} /></TableCell>
                      <TableCell align="center" sx={{ py: 1 }}>
                        <Tooltip title="Ver detalle"><IconButton size="small" onClick={() => onVerDetalle(r.id)}><Visibility sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        {r.estado === 'pendiente' && (
                          <Tooltip title="Cerrar corte"><IconButton size="small" color="success" onClick={() => onCerrarRapido(r.id)}><CheckCircle sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {(resumen?.cilindros.length || 0) > 1 && (
                  <TableBody>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontSize: '0.72rem', fontWeight: 'bold', py: 0.75 }}>{resumen?.cilindros.filter(r => r.estado === 'validado').length}/{resumen?.cilindros.length} validados</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 'bold', py: 0.75 }}>{resumen?.cilindros.reduce((s, r) => s + r.kg10, 0)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 'bold', py: 0.75 }}>{resumen?.cilindros.reduce((s, r) => s + r.kg20, 0)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 'bold', py: 0.75 }}>{resumen?.cilindros.reduce((s, r) => s + r.kg30, 0)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 'bold', py: 0.75 }}>{fmt$(resumen?.cilindros.reduce((s, r) => s + r.total, 0) || 0)}</TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

// ======================== VISTA DETALLE ========================

function VistaDetalle({
  detalle, loading, onVolver, onCerrarCorte, onCorregirPago, onReimprimir
}: {
  detalle: CorteDetalle | null; loading: boolean; onVolver: () => void
  onCerrarCorte: (id: string, litrosMedidor?: number, observaciones?: string) => void
  onCorregirPago: (pedidoId: string, pedidoNombre: string) => void
  onReimprimir: (extras?: { litrosReporte: Record<string, string>; servicioNum: Record<string, string> }) => void
}) {
  const [litrosMedidor, setLitrosMedidor] = useState<string>('')
  const [obsDialog, setObsDialog] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [litrosReporte, setLitrosReporte] = useState<Record<string, string>>({})
  const [servicioNum, setServicioNum] = useState<Record<string, string>>({})
  const [reabriendo, setReabriendo] = useState(false)
  const [editDepIdx, setEditDepIdx] = useState<number | null>(null)
  const [editDepData, setEditDepData] = useState<any>(null)

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={onVolver} sx={{ mb: 2 }}>Volver</Button>
        <LinearProgress />
      </Box>
    )
  }
  if (!detalle) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>No se pudo cargar el detalle</Typography>
        <Button startIcon={<ArrowBack />} onClick={onVolver}>Volver</Button>
      </Box>
    )
  }

  const esPipas = detalle.repartidor?.tipoRepartidor === 'pipas'
  const litrosApp = detalle.totalLitros || 0
  const litrosMedidorNum = parseFloat(litrosMedidor) || 0
  const diferencia = litrosApp - litrosMedidorNum
  const alertaMedidor = litrosMedidor !== '' && litrosMedidorNum > 0 && Math.abs(diferencia) > 20
  const totalLitrosIngresados = (Object.values(litrosReporte) as string[]).reduce((s: number, v: string) => s + (parseFloat(v) || 0), 0 as number)

  // Para pipas: expandir productos como filas independientes
  type FilaDetalle = {
    rowKey: string; pedidoId: string; clienteNombre: string
    litrosRow: number; precioRow: number; descuentoRow: number; subtotalRow: number; totalPedido: number
    formasPago: { tipo: string; monto: number }[]; formaPagoCorte?: string
    isFirst: boolean; isLast: boolean; numProds: number; prodIdx: number
  }
  const pedidosOrdenados = [...(detalle.pedidos || [])].sort((a, b) => {
    const keyA = esPipas ? `${a.pedidoId}_0` : a.pedidoId
    const keyB = esPipas ? `${b.pedidoId}_0` : b.pedidoId
    const na = parseInt(servicioNum[keyA] || servicioNum[a.pedidoId] || '0')
    const nb = parseInt(servicioNum[keyB] || servicioNum[b.pedidoId] || '0')
    if (na && nb) return na - nb
    if (na) return -1
    if (nb) return 1
    return (a.numero || 0) - (b.numero || 0)
  })
  const filasDetalle: FilaDetalle[] = esPipas
    ? pedidosOrdenados.flatMap(p => {
        const prods = (p.productos || []).filter(pr => pr.cantidad > 0)
        if (prods.length === 0) return [{ rowKey: p.pedidoId, pedidoId: p.pedidoId, clienteNombre: p.clienteNombre, litrosRow: p.litros, precioRow: 0, descuentoRow: p.descuento, subtotalRow: p.total, totalPedido: p.total, formasPago: p.formasPago, formaPagoCorte: p.formaPagoCorte, isFirst: true, isLast: true, numProds: 1, prodIdx: 0 }]
        return prods.map((pr, pi) => ({ rowKey: `${p.pedidoId}_${pi}`, pedidoId: p.pedidoId, clienteNombre: p.clienteNombre, litrosRow: pr.cantidad, precioRow: pr.precio, descuentoRow: pr.descuento, subtotalRow: pr.subtotal || (pr.precio * pr.cantidad), totalPedido: p.total, formasPago: pi === 0 ? p.formasPago : [], formaPagoCorte: pi === 0 ? p.formaPagoCorte : '', isFirst: pi === 0, isLast: pi === prods.length - 1, numProds: prods.length, prodIdx: pi }))
      })
    : pedidosOrdenados.map(p => ({ rowKey: p.pedidoId, pedidoId: p.pedidoId, clienteNombre: p.clienteNombre, litrosRow: p.litros, precioRow: 0, descuentoRow: p.descuento, subtotalRow: p.total, totalPedido: p.total, formasPago: p.formasPago, formaPagoCorte: p.formaPagoCorte, isFirst: true, isLast: true, numProds: 1, prodIdx: 0 }))

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={onVolver} variant="text" color="inherit" sx={{ mt: 0.5 }}>Volver</Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {detalle.repartidor?.tipoRepartidor === 'pipas' ? '🚛' : '🔵'} {nombreRepartidor(detalle.repartidor)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {detalle.repartidor?.tipoRepartidor === 'pipas' ? 'Pipas' : 'Cilindros'} · {fmtFecha(detalle.dia)} · ID: {detalle.id.slice(-8).toUpperCase()}
          </Typography>
        </Box>
        <ChipEstado estado={detalle.estado} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>

          {/* Desglose cilindros */}
          {!esPipas && detalle.desgloseCilindros && detalle.desgloseCilindros.length > 0 && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>🔵 Desglose por tipo de cilindro</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Producto</b></TableCell>
                    <TableCell align="center"><b>Unidades</b></TableCell>
                    <TableCell align="right"><b>Subtotal</b></TableCell>
                    {detalle.desgloseCilindros.some(d => d.descuento > 0) && <TableCell align="right"><b>Descuento</b></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalle.desgloseCilindros.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{d.nombre}</Typography>
                          {d.esNuevo && <Chip label="NUEVO" size="small" color="info" sx={{ height: 18, fontSize: '0.65rem' }} />}
                        </Box>
                      </TableCell>
                      <TableCell align="center"><b>{d.unidades}</b></TableCell>
                      <TableCell align="right"><b>{fmt$(d.monto)}</b></TableCell>
                      {detalle.desgloseCilindros!.some(dd => dd.descuento > 0) && (
                        <TableCell align="right" sx={{ color: 'error.main' }}>{d.descuento > 0 ? `-${fmt$(d.descuento)}` : '—'}</TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'primary.50' }}>
                    <TableCell><b>Total</b></TableCell>
                    <TableCell align="center"><b>{detalle.desgloseCilindros.reduce((s, d) => s + d.unidades, 0)} cil</b></TableCell>
                    <TableCell align="right"><b>{fmt$(detalle.desgloseCilindros.reduce((s, d) => s + d.monto, 0))}</b></TableCell>
                    {detalle.desgloseCilindros.some(d => d.descuento > 0) && (
                      <TableCell align="right"><b style={{ color: '#f44336' }}>-{fmt$(detalle.desgloseCilindros.reduce((s, d) => s + d.descuento, 0))}</b></TableCell>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Medidor físico — pipas */}
          {esPipas && (
            <Paper sx={{ p: 2, mb: 2, border: '2px solid', borderColor: alertaMedidor ? 'error.light' : 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>📊 Comparativo medidor físico de pipa</Typography>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">App reporta</Typography>
                    <Typography fontWeight="bold" color="primary.main">{litrosApp.toFixed(1)} L</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1, bgcolor: totalLitrosIngresados > 0 ? 'info.50' : 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Ingresados</Typography>
                    <Typography fontWeight="bold" color={totalLitrosIngresados > 0 ? 'info.main' : 'text.disabled'}>
                      {totalLitrosIngresados > 0 ? `${totalLitrosIngresados.toFixed(1)} L` : '—'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Medidor físico total" type="number" value={litrosMedidor}
                    onChange={e => setLitrosMedidor(e.target.value)}
                    onWheel={e => (e.target as HTMLInputElement).blur()}
                    size="small" fullWidth
                    inputProps={{ style: { MozAppearance: 'textfield' } }}
                    sx={{ '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 } }}
                    InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>L</Typography> }}
                    placeholder="Ej: 2903.60" helperText="Lectura total del odómetro de la pipa" />
                </Grid>
              </Grid>
              {litrosMedidor !== '' && litrosMedidorNum > 0 && (
                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: alertaMedidor ? '#fff3f3' : '#f3fff3', border: `1px solid ${alertaMedidor ? '#f44336' : '#4caf50'}` }}>
                  <Typography variant="body2" color={alertaMedidor ? 'error.main' : 'success.main'} fontWeight="bold">
                    {alertaMedidor ? '⚠️' : '✅'} Medidor vs App: {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)} L
                    {totalLitrosIngresados > 0 && ` | Ingresados vs App: ${(litrosApp - totalLitrosIngresados) > 0 ? '+' : ''}${(litrosApp - totalLitrosIngresados).toFixed(2)} L`}
                  </Typography>
                  <Typography variant="caption" color={alertaMedidor ? 'error.main' : 'success.main'}>
                    {alertaMedidor ? 'Supera ±20 L — verificar con repartidor' : 'Dentro del rango aceptable (±20 L)'}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {/* Tabla pedidos */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">{esPipas ? '🚛 Servicios del día' : '📦 Detalle de pedidos'}</Typography>
              <Chip label={`${detalle.pedidos.length}`} size="small" sx={{ ml: 1 }} />
            </Box>
            {filasDetalle.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin pedidos en este corte</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      {esPipas && <TableCell sx={{ width: 60 }}><b># Srv.</b></TableCell>}
                      {!esPipas && <TableCell sx={{ width: 32 }}><b>#</b></TableCell>}
                      <TableCell><b>Cliente</b></TableCell>
                      {esPipas ? (
                        <>
                          <TableCell align="right"><b>Litros app</b></TableCell>
                          <TableCell align="right" sx={{ color: 'info.main' }}><b>L. reporte</b></TableCell>
                          <TableCell align="right"><b>$/L</b></TableCell>
                          <TableCell align="right"><b>Desc.</b></TableCell>
                        </>
                      ) : <TableCell><b>Productos</b></TableCell>}
                      <TableCell><b>Forma de pago</b></TableCell>
                      <TableCell align="right"><b>Total</b></TableCell>
                      <TableCell align="center" sx={{ width: 40 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filasDetalle.map((fila, rowIdx) => (
                      <TableRow key={fila.rowKey} hover sx={{ bgcolor: esPipas && !fila.isFirst ? 'grey.25' : undefined }}>
                        {esPipas ? (
                          <TableCell sx={{ py: 0.5 }}>
                            <TextField size="small" type="number"
                              value={servicioNum[fila.rowKey] || ''}
                              onChange={e => setServicioNum(prev => ({ ...prev, [fila.rowKey]: e.target.value }))}
                              onWheel={e => (e.target as HTMLInputElement).blur()}
                              placeholder={String(rowIdx + 1)}
                              inputProps={{ style: { MozAppearance: 'textfield' } }}
                              sx={{ width: 52, '& input': { p: '4px 6px', fontSize: '0.75rem', textAlign: 'center' }, '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 } }} />
                          </TableCell>
                        ) : (
                          <TableCell><Typography variant="caption" color="text.secondary">{rowIdx + 1}</Typography></TableCell>
                        )}
                        <TableCell>
                          <Typography variant="body2" color={esPipas && !fila.isFirst ? 'text.secondary' : undefined}>
                            {fila.clienteNombre}
                            {esPipas && !fila.isFirst && <span style={{ color: '#999', fontSize: '0.7rem', marginLeft: 4 }}>↳ carga {fila.prodIdx + 1}</span>}
                          </Typography>
                        </TableCell>
                        {esPipas ? (
                          <>
                            <TableCell align="right">
                              <Typography variant="body2">{fila.litrosRow.toFixed(2)} L</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 0.5 }}>
                              <TextField size="small" type="number"
                                value={litrosReporte[fila.rowKey] || ''}
                                onChange={e => setLitrosReporte(prev => ({ ...prev, [fila.rowKey]: e.target.value }))}
                                onWheel={e => (e.target as HTMLInputElement).blur()}
                                placeholder="0.00"
                                inputProps={{ style: { MozAppearance: 'textfield' } }}
                                sx={{ width: 72, '& input': { p: '4px 6px', fontSize: '0.75rem', textAlign: 'right' }, '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 } }}
                                InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.3, fontSize: '0.65rem' }}>L</Typography> }} />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption" color="text.secondary">
                                {fila.precioRow > 0 ? `$${fila.precioRow.toFixed(2)}` : fila.litrosRow > 0 ? `$${(fila.subtotalRow / fila.litrosRow).toFixed(2)}` : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption" color={fila.descuentoRow > 0 ? 'error.main' : 'text.disabled'}>
                                {fila.descuentoRow > 0 ? `-$${fila.descuentoRow.toFixed(2)}` : '—'}
                              </Typography>
                            </TableCell>
                          </>
                        ) : (
                          <TableCell>
                            {(detalle.pedidos.find(p => p.pedidoId === fila.pedidoId)?.productos || []).map((prod, pi) => (
                              <Typography key={pi} variant="caption" display="block">
                                {prod.cantidad} × {prod.nombre}
                                {prod.descuento > 0 && <span style={{ color: '#f44336' }}> (-{fmt$(prod.descuento)})</span>}
                              </Typography>
                            ))}
                          </TableCell>
                        )}
                        <TableCell>
                          {fila.isFirst && fila.formasPago && fila.formasPago.length > 0
                            ? fila.formasPago.map((f, fi) => (
                              <Typography key={fi} variant="caption" display="block">{f.tipo}: <b>{fmt$(f.monto)}</b></Typography>
                            ))
                            : fila.isFirst && <Typography variant="caption" color="text.secondary">{fila.formaPagoCorte || '—'}</Typography>}
                        </TableCell>
                        <TableCell align="right">
                          {fila.isFirst
                            ? <Typography fontWeight="medium">{fmt$(fila.totalPedido)}</Typography>
                            : <Typography variant="caption" color="text.secondary">{fmt$(fila.subtotalRow)}</Typography>}
                        </TableCell>
                        <TableCell align="center">
                          {fila.isFirst && (
                            <Tooltip title="Corregir forma de pago">
                              <IconButton size="small" onClick={() => onCorregirPago(fila.pedidoId, fila.clienteNombre)}>
                                <Edit sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {esPipas && Object.keys(litrosReporte).some(k => litrosReporte[k]) && (
                      <TableRow sx={{ bgcolor: totalLitrosIngresados > 0 && Math.abs(litrosApp - totalLitrosIngresados) > 20 ? '#fff3f3' : '#f3fff3' }}>
                        <TableCell colSpan={4} align="right"><Typography variant="caption" fontWeight="bold">Total litros ingresados:</Typography></TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" fontWeight="bold" color={Math.abs(litrosApp - totalLitrosIngresados) > 20 ? 'error.main' : 'success.main'}>
                            {totalLitrosIngresados.toFixed(2)} L
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={4}>
                          <Typography variant="caption" color={Math.abs(litrosApp - totalLitrosIngresados) > 20 ? 'error.main' : 'success.main'}>
                            {Math.abs(litrosApp - totalLitrosIngresados) > 20 ? '⚠️' : '✅'} Dif: {(litrosApp - totalLitrosIngresados) > 0 ? '+' : ''}{(litrosApp - totalLitrosIngresados).toFixed(2)} L
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Depósitos */}
          {detalle.depositos && detalle.depositos.length > 0 && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>🏦 Depósitos</Typography>
              <Alert severity="info" sx={{ mb: 1.5, fontSize: '0.75rem', py: 0.5 }}>
                Total efectivo = Depósito + Billetes rechazados + Monedas
              </Alert>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Folio</b></TableCell>
                    <TableCell align="right"><b>Depósito</b></TableCell>
                    <TableCell align="right"><b>Bill. rechazados</b></TableCell>
                    <TableCell align="right"><b>Monedas</b></TableCell>
                    <TableCell align="right"><b>Total efectivo</b></TableCell>
                    <TableCell sx={{ width: 36 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalle.depositos.map((dep: any, i: number) => {
                    const depositoReal = parseFloat(dep.total || 0) || parseFloat(dep.monto || 0) * 1000
                    const billetes = parseFloat(dep.billetesRechazados || 0)
                    const monedas = parseFloat(dep.monedas || 0)
                    const totalEf = depositoReal + billetes + monedas
                    const monto = depositoReal
                    const isEditing = editDepIdx === i
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          {isEditing
                            ? <TextField size="small" value={editDepData?.folio || ''} onChange={e => setEditDepData((d: any) => ({ ...d, folio: e.target.value }))} sx={{ width: 80, '& input': { p: '3px 6px', fontSize: '0.78rem' } }} />
                            : <Typography variant="body2">{dep.folio || '—'}</Typography>}
                        </TableCell>
                        <TableCell align="right">
                          {isEditing
                            ? <TextField size="small" type="number" value={editDepData?.monto || ''} onChange={e => setEditDepData((d: any) => ({ ...d, monto: e.target.value }))} onWheel={e => (e.target as HTMLInputElement).blur()} inputProps={{ style: { MozAppearance: 'textfield' } }} sx={{ width: 80, '& input': { p: '3px 6px', fontSize: '0.78rem', textAlign: 'right' }, '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none' } }} />
                            : fmt$(monto)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color={billetes > 0 ? 'warning.main' : 'text.disabled'}>{billetes > 0 ? fmt$(billetes) : '—'}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color={monedas > 0 ? 'info.main' : 'text.disabled'}>{monedas > 0 ? fmt$(monedas) : '—'}</Typography>
                        </TableCell>
                        <TableCell align="right"><b>{fmt$(totalEf)}</b></TableCell>
                        <TableCell align="center">
                          {isEditing ? (
                            <IconButton size="small" color="success" onClick={() => {
                              // Solo actualiza visualmente por ahora
                              setEditDepIdx(null); setEditDepData(null)
                            }}><CheckCircle sx={{ fontSize: 15 }} /></IconButton>
                          ) : (
                            <IconButton size="small" onClick={() => { setEditDepIdx(i); setEditDepData({ folio: dep.folio, monto: dep.monto }) }}>
                              <Edit sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Total</b></TableCell>
                    <TableCell align="right"><b>{fmt$(detalle.depositos.reduce((s: number, d: any) => {
                      const dReal = parseFloat(d.total || 0) || parseFloat(d.monto || 0) * 1000
                      return s + dReal
                    }, 0))}</b></TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="warning.main">
                        {detalle.depositos.reduce((s: number, d: any) => s + parseFloat(d.billetesRechazados || 0), 0) > 0
                          ? fmt$(detalle.depositos.reduce((s: number, d: any) => s + parseFloat(d.billetesRechazados || 0), 0))
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="info.main">
                        {detalle.depositos.reduce((s: number, d: any) => s + parseFloat(d.monedas || 0), 0) > 0
                          ? fmt$(detalle.depositos.reduce((s: number, d: any) => s + parseFloat(d.monedas || 0), 0))
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <b>{fmt$(detalle.depositos.reduce((s: number, d: any) => {
                        const dReal = parseFloat(d.total || 0) || parseFloat(d.monto || 0) * 1000
                        const b = parseFloat(d.billetesRechazados || 0), mo = parseFloat(d.monedas || 0)
                        return s + dReal + b + mo
                      }, 0))}</b>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>💰 Resumen de pago</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {FP_ORDER.map(c => {
                const v = detalle.resumenFormasPago?.[c.key] || 0
                if (v <= 0) return null
                return (
                  <Box key={c.key} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: c.color + '12', borderRadius: 1, borderLeft: `3px solid ${c.color}` }}>
                    <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                    <Typography variant="caption" fontWeight="bold">{fmt$(v)}</Typography>
                  </Box>
                )
              })}
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography fontWeight="bold">Total</Typography>
              <Typography fontWeight="bold" variant="h6" color="primary.main">{fmt$(detalle.totalVentas || detalle.totalAbonos)}</Typography>
            </Box>
          </Paper>

          {detalle.observaciones && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>Observaciones</Typography>
              <Typography variant="body2" color="text.secondary">{detalle.observaciones}</Typography>
            </Paper>
          )}

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Acciones</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button startIcon={<Print />} variant="outlined" fullWidth onClick={() => onReimprimir({ litrosReporte, servicioNum })}>
                Reimprimir corte
              </Button>
              {detalle.estado === 'pendiente' && (
                <Button startIcon={<CheckCircle />} variant="contained" color="success" fullWidth onClick={() => setObsDialog(true)}>
                  Cerrar y validar corte
                </Button>
              )}
              {detalle.estado === 'validado' && (
                <Button
                  startIcon={reabriendo ? <CircularProgress size={16} color="inherit" /> : <LockOpen />}
                  variant="outlined" color="warning" fullWidth disabled={reabriendo}
                  onClick={async () => {
                    if (!window.confirm('¿Reabrir este corte? Pasará a Pendiente.')) return
                    setReabriendo(true)
                    try { await ventasAPI.reabrirCorte(detalle.id); window.location.reload() }
                    catch (e: any) { alert(e.message || 'Error al reabrir'); setReabriendo(false) }
                  }}>
                  Reabrir corte
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog cierre */}
      <Dialog open={obsDialog} onClose={() => setObsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cerrar corte — {nombreRepartidor(detalle.repartidor)}</DialogTitle>
        <DialogContent>
          {esPipas && litrosMedidor !== '' && litrosMedidorNum > 0 && (
            <Alert severity={alertaMedidor ? 'warning' : 'success'} sx={{ mb: 2 }}>
              Diferencia: {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)} L {alertaMedidor ? '— Supera ±20L' : '— OK'}
            </Alert>
          )}
          <TextField label="Observaciones (opcional)" multiline rows={3} value={observaciones}
            onChange={e => setObservaciones(e.target.value)} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setObsDialog(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={() => {
            onCerrarCorte(detalle.id, esPipas && litrosMedidorNum > 0 ? litrosMedidorNum : undefined, observaciones || undefined)
            setObsDialog(false)
          }}>✅ Confirmar cierre</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ======================== VISTA HISTORIAL ========================

function VistaHistorial({ cortes, loading, onVerDetalle }: {
  cortes: CorteResumen[]; loading: boolean; onVerDetalle: (id: string) => void
}) {
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'pipas' | 'cilindros'>('todos')
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'pendiente' | 'validado'>('todos')

  const filtrados = cortes.filter(c => {
    if (fechaDesde && c.dia < fechaDesde) return false
    if (fechaHasta && c.dia > fechaHasta) return false
    if (tipoFiltro !== 'todos' && c.repartidor?.tipoRepartidor !== tipoFiltro) return false
    if (estadoFiltro !== 'todos' && c.estado !== estadoFiltro) return false
    return true
  })

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}><TextField label="Desde" type="date" size="small" fullWidth value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={3}><TextField label="Hasta" type="date" size="small" fullWidth value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} sm={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={tipoFiltro} label="Tipo" onChange={e => setTipoFiltro(e.target.value as any)}>
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="pipas">🚛 Pipas</MenuItem>
                <MenuItem value="cilindros">🔵 Cilindros</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={estadoFiltro} label="Estado" onChange={e => setEstadoFiltro(e.target.value as any)}>
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="pendiente">⏳ Pendientes</MenuItem>
                <MenuItem value="validado">✅ Validados</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Typography variant="caption" color="text.secondary">{filtrados.length} corte{filtrados.length !== 1 ? 's' : ''}</Typography>
          </Grid>
        </Grid>
      </Paper>
      {loading ? <LinearProgress /> : filtrados.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Sin cortes con esos filtros</Typography></Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Fecha</b></TableCell>
                <TableCell><b>Repartidor</b></TableCell>
                <TableCell><b>Tipo</b></TableCell>
                <TableCell><b>Estado</b></TableCell>
                <TableCell align="right"><b>Total</b></TableCell>
                <TableCell align="center"><b>Acción</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell><Typography variant="caption">{fmtFecha(c.dia)}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {c.repartidor?.tipoRepartidor === 'pipas' ? '🚛' : '🔵'} {nombreRepartidor(c.repartidor)}
                    </Typography>
                  </TableCell>
                  <TableCell><Typography variant="caption">{c.repartidor?.tipoRepartidor === 'pipas' ? 'Pipas' : 'Cilindros'}</Typography></TableCell>
                  <TableCell><ChipEstado estado={c.estado} /></TableCell>
                  <TableCell align="right"><Typography fontWeight="bold">{fmt$(c.tipo === 'venta_dia' ? c.totalVentas : c.totalAbonos)}</Typography></TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalle"><IconButton size="small" onClick={() => onVerDetalle(c.id)}><Visibility fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

// ======================== DIALOGS ========================

function DialogCorteManual({ open, onClose, onCrear, sedeId }: { 
  open: boolean; onClose: () => void; onCrear: (d: any) => Promise<void>; sedeId?: string | null 
}) {
  const [repartidorId, setRepartidorId] = useState('')
  const [tipo, setTipo] = useState('venta_dia')
  const [dia, setDia] = useState(getHoyMx())
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [repartidores, setRepartidores] = useState<any[]>([])
  const [loadingReps, setLoadingReps] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (!open) return
    setLoadingReps(true)
    const filtros: any = { rol: 'repartidor', estado: 'activo' }
    if (sedeId) filtros.sede = sedeId
    usuariosAPI.getAll(filtros)
      .then(data => setRepartidores(data || []))
      .catch(() => setRepartidores([]))
      .finally(() => setLoadingReps(false))
  }, [open, sedeId])

  const repsFiltrados = repartidores.filter(r => {
    const nombre = `${r.nombres || ''} ${r.apellidoPaterno || ''}`.toLowerCase()
    return nombre.includes(busqueda.toLowerCase())
  })

  const repSeleccionado = repartidores.find(r => r.id === repartidorId)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear corte manual</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>Úsalo cuando el repartidor no generó corte desde la app.</Alert>
          
          {/* Buscador de repartidor */}
          <Box>
            <TextField
              label="Buscar repartidor"
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setRepartidorId('') }}
              size="small" fullWidth
              placeholder="Escribe el nombre..."
              InputProps={{ endAdornment: loadingReps ? <CircularProgress size={16} /> : null }}
            />
            {busqueda && repsFiltrados.length > 0 && !repSeleccionado && (
              <Paper variant="outlined" sx={{ mt: 0.5, maxHeight: 200, overflow: 'auto' }}>
                {repsFiltrados.map(r => (
                  <Box key={r.id} sx={{ px: 2, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onClick={() => { setRepartidorId(r.id); setBusqueda(`${r.nombres || ''} ${r.apellidoPaterno || ''}`.trim()) }}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">{r.nombres} {r.apellidoPaterno}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.tipoRepartidor === 'pipas' ? '🚛 Pipas' : '🔵 Cilindros'}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{r.sede}</Typography>
                  </Box>
                ))}
              </Paper>
            )}
            {repSeleccionado && (
              <Box sx={{ mt: 0.5, p: 1.5, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.light', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="success.main">✓ {repSeleccionado.nombres} {repSeleccionado.apellidoPaterno}</Typography>
                  <Typography variant="caption" color="text.secondary">{repSeleccionado.tipoRepartidor === 'pipas' ? '🚛 Pipas' : '🔵 Cilindros'} · {repSeleccionado.sede}</Typography>
                </Box>
                <Button size="small" onClick={() => { setRepartidorId(''); setBusqueda('') }}>Cambiar</Button>
              </Box>
            )}
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel>Tipo de corte</InputLabel>
            <Select value={tipo} label="Tipo de corte" onChange={e => setTipo(e.target.value)}>
              <MenuItem value="venta_dia">Venta del día</MenuItem>
              <MenuItem value="abono">Abonos</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Fecha" type="date" value={dia} onChange={e => setDia(e.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Observaciones" multiline rows={2} value={observaciones} onChange={e => setObservaciones(e.target.value)} size="small" fullWidth />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={loading || !repartidorId} onClick={async () => {
          if (!repartidorId) { setError('Selecciona un repartidor'); return }
          setLoading(true); setError('')
          try { await onCrear({ repartidorId, tipo, dia, observaciones }); setRepartidorId(''); setBusqueda(''); setObservaciones(''); onClose() }
          catch (e: any) { setError(e.message || 'Error') }
          finally { setLoading(false) }
        }}>
          {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null} Crear corte
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function DialogCorregirPago({ open, onClose, pedidoId, pedidoNombre, corteId, onCorregido }: {
  open: boolean; onClose: () => void; pedidoId: string; pedidoNombre: string; corteId: string; onCorregido: () => void
}) {
  const TIPOS = ['efectivo', 'transferencia', 'tarjeta', 'cheque', 'credito']
  const [formasPago, setFormasPago] = useState([{ tipo: 'efectivo', monto: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Corregir forma de pago</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Pedido de: <b>{pedidoNombre}</b></Typography>
        {formasPago.map((fp, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={fp.tipo} label="Tipo" onChange={e => { const u = [...formasPago]; u[i].tipo = e.target.value; setFormasPago(u) }}>
                {TIPOS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Monto" type="number" size="small" sx={{ flex: 1 }} value={fp.monto}
              onChange={e => { const u = [...formasPago]; u[i].monto = e.target.value; setFormasPago(u) }} />
            {i > 0 && <IconButton size="small" onClick={() => setFormasPago(formasPago.filter((_, j) => j !== i))}><Close fontSize="small" /></IconButton>}
          </Box>
        ))}
        <Button size="small" sx={{ mt: 0.5 }} onClick={() => setFormasPago([...formasPago, { tipo: 'efectivo', monto: '' }])}>+ Agregar</Button>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={loading} onClick={async () => {
          const payload = formasPago.filter(f => parseFloat(f.monto) > 0).map(f => ({ tipo: f.tipo, monto: parseFloat(f.monto) }))
          if (!payload.length) { setError('Ingresa al menos un monto'); return }
          setLoading(true); setError('')
          try { await ventasAPI.corregirFormaPago(corteId, pedidoId, { formasPago: payload }); onCorregido(); onClose(); setFormasPago([{ tipo: 'efectivo', monto: '' }]) }
          catch (e: any) { setError(e.message || 'Error') }
          finally { setLoading(false) }
        }}>
          {loading ? <CircularProgress size={16} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function DialogReimprimir({ open, onClose, detalle, litrosReporte, servicioNum }: {
  open: boolean; onClose: () => void; detalle: CorteDetalle | null
  litrosReporte?: Record<string, string>; servicioNum?: Record<string, string>
}) {
  if (!detalle) return null
  const esPipas = detalle.repartidor?.tipoRepartidor === 'pipas'
  const resumen = detalle.resumenFormasPago || {}
  const totalCorte = detalle.totalVentas || detalle.totalAbonos || 0

  const pedidosOrden = [...(detalle.pedidos || [])].sort((a, b) => {
    const na = parseInt((servicioNum || {})[a.pedidoId] || '0')
    const nb = parseInt((servicioNum || {})[b.pedidoId] || '0')
    if (na && nb) return na - nb
    if (na) return -1
    if (nb) return 1
    return (a.numero || 0) - (b.numero || 0)
  })

  const handlePrint = () => {
    const rep = nombreRepartidor(detalle.repartidor)
    const totalCorteVal = totalCorte
    const resumenFP = resumen

    // Construir servicios
    const pedSorted = [...(detalle.pedidos||[])].sort((a,b) => {
      const na = parseInt((servicioNum||{})[`${a.pedidoId}_0`] || (servicioNum||{})[a.pedidoId] || '0')
      const nb = parseInt((servicioNum||{})[`${b.pedidoId}_0`] || (servicioNum||{})[b.pedidoId] || '0')
      if (na && nb) return na - nb; if (na) return -1; if (nb) return 1
      return (a.numero||0) - (b.numero||0)
    })

    let serviciosHtml = ''
    let srvCount = 0

    if (esPipas) {
      pedSorted.forEach(p => {
        const prods = (p.productos||[]).filter((pr: any) => pr.cantidad > 0)
        const rows = prods.length > 0
          ? prods.map((pr: any, pi: number) => ({
              rowKey: `${p.pedidoId}_${pi}`, clienteNombre: p.clienteNombre,
              litros: pr.cantidad, subtotal: pr.subtotal || pr.precio * pr.cantidad,
              totalPedido: p.total, formasPago: pi === 0 ? p.formasPago : [],
              formaPagoCorte: pi === 0 ? p.formaPagoCorte : '', isFirst: pi === 0, descuento: pr.descuento || 0
            }))
          : [{ rowKey: p.pedidoId, clienteNombre: p.clienteNombre, litros: p.litros, subtotal: p.total, totalPedido: p.total, formasPago: p.formasPago, formaPagoCorte: p.formaPagoCorte, isFirst: true, descuento: p.descuento || 0 }]

        rows.forEach((row: any) => {
          srvCount++
          const numStr = (servicioNum||{})[row.rowKey] || String(srvCount).padStart(3, '0')
          const fps = row.formasPago?.length > 0
            ? row.formasPago.map((f: any) => `<div class="fp-line"><span>${f.tipo.toUpperCase()}:</span><span>$${f.monto.toFixed(2)}</span></div>`).join('')
            : row.formaPagoCorte ? `<div class="fp-line"><span>${row.formaPagoCorte.toUpperCase()}</span></div>` : ''
          const lrep = (litrosReporte||{})[row.rowKey]
          const litrosLine = lrep && parseFloat(lrep) > 0
            ? `<div class="row-sb"><span>${row.litros.toFixed(2)} L</span><span class="muted">Rpt: ${parseFloat(lrep).toFixed(2)} L</span></div>`
            : `<div class="litros">${row.litros.toFixed(2)} L</div>`
          const descLine = row.descuento > 0 ? `<div class="descuento">Descuento: -$${row.descuento.toFixed(2)}</div>` : ''
          const totalLine = row.isFirst
            ? `<div class="row-sb"><span class="bold">${numStr}. ${row.clienteNombre}</span><span class="bold">$${row.totalPedido.toFixed(2)}</span></div>`
            : `<div class="row-sb indent"><span class="muted">↳ carga ${row.litros.toFixed(2)} L</span><span>$${row.subtotal.toFixed(2)}</span></div>`
          serviciosHtml += `<div class="servicio">${totalLine}${fps}${litrosLine}${descLine}</div>`
        })
      })
    } else {
      pedSorted.forEach((p: any) => {
        srvCount++
        const numStr = (servicioNum||{})[p.pedidoId] || String(srvCount).padStart(3, '0')
        const prodsHtml = (p.productos||[]).filter((pr: any) => pr.cantidad > 0).map((pr: any) => {
          const kg = pr.kg ? `CIL ${pr.kg} KG` : pr.nombre || ''
          const desc = pr.descuento > 0 ? ` <span class="descuento">-$${pr.descuento.toFixed(2)}</span>` : ''
          return `<div class="prod-line">${pr.cantidad} × ${kg}${desc}</div>`
        }).join('')
        const fps = p.formasPago?.length > 0
          ? p.formasPago.map((f: any) => `<div class="fp-line"><span>${f.tipo.toUpperCase()}:</span><span>$${f.monto.toFixed(2)}</span></div>`).join('')
          : p.formaPagoCorte ? `<div class="fp-line"><span>${p.formaPagoCorte.toUpperCase()}</span></div>` : ''
        serviciosHtml += `<div class="servicio"><div class="row-sb"><span class="bold">${numStr}. ${p.clienteNombre}</span><span class="bold">$${p.total.toFixed(2)}</span></div>${prodsHtml}${fps}</div>`
      })
      // Resumen cilindros ya aparece arriba en RESUMEN DE VENTAS
    }

    // Formas de pago totales
    const fpLabels: Record<string, string> = { efectivo:'EFECTIVO', transferencia:'TRANSFERENCIA', tarjeta:'TARJETA', cheque:'CHEQUES', credito:'CRÉDITO', deposito:'DEPÓSITO', otros:'OTROS' }
    const fpHtml = Object.entries(resumenFP).filter(([,v]) => (v as number) > 0)
      .map(([k,v]) => `<div class="row-sb"><span>${fpLabels[k]||k.toUpperCase()}:</span><span>$${(v as number).toFixed(2)}</span></div>`).join('')

    // Depósitos
    let depHtml = ''
    if (detalle.depositos && detalle.depositos.length > 0) {
      const totalDep = detalle.depositos.reduce((s: number, d: any) => s + (parseFloat(d.total || 0) || parseFloat(d.monto || 0) * 1000), 0)
      const totalBilletes = detalle.depositos.reduce((s: number, d: any) => s + parseFloat(d.billetesRechazados || 0), 0)
      const totalMonedas = detalle.depositos.reduce((s: number, d: any) => s + parseFloat(d.monedas || 0), 0)
      const totalEfRecibido = totalDep + totalBilletes + totalMonedas
      const folios = detalle.depositos.map((d: any) => d.folio).filter(Boolean).join(', ')
      const depRows = detalle.depositos.map((d: any, i: number) => {
        const dReal = parseFloat(d.total || 0) || parseFloat(d.monto || 0) * 1000
        return `<div class="row-sb"><span>Depósito ${i+1} — ${d.folio||''}</span><span>$${dReal.toFixed(2)}</span></div>`
      }).join('')
      const billetesRow = totalBilletes > 0 ? `<div class="row-sb"><span>Bill. rechazados:</span><span>$${totalBilletes.toFixed(2)}</span></div>` : ''
      const monedasRow = totalMonedas > 0 ? `<div class="row-sb"><span>Monedas:</span><span>$${totalMonedas.toFixed(2)}</span></div>` : ''
      depHtml = `
        <div class="section-header">EFECTIVO Y DEPÓSITOS</div>
        ${depRows}
        <div class="row-sb"><span>Bill. rechazados:</span><span>$${totalBilletes.toFixed(2)}</span></div>
        <div class="row-sb"><span>Monedas:</span><span>$${totalMonedas.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="row-sb bold"><span>Total efectivo recibido:</span><span>$${totalEfRecibido.toFixed(2)}</span></div>`
    }

    const litrosSection = esPipas && detalle.totalLitros > 0
      ? `<div class="divider"></div><div class="row-sb"><span>LITROS (app):</span><span>${(detalle.totalLitros||0).toFixed(2)} L</span></div>` : ''

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Corte de Caja</title>
<style>
  @page { margin: 2mm 3mm; size: 80mm auto; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, 'Helvetica Neue', sans-serif; font-size: 8.5pt; font-weight: 500; line-height: 1.45; width: 74mm; color: #000; padding: 2mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; orphans: 3; widows: 3; }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .muted { color: #444; font-size: 7.5pt; }
  .divider { border-top: 1.5px dashed #000; margin: 3px 0; }
  .divider-solid { border-top: 2.5px solid #000; margin: 3px 0; }
  .header { text-align: center; margin-bottom: 4px; }
  .header .empresa { font-size: 11pt; font-weight: 900; letter-spacing: 0.5px; }
  .header .sub { font-size: 7pt; font-weight: 500; }
  .titulo { text-align: center; font-weight: 800; font-size: 9.5pt; margin: 3px 0; letter-spacing: 2px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 8pt; margin: 1.5px 0; font-weight: 500; }
  .section-header { text-align: center; font-weight: 800; font-size: 8pt; background: #000 !important; color: #fff !important; padding: 2px 0; margin: 5px 0 3px; letter-spacing: 1.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .servicio { margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1.5px dashed #000; page-break-inside: avoid; break-inside: avoid; }
  .row-sb { display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 500; }
  .row-sb.indent { padding-left: 8px; }
  .fp-line { display: flex; justify-content: space-between; font-size: 8pt; padding-left: 4px; font-weight: 500; }
  .litros { font-size: 8pt; padding-left: 4px; font-weight: 500; }
  .descuento { font-size: 8pt; color: #000; padding-left: 4px; font-weight: 600; }
  .prod-line { font-size: 8pt; padding-left: 8px; font-weight: 500; }
  .total-block { margin: 3px 0; page-break-inside: avoid; break-inside: avoid; }
  .total-block .total-main { display: flex; justify-content: space-between; font-weight: 800; font-size: 10pt; border-top: 2.5px solid #000; border-bottom: 1.5px solid #000; padding: 2px 0; }
  .footer { text-align: center; font-size: 7.5pt; margin-top: 4px; font-weight: 500; }
</style>
</head>
<body>
  <div class="header">
    <div class="empresa">GAS PROVIDENCIA</div>
    <div class="sub">PLANTA DOLORES HIDALGO</div>
    <div class="sub">"EL GAS QUE RINDE LO QUE CUESTA"</div>
  </div>
  <div class="divider-solid"></div>
  <div class="titulo">CORTE VENTA DÍA</div>
  <div class="meta-row"><span>Folio:</span><span>${detalle.id.slice(-8).toUpperCase()}</span></div>
  <div class="divider"></div>
  <div class="meta-row"><span>Repartidor:</span><span><b>${rep}</b></span></div>
  <div class="meta-row"><span>Fecha:</span><span>${fmtFecha(detalle.dia)}</span></div>
  <div class="meta-row"><span>Tipo:</span><span>${esPipas ? 'PIPAS' : 'CILINDROS'}</span></div>
  <div class="divider"></div>

  <div class="section-header">RESUMEN DE VENTAS</div>
  <div class="meta-row"><span>Servicios realizados:</span><span><b>${pedSorted.length}</b></span></div>
  ${esPipas ? `<div class="meta-row"><span>Litros (app):</span><span><b>${(detalle.totalLitros||0).toFixed(2)} L</b></span></div>` : ''}
  ${!esPipas && detalle.desgloseCilindros && detalle.desgloseCilindros.length > 0 ? `
    <div class="divider"></div>
    ${detalle.desgloseCilindros.map((d: any) => `<div class="row-sb"><span>${d.nombre}:</span><span>${d.unidades} cil = $${d.monto.toFixed(2)}</span></div>`).join('')}
    <div class="row-sb bold"><span>Total cilindros:</span><span>${detalle.desgloseCilindros.reduce((s: number,d: any) => s + d.unidades, 0)} cil</span></div>
  ` : ''}

  <div class="section-header">FORMAS DE PAGO RECIBIDAS</div>
  ${fpHtml}
  <div class="divider"></div>
  <div class="row-sb bold" style="font-size:10pt"><span>Total ventas:</span><span>$${totalCorteVal.toFixed(2)}</span></div>

  <div class="section-header">DETALLE POR ${esPipas ? 'SERVICIO' : 'CLIENTE'}</div>
  ${serviciosHtml}

  <div class="divider-solid"></div>
  <div class="total-block">
    <div class="total-main"><span>TOTAL</span><span>$${totalCorteVal.toFixed(2)}</span></div>
    ${litrosSection}
  </div>

  ${depHtml ? `<div class="divider"></div>${depHtml}` : ''}

  <div class="divider"></div>
  <div class="footer">
    <div>Repartidor(a): ${rep}</div>
    <div>Representación impresa del corte de venta</div>
    <div>Estado: ${detalle.estado.toUpperCase()} VALIDACIÓN</div>
  </div>
</body>
</html>`

    const w = window.open('', '_blank', 'width=380,height=900')
    if (!w) return
    w.document.write(html); w.document.close()
    setTimeout(() => { w.print(); w.close() }, 600)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Vista previa — Corte
        <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ fontFamily: 'Courier New, monospace', fontSize: '0.7rem', p: 1.5, border: '1px dashed #bbb', borderRadius: 1, bgcolor: '#fafafa', lineHeight: 1.5, maxHeight: 440, overflow: 'auto', whiteSpace: 'pre' }}>
          {(() => {
            const SEP = '-'.repeat(38); const SEP2 = '='.repeat(38)
            const lines: string[] = ['GAS PROVIDENCIA','CORTE DE CAJA', fmtFecha(detalle.dia), SEP,
              `Repartidor: ${nombreRepartidor(detalle.repartidor)}`,
              `Tipo: ${esPipas ? 'PIPAS' : 'CILINDROS'}`,
              `Estado: ${detalle.estado.toUpperCase()}`,
              `Folio: ${detalle.id.slice(-8).toUpperCase()}`, SEP]
            let srvC = 0
            pedidosOrden.forEach(p => {
              const prods = esPipas ? (p.productos||[]).filter(pr => pr.cantidad > 0) : []
              const rows = esPipas && prods.length > 1
                ? prods.map((pr,pi) => ({ rk: `${p.pedidoId}_${pi}`, cli: p.clienteNombre, litros: pr.cantidad, sub: pr.subtotal || pr.precio*pr.cantidad, tot: p.total, fps: pi===0?p.formasPago:[], fpc: pi===0?p.formaPagoCorte:'', first: pi===0 }))
                : [{ rk: p.pedidoId, cli: p.clienteNombre, litros: p.litros, sub: p.total, tot: p.total, fps: p.formasPago, fpc: p.formaPagoCorte, first: true }]
              rows.forEach(r => {
                srvC++
                const num = (servicioNum||{})[r.rk] || String(srvC).padStart(3,'0')
                lines.push(`${num}. ${r.cli.substring(0,28)}`)
                if (r.first) lines.push(`$${r.tot.toFixed(2)}`)
                else lines.push(`   ${r.litros.toFixed(2)} L = $${r.sub.toFixed(2)}`)
                ;(r.fps?.length > 0 ? r.fps.map((f:any) => `${f.tipo}: $${f.monto.toFixed(2)}`) : r.fpc ? [r.fpc] : []).forEach((l:string) => lines.push(l))
                if (esPipas) {
                  const lrep = (litrosReporte||{})[r.rk]
                  lines.push(lrep && parseFloat(lrep)>0 ? `${r.litros.toFixed(2)} L (rpt:${parseFloat(lrep).toFixed(2)})` : `${r.litros.toFixed(2)} L`)
                }
              })
              if (!esPipas) {
                ;(p.productos||[]).filter(pr=>pr.cantidad>0).forEach(pr => lines.push(`  ${pr.cantidad}x ${pr.kg ? 'CIL '+pr.kg+' KG' : pr.nombre||''} = $${pr.subtotal.toFixed(2)}`))
              }
            })
            lines.push(SEP2, `TOTAL                   $${totalCorte.toFixed(2)}`)
            Object.entries(resumen).filter(([,v])=>(v as number)>0).forEach(([k,v]) => lines.push(`${k.toUpperCase().padEnd(24)}$${(v as number).toFixed(2)}`))
            if (esPipas && detalle.totalLitros > 0) lines.push(SEP, `LITROS (app)            ${(detalle.totalLitros||0).toFixed(2)} L`)
            return lines.join('\n')
          })()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>Imprimir (80mm)</Button>
      </DialogActions>
    </Dialog>
  )
}

// ======================== MAIN PAGE ========================

export default function CorteCajaPage() {
  const [vista, setVista] = useState<'dashboard' | 'detalle' | 'historial'>('dashboard')
  const [fecha, setFecha] = useState(getHoyMx())
  const [resumen, setResumen] = useState<ResumenDia | null>(null)
  const [cortes, setCortes] = useState<CorteResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [corteDetalle, setCorteDetalle] = useState<CorteDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [dialogManual, setDialogManual] = useState(false)
  const [dialogCorregir, setDialogCorregir] = useState({ open: false, pedidoId: '', pedidoNombre: '' })
  const [dialogReimprimir, setDialogReimprimir] = useState(false)
  const [reimprimirExtras, setReimprimirExtras] = useState<{ litrosReporte: Record<string, string>; servicioNum: Record<string, string> }>({ litrosReporte: {}, servicioNum: {} })
  const [cerrarRapidoId, setCerrarRapidoId] = useState<string | null>(null)
  const [sedes, setSedes] = useState<Sede[]>([])
  const [sedeId, setSedeId] = useState<string | null>(null)
  const [sedeSeleccionada, setSedeSeleccionada] = useState<string | null>(null)
  const [esSuperAdmin, setEsSuperAdmin] = useState(false)

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => setSnackbar({ open: true, message, severity })

  const loadDashboard = useCallback(async (f: string) => {
    setLoading(true)
    try {
      const data = await ventasAPI.getResumenDia(f, sedeId || undefined)
      setResumen(data)
    } catch (e: any) {
      showSnack(e.message || 'Error al cargar', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHistorial = useCallback(async () => {
    try {
      const data = await ventasAPI.getAllCortes()
      setCortes(data || [])
    } catch (e: any) { showSnack(e.message || 'Error', 'error') }
  }, [])

  // Cargar usuario y sedes al montar
  useEffect(() => {
    const init = async () => {
      try {
        const user = await authAPI.getProfile()
        const sedesData = await sedesAPI.getAll()
        setSedes(sedesData)
        const esSuper = user.rol === 'superAdministrador'
        setEsSuperAdmin(esSuper)
        if (user.sede) {
          const found = sedesData.find((s: Sede) => s.id === user.sede || s.nombre === user.sede || s.nombre?.toUpperCase() === user.sede?.toUpperCase())
          const id = found?.id || null
          setSedeId(esSuper ? (id || sedesData[0]?.id || null) : id)
          setSedeSeleccionada(esSuper ? (id || sedesData[0]?.id || null) : id)
        } else if (esSuper) {
          setSedeId(sedesData[0]?.id || null)
          setSedeSeleccionada(sedesData[0]?.id || null)
        }
      } catch (e) { /* ignore */ }
    }
    init()
  }, [])

  useEffect(() => { if (vista === 'dashboard') loadDashboard(fecha) }, [fecha, vista, sedeId, loadDashboard])
  useEffect(() => { if (vista === 'historial') loadHistorial() }, [vista, loadHistorial])

  const handleVerDetalle = async (id: string, destino: 'dashboard' | 'historial' = 'dashboard') => {
    setLoadingDetalle(true); setCorteDetalle(null); setVista('detalle')
    try { const data = await ventasAPI.getCorteDetalle(id); setCorteDetalle(data) }
    catch (e: any) { showSnack(e.message || 'Error', 'error'); setVista(destino) }
    finally { setLoadingDetalle(false) }
  }

  const handleCerrarCorte = async (id: string, litrosMedidor?: number, observaciones?: string) => {
    try {
      await ventasAPI.cerrarCorte(id, { litrosMedidor, observaciones })
      showSnack('✅ Corte cerrado correctamente')
      loadDashboard(fecha)
      if (corteDetalle?.id === id) { const u = await ventasAPI.getCorteDetalle(id); setCorteDetalle(u) }
    } catch (e: any) { showSnack(e.message || 'Error', 'error') }
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {vista !== 'dashboard' && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setVista('dashboard')}>📊 Dashboard</Button>
          <Button variant={vista === 'historial' ? 'contained' : 'outlined'} size="small" onClick={() => setVista('historial')}>📋 Historial</Button>
        </Box>
      )}

      {vista === 'dashboard' && (
        <>
          <VistaDashboard
            resumen={resumen} loading={loading} fecha={fecha}
            onFechaChange={f => { setFecha(f); setVista('dashboard') }}
            onVerDetalle={id => handleVerDetalle(id, 'dashboard')}
            onCrearManual={() => setDialogManual(true)}
            onCerrarRapido={id => setCerrarRapidoId(id)}
            sedes={sedes} sedeId={sedeId} sedeSeleccionada={sedeSeleccionada}
            esSuperAdmin={esSuperAdmin}
            onSedeChange={id => { setSedeSeleccionada(id); setSedeId(id) }}
          />
          {/* Botón historial abajo */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" size="small" onClick={() => setVista('historial')}>📋 Ver historial completo</Button>
          </Box>
        </>
      )}

      {vista === 'detalle' && (
        <VistaDetalle
          detalle={corteDetalle} loading={loadingDetalle}
          onVolver={() => setVista('dashboard')}
          onCerrarCorte={handleCerrarCorte}
          onCorregirPago={(pid, pn) => setDialogCorregir({ open: true, pedidoId: pid, pedidoNombre: pn })}
          onReimprimir={extras => { if (extras) setReimprimirExtras(extras); setDialogReimprimir(true) }}
        />
      )}

      {vista === 'historial' && (
        <VistaHistorial cortes={cortes} loading={loading} onVerDetalle={id => handleVerDetalle(id, 'historial')} />
      )}

      <DialogCorteManual open={dialogManual} onClose={() => setDialogManual(false)} sedeId={sedeId}
        onCrear={async d => { await ventasAPI.createCorteManual(d); showSnack('✅ Corte creado'); loadDashboard(fecha) }} />

      {dialogCorregir.open && corteDetalle && (
        <DialogCorregirPago open={dialogCorregir.open} onClose={() => setDialogCorregir(p => ({ ...p, open: false }))}
          pedidoId={dialogCorregir.pedidoId} pedidoNombre={dialogCorregir.pedidoNombre} corteId={corteDetalle.id}
          onCorregido={async () => { showSnack('✅ Forma de pago corregida'); const u = await ventasAPI.getCorteDetalle(corteDetalle.id); setCorteDetalle(u) }} />
      )}

      <DialogReimprimir open={dialogReimprimir} onClose={() => setDialogReimprimir(false)}
        detalle={corteDetalle} litrosReporte={reimprimirExtras.litrosReporte} servicioNum={reimprimirExtras.servicioNum} />

      {/* Dialog cierre rápido */}
      <Dialog open={!!cerrarRapidoId} onClose={() => setCerrarRapidoId(null)} maxWidth="xs">
        <DialogTitle>Cerrar corte</DialogTitle>
        <DialogContent>
          <Typography>¿Confirmas cerrar este corte? Para validar litros del medidor usa "Ver detalle" primero.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCerrarRapidoId(null)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={async () => {
            if (!cerrarRapidoId) return
            try { await ventasAPI.cerrarCorte(cerrarRapidoId, {}); setCerrarRapidoId(null); loadDashboard(fecha) }
            catch (e: any) { showSnack(e.message || 'Error', 'error'); setCerrarRapidoId(null) }
          }}>✅ Confirmar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
