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
import { ventasAPI } from '@/lib/api'

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

function VistaDashboard({ resumen, loading, fecha, onFechaChange, onVerDetalle, onCrearManual, onCerrarRapido }: {
  resumen: ResumenDia | null; loading: boolean; fecha: string
  onFechaChange: (f: string) => void
  onVerDetalle: (id: string) => void
  onCrearManual: () => void
  onCerrarRapido: (id: string) => void
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

  const pedidosOrdenados = [...(detalle.pedidos || [])].sort((a, b) => {
    const na = parseInt(servicioNum[a.pedidoId] || '0')
    const nb = parseInt(servicioNum[b.pedidoId] || '0')
    if (na && nb) return na - nb
    if (na) return -1
    if (nb) return 1
    return (a.numero || 0) - (b.numero || 0)
  })

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
                    onChange={e => setLitrosMedidor(e.target.value)} size="small" fullWidth
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
            {pedidosOrdenados.length === 0 ? (
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
                        </>
                      ) : <TableCell><b>Productos</b></TableCell>}
                      <TableCell><b>Forma de pago</b></TableCell>
                      <TableCell align="right"><b>Total</b></TableCell>
                      <TableCell align="center" sx={{ width: 40 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pedidosOrdenados.map((p, rowIdx) => (
                      <TableRow key={p.pedidoId} hover>
                        {esPipas ? (
                          <TableCell sx={{ py: 0.5 }}>
                            <TextField size="small" type="number"
                              value={servicioNum[p.pedidoId] || ''}
                              onChange={e => setServicioNum(prev => ({ ...prev, [p.pedidoId]: e.target.value }))}
                              placeholder={String(rowIdx + 1)}
                              sx={{ width: 52, '& input': { p: '4px 6px', fontSize: '0.75rem', textAlign: 'center' } }} />
                          </TableCell>
                        ) : (
                          <TableCell><Typography variant="caption" color="text.secondary">{p.numero}</Typography></TableCell>
                        )}
                        <TableCell><Typography variant="body2">{p.clienteNombre}</Typography></TableCell>
                        {esPipas ? (
                          <>
                            <TableCell align="right">
                              <Typography variant="body2">{(p.litros || 0).toFixed(1)} L</Typography>
                              {p.descuento > 0 && <Typography variant="caption" color="error.main" display="block">-{fmt$(p.descuento)}</Typography>}
                            </TableCell>
                            <TableCell align="right" sx={{ py: 0.5 }}>
                              <TextField size="small" type="number"
                                value={litrosReporte[p.pedidoId] || ''}
                                onChange={e => setLitrosReporte(prev => ({ ...prev, [p.pedidoId]: e.target.value }))}
                                placeholder="0.0"
                                sx={{ width: 72, '& input': { p: '4px 6px', fontSize: '0.75rem', textAlign: 'right' } }}
                                InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.3, fontSize: '0.65rem' }}>L</Typography> }} />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption" color="text.secondary">
                                {p.litros > 0 ? `$${(p.total / p.litros).toFixed(2)}` : '—'}
                              </Typography>
                            </TableCell>
                          </>
                        ) : (
                          <TableCell>
                            {(p.productos || []).map((prod, pi) => (
                              <Typography key={pi} variant="caption" display="block">
                                {prod.cantidad} × {prod.nombre}
                                {prod.descuento > 0 && <span style={{ color: '#f44336' }}> (-{fmt$(prod.descuento)})</span>}
                              </Typography>
                            ))}
                          </TableCell>
                        )}
                        <TableCell>
                          {p.formasPago && p.formasPago.length > 0
                            ? p.formasPago.map((f, fi) => (
                              <Typography key={fi} variant="caption" display="block">{f.tipo}: <b>{fmt$(f.monto)}</b></Typography>
                            ))
                            : <Typography variant="caption" color="text.secondary">{p.formaPagoCorte || '—'}</Typography>}
                        </TableCell>
                        <TableCell align="right"><Typography fontWeight="medium">{fmt$(p.total)}</Typography></TableCell>
                        <TableCell align="center">
                          <Tooltip title="Corregir forma de pago">
                            <IconButton size="small" onClick={() => onCorregirPago(p.pedidoId, p.clienteNombre)}>
                              <Edit sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {esPipas && Object.keys(litrosReporte).some(k => litrosReporte[k]) && (
                      <TableRow sx={{ bgcolor: totalLitrosIngresados > 0 && Math.abs(litrosApp - totalLitrosIngresados) > 20 ? '#fff3f3' : '#f3fff3' }}>
                        <TableCell colSpan={3} align="right"><Typography variant="caption" fontWeight="bold">Total litros ingresados:</Typography></TableCell>
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><b>Folio</b></TableCell>
                    <TableCell align="right"><b>Billetes</b></TableCell>
                    <TableCell align="right"><b>Monedas</b></TableCell>
                    <TableCell align="right"><b>Total depósito</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalle.depositos.map((dep: any, i: number) => {
                    const totalDep = parseFloat(dep.total || 0) > parseFloat(dep.monto || 0) ? parseFloat(dep.total || 0) : parseFloat(dep.monto || 0)
                    return (
                      <TableRow key={i}>
                        <TableCell>{dep.folio || '—'}</TableCell>
                        <TableCell align="right">{parseFloat(dep.monedas || 0) > 0 ? fmt$(parseFloat(dep.monto || 0)) : '—'}</TableCell>
                        <TableCell align="right">{parseFloat(dep.monedas || 0) > 0 ? fmt$(parseFloat(dep.monedas || 0)) : '—'}</TableCell>
                        <TableCell align="right"><b>{fmt$(totalDep)}</b></TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell colSpan={3}><b>Total depositado</b></TableCell>
                    <TableCell align="right">
                      <b>{fmt$(detalle.depositos.reduce((s: number, d: any) => {
                        const t = parseFloat(d.total || 0) > parseFloat(d.monto || 0) ? parseFloat(d.total || 0) : parseFloat(d.monto || 0)
                        return s + t
                      }, 0))}</b>
                    </TableCell>
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

function DialogCorteManual({ open, onClose, onCrear }: { open: boolean; onClose: () => void; onCrear: (d: any) => Promise<void> }) {
  const [repartidorId, setRepartidorId] = useState('')
  const [tipo, setTipo] = useState('venta_dia')
  const [dia, setDia] = useState(getHoyMx())
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear corte manual</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>Úsalo cuando el repartidor no generó corte desde la app.</Alert>
          <TextField label="ID del repartidor" value={repartidorId} onChange={e => setRepartidorId(e.target.value)} size="small" fullWidth helperText="ID interno del repartidor en el sistema" />
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
        <Button variant="contained" disabled={loading} onClick={async () => {
          if (!repartidorId.trim()) { setError('El ID es requerido'); return }
          setLoading(true); setError('')
          try { await onCrear({ repartidorId: repartidorId.trim(), tipo, dia, observaciones }); setRepartidorId(''); setObservaciones(''); onClose() }
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
    const PAD = 38
    const lines: string[] = [
      'GAS PROVIDENCIA'.padStart(19 + 7),
      'CORTE DE CAJA'.padStart(18 + 6),
      fmtFecha(detalle.dia),
      '-'.repeat(PAD),
      `Repartidor: ${nombreRepartidor(detalle.repartidor)}`,
      `Tipo: ${esPipas ? 'PIPAS' : 'CILINDROS'}`,
      `Estado: ${detalle.estado.toUpperCase()}`,
      `ID: ${detalle.id.slice(-8).toUpperCase()}`,
      '-'.repeat(PAD),
    ]
    pedidosOrden.forEach((p, idx) => {
      const num = (servicioNum || {})[p.pedidoId] || String(idx + 1)
      const cli = p.clienteNombre.substring(0, 22)
      const tot = fmt$(p.total)
      const spaces = Math.max(1, PAD - `${num}. ${cli}`.length - tot.length)
      lines.push(`${num}. ${cli}${' '.repeat(spaces)}${tot}`)
      const fps = p.formasPago?.map(f => `   ${f.tipo}: ${fmt$(f.monto)}`) || [`   ${p.formaPagoCorte || '—'}`]
      fps.forEach(l => lines.push(l))
      if (esPipas) {
        const lrep = (litrosReporte || {})[p.pedidoId]
        lines.push(lrep && parseFloat(lrep) > 0 ? `   App:${(p.litros||0).toFixed(1)}L  Rep:${parseFloat(lrep).toFixed(1)}L` : `   ${(p.litros||0).toFixed(1)} L`)
      }
    })
    lines.push('='.repeat(PAD))
    const totLabel = 'TOTAL'; const totVal = fmt$(totalCorte)
    lines.push(totLabel.padEnd(PAD - totVal.length) + totVal)
    Object.entries(resumen).forEach(([k, v]) => {
      if ((v as number) <= 0) return
      const val = fmt$(v as number)
      lines.push(k.toUpperCase().padEnd(PAD - val.length) + val)
    })
    if (esPipas && detalle.totalLitros > 0) {
      const lv = `${(detalle.totalLitros||0).toFixed(2)} L`
      lines.push('LITROS (app)'.padEnd(PAD - lv.length) + lv)
    }
    lines.push(''); lines.push('GAS PROVIDENCIA'.padStart(19 + 7))
    const html = `<!DOCTYPE html><html><head><title>Corte</title><style>@page{margin:2mm;size:80mm auto}body{font-family:'Courier New',monospace;font-size:10pt;line-height:1.3;width:72mm;margin:0 auto;padding:2mm;color:#000}pre{margin:0;font-family:inherit;font-size:inherit;white-space:pre-wrap}</style></head><body><pre>${lines.join('\n')}</pre></body></html>`
    const w = window.open('', '_blank', 'width=350,height=700')
    if (!w) return
    w.document.write(html); w.document.close()
    setTimeout(() => { w.print(); w.close() }, 500)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Vista previa — Corte
        <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ fontFamily: 'Courier New, monospace', fontSize: '0.72rem', p: 1.5, border: '1px dashed #bbb', borderRadius: 1, bgcolor: '#fafafa', lineHeight: 1.4, maxHeight: 420, overflow: 'auto', whiteSpace: 'pre' }}>
          {(() => {
            const NL = '\n'
            const lines: string[] = ['GAS PROVIDENCIA', 'CORTE DE CAJA', fmtFecha(detalle.dia), '-'.repeat(38),
              `Rep: ${nombreRepartidor(detalle.repartidor)}`, `Tipo: ${esPipas ? 'PIPAS' : 'CILINDROS'}`, '-'.repeat(38)]
            pedidosOrden.forEach((p, idx) => {
              const num = (servicioNum || {})[p.pedidoId] || String(idx + 1)
              lines.push(`${num}. ${p.clienteNombre.substring(0, 20)}  ${fmt$(p.total)}`)
              const fps = p.formasPago?.map(f => `   ${f.tipo}: ${fmt$(f.monto)}`) || [`   ${p.formaPagoCorte || '—'}`]
              fps.forEach(l => lines.push(l))
              if (esPipas) {
                const lrep = (litrosReporte || {})[p.pedidoId]
                lines.push(lrep ? `   App:${(p.litros||0).toFixed(1)}L Rep:${parseFloat(lrep).toFixed(1)}L` : `   ${(p.litros||0).toFixed(1)} L`)
              }
            })
            lines.push('='.repeat(38), `TOTAL  ${fmt$(totalCorte)}`)
            Object.entries(resumen).filter(([,v]) => (v as number) > 0).forEach(([k,v]) => lines.push(`${k.toUpperCase()}  ${fmt$(v as number)}`))
            if (esPipas && detalle.totalLitros > 0) lines.push(`LITROS  ${(detalle.totalLitros||0).toFixed(2)} L`)
            return lines.join(NL)
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

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => setSnackbar({ open: true, message, severity })

  const loadDashboard = useCallback(async (f: string) => {
    setLoading(true)
    try {
      const data = await ventasAPI.getResumenDia(f)
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

  useEffect(() => { if (vista === 'dashboard') loadDashboard(fecha) }, [fecha, vista, loadDashboard])
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

      <DialogCorteManual open={dialogManual} onClose={() => setDialogManual(false)}
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
