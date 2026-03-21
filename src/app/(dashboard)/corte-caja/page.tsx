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
  ArrowBack, CheckCircle, Edit, Print, Add, Visibility, Close, Warning
} from '@mui/icons-material'
import { ventasAPI } from '@/lib/api'

// ======================== TYPES ========================

interface CorteResumen {
  id: string
  tipo: 'venta_dia' | 'abono'
  dia: string
  fecha: string
  estado: 'pendiente' | 'validado'
  totalVentas: number
  totalAbonos: number
  totalEfectivo: number
  totalLitros: number
  totalProductosUnidades: number
  observaciones?: string
  repartidor: {
    id: string
    nombre: string
    apellidoPaterno?: string
    tipoRepartidor: 'pipas' | 'cilindros'
    sede?: string
  }
  depositos: any[]
  detalles: any[]
  resumenFormasPagoVenta: Record<string, number> | null
  resumenFormasPagoAbono: Record<string, number> | null
}

interface PedidoDetalle {
  numero: number
  pedidoId: string
  detalleId?: string
  clienteNombre: string
  fecha: string
  total: number
  litros: number
  descuento: number
  formasPago: { tipo: string; monto: number }[]
  formaPagoCorte?: string
  productos: {
    nombre: string
    kg?: number
    cantidad: number
    precio: number
    descuento: number
    subtotal: number
  }[]
}

interface DesgloseCilindro {
  kg: number
  nombre: string
  esNuevo: boolean
  unidades: number
  monto: number
  descuento: number
}

interface CorteDetalle extends CorteResumen {
  stats: Record<string, number> | null
  dailySales: any[] | null
  pedidos: PedidoDetalle[]
  desgloseCilindros: DesgloseCilindro[] | null
  resumenFormasPago: Record<string, number>
}

// ======================== HELPERS ========================

const TIMEZONE_MX = 'America/Mexico_City'

function getHoyMx(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE_MX })
}

function esHoyMx(fecha: string): boolean {
  try {
    const d = new Date(fecha + (fecha.length === 10 ? 'T12:00:00' : ''))
    return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE_MX }) === getHoyMx()
  } catch { return false }
}

function fmt$(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
}

function fmtFecha(fecha: string): string {
  try {
    const d = new Date(fecha + (fecha.length === 10 ? 'T12:00:00' : ''))
    return d.toLocaleDateString('es-MX', {
      timeZone: TIMEZONE_MX, day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch { return fecha }
}

function nombreRepartidor(r: any): string {
  if (!r) return '—'
  return `${r.nombres || r.nombre || ''} ${r.apellidoPaterno || ''}`.trim()
}

function getEstadoColor(estado: string): 'success' | 'warning' | 'default' {
  if (estado === 'validado') return 'success'
  if (estado === 'pendiente') return 'warning'
  return 'default'
}

function tipoIcon(tipo: string): string {
  return tipo === 'pipas' ? '🚛' : '🔵'
}

// ======================== KPI CARD ========================

function KPICard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight="bold" color={color || 'text.primary'} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  )
}

// ======================== RESUMEN FORMAS DE PAGO ========================

const FP_CONFIG = [
  { key: 'efectivo', label: 'Efectivo', color: '#4caf50' },
  { key: 'transferencia', label: 'Transf.', color: '#2196f3' },
  { key: 'tarjeta', label: 'Tarjeta', color: '#9c27b0' },
  { key: 'cheque', label: 'Cheque', color: '#ff9800' },
  { key: 'credito', label: 'Crédito', color: '#f44336' },
  { key: 'deposito', label: 'Depósito', color: '#00bcd4' },
  { key: 'otros', label: 'Otros', color: '#607d8b' },
]

function ResumenPago({ data, compact }: { data: Record<string, number>; compact?: boolean }) {
  const activos = FP_CONFIG.filter(c => (data?.[c.key] || 0) > 0)
  if (!data || activos.length === 0) return <Typography variant="caption" color="text.secondary">—</Typography>

  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {activos.map(c => (
          <Chip key={c.key} label={`${c.label}: ${fmt$(data[c.key])}`} size="small"
            sx={{ bgcolor: c.color + '20', color: c.color, fontWeight: 600, fontSize: '0.7rem' }} />
        ))}
      </Box>
    )
  }

  return (
    <Grid container spacing={1}>
      {activos.map(c => (
        <Grid item xs={6} sm={4} key={c.key}>
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: c.color + '12', borderLeft: `3px solid ${c.color}` }}>
            <Typography variant="caption" color="text.secondary" display="block">{c.label}</Typography>
            <Typography fontWeight="bold">{fmt$(data[c.key])}</Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  )
}

