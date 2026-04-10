'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Chip, IconButton, LinearProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, Card, CardContent, Grid, Checkbox, FormControl, InputLabel,
  Select, MenuItem, Tabs, Tab, Divider
} from '@mui/material'
import {
  Search as SearchIcon, Add as AddIcon, Visibility as VisibilityIcon, Print as PrintIcon,
  CheckCircle as CheckCircleIcon, Refresh as RefreshIcon, ArrowBack as ArrowBackIcon,
  AttachMoney as MoneyIcon, CreditCard as CardIcon, Save as SaveIcon
} from '@mui/icons-material'
import {
  cortesOficinaAPI, authAPI,
  type PagoOficinaDisponible, type CorteOficina, type CorteOficinaPagoSnapshot
} from '@/lib/api'

const fmt$ = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
const fmtFecha = (s: string) => {
  if (!s) return '—'
  try { return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Mexico_City' }) } catch { return s }
}
const fmtFechaHora = (s: string) => {
  if (!s) return '—'
  try { return new Date(s).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' }) } catch { return s }
}

// Devuelve la fecha del lunes de esta semana en formato YYYY-MM-DD (zona MX)
function getLunesSemana(): string {
  const hoy = new Date()
  const dia = hoy.getDay() // 0=domingo, 1=lunes...
  const diff = dia === 0 ? -6 : 1 - dia
  hoy.setDate(hoy.getDate() + diff)
  return hoy.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}
function getHoy(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

export default function CorteOficinaComponent() {
  const [tab, setTab] = useState<'crear' | 'historial'>('crear')
  const [usuario, setUsuario] = useState<any>(null)

  // Estado: crear corte
  const [fechaDesde, setFechaDesde] = useState(getLunesSemana())
  const [fechaHasta, setFechaHasta] = useState(getHoy())
  const [pagosDisponibles, setPagosDisponibles] = useState<PagoOficinaDisponible[]>([])
  const [pagosSeleccionados, setPagosSeleccionados] = useState<Set<string>>(new Set())
  const [loadingPagos, setLoadingPagos] = useState(false)
  const [busqueda, setBusqueda] = useState(false)
  const [filtroForma, setFiltroForma] = useState<'todos' | 'efectivo' | 'tarjeta'>('todos')

  // Depósitos del corte
  const [depPlanta, setDepPlanta] = useState('')
  const [folioPlanta, setFolioPlanta] = useState('')
  const [depCajero, setDepCajero] = useState('')
  const [folioCajero, setFolioCajero] = useState('')
  const [monedasExtra, setMonedasExtra] = useState('')
  const [efectivoExtra, setEfectivoExtra] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Estado: historial
  const [historial, setHistorial] = useState<CorteOficina[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'validado'>('todos')

  // Estado: detalle
  const [corteDetalle, setCorteDetalle] = useState<CorteOficina | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Snackbar
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' | 'info' }>({ open: false, msg: '', sev: 'success' })
  const showMsg = (msg: string, sev: 'success' | 'error' | 'info' = 'success') => setSnack({ open: true, msg, sev })

  // Cargar usuario al montar
  useEffect(() => {
    authAPI.getProfile().then(setUsuario).catch(() => {})
  }, [])

  // Cargar historial al cambiar a ese tab
  useEffect(() => { if (tab === 'historial') loadHistorial() }, [tab])

  const loadHistorial = useCallback(async () => {
    setLoadingHistorial(true)
    try {
      const data = await cortesOficinaAPI.list()
      setHistorial(data || [])
    } catch (e: any) { showMsg(e.message || 'Error al cargar historial', 'error') }
    finally { setLoadingHistorial(false) }
  }, [])

  // Buscar pagos disponibles
  const buscarPagos = async () => {
    if (!fechaDesde || !fechaHasta) { showMsg('Selecciona el rango de fechas', 'error'); return }
    setLoadingPagos(true); setBusqueda(true)
    try {
      const desdeISO = `${fechaDesde}T00:00:00.000Z`
      const hastaISO = `${fechaHasta}T23:59:59.999Z`
      const data = await cortesOficinaAPI.getPagosDisponibles(desdeISO, hastaISO)
      setPagosDisponibles(data.pagos || [])
      // Auto-seleccionar todos los pagos al cargar
      setPagosSeleccionados(new Set((data.pagos || []).map(p => p.id)))
      if (!data.pagos || data.pagos.length === 0) {
        showMsg('No se encontraron pagos en este rango', 'info')
      }
    } catch (e: any) { showMsg(e.message || 'Error al buscar pagos', 'error') }
    finally { setLoadingPagos(false) }
  }

  const togglePago = (id: string) => {
    const nuevo = new Set(pagosSeleccionados)
    if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id)
    setPagosSeleccionados(nuevo)
  }
  const toggleTodos = () => {
    if (pagosSeleccionados.size === pagosFiltrados.length) {
      setPagosSeleccionados(new Set())
    } else {
      setPagosSeleccionados(new Set(pagosFiltrados.map(p => p.id)))
    }
  }

  const pagosFiltrados = useMemo(() => {
    if (filtroForma === 'todos') return pagosDisponibles
    return pagosDisponibles.filter(p => p.formaPago === filtroForma)
  }, [pagosDisponibles, filtroForma])

  const totalesSeleccionados = useMemo(() => {
    const seleccionados = pagosDisponibles.filter(p => pagosSeleccionados.has(p.id))
    let efectivo = 0, tarjeta = 0
    for (const p of seleccionados) {
      efectivo += Number(p.totalEfectivo || 0)
      tarjeta += Number(p.totalTarjeta || 0)
    }
    return { efectivo, tarjeta, total: efectivo + tarjeta, count: seleccionados.length }
  }, [pagosDisponibles, pagosSeleccionados])

  const efectivoDepositadoTotal = useMemo(() => {
    return Number(depPlanta || 0) + Number(depCajero || 0) + Number(monedasExtra || 0) + Number(efectivoExtra || 0)
  }, [depPlanta, depCajero, monedasExtra, efectivoExtra])

  const diferenciaEfectivo = efectivoDepositadoTotal - totalesSeleccionados.efectivo

  // Crear corte
  const guardarCorte = async () => {
    if (pagosSeleccionados.size === 0) { showMsg('Selecciona al menos un pago', 'error'); return }
    setGuardando(true)
    try {
      const data = await cortesOficinaAPI.create({
        fechaDesde: `${fechaDesde}T00:00:00.000Z`,
        fechaHasta: `${fechaHasta}T23:59:59.999Z`,
        pagoIds: Array.from(pagosSeleccionados),
        depositoPlanta: Number(depPlanta || 0),
        folioDepPlanta: folioPlanta || null,
        depositoCajero: Number(depCajero || 0),
        folioDepCajero: folioCajero || null,
        monedasExtra: Number(monedasExtra || 0),
        efectivoExtra: Number(efectivoExtra || 0),
        observaciones: observaciones || null,
      })
      showMsg('✅ Corte creado correctamente')
      // Reset form
      setPagosDisponibles([])
      setPagosSeleccionados(new Set())
      setDepPlanta(''); setFolioPlanta(''); setDepCajero(''); setFolioCajero('')
      setMonedasExtra(''); setEfectivoExtra(''); setObservaciones(''); setBusqueda(false)
      // Ir al detalle del corte recién creado
      setTimeout(async () => {
        try { const det = await cortesOficinaAPI.get(data.id); setCorteDetalle(det) } catch {}
      }, 300)
    } catch (e: any) { showMsg(e.message || 'Error al guardar corte', 'error') }
    finally { setGuardando(false) }
  }

  const verDetalle = async (id: string) => {
    setLoadingDetalle(true)
    try {
      const det = await cortesOficinaAPI.get(id)
      setCorteDetalle(det)
    } catch (e: any) { showMsg(e.message || 'Error al cargar detalle', 'error') }
    finally { setLoadingDetalle(false) }
  }

  const cerrarCorte = async (id: string) => {
    try {
      const upd = await cortesOficinaAPI.cerrar(id)
      setCorteDetalle(upd)
      loadHistorial()
      showMsg('✅ Corte validado y cerrado')
    } catch (e: any) { showMsg(e.message || 'Error', 'error') }
  }

  const reabrirCorte = async (id: string) => {
    try {
      const upd = await cortesOficinaAPI.reabrir(id)
      setCorteDetalle(upd)
      loadHistorial()
      showMsg('Corte reabierto')
    } catch (e: any) { showMsg(e.message || 'Error', 'error') }
  }

  const imprimirCorte = (corte: CorteOficina) => {
    const html = generarHtmlCorteOficina(corte)
    const w = window.open('', '_blank', 'width=400,height=700')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => { try { w.print() } catch {} }, 500) }
  }

  const historialFiltrado = useMemo(() => {
    if (filtroEstado === 'todos') return historial
    return historial.filter(c => c.estado === filtroEstado)
  }, [historial, filtroEstado])

  return (
    <Box>
      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="crear" label="📝 Crear Corte" />
        <Tab value="historial" label="📋 Historial" />
      </Tabs>

      {/* TAB: CREAR CORTE */}
      {tab === 'crear' && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Período del corte</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField label="Desde" type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Hasta" type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button variant="contained" startIcon={<SearchIcon />} onClick={buscarPagos} disabled={loadingPagos} fullWidth>
                  {loadingPagos ? 'Buscando...' : 'Buscar pagos'}
                </Button>
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Se incluyen los pagos de crédito en efectivo y tarjeta registrados por usuarios de oficina/planta en este rango. Los pagos ya incluidos en otro corte se excluyen automáticamente.
            </Typography>
          </Paper>

          {loadingPagos && <LinearProgress sx={{ mb: 2 }} />}

          {busqueda && !loadingPagos && pagosDisponibles.length === 0 && (
            <Alert severity="info">No se encontraron pagos disponibles en el período seleccionado.</Alert>
          )}

          {pagosDisponibles.length > 0 && (
            <>
              {/* KPIs de seleccionados */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: '#e8f5e9' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">EFECTIVO</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>{fmt$(totalesSeleccionados.efectivo)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: '#e3f2fd' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">TARJETA</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1565c0' }}>{fmt$(totalesSeleccionados.tarjeta)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: '#fff3e0' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">TOTAL</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e65100' }}>{fmt$(totalesSeleccionados.total)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: '#f3e5f5' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">PAGOS</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#6a1b9a' }}>{totalesSeleccionados.count} / {pagosDisponibles.length}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Filtro forma de pago */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip label={`Todos (${pagosDisponibles.length})`} onClick={() => setFiltroForma('todos')} color={filtroForma === 'todos' ? 'primary' : 'default'} size="small" />
                <Chip label={`Efectivo (${pagosDisponibles.filter(p => p.formaPago === 'efectivo').length})`} onClick={() => setFiltroForma('efectivo')} color={filtroForma === 'efectivo' ? 'success' : 'default'} size="small" />
                <Chip label={`Tarjeta (${pagosDisponibles.filter(p => p.formaPago === 'tarjeta').length})`} onClick={() => setFiltroForma('tarjeta')} color={filtroForma === 'tarjeta' ? 'info' : 'default'} size="small" />
              </Box>

              {/* Tabla de pagos */}
              <Paper sx={{ mb: 2, overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={pagosFiltrados.length > 0 && pagosSeleccionados.size === pagosFiltrados.length}
                          indeterminate={pagosSeleccionados.size > 0 && pagosSeleccionados.size < pagosFiltrados.length}
                          onChange={toggleTodos}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Folio nota</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Forma</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Monto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Registró</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagosFiltrados.map(p => (
                      <TableRow key={p.id} hover sx={{ bgcolor: pagosSeleccionados.has(p.id) ? '#e8f5e9' : 'inherit' }}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={pagosSeleccionados.has(p.id)} onChange={() => togglePago(p.id)} />
                        </TableCell>
                        <TableCell><Typography variant="caption">{fmtFechaHora(p.fechaPago)}</Typography></TableCell>
                        <TableCell><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{p.clienteNombre}</Typography></TableCell>
                        <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{p.folioNota}</Typography></TableCell>
                        <TableCell>
                          <Chip label={p.formaPagoNombre || p.formaPago} size="small"
                            color={p.formaPago === 'efectivo' ? 'success' : 'info'}
                            sx={{ fontSize: 10, fontWeight: 'bold' }} />
                          {p.referencia && <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: 9 }}>{p.referencia}</Typography>}
                        </TableCell>
                        <TableCell align="right"><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{fmt$(p.monto)}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{p.usuarioRegistro}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              {/* Sección de depósitos */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Depósitos del efectivo</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Depósito en planta ($)" type="number" value={depPlanta} onChange={e => setDepPlanta(e.target.value)} fullWidth size="small" inputProps={{ min: 0, step: 0.01 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Folio depósito planta" value={folioPlanta} onChange={e => setFolioPlanta(e.target.value)} fullWidth size="small" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Depósito en cajero ($)" type="number" value={depCajero} onChange={e => setDepCajero(e.target.value)} fullWidth size="small" inputProps={{ min: 0, step: 0.01 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Folio depósito cajero" value={folioCajero} onChange={e => setFolioCajero(e.target.value)} fullWidth size="small" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Monedas/sueltos ($)" type="number" value={monedasExtra} onChange={e => setMonedasExtra(e.target.value)} fullWidth size="small" inputProps={{ min: 0, step: 0.01 }} helperText="Dinero adicional sin depositar" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Otro efectivo ($)" type="number" value={efectivoExtra} onChange={e => setEfectivoExtra(e.target.value)} fullWidth size="small" inputProps={{ min: 0, step: 0.01 }} helperText="Otros conceptos" />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Resumen de cuadre */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Efectivo esperado</Typography>
                    <Typography variant="h6">{fmt$(totalesSeleccionados.efectivo)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Efectivo entregado</Typography>
                    <Typography variant="h6">{fmt$(efectivoDepositadoTotal)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Diferencia</Typography>
                    <Typography variant="h6" sx={{
                      color: Math.abs(diferenciaEfectivo) < 0.01 ? '#2e7d32' : (diferenciaEfectivo < 0 ? '#c62828' : '#1565c0'),
                      fontWeight: 'bold'
                    }}>
                      {diferenciaEfectivo === 0 ? '✅ CUADRADO' : (diferenciaEfectivo < 0 ? `${fmt$(diferenciaEfectivo)} FALTANTE` : `+${fmt$(diferenciaEfectivo)} SOBRANTE`)}
                    </Typography>
                  </Box>
                </Box>

                <TextField label="Observaciones (opcional)" value={observaciones} onChange={e => setObservaciones(e.target.value)} fullWidth multiline rows={2} sx={{ mt: 2 }} size="small" />
              </Paper>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="success" size="large" startIcon={<SaveIcon />} onClick={guardarCorte} disabled={guardando || pagosSeleccionados.size === 0}>
                  {guardando ? 'Guardando...' : `Guardar corte (${pagosSeleccionados.size} pagos)`}
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* TAB: HISTORIAL */}
      {tab === 'historial' && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
            <Chip label="Todos" onClick={() => setFiltroEstado('todos')} color={filtroEstado === 'todos' ? 'primary' : 'default'} size="small" />
            <Chip label="Pendientes" onClick={() => setFiltroEstado('pendiente')} color={filtroEstado === 'pendiente' ? 'warning' : 'default'} size="small" />
            <Chip label="Validados" onClick={() => setFiltroEstado('validado')} color={filtroEstado === 'validado' ? 'success' : 'default'} size="small" />
            <Box sx={{ flex: 1 }} />
            <IconButton onClick={loadHistorial} size="small"><RefreshIcon /></IconButton>
          </Box>

          {loadingHistorial && <LinearProgress />}

          {!loadingHistorial && historialFiltrado.length === 0 && (
            <Alert severity="info">No hay cortes en el historial.</Alert>
          )}

          {historialFiltrado.length > 0 && (
            <Paper sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Creado por</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Pagos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Efectivo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Tarjeta</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialFiltrado.map(c => (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Typography variant="caption" display="block">{fmtFecha(c.fechaDesde)} → {fmtFecha(c.fechaHasta)}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Creado: {fmtFechaHora(c.createdAt)}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{c.creadoPorNombre}</Typography></TableCell>
                      <TableCell align="right">{c._count?.pagos ?? '—'}</TableCell>
                      <TableCell align="right"><Typography variant="caption">{fmt$(c.totalEfectivo)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="caption">{fmt$(c.totalTarjeta)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{fmt$(c.totalGeneral)}</Typography></TableCell>
                      <TableCell>
                        <Chip label={c.estado === 'validado' ? '✓ Validado' : '⏳ Pendiente'} size="small"
                          color={c.estado === 'validado' ? 'success' : 'warning'} sx={{ fontSize: 10, fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => verDetalle(c.id)}><VisibilityIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Tooltip>
                        <Tooltip title="Imprimir">
                          <IconButton size="small" onClick={async () => { const det = await cortesOficinaAPI.get(c.id); imprimirCorte(det) }}><PrintIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      )}

      {/* DIALOG DETALLE */}
      <Dialog open={!!corteDetalle} onClose={() => setCorteDetalle(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Detalle del corte</span>
          {corteDetalle && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" startIcon={<PrintIcon />} onClick={() => imprimirCorte(corteDetalle)}>Imprimir</Button>
              {corteDetalle.estado === 'pendiente' && (
                <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => cerrarCorte(corteDetalle.id)}>Validar y cerrar</Button>
              )}
              {corteDetalle.estado === 'validado' && usuario && (corteDetalle.creadoPorId === usuario.id || ['administrador', 'superAdministrador'].includes(usuario.rol)) && (
                <Button size="small" variant="outlined" color="warning" onClick={() => reabrirCorte(corteDetalle.id)}>Reabrir</Button>
              )}
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingDetalle && <LinearProgress />}
          {corteDetalle && (
            <Box>
              {/* Info general */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Período</Typography><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{fmtFecha(corteDetalle.fechaDesde)} → {fmtFecha(corteDetalle.fechaHasta)}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Creado por</Typography><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{corteDetalle.creadoPorNombre}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Estado</Typography><Chip label={corteDetalle.estado} size="small" color={corteDetalle.estado === 'validado' ? 'success' : 'warning'} /></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Pagos</Typography><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{corteDetalle.pagos?.length || 0}</Typography></Grid>
              </Grid>

              {/* KPIs */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={4}><Card sx={{ bgcolor: '#e8f5e9' }}><CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}><Typography variant="caption">Efectivo</Typography><Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>{fmt$(corteDetalle.totalEfectivo)}</Typography></CardContent></Card></Grid>
                <Grid item xs={4}><Card sx={{ bgcolor: '#e3f2fd' }}><CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}><Typography variant="caption">Tarjeta</Typography><Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 'bold' }}>{fmt$(corteDetalle.totalTarjeta)}</Typography></CardContent></Card></Grid>
                <Grid item xs={4}><Card sx={{ bgcolor: '#fff3e0' }}><CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}><Typography variant="caption">Total</Typography><Typography variant="h6" sx={{ color: '#e65100', fontWeight: 'bold' }}>{fmt$(corteDetalle.totalGeneral)}</Typography></CardContent></Card></Grid>
              </Grid>

              {/* Tabla de pagos */}
              <Typography variant="subtitle2" gutterBottom>Pagos incluidos</Typography>
              <Paper variant="outlined" sx={{ mb: 2, maxHeight: 300, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: 11, fontWeight: 'bold' }}>Fecha</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 'bold' }}>Cliente</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 'bold' }}>Folio</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 'bold' }}>Forma</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 'bold' }} align="right">Monto</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 'bold' }}>Registró</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(corteDetalle.pagos || []).map(p => (
                      <TableRow key={p.id}>
                        <TableCell sx={{ fontSize: 10 }}>{fmtFechaHora(p.fechaPago)}</TableCell>
                        <TableCell sx={{ fontSize: 10, fontWeight: 'bold' }}>{p.clienteNombre}</TableCell>
                        <TableCell sx={{ fontSize: 10, fontFamily: 'monospace' }}>{p.folioNota}</TableCell>
                        <TableCell><Chip label={p.formaPagoNombre || p.formaPago} size="small" color={p.formaPago === 'efectivo' ? 'success' : 'info'} sx={{ fontSize: 9, height: 18 }} /></TableCell>
                        <TableCell sx={{ fontSize: 10, fontWeight: 'bold' }} align="right">{fmt$(p.monto)}</TableCell>
                        <TableCell sx={{ fontSize: 10 }}>{p.usuarioRegistro}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              {/* Depósitos */}
              <Typography variant="subtitle2" gutterBottom>Depósitos y cuadre</Typography>
              <Grid container spacing={1} sx={{ mb: 1 }}>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Depósito planta</Typography><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{fmt$(corteDetalle.depositoPlanta)}</Typography>{corteDetalle.folioDepPlanta && <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{corteDetalle.folioDepPlanta}</Typography>}</Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Depósito cajero</Typography><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{fmt$(corteDetalle.depositoCajero)}</Typography>{corteDetalle.folioDepCajero && <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{corteDetalle.folioDepCajero}</Typography>}</Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Monedas/sueltos</Typography><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{fmt$(corteDetalle.monedasExtra)}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Otro efectivo</Typography><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{fmt$(corteDetalle.efectivoExtra)}</Typography></Grid>
              </Grid>
              <Box sx={{ p: 1, bgcolor: Math.abs(corteDetalle.diferencia) < 0.01 ? '#e8f5e9' : (corteDetalle.diferencia < 0 ? '#ffebee' : '#e3f2fd'), borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                  Diferencia: {corteDetalle.diferencia === 0 ? '✅ CUADRADO' : (corteDetalle.diferencia < 0 ? `${fmt$(corteDetalle.diferencia)} FALTANTE` : `+${fmt$(corteDetalle.diferencia)} SOBRANTE`)}
                </Typography>
              </Box>

              {corteDetalle.observaciones && (
                <Box sx={{ mt: 2, p: 1, bgcolor: '#fffde7', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body2">{corteDetalle.observaciones}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCorteDetalle(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {snack.open && (
        <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })}
          sx={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, boxShadow: 3 }}>
          {snack.msg}
        </Alert>
      )}
    </Box>
  )
}

// Genera HTML del ticket térmico 80mm del corte de oficina
function generarHtmlCorteOficina(c: CorteOficina): string {
  const fmt = (n: number) => `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fechaCreacion = new Date(c.createdAt).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })
  const fechaDesde = new Date(c.fechaDesde).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Mexico_City' })
  const fechaHasta = new Date(c.fechaHasta).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Mexico_City' })

  const filasPagos = (c.pagos || []).map((p, i) => `
    <tr>
      <td style="font-size:9px;padding:1px 0;">${i + 1}</td>
      <td style="font-size:9px;padding:1px 0;">${(p.clienteNombre || '').substring(0, 20)}</td>
      <td style="font-size:9px;padding:1px 0;">${p.folioNota || ''}</td>
      <td style="font-size:9px;padding:1px 0;">${(p.formaPago || '').substring(0, 4).toUpperCase()}</td>
      <td style="font-size:9px;padding:1px 0;text-align:right;font-weight:700;">${fmt(p.monto)}</td>
    </tr>
    <tr><td colspan="5" style="font-size:8px;color:#444;padding-bottom:2px;">&nbsp;&nbsp;<i>Reg: ${p.usuarioRegistro || ''}</i></td></tr>
  `).join('')

  const totalDepositosEfectivo = c.depositoPlanta + c.depositoCajero + c.monedasExtra + c.efectivoExtra
  const cuadre = c.diferencia === 0 ? 'CUADRADO' : (c.diferencia < 0 ? `FALTANTE ${fmt(c.diferencia)}` : `SOBRANTE +${fmt(c.diferencia)}`)

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; } }
    body { font-family: Arial, Helvetica, sans-serif; max-width: 80mm; width: 80mm; margin: 0 auto; padding: 4px 6px; font-size: 12px; color: #000; line-height: 1.3; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .dbl { border-top: 3px solid #000; margin: 4px 0; }
    .dash { border-top: 1px dashed #000; margin: 3px 0; }
    .title { text-align: center; font-size: 14px; font-weight: 700; margin: 3px 0; }
    .section { text-align: center; font-weight: 700; font-size: 11px; border-top: 2px solid #000; border-bottom: 1px solid #000; padding: 2px; margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; }
    .totalrow { font-size: 14px; font-weight: 700; }
  </style></head><body>
    <div class="center bold" style="font-size:14px;">GAS PROVIDENCIA</div>
    <div class="center" style="font-size:10px;">CORTE DE OFICINA</div>
    <div class="dbl"></div>
    <div class="title">CORTE DE COBROS</div>
    <div class="center" style="font-size:10px;">${fechaDesde} al ${fechaHasta}</div>
    <div class="dash"></div>
    <table>
      <tr><td>Creado por:</td><td style="text-align:right;font-weight:700;">${(c.creadoPorNombre || '').substring(0, 22)}</td></tr>
      <tr><td>Fecha:</td><td style="text-align:right;">${fechaCreacion}</td></tr>
      <tr><td>Estado:</td><td style="text-align:right;font-weight:700;">${c.estado.toUpperCase()}</td></tr>
      <tr><td>Pagos:</td><td style="text-align:right;font-weight:700;">${c.pagos?.length || 0}</td></tr>
    </table>

    <div class="section">RESUMEN POR FORMA</div>
    <table>
      <tr><td>Efectivo:</td><td style="text-align:right;font-weight:700;">${fmt(c.totalEfectivo)}</td></tr>
      <tr><td>Tarjeta:</td><td style="text-align:right;font-weight:700;">${fmt(c.totalTarjeta)}</td></tr>
      <tr><td colspan="2"><div class="dash"></div></td></tr>
      <tr class="totalrow"><td>TOTAL:</td><td style="text-align:right;">${fmt(c.totalGeneral)}</td></tr>
    </table>

    <div class="section">DETALLE DE COBROS</div>
    <table>
      <tr style="border-bottom:1px solid #000;">
        <td style="font-size:9px;font-weight:700;">#</td>
        <td style="font-size:9px;font-weight:700;">Cliente</td>
        <td style="font-size:9px;font-weight:700;">Folio</td>
        <td style="font-size:9px;font-weight:700;">F.Pago</td>
        <td style="font-size:9px;font-weight:700;text-align:right;">Monto</td>
      </tr>
      ${filasPagos}
    </table>

    <div class="section">DEPÓSITOS</div>
    <table>
      <tr><td>Depósito planta:</td><td style="text-align:right;">${fmt(c.depositoPlanta)}</td></tr>
      ${c.folioDepPlanta ? `<tr><td colspan="2" style="font-size:9px;">&nbsp;&nbsp;Folio: ${c.folioDepPlanta}</td></tr>` : ''}
      <tr><td>Depósito cajero:</td><td style="text-align:right;">${fmt(c.depositoCajero)}</td></tr>
      ${c.folioDepCajero ? `<tr><td colspan="2" style="font-size:9px;">&nbsp;&nbsp;Folio: ${c.folioDepCajero}</td></tr>` : ''}
      <tr><td>Monedas/sueltos:</td><td style="text-align:right;">${fmt(c.monedasExtra)}</td></tr>
      <tr><td>Otro efectivo:</td><td style="text-align:right;">${fmt(c.efectivoExtra)}</td></tr>
      <tr><td colspan="2"><div class="dash"></div></td></tr>
      <tr class="bold"><td>Total entregado:</td><td style="text-align:right;">${fmt(totalDepositosEfectivo)}</td></tr>
      <tr><td>Efectivo esperado:</td><td style="text-align:right;">${fmt(c.totalEfectivo)}</td></tr>
      <tr class="bold" style="font-size:13px;"><td>Diferencia:</td><td style="text-align:right;">${cuadre}</td></tr>
    </table>

    ${c.observaciones ? `<div class="dash"></div><div style="font-size:10px;"><b>Obs:</b> ${c.observaciones}</div>` : ''}

    <div class="dbl"></div>
    <div class="center" style="font-size:9px;font-style:italic;">Generado: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</div>
  </body></html>`
}
