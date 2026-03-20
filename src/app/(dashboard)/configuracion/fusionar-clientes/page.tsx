'use client'
import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, LinearProgress, Divider, Paper
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MergeIcon from '@mui/icons-material/MergeType'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

const fetchAuth = async (path: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || sessionStorage.getItem('token') || '') : ''
  return fetch(API + path, {
    ...options,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', ...(options.headers || {}) }
  })
}

interface ClienteResult {
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  telefono: string
  calle: string
  colonia: string
  municipio: string
  ruta?: { nombre: string }
  saldoActual: number
  limiteCredito: number
  estadoCliente: string
  _pedidos?: number
  _notas?: number
}

export default function FusionarClientesPage() {
  const [busqueda1, setBusqueda1] = useState('')
  const [busqueda2, setBusqueda2] = useState('')
  const [resultados1, setResultados1] = useState<ClienteResult[]>([])
  const [resultados2, setResultados2] = useState<ClienteResult[]>([])
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [principal, setPrincipal] = useState<ClienteResult | null>(null)
  const [secundario, setSecundario] = useState<ClienteResult | null>(null)
  const [modalConfirm, setModalConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    fetchAuth('/usuarios/profile').then(r => r.json()).then(d => setUsuario(d)).catch(() => {})
  }, [])

  const buscar = async (q: string, slot: 1 | 2) => {
    if (!q.trim() || q.trim().length < 2) return
    if (slot === 1) setLoading1(true); else setLoading2(true)
    try {
      const res = await fetchAuth(`/clientes?nombre=${encodeURIComponent(q)}&pageSize=10&page=1`)
      if (!res.ok) throw new Error('Error al buscar')
      const data = await res.json()
      const clientes = Array.isArray(data) ? data : (data.clientes || data.data || [])
      if (slot === 1) setResultados1(clientes)
      else setResultados2(clientes)
    } catch (e: any) {
      setError(e.message)
    } finally {
      if (slot === 1) setLoading1(false); else setLoading2(false)
    }
  }

  const seleccionar = (cliente: ClienteResult, slot: 1 | 2) => {
    if (slot === 1) { setPrincipal(cliente); setResultados1([]) }
    else { setSecundario(cliente); setResultados2([]) }
    setError(null)
  }

  const intercambiar = () => {
    const tmp = principal
    setPrincipal(secundario)
    setSecundario(tmp)
  }

  const fusionar = async () => {
    if (!principal || !secundario) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetchAuth('/clientes/fusionar', {
        method: 'POST',
        body: JSON.stringify({ principalId: principal.id, secundarioId: secundario.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al fusionar')
      setSuccess(`✅ Clientes fusionados correctamente. Todo el historial de "${secundario.nombre} ${secundario.apellidoPaterno}" fue transferido a "${principal.nombre} ${principal.apellidoPaterno}".`)
      setPrincipal(null)
      setSecundario(null)
      setBusqueda1('')
      setBusqueda2('')
      setModalConfirm(false)
    } catch (e: any) {
      setError(e.message)
      setModalConfirm(false)
    } finally {
      setSaving(false)
    }
  }

  const rolesPermitidos = ['superAdministrador', 'administrador', 'oficina', 'planta']
  if (usuario && !rolesPermitidos.includes(usuario.rol)) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity='error'>No tienes permiso para acceder a esta sección.</Alert>
      </Box>
    )
  }

  const nombreCompleto = (c: ClienteResult) => `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno}`.trim()
  const direccion = (c: ClienteResult) => `${c.calle}, ${c.colonia}, ${c.municipio}`

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant='h5' fontWeight='bold' gutterBottom>
        Fusionar Clientes Duplicados
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Busca dos registros del mismo cliente, selecciona cuál es el principal (el que se conservará)
        y cuál es el duplicado (se eliminará). Todo el historial, créditos, pedidos y abonos se transferirán al principal.
      </Typography>

      {success && (
        <Alert severity='success' sx={{ mb: 3 }} onClose={() => setSuccess(null)} icon={<CheckCircleIcon />}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Buscadores lado a lado */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 2, alignItems: 'start', mb: 3 }}>

        {/* Cliente Principal */}
        <Card sx={{ border: principal ? '2px solid #2e7d32' : '2px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant='subtitle2' fontWeight='bold' color='success.dark' gutterBottom>
              ✅ CLIENTE PRINCIPAL (se conserva)
            </Typography>
            <TextField
              fullWidth size='small' placeholder='Buscar por nombre...'
              value={busqueda1}
              onChange={e => { setBusqueda1(e.target.value); if (e.target.value.length >= 2) buscar(e.target.value, 1) }}
              InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' /></InputAdornment> }}
              sx={{ mb: 1 }}
            />
            {loading1 && <LinearProgress sx={{ mb: 1 }} />}
            {resultados1.length > 0 && !principal && (
              <Paper variant='outlined' sx={{ maxHeight: 200, overflow: 'auto' }}>
                {resultados1.map(c => (
                  <Box key={c.id} sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid #f0f0f0' }}
                    onClick={() => seleccionar(c, 1)}>
                    <Typography variant='body2' fontWeight='bold'>{nombreCompleto(c)}</Typography>
                    <Typography variant='caption' color='text.secondary'>{direccion(c)}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3 }}>
                      <Chip label={c.ruta?.nombre || 'Sin ruta'} size='small' sx={{ fontSize: 10, height: 18 }} />
                      {(c.saldoActual ?? 0) > 0 && <Chip label={`$${(c.saldoActual ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`} size='small' color='warning' sx={{ fontSize: 10, height: 18 }} />}
                    </Box>
                  </Box>
                ))}
              </Paper>
            )}
            {principal && (
              <Box sx={{ bgcolor: '#f1f8e9', borderRadius: 1, p: 1.5, mt: 1 }}>
                <Typography variant='body2' fontWeight='bold'>{nombreCompleto(principal)}</Typography>
                <Typography variant='caption' color='text.secondary' display='block'>{direccion(principal)}</Typography>
                <Typography variant='caption' color='text.secondary' display='block'>📞 {principal.telefono}</Typography>
                <Typography variant='caption' color='text.secondary' display='block'>🛣️ {principal.ruta?.nombre || 'Sin ruta'}</Typography>
                {(principal.saldoActual ?? 0) > 0 && (
                  <Typography variant='caption' color='warning.dark' display='block'>💰 Saldo: ${(principal.saldoActual ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</Typography>
                )}
                <Button size='small' sx={{ mt: 1 }} onClick={() => { setPrincipal(null); setBusqueda1('') }}>
                  Cambiar
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Botón intercambiar */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 7 }}>
          <Button variant='outlined' size='small' onClick={intercambiar} disabled={!principal || !secundario}
            sx={{ minWidth: 0, p: 1 }} title='Intercambiar principal y duplicado'>
            <SwapHorizIcon />
          </Button>
          <Typography variant='caption' color='text.disabled' sx={{ mt: 0.5, textAlign: 'center', fontSize: 10 }}>
            intercambiar
          </Typography>
        </Box>

        {/* Cliente Duplicado */}
        <Card sx={{ border: secundario ? '2px solid #c62828' : '2px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant='subtitle2' fontWeight='bold' color='error.dark' gutterBottom>
              🗑️ CLIENTE DUPLICADO (se eliminará)
            </Typography>
            <TextField
              fullWidth size='small' placeholder='Buscar por nombre...'
              value={busqueda2}
              onChange={e => { setBusqueda2(e.target.value); if (e.target.value.length >= 2) buscar(e.target.value, 2) }}
              InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' /></InputAdornment> }}
              sx={{ mb: 1 }}
            />
            {loading2 && <LinearProgress sx={{ mb: 1 }} />}
            {resultados2.length > 0 && !secundario && (
              <Paper variant='outlined' sx={{ maxHeight: 200, overflow: 'auto' }}>
                {resultados2.map(c => (
                  <Box key={c.id} sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid #f0f0f0' }}
                    onClick={() => seleccionar(c, 2)}>
                    <Typography variant='body2' fontWeight='bold'>{nombreCompleto(c)}</Typography>
                    <Typography variant='caption' color='text.secondary'>{direccion(c)}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3 }}>
                      <Chip label={c.ruta?.nombre || 'Sin ruta'} size='small' sx={{ fontSize: 10, height: 18 }} />
                      {(c.saldoActual ?? 0) > 0 && <Chip label={`$${(c.saldoActual ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`} size='small' color='warning' sx={{ fontSize: 10, height: 18 }} />}
                    </Box>
                  </Box>
                ))}
              </Paper>
            )}
            {secundario && (
              <Box sx={{ bgcolor: '#ffebee', borderRadius: 1, p: 1.5, mt: 1 }}>
                <Typography variant='body2' fontWeight='bold'>{nombreCompleto(secundario)}</Typography>
                <Typography variant='caption' color='text.secondary' display='block'>{direccion(secundario)}</Typography>
                <Typography variant='caption' color='text.secondary' display='block'>📞 {secundario.telefono}</Typography>
                <Typography variant='caption' color='text.secondary' display='block'>🛣️ {secundario.ruta?.nombre || 'Sin ruta'}</Typography>
                {(secundario.saldoActual ?? 0) > 0 && (
                  <Typography variant='caption' color='warning.dark' display='block'>💰 Saldo: ${(secundario.saldoActual ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</Typography>
                )}
                <Button size='small' sx={{ mt: 1 }} onClick={() => { setSecundario(null); setBusqueda2('') }}>
                  Cambiar
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Resumen de la fusión */}
      {principal && secundario && (
        <Card sx={{ mb: 3, bgcolor: '#fff8e1', border: '1px solid #ffb74d' }}>
          <CardContent>
            <Typography variant='subtitle2' fontWeight='bold' gutterBottom>
              📋 Resumen de la fusión
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant='caption' color='success.dark' fontWeight='bold'>QUEDARÁ:</Typography>
                <Typography variant='body2'>{nombreCompleto(principal)}</Typography>
                <Typography variant='caption' color='text.secondary'>{principal.ruta?.nombre || 'Sin ruta'}</Typography>
              </Box>
              <Box>
                <Typography variant='caption' color='error.dark' fontWeight='bold'>SE ELIMINARÁ:</Typography>
                <Typography variant='body2'>{nombreCompleto(secundario)}</Typography>
                <Typography variant='caption' color='text.secondary'>{secundario.ruta?.nombre || 'Sin ruta'}</Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant='caption' color='text.secondary'>
              ✅ Se transferirán al principal: todos los pedidos, notas de crédito, pagos, abonos e historial de límites.<br />
              ✅ El saldo del duplicado (${(secundario.saldoActual ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}) se sumará al principal.<br />
              ✅ Se conservará el límite de crédito más alto entre los dos.<br />
              ⚠️ Esta acción no se puede deshacer.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant='contained' color='warning' startIcon={<MergeIcon />}
                onClick={() => setModalConfirm(true)} disabled={saving}>
                Fusionar clientes
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Modal de confirmación */}
      <Dialog open={modalConfirm} onClose={() => setModalConfirm(false)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.dark' }}>
          <WarningIcon color='warning' /> Confirmar fusión
        </DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            Esta acción <strong>no se puede deshacer</strong>. El cliente duplicado será eliminado permanentemente.
          </Alert>
          {principal && secundario && (
            <Box>
              <Typography variant='body2' sx={{ mb: 1 }}>
                ¿Confirmas que deseas fusionar estos dos clientes?
              </Typography>
              <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 1, p: 1.5 }}>
                <Typography variant='caption' color='success.dark' fontWeight='bold' display='block'>SE CONSERVA:</Typography>
                <Typography variant='body2' fontWeight='bold'>{nombreCompleto(principal)}</Typography>
                <Typography variant='caption' color='error.dark' fontWeight='bold' display='block' sx={{ mt: 1 }}>SE ELIMINA:</Typography>
                <Typography variant='body2' fontWeight='bold'>{nombreCompleto(secundario)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalConfirm(false)} disabled={saving}>Cancelar</Button>
          <Button variant='contained' color='warning' onClick={fusionar} disabled={saving}>
            {saving ? 'Fusionando...' : 'Sí, fusionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
