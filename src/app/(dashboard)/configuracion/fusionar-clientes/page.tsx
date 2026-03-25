'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Collapse,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, LinearProgress,
  Divider, Paper, Snackbar, CircularProgress
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const fetchAuth = async (path: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token') || '') : ''
  return fetch(API + path, { ...options, headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', ...(options.headers || {}) } })
}

interface ClienteSimple {
  id: string; nombre: string; nombreGrupo?: string; telefono?: string
  calle?: string; colonia?: string; municipio?: string
  ruta?: string; saldoActual: number; limiteCredito: number
  clientePrincipalId?: string
}
interface Grupo {
  principalId: string; nombreGrupo: string; nombre: string; ruta?: string
  limiteCredito: number; saldoGrupo: number; totalMiembros: number
  hijos: { id: string; nombre: string; ruta?: string; saldoActual: number }[]
}

export default function AgruparClientesPage() {
  const [usuario, setUsuario] = useState<any>(null)
  const [vista, setVista] = useState<'grupos' | 'agrupar'>('grupos')
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [expandedGrupo, setExpandedGrupo] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ClienteSimple[]>([])
  const [loadingBusqueda, setLoadingBusqueda] = useState(false)
  const [principalSeleccionado, setPrincipalSeleccionado] = useState<ClienteSimple | null>(null)
  const [hijosSeleccionados, setHijosSeleccionados] = useState<ClienteSimple[]>([])
  const [busquedaHijo, setBusquedaHijo] = useState('')
  const [resultadosHijo, setResultadosHijo] = useState<ClienteSimple[]>([])
  const [loadingHijo, setLoadingHijo] = useState(false)
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [limiteGrupo, setLimiteGrupo] = useState('')

  const [editandoGrupo, setEditandoGrupo] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editLimite, setEditLimite] = useState('')

  // Agregar a grupo existente
  const [busquedaAgregar, setBusquedaAgregar] = useState<Record<string, string>>({})
  const [resultadosAgregar, setResultadosAgregar] = useState<ClienteSimple[]>([])
  const [agregandoA, setAgregandoA] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => setSnack({ open: true, message, severity })

  useEffect(() => { fetchAuth('/usuarios/profile').then(r => r.json()).then(d => setUsuario(d)).catch(() => {}) }, [])

  const cargarGrupos = useCallback(async () => {
    setLoadingGrupos(true)
    try {
      const res = await fetchAuth('/clientes/grupos')
      if (res.ok) setGrupos(await res.json())
    } catch {}
    finally { setLoadingGrupos(false) }
  }, [])

  useEffect(() => { cargarGrupos() }, [cargarGrupos])

  const buscarClientes = async (q: string, tipo: 'principal' | 'hijo' | 'agregar') => {
    if (q.trim().length < 2) return
    if (tipo === 'principal') setLoadingBusqueda(true)
    else if (tipo === 'hijo') setLoadingHijo(true)
    try {
      const res = await fetchAuth(`/clientes?nombre=${encodeURIComponent(q)}&pageSize=50&page=1`)
      if (!res.ok) return
      const data = await res.json()
      const clientes = (Array.isArray(data) ? data : (data.clientes || data.data || [])).map((c: any) => ({
        id: c.id, nombre: c.nombre, telefono: c.telefono, calle: c.calle, colonia: c.colonia,
        municipio: c.municipio, ruta: c.ruta?.nombre || c.ruta || null,
        saldoActual: parseFloat(c.saldoActual) || 0, limiteCredito: parseFloat(c.limiteCredito) || 0,
        clientePrincipalId: c.clientePrincipalId, nombreGrupo: c.nombreGrupo
      }))
      if (tipo === 'principal') setResultados(clientes)
      else if (tipo === 'hijo') setResultadosHijo(clientes)
      else setResultadosAgregar(clientes)
    } catch {}
    finally {
      if (tipo === 'principal') setLoadingBusqueda(false)
      else if (tipo === 'hijo') setLoadingHijo(false)
    }
  }

  const seleccionarPrincipal = (c: ClienteSimple) => {
    setPrincipalSeleccionado(c)
    setNombreGrupo(c.nombre)
    setLimiteGrupo(String(c.limiteCredito || 10000))
    setResultados([])
    setHijosSeleccionados([])
    // Auto-buscar posibles duplicados usando la primera palabra del nombre
    const primeraPalabra = c.nombre.split(' ')[0]
    if (primeraPalabra.length >= 2) {
      setBusquedaHijo(primeraPalabra)
      buscarClientes(primeraPalabra, 'hijo')
    }
  }

  const agregarHijo = (c: ClienteSimple) => {
    if (c.id === principalSeleccionado?.id) return
    if (hijosSeleccionados.find(h => h.id === c.id)) return
    setHijosSeleccionados(prev => [...prev, c])
    setResultadosHijo([])
    setBusquedaHijo('')
  }

  const guardarGrupo = async () => {
    if (!principalSeleccionado || hijosSeleccionados.length === 0) return
    setSaving(true)
    try {
      await fetchAuth(`/clientes/${principalSeleccionado.id}/grupo`, {
        method: 'PUT', body: JSON.stringify({ nombreGrupo, limiteCredito: parseFloat(limiteGrupo) || 0 })
      })
      for (const hijo of hijosSeleccionados) {
        const res = await fetchAuth('/clientes/agrupar', {
          method: 'POST', body: JSON.stringify({ principalId: principalSeleccionado.id, hijoId: hijo.id })
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      }
      showSnack(`Grupo "${nombreGrupo}" creado con ${hijosSeleccionados.length + 1} miembros`)
      setPrincipalSeleccionado(null); setHijosSeleccionados([]); setBusqueda(''); setNombreGrupo(''); setLimiteGrupo('')
      setVista('grupos'); cargarGrupos()
    } catch (e: any) { showSnack(e.message || 'Error al agrupar', 'error') }
    finally { setSaving(false) }
  }

  const desagrupar = async (hijoId: string, nombreHijo: string) => {
    try {
      const res = await fetchAuth(`/clientes/${hijoId}/desagrupar`, { method: 'PUT' })
      if (!res.ok) throw new Error('Error')
      showSnack(`${nombreHijo} desagrupado`)
      cargarGrupos()
    } catch (e: any) { showSnack(e.message, 'error') }
  }

  const guardarEdicionGrupo = async (principalId: string) => {
    try {
      await fetchAuth(`/clientes/${principalId}/grupo`, {
        method: 'PUT', body: JSON.stringify({ nombreGrupo: editNombre, limiteCredito: parseFloat(editLimite) || 0 })
      })
      showSnack('Grupo actualizado')
      setEditandoGrupo(null); cargarGrupos()
    } catch (e: any) { showSnack(e.message, 'error') }
  }

  const agregarHijoAGrupoExistente = async (principalId: string, hijoId: string) => {
    try {
      const res = await fetchAuth('/clientes/agrupar', { method: 'POST', body: JSON.stringify({ principalId, hijoId }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      showSnack('Cliente agregado al grupo')
      cargarGrupos(); setResultadosAgregar([]); setAgregandoA(null)
    } catch (e: any) { showSnack(e.message, 'error') }
  }

  const rolesPermitidos = ['superAdministrador', 'administrador', 'oficina', 'planta']
  if (usuario && !rolesPermitidos.includes(usuario.rol)) {
    return <Box sx={{ p: 4 }}><Alert severity='error'>No tienes permiso para acceder a esta sección.</Alert></Box>
  }

  const dir = (c: ClienteSimple) => [c.calle, c.colonia, c.municipio].filter(x => x && x !== 'Por definir').join(', ') || 'Sin dirección'
  const fmt$ = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant='h5' fontWeight='bold'>Agrupación de Clientes</Typography>
          <Typography variant='body2' color='text.secondary'>
            Agrupa registros del mismo cliente sin borrar nada. Cada repartidor sigue viendo sus clientes como siempre en la app.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant={vista === 'grupos' ? 'contained' : 'outlined'} size='small' onClick={() => setVista('grupos')}>
            Grupos ({grupos.length})
          </Button>
          <Button variant={vista === 'agrupar' ? 'contained' : 'outlined'} size='small' startIcon={<AddIcon />}
            onClick={() => { setVista('agrupar'); setPrincipalSeleccionado(null); setHijosSeleccionados([]); setBusqueda('') }}>
            Crear grupo
          </Button>
        </Box>
      </Box>

      {/* ====== VISTA GRUPOS EXISTENTES ====== */}
      {vista === 'grupos' && (
        <Box>
          {loadingGrupos ? <LinearProgress sx={{ mb: 2 }} /> : grupos.length === 0 ? (
            <Card><CardContent>
              <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                No hay grupos creados aún. Usa "Crear grupo" para empezar.
              </Typography>
            </CardContent></Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {grupos.map(g => (
                <Card key={g.principalId} variant='outlined'>
                  <CardContent sx={{ pb: '12px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                        <IconButton size='small' onClick={() => { setExpandedGrupo(expandedGrupo === g.principalId ? null : g.principalId); setAgregandoA(null); setResultadosAgregar([]) }}>
                          {expandedGrupo === g.principalId ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        {editandoGrupo === g.principalId ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                            <TextField size='small' label='Nombre del grupo' value={editNombre} onChange={e => setEditNombre(e.target.value)} sx={{ flex: 1 }} />
                            <TextField size='small' label='Límite crédito' type='number' value={editLimite} onChange={e => setEditLimite(e.target.value)} sx={{ width: 150 }}
                              InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} />
                            <IconButton color='success' onClick={() => guardarEdicionGrupo(g.principalId)}><SaveIcon /></IconButton>
                            <IconButton onClick={() => setEditandoGrupo(null)}><CloseIcon /></IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography fontWeight='bold'>{g.nombreGrupo}</Typography>
                              <Chip label={`${g.totalMiembros} registros`} size='small' sx={{ fontSize: 10, height: 20 }} />
                              {g.saldoGrupo > 0 && <Chip label={fmt$(g.saldoGrupo)} size='small' color='warning' sx={{ fontSize: 10, height: 20 }} />}
                              <IconButton size='small' onClick={() => { setEditandoGrupo(g.principalId); setEditNombre(g.nombreGrupo); setEditLimite(String(g.limiteCredito)) }}>
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                            <Typography variant='caption' color='text.secondary'>
                              Límite: {fmt$(g.limiteCredito)} · {g.ruta || 'Sin ruta'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <Collapse in={expandedGrupo === g.principalId}>
                      <Divider sx={{ my: 1.5 }} />
                      <TableContainer>
                        <Table size='small'>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Nombre en sistema</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Ruta</TableCell>
                              <TableCell align='right' sx={{ fontWeight: 'bold', fontSize: 11 }}>Saldo</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Rol</TableCell>
                              <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 11 }}>Acción</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow sx={{ bgcolor: '#f1f8e9' }}>
                              <TableCell><Typography variant='body2' fontWeight='bold' fontSize={12}>{g.nombre}</Typography></TableCell>
                              <TableCell><Chip label={g.ruta || 'Sin ruta'} size='small' sx={{ fontSize: 10, height: 18 }} /></TableCell>
                              <TableCell align='right' sx={{ fontSize: 12 }}>—</TableCell>
                              <TableCell><Chip label='Principal' size='small' color='success' sx={{ fontSize: 10, height: 18 }} /></TableCell>
                              <TableCell align='center'>—</TableCell>
                            </TableRow>
                            {g.hijos.map(h => (
                              <TableRow key={h.id} hover>
                                <TableCell sx={{ fontSize: 12 }}>{h.nombre}</TableCell>
                                <TableCell><Chip label={h.ruta || 'Sin ruta'} size='small' sx={{ fontSize: 10, height: 18 }} /></TableCell>
                                <TableCell align='right' sx={{ fontSize: 12 }}>{h.saldoActual > 0 ? fmt$(h.saldoActual) : '—'}</TableCell>
                                <TableCell><Chip label='Agrupado' size='small' sx={{ fontSize: 10, height: 18 }} /></TableCell>
                                <TableCell align='center'>
                                  <Tooltip title='Desagrupar este registro'>
                                    <IconButton size='small' color='error' onClick={() => desagrupar(h.id, h.nombre)}>
                                      <LinkOffIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Agregar más al grupo */}
                      {agregandoA === g.principalId ? (
                        <Box sx={{ mt: 1.5 }}>
                          <TextField fullWidth size='small' placeholder='Buscar cliente para agregar al grupo...' autoFocus
                            onChange={e => { if (e.target.value.length >= 2) buscarClientes(e.target.value, 'agregar') }}
                            InputProps={{
                              startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' /></InputAdornment>,
                              endAdornment: <InputAdornment position='end'><IconButton size='small' onClick={() => { setAgregandoA(null); setResultadosAgregar([]) }}><CloseIcon fontSize='small' /></IconButton></InputAdornment>
                            }}
                          />
                          {resultadosAgregar.length > 0 && (
                            <Paper variant='outlined' sx={{ maxHeight: 180, overflow: 'auto', mt: 0.5 }}>
                              {resultadosAgregar
                                .filter(c => c.id !== g.principalId && !g.hijos.find(h => h.id === c.id))
                                .map(c => (
                                <Box key={c.id} sx={{ px: 1.5, py: 0.8, cursor: 'pointer', '&:hover': { bgcolor: '#e8f5e9' }, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                  onClick={() => agregarHijoAGrupoExistente(g.principalId, c.id)}>
                                  <Box>
                                    <Typography variant='body2' fontSize={12}>{c.nombre}</Typography>
                                    <Typography variant='caption' color='text.secondary'>{c.ruta || 'Sin ruta'} {c.saldoActual > 0 ? `· ${fmt$(c.saldoActual)}` : ''}</Typography>
                                  </Box>
                                  <AddIcon fontSize='small' color='success' />
                                </Box>
                              ))}
                            </Paper>
                          )}
                        </Box>
                      ) : (
                        <Button size='small' startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={() => setAgregandoA(g.principalId)}>
                          Agregar registro al grupo
                        </Button>
                      )}
                    </Collapse>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ====== VISTA CREAR GRUPO ====== */}
      {vista === 'agrupar' && (
        <Box>
          <Card sx={{ mb: 2, border: principalSeleccionado ? '2px solid #4caf50' : '2px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant='subtitle2' fontWeight='bold' color='success.dark' gutterBottom>
                1. Selecciona el cliente PRINCIPAL (el que representa al grupo)
              </Typography>
              {!principalSeleccionado ? (
                <>
                  <TextField fullWidth size='small' placeholder='Buscar por nombre...' value={busqueda}
                    onChange={e => { setBusqueda(e.target.value); if (e.target.value.length >= 2) buscarClientes(e.target.value, 'principal') }}
                    InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' /></InputAdornment> }}
                  />
                  {loadingBusqueda && <LinearProgress sx={{ mt: 1 }} />}
                  {resultados.length > 0 && (
                    <Paper variant='outlined' sx={{ maxHeight: 350, overflow: 'auto', mt: 1 }}>
                      {resultados.map(c => (
                        <Box key={c.id} sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#e8f5e9' }, borderBottom: '1px solid #f0f0f0' }}
                          onClick={() => seleccionarPrincipal(c)}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant='body2' fontWeight='bold'>{c.nombre}</Typography>
                              <Typography variant='caption' color='text.secondary'>{dir(c)}</Typography>
                              {c.telefono && <Typography variant='caption' color='text.secondary' display='block'>📞 {c.telefono}</Typography>}
                            </Box>
                            <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                              <Chip label={c.ruta || 'Sin ruta'} size='small' sx={{ fontSize: 9, height: 18, mb: 0.3 }} />
                              {c.saldoActual > 0 && <Typography variant='caption' color='warning.dark' display='block'>{fmt$(c.saldoActual)}</Typography>}
                              {c.limiteCredito > 0 && <Typography variant='caption' color='text.secondary' display='block'>Lím: {fmt$(c.limiteCredito)}</Typography>}
                              {c.clientePrincipalId && <Chip label='Ya agrupado' size='small' color='info' sx={{ fontSize: 9, height: 16, mt: 0.3 }} />}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                  )}
                </>
              ) : (
                <Box sx={{ bgcolor: '#f1f8e9', borderRadius: 1, p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant='body2' fontWeight='bold'>{principalSeleccionado.nombre}</Typography>
                    <Typography variant='caption' color='text.secondary'>{dir(principalSeleccionado)} · {principalSeleccionado.ruta || 'Sin ruta'}</Typography>
                  </Box>
                  <Button size='small' onClick={() => { setPrincipalSeleccionado(null); setHijosSeleccionados([]); setBusqueda('') }}>Cambiar</Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {principalSeleccionado && (
            <Card sx={{ mb: 2, border: hijosSeleccionados.length > 0 ? '2px solid #ff9800' : '2px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant='subtitle2' fontWeight='bold' color='warning.dark' gutterBottom>
                  2. Agrega los registros duplicados
                </Typography>
                <TextField fullWidth size='small' placeholder='Buscar duplicados...' value={busquedaHijo}
                  onChange={e => { setBusquedaHijo(e.target.value); if (e.target.value.length >= 2) buscarClientes(e.target.value, 'hijo') }}
                  InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' /></InputAdornment> }}
                />
                {loadingHijo && <LinearProgress sx={{ mt: 1 }} />}
                {resultadosHijo.length > 0 && (
                  <Paper variant='outlined' sx={{ mt: 1 }}>
                    <TableContainer sx={{ maxHeight: 350 }}>
                      <Table size='small' stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: 10, py: 0.5 }}>Nombre en sistema</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: 10, py: 0.5 }}>Dirección</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: 10, py: 0.5 }}>Ruta</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: 10, py: 0.5 }}>Saldo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: 10, py: 0.5 }}></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {resultadosHijo.filter(c => c.id !== principalSeleccionado.id && !hijosSeleccionados.find(h => h.id === c.id)).map(c => (
                            <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => agregarHijo(c)}>
                              <TableCell sx={{ py: 0.5 }}>
                                <Typography variant='body2' fontSize={11} fontWeight='bold'>{c.nombre}</Typography>
                                {c.telefono && <Typography variant='caption' color='text.secondary'>📞 {c.telefono}</Typography>}
                              </TableCell>
                              <TableCell sx={{ py: 0.5, maxWidth: 200 }}>
                                <Typography variant='caption' color='text.secondary' sx={{ fontSize: 10 }}>{dir(c)}</Typography>
                              </TableCell>
                              <TableCell sx={{ py: 0.5 }}><Chip label={c.ruta || 'Sin ruta'} size='small' sx={{ fontSize: 9, height: 18 }} /></TableCell>
                              <TableCell sx={{ py: 0.5, fontSize: 11 }}>{c.saldoActual > 0 ? fmt$(c.saldoActual) : '—'}</TableCell>
                              <TableCell sx={{ py: 0.5 }}><AddIcon fontSize='small' color='warning' /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant='caption' color='text.secondary' sx={{ p: 0.5, display: 'block', textAlign: 'center', bgcolor: '#fafafa' }}>
                      Click en una fila para agregarla · {resultadosHijo.filter(c => c.id !== principalSeleccionado.id && !hijosSeleccionados.find(h => h.id === c.id)).length} resultados
                    </Typography>
                  </Paper>
                )}
                {hijosSeleccionados.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
                      {hijosSeleccionados.length} registro(s) para agrupar:
                    </Typography>
                    {hijosSeleccionados.map(h => (
                      <Box key={h.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff8e1', borderRadius: 1, px: 1.5, py: 0.8, mb: 0.5 }}>
                        <Box>
                          <Typography variant='body2' fontSize={12}>{h.nombre}</Typography>
                          <Typography variant='caption' color='text.secondary'>{h.ruta || 'Sin ruta'} {h.saldoActual > 0 ? `· Saldo: ${fmt$(h.saldoActual)}` : ''}</Typography>
                        </Box>
                        <IconButton size='small' onClick={() => setHijosSeleccionados(prev => prev.filter(x => x.id !== h.id))}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {principalSeleccionado && hijosSeleccionados.length > 0 && (
            <Card sx={{ mb: 2, bgcolor: '#fafafa' }}>
              <CardContent>
                <Typography variant='subtitle2' fontWeight='bold' gutterBottom>
                  3. Nombre del grupo y límite de crédito
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField fullWidth size='small' label='Nombre del grupo (como se verá en el web)' value={nombreGrupo} onChange={e => setNombreGrupo(e.target.value)} />
                  <TextField size='small' label='Límite de crédito' type='number' value={limiteGrupo} onChange={e => setLimiteGrupo(e.target.value)} sx={{ minWidth: 180 }}
                    InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} />
                </Box>
                <Alert severity='info' sx={{ mb: 2, fontSize: '0.75rem' }}>
                  <strong>Resumen:</strong> Grupo "{nombreGrupo}" con {hijosSeleccionados.length + 1} registros.
                  Límite: {fmt$(parseFloat(limiteGrupo) || 0)}.
                  Saldo actual: {fmt$(hijosSeleccionados.reduce((s, h) => s + h.saldoActual, principalSeleccionado.saldoActual))}.
                  <br />La app NO cambia — cada repartidor sigue viendo sus clientes como siempre.
                </Alert>
                <Button variant='contained' color='success' startIcon={saving ? <CircularProgress size={16} /> : <GroupWorkIcon />}
                  onClick={guardarGrupo} disabled={saving || !nombreGrupo.trim()}>
                  {saving ? 'Agrupando...' : 'Crear grupo'}
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(p => ({ ...p, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  )
}