// ======================== VISTA DASHBOARD ========================

function VistaDashboard({
  cortes, loading, onVerDetalle, onCrearManual, tabActual, setTabActual
}: {
  cortes: CorteResumen[]
  loading: boolean
  onVerDetalle: (id: string) => void
  onCrearManual: () => void
  tabActual: 'ventas' | 'abonos'
  setTabActual: (t: 'ventas' | 'abonos') => void
}) {
  const [cerrarId, setCerrarId] = useState<string | null>(null)
  const [cerrando, setCerrando] = useState(false)

  const filtrados = cortes.filter(c =>
    tabActual === 'ventas' ? c.tipo === 'venta_dia' : c.tipo === 'abono'
  )

  const totalDia = filtrados.reduce((s, c) =>
    s + (tabActual === 'ventas' ? c.totalVentas : c.totalAbonos), 0)
  const totalEfectivo = filtrados.reduce((s, c) => {
    const fp = c.resumenFormasPagoVenta || c.resumenFormasPagoAbono || {}
    return s + (fp.efectivo || 0)
  }, 0)
  const totalTransf = filtrados.reduce((s, c) => {
    const fp = c.resumenFormasPagoVenta || c.resumenFormasPagoAbono || {}
    return s + (fp.transferencia || 0)
  }, 0)
  const pendientes = filtrados.filter(c => c.estado === 'pendiente').length

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KPICard label="Total del día" value={fmt$(totalDia)} color="primary.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Efectivo" value={fmt$(totalEfectivo)} color="#4caf50" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Transferencias" value={fmt$(totalTransf)} color="#2196f3" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Pendientes de cerrar" value={String(pendientes)}
            sub={pendientes > 0 ? 'cortes sin validar' : 'todos cerrados'}
            color={pendientes > 0 ? 'warning.main' : 'success.main'} />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button variant={tabActual === 'ventas' ? 'contained' : 'outlined'} size="small"
          onClick={() => setTabActual('ventas')}>
          Ventas del día
        </Button>
        <Button variant={tabActual === 'abonos' ? 'contained' : 'outlined'} size="small"
          onClick={() => setTabActual('abonos')}>
          Abonos
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<Add />} variant="outlined" size="small" onClick={onCrearManual}>
          Crear corte manual
        </Button>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : filtrados.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography>No hay cortes de {tabActual === 'ventas' ? 'ventas' : 'abonos'} para hoy</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Repartidor</b></TableCell>
                <TableCell><b>Tipo</b></TableCell>
                <TableCell><b>Estado</b></TableCell>
                <TableCell align="right"><b>Total</b></TableCell>
                <TableCell><b>Formas de Pago</b></TableCell>
                {tabActual === 'ventas' && <TableCell align="right"><b>Litros / Cil.</b></TableCell>}
                <TableCell align="center"><b>Acciones</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.map(c => {
                const fp = c.resumenFormasPagoVenta || c.resumenFormasPagoAbono || {}
                const total = tabActual === 'ventas' ? c.totalVentas : c.totalAbonos
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {tipoIcon(c.repartidor?.tipoRepartidor)} {nombreRepartidor(c.repartidor)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {c.repartidor?.tipoRepartidor === 'pipas' ? 'Pipas' : 'Cilindros'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.estado === 'validado' ? 'Validado' : 'Pendiente'}
                        color={getEstadoColor(c.estado)} size="small"
                        icon={c.estado === 'validado' ? <CheckCircle sx={{ fontSize: 14 }} /> : <Warning sx={{ fontSize: 14 }} />}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{fmt$(total)}</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <ResumenPago data={fp} compact />
                    </TableCell>
                    {tabActual === 'ventas' && (
                      <TableCell align="right">
                        <Typography variant="caption">
                          {c.repartidor?.tipoRepartidor === 'pipas'
                            ? `${(c.totalLitros || 0).toFixed(1)} L`
                            : `${c.totalProductosUnidades || 0} cil`}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Tooltip title="Ver detalle completo">
                        <IconButton size="small" onClick={() => onVerDetalle(c.id)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {c.estado === 'pendiente' && (
                        <Tooltip title="Cerrar y validar corte">
                          <IconButton size="small" color="success" onClick={() => setCerrarId(c.id)}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog confirmar cierre rápido */}
      <Dialog open={!!cerrarId} onClose={() => setCerrarId(null)} maxWidth="xs">
        <DialogTitle>Cerrar corte</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Confirmas cerrar el corte de{' '}
            <b>{nombreRepartidor(filtrados.find(c => c.id === cerrarId)?.repartidor)}</b>?
          </Typography>
          <Alert severity="info" sx={{ mt: 1.5, fontSize: '0.8rem' }}>
            Para validar litros del medidor, usa "Ver detalle" primero.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCerrarId(null)}>Cancelar</Button>
          <Button variant="contained" color="success" disabled={cerrando}
            onClick={async () => {
              if (!cerrarId) return
              setCerrando(true)
              try {
                await ventasAPI.cerrarCorte(cerrarId, {})
                setCerrarId(null)
                // Reload - the parent will handle this via a callback or re-fetch
                window.location.reload()
              } catch (e) {
                setCerrando(false)
              }
            }}>
            {cerrando ? <CircularProgress size={16} /> : '✅ Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ======================== VISTA DETALLE ========================

function VistaDetalle({
  detalle, loading, onVolver, onCerrarCorte, onCorregirPago, onReimprimir
}: {
  detalle: CorteDetalle | null
  loading: boolean
  onVolver: () => void
  onCerrarCorte: (id: string, litrosMedidor?: number, observaciones?: string) => void
  onCorregirPago: (pedidoId: string, pedidoNombre: string) => void
  onReimprimir: () => void
}) {
  const [litrosMedidor, setLitrosMedidor] = useState<string>('')
  const [obsDialog, setObsDialog] = useState(false)
  const [observaciones, setObservaciones] = useState('')

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={onVolver} sx={{ mb: 2 }}>Volver</Button>
        <LinearProgress />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Cargando detalle del corte...
        </Typography>
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={onVolver} variant="text" color="inherit" sx={{ mt: 0.5 }}>
          Volver
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {tipoIcon(detalle.repartidor?.tipoRepartidor)} {nombreRepartidor(detalle.repartidor)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {detalle.repartidor?.tipoRepartidor === 'pipas' ? 'Pipas' : 'Cilindros'}
            {' · '}{fmtFecha(detalle.dia)}
            {' · '}ID: {detalle.id.slice(-8).toUpperCase()}
          </Typography>
        </Box>
        <Chip
          label={detalle.estado === 'validado' ? '✅ Validado' : '⏳ Pendiente'}
          color={getEstadoColor(detalle.estado)}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Columna principal */}
        <Grid item xs={12} md={8}>

          {/* Desglose cilindros */}
          {!esPipas && detalle.desgloseCilindros && detalle.desgloseCilindros.length > 0 && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                🔵 Desglose por tipo de cilindro
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><b>Producto</b></TableCell>
                      <TableCell align="center"><b>Unidades</b></TableCell>
                      <TableCell align="right"><b>Subtotal</b></TableCell>
                      {detalle.desgloseCilindros.some(d => d.descuento > 0) && (
                        <TableCell align="right"><b>Descuento</b></TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.desgloseCilindros.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{d.nombre}</Typography>
                            {d.esNuevo && (
                              <Chip label="NUEVO" size="small" color="info" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center"><b>{d.unidades}</b></TableCell>
                        <TableCell align="right"><b>{fmt$(d.monto)}</b></TableCell>
                        {detalle.desgloseCilindros!.some(dd => dd.descuento > 0) && (
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            {d.descuento > 0 ? `-${fmt$(d.descuento)}` : '—'}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'primary.50' }}>
                      <TableCell><b>Total</b></TableCell>
                      <TableCell align="center">
                        <b>{detalle.desgloseCilindros.reduce((s, d) => s + d.unidades, 0)} cil</b>
                      </TableCell>
                      <TableCell align="right">
                        <b>{fmt$(detalle.desgloseCilindros.reduce((s, d) => s + d.monto, 0))}</b>
                      </TableCell>
                      {detalle.desgloseCilindros.some(d => d.descuento > 0) && (
                        <TableCell align="right">
                          <b style={{ color: '#f44336' }}>
                            -{fmt$(detalle.desgloseCilindros.reduce((s, d) => s + d.descuento, 0))}
                          </b>
                        </TableCell>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Pedidos / Servicios */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {esPipas ? '🚛 Servicios del día' : '📦 Detalle de pedidos'}
              </Typography>
              <Chip label={`${detalle.pedidos.length}`} size="small" sx={{ ml: 1 }} />
            </Box>

            {detalle.pedidos.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin pedidos registrados en este corte</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ width: 32 }}><b>#</b></TableCell>
                      <TableCell><b>Cliente</b></TableCell>
                      {esPipas
                        ? <TableCell align="right"><b>Litros</b></TableCell>
                        : <TableCell><b>Productos</b></TableCell>
                      }
                      <TableCell><b>Forma de pago</b></TableCell>
                      <TableCell align="right"><b>Total</b></TableCell>
                      <TableCell align="center" sx={{ width: 40 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.pedidos.map(p => (
                      <TableRow key={p.pedidoId} hover>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{p.numero}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{p.clienteNombre}</Typography>
                        </TableCell>
                        {esPipas ? (
                          <TableCell align="right">
                            <Typography variant="body2">{(p.litros || 0).toFixed(1)} L</Typography>
                            {p.descuento > 0 && (
                              <Typography variant="caption" color="error.main" display="block">
                                -{fmt$(p.descuento)}
                              </Typography>
                            )}
                          </TableCell>
                        ) : (
                          <TableCell>
                            {(p.productos || []).map((prod, pi) => (
                              <Typography key={pi} variant="caption" display="block">
                                {prod.cantidad} × {prod.nombre}
                                {prod.descuento > 0 && (
                                  <span style={{ color: '#f44336' }}> (-{fmt$(prod.descuento)})</span>
                                )}
                              </Typography>
                            ))}
                          </TableCell>
                        )}
                        <TableCell>
                          {p.formasPago && p.formasPago.length > 0
                            ? p.formasPago.map((f, fi) => (
                              <Typography key={fi} variant="caption" display="block">
                                {f.tipo}: <b>{fmt$(f.monto)}</b>
                              </Typography>
                            ))
                            : <Typography variant="caption" color="text.secondary">
                                {p.formaPagoCorte || '—'}
                              </Typography>
                          }
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="medium">{fmt$(p.total)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Corregir forma de pago">
                            <IconButton size="small" onClick={() => onCorregirPago(p.pedidoId, p.clienteNombre)}>
                              <Edit sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Validación de litros medidor — solo pipas, columna principal */}
          {esPipas && (
            <Paper sx={{ p: 2, mb: 2, border: '2px solid', borderColor: alertaMedidor ? 'error.light' : 'primary.light' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                📊 Reporte del medidor físico de pipa
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">App reporta</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">{litrosApp.toFixed(2)} L</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Medidor físico"
                    type="number"
                    value={litrosMedidor}
                    onChange={e => setLitrosMedidor(e.target.value)}
                    size="small"
                    fullWidth
                    InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>L</Typography> }}
                    placeholder="Ej: 2903.60"
                    helperText="Lectura del medidor de la pipa"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  {litrosMedidor !== '' && litrosMedidorNum > 0 ? (
                    <Box sx={{
                      p: 1.5, borderRadius: 1,
                      bgcolor: alertaMedidor ? '#fff3f3' : '#f3fff3',
                      border: `1px solid ${alertaMedidor ? '#f44336' : '#4caf50'}`,
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" color={alertaMedidor ? 'error.main' : 'success.main'} fontWeight="bold">
                        {alertaMedidor ? '⚠️' : '✅'} {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)} L
                      </Typography>
                      <Typography variant="caption" color={alertaMedidor ? 'error.main' : 'success.main'}>
                        {alertaMedidor ? 'Verificar — supera ±20 L' : 'Dentro del rango (±20 L)'}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Ingresa la lectura del medidor para comparar</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Depósitos */}
          {detalle.depositos && detalle.depositos.length > 0 && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                🏦 Depósitos
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Folio</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="right">Monedas</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalle.depositos.map((dep: any, i: number) => {
                    const totalDep = parseFloat(dep.total || 0) > parseFloat(dep.monto || 0)
                      ? parseFloat(dep.total || 0)
                      : parseFloat(dep.monto || 0)
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

        {/* Sidebar derecho */}
        <Grid item xs={12} md={4}>

          {/* Resumen de pago */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
              💰 Resumen de pago
            </Typography>
            <ResumenPago data={detalle.resumenFormasPago} />
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontWeight="bold">Total del corte</Typography>
              <Typography fontWeight="bold" variant="h6" color="primary.main">
                {fmt$(detalle.totalVentas || detalle.totalAbonos)}
              </Typography>
            </Box>
          </Paper>



          {/* Observaciones del corte */}
          {detalle.observaciones && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>Observaciones</Typography>
              <Typography variant="body2" color="text.secondary">{detalle.observaciones}</Typography>
            </Paper>
          )}

          {/* Acciones */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Acciones</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button startIcon={<Print />} variant="outlined" fullWidth onClick={onReimprimir}>
                Reimprimir corte
              </Button>
              {detalle.estado === 'pendiente' && (
                <Button startIcon={<CheckCircle />} variant="contained" color="success" fullWidth
                  onClick={() => setObsDialog(true)}>
                  Cerrar y validar corte
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog confirmar cierre con observaciones */}
      <Dialog open={obsDialog} onClose={() => setObsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cerrar corte — {nombreRepartidor(detalle.repartidor)}</DialogTitle>
        <DialogContent>
          {esPipas && litrosMedidor !== '' && litrosMedidorNum > 0 && (
            <Alert severity={alertaMedidor ? 'warning' : 'success'} sx={{ mb: 2 }}>
              Diferencia de litros: {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)} L
              {alertaMedidor ? ' — Supera ±20L, verifica el reporte físico' : ' — Dentro del rango aceptable'}
            </Alert>
          )}
          <TextField
            label="Observaciones (opcional)"
            multiline rows={3}
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            fullWidth size="small"
            placeholder="Notas sobre el cierre de este corte..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setObsDialog(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={() => {
            onCerrarCorte(
              detalle.id,
              esPipas && litrosMedidorNum > 0 ? litrosMedidorNum : undefined,
              observaciones || undefined
            )
            setObsDialog(false)
          }}>
            ✅ Confirmar cierre
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ======================== VISTA HISTORIAL ========================

function VistaHistorial({
  cortes, loading, onVerDetalle
}: {
  cortes: CorteResumen[]
  loading: boolean
  onVerDetalle: (id: string) => void
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
          <Grid item xs={12} sm={3}>
            <TextField label="Desde" type="date" size="small" fullWidth
              value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="Hasta" type="date" size="small" fullWidth
              value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={tipoFiltro} label="Tipo"
                onChange={e => setTipoFiltro(e.target.value as typeof tipoFiltro)}>
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="pipas">🚛 Pipas</MenuItem>
                <MenuItem value="cilindros">🔵 Cilindros</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={estadoFiltro} label="Estado"
                onChange={e => setEstadoFiltro(e.target.value as typeof estadoFiltro)}>
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="pendiente">⏳ Pendientes</MenuItem>
                <MenuItem value="validado">✅ Validados</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Typography variant="caption" color="text.secondary">
              {filtrados.length} corte{filtrados.length !== 1 ? 's' : ''}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LinearProgress />
      ) : filtrados.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay cortes con esos filtros</Typography>
        </Paper>
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
                <TableCell><b>Formas de Pago</b></TableCell>
                <TableCell align="center"><b>Acción</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.map(c => {
                const fp = c.resumenFormasPagoVenta || c.resumenFormasPagoAbono || {}
                const total = c.tipo === 'venta_dia' ? c.totalVentas : c.totalAbonos
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography variant="caption">{fmtFecha(c.dia)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tipoIcon(c.repartidor?.tipoRepartidor)} {nombreRepartidor(c.repartidor)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {c.repartidor?.tipoRepartidor === 'pipas' ? 'Pipas' : 'Cilindros'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={c.estado === 'validado' ? 'Validado' : 'Pendiente'}
                        color={getEstadoColor(c.estado)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{fmt$(total)}</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <ResumenPago data={fp} compact />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalle completo">
                        <IconButton size="small" onClick={() => onVerDetalle(c.id)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

// ======================== DIALOG CORTE MANUAL ========================

function DialogCorteManual({ open, onClose, onCrear }: {
  open: boolean
  onClose: () => void
  onCrear: (data: any) => Promise<void>
}) {
  const [repartidorId, setRepartidorId] = useState('')
  const [tipo, setTipo] = useState('venta_dia')
  const [dia, setDia] = useState(getHoyMx())
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCrear = async () => {
    if (!repartidorId.trim()) { setError('El ID del repartidor es requerido'); return }
    setLoading(true)
    setError('')
    try {
      await onCrear({ repartidorId: repartidorId.trim(), tipo, dia, observaciones })
      setRepartidorId('')
      setObservaciones('')
      onClose()
    } catch (e: any) {
      setError(e.message || 'Error al crear corte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear corte manual</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
            Úsalo cuando el repartidor no generó corte desde la app.
          </Alert>
          <TextField label="ID del repartidor" value={repartidorId}
            onChange={e => setRepartidorId(e.target.value)}
            size="small" fullWidth helperText="ID interno del repartidor en el sistema" />
          <FormControl size="small" fullWidth>
            <InputLabel>Tipo de corte</InputLabel>
            <Select value={tipo} label="Tipo de corte" onChange={e => setTipo(e.target.value)}>
              <MenuItem value="venta_dia">Venta del día</MenuItem>
              <MenuItem value="abono">Abonos</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Fecha" type="date" value={dia}
            onChange={e => setDia(e.target.value)}
            size="small" fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Observaciones" multiline rows={2}
            value={observaciones} onChange={e => setObservaciones(e.target.value)}
            size="small" fullWidth />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleCrear} disabled={loading}>
          {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
          Crear corte
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ======================== DIALOG CORREGIR PAGO ========================

function DialogCorregirPago({ open, onClose, pedidoId, pedidoNombre, corteId, onCorregido }: {
  open: boolean
  onClose: () => void
  pedidoId: string
  pedidoNombre: string
  corteId: string
  onCorregido: () => void
}) {
  const TIPOS_PAGO = ['efectivo', 'transferencia', 'tarjeta', 'cheque', 'credito']
  const [formasPago, setFormasPago] = useState([{ tipo: 'efectivo', monto: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const payload = formasPago
      .filter(f => parseFloat(f.monto) > 0)
      .map(f => ({ tipo: f.tipo, monto: parseFloat(f.monto) }))
    if (payload.length === 0) { setError('Ingresa al menos un monto válido'); return }
    setLoading(true)
    setError('')
    try {
      await ventasAPI.corregirFormaPago(corteId, pedidoId, { formasPago: payload })
      onCorregido()
      onClose()
      setFormasPago([{ tipo: 'efectivo', monto: '' }])
    } catch (e: any) {
      setError(e.message || 'Error al corregir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Corregir forma de pago</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pedido de: <b>{pedidoNombre}</b>
        </Typography>
        {formasPago.map((fp, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={fp.tipo} label="Tipo" onChange={e => {
                const u = [...formasPago]; u[i].tipo = e.target.value; setFormasPago(u)
              }}>
                {TIPOS_PAGO.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Monto" type="number" size="small" sx={{ flex: 1 }}
              value={fp.monto} onChange={e => {
                const u = [...formasPago]; u[i].monto = e.target.value; setFormasPago(u)
              }} />
            {i > 0 && (
              <IconButton size="small" onClick={() => setFormasPago(formasPago.filter((_, j) => j !== i))}>
                <Close fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
        <Button size="small" sx={{ mt: 0.5 }}
          onClick={() => setFormasPago([...formasPago, { tipo: 'efectivo', monto: '' }])}>
          + Agregar
        </Button>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={16} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ======================== DIALOG REIMPRIMIR ========================

function DialogReimprimir({ open, onClose, detalle }: {
  open: boolean
  onClose: () => void
  detalle: CorteDetalle | null
}) {
  if (!detalle) return null
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const w = window.open('', '_blank', 'width=400,height=700')
    if (!w) return
    w.document.write(`
      <html><head><title>Corte de Caja</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 11px; margin: 16px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
        .indent { padding-left: 16px; }
      </style></head><body>`)
    w.document.write(content.innerHTML)
    w.document.write('</body></html>')
    w.document.close()
    w.print()
  }

  const resumen = detalle.resumenFormasPago || {}

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Vista previa — Corte de {nombreRepartidor(detalle.repartidor)}
        <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box ref={printRef} sx={{
          fontFamily: 'monospace', fontSize: '0.78rem', p: 2,
          border: '1px dashed #ccc', borderRadius: 1, bgcolor: 'grey.50'
        }}>
          <Box className="center"><b>GAS PROVIDENCIA</b></Box>
          <Box className="center">CORTE DE CAJA</Box>
          <Box className="center">{fmtFecha(detalle.dia)}</Box>
          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
          <Box>Repartidor: <b>{nombreRepartidor(detalle.repartidor)}</b></Box>
          <Box>Tipo: {detalle.repartidor?.tipoRepartidor === 'pipas' ? 'PIPAS' : 'CILINDROS'}</Box>
          <Box>Estado: {detalle.estado.toUpperCase()}</Box>
          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
          {detalle.pedidos.map(p => (
            <Box key={p.pedidoId} sx={{ mb: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.numero}. {p.clienteNombre.substring(0, 22)}</span>
                <span><b>{fmt$(p.total)}</b></span>
              </Box>
              {p.formasPago.map((f, fi) => (
                <Box key={fi} sx={{ pl: 2, color: 'text.secondary', fontSize: '0.72rem' }}>
                  {f.tipo}: {fmt$(f.monto)}
                </Box>
              ))}
            </Box>
          ))}
          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <b>TOTAL</b>
            <b>{fmt$(detalle.totalVentas || detalle.totalAbonos)}</b>
          </Box>
          {Object.entries(resumen).filter(([, v]) => (v as number) > 0).map(([k, v]) => (
            <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{k.toUpperCase()}</span>
              <span>{fmt$(v as number)}</span>
            </Box>
          ))}
          {detalle.repartidor?.tipoRepartidor === 'pipas' && detalle.totalLitros > 0 && (
            <>
              <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>LITROS (app)</span>
                <span>{(detalle.totalLitros || 0).toFixed(2)} L</span>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ======================== MAIN PAGE ========================

export default function CorteCajaPage() {
  const [vista, setVista] = useState<'dashboard' | 'detalle' | 'historial'>('dashboard')
  const [cortes, setCortes] = useState<CorteResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [corteDetalle, setCorteDetalle] = useState<CorteDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [tabDashboard, setTabDashboard] = useState<'ventas' | 'abonos'>('ventas')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [dialogManual, setDialogManual] = useState(false)
  const [dialogCorregir, setDialogCorregir] = useState({ open: false, pedidoId: '', pedidoNombre: '' })
  const [dialogReimprimir, setDialogReimprimir] = useState(false)

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const loadCortes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ventasAPI.getAllCortes()
      setCortes(data || [])
    } catch (e: any) {
      showSnack(e.message || 'Error al cargar cortes', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCortes() }, [loadCortes])

  const handleVerDetalle = async (id: string, destino: 'dashboard' | 'historial' = 'dashboard') => {
    setLoadingDetalle(true)
    setCorteDetalle(null)
    setVista('detalle')
    try {
      const data = await ventasAPI.getCorteDetalle(id)
      setCorteDetalle(data)
    } catch (e: any) {
      showSnack(e.message || 'Error al cargar detalle', 'error')
      setVista(destino)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const handleCerrarCorte = async (id: string, litrosMedidor?: number, observaciones?: string) => {
    try {
      await ventasAPI.cerrarCorte(id, { litrosMedidor, observaciones })
      showSnack('✅ Corte cerrado y validado correctamente')
      await loadCortes()
      // Refresh detalle si estamos en él
      if (corteDetalle?.id === id) {
        const updated = await ventasAPI.getCorteDetalle(id)
        setCorteDetalle(updated)
      }
    } catch (e: any) {
      showSnack(e.message || 'Error al cerrar el corte', 'error')
    }
  }

  const handleCrearManual = async (data: any) => {
    await ventasAPI.createCorteManual(data)
    showSnack('✅ Corte manual creado')
    await loadCortes()
  }

  const handlePagoCorregido = async () => {
    showSnack('✅ Forma de pago corregida')
    if (corteDetalle) {
      const updated = await ventasAPI.getCorteDetalle(corteDetalle.id)
      setCorteDetalle(updated)
    }
  }

  const cortesHoy = cortes.filter(c => esHoyMx(c.dia || c.fecha))

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header de página */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">Corte de Caja</Typography>
          <Typography variant="caption" color="text.secondary">
            {vista === 'dashboard' && `Hoy · ${cortesHoy.length} repartidores`}
            {vista === 'historial' && `Historial · ${cortes.length} cortes totales`}
            {vista === 'detalle' && corteDetalle && `Detalle de ${nombreRepartidor(corteDetalle.repartidor)}`}
          </Typography>
        </Box>
        {vista !== 'detalle' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant={vista === 'dashboard' ? 'contained' : 'outlined'} size="small"
              onClick={() => setVista('dashboard')}>
              📊 Hoy
            </Button>
            <Button variant={vista === 'historial' ? 'contained' : 'outlined'} size="small"
              onClick={() => setVista('historial')}>
              📋 Historial
            </Button>
          </Box>
        )}
      </Box>

      {/* Vistas */}
      {vista === 'dashboard' && (
        <VistaDashboard
          cortes={cortesHoy}
          loading={loading}
          onVerDetalle={(id) => handleVerDetalle(id, 'dashboard')}
          onCrearManual={() => setDialogManual(true)}
          tabActual={tabDashboard}
          setTabActual={setTabDashboard}
        />
      )}

      {vista === 'detalle' && (
        <VistaDetalle
          detalle={corteDetalle}
          loading={loadingDetalle}
          onVolver={() => {
            const eraHoy = corteDetalle ? esHoyMx(corteDetalle.dia) : true
            setVista(eraHoy ? 'dashboard' : 'historial')
          }}
          onCerrarCorte={handleCerrarCorte}
          onCorregirPago={(pedidoId, pedidoNombre) =>
            setDialogCorregir({ open: true, pedidoId, pedidoNombre })}
          onReimprimir={() => setDialogReimprimir(true)}
        />
      )}

      {vista === 'historial' && (
        <VistaHistorial
          cortes={cortes}
          loading={loading}
          onVerDetalle={(id) => handleVerDetalle(id, 'historial')}
        />
      )}

      {/* Dialogs globales */}
      <DialogCorteManual
        open={dialogManual}
        onClose={() => setDialogManual(false)}
        onCrear={handleCrearManual}
      />

      {dialogCorregir.open && corteDetalle && (
        <DialogCorregirPago
          open={dialogCorregir.open}
          onClose={() => setDialogCorregir(p => ({ ...p, open: false }))}
          pedidoId={dialogCorregir.pedidoId}
          pedidoNombre={dialogCorregir.pedidoNombre}
          corteId={corteDetalle.id}
          onCorregido={handlePagoCorregido}
        />
      )}

      <DialogReimprimir
        open={dialogReimprimir}
        onClose={() => setDialogReimprimir(false)}
        detalle={corteDetalle}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
