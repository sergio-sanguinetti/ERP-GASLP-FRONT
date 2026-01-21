'use client'

import React, { useState, useEffect } from 'react'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment,
  Checkbox,
  DialogContentText,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material'

// Type Imports
import { formasPagoAPI, sedesAPI, tiposFormaPagoAPI, type FormaPago, type Sede, type TipoFormaPago } from '@lib/api'
import { useAuth } from '@contexts/AuthContext'

// Tipos de datos (compatibilidad con estructura del frontend)
interface FormaPagoFrontend extends FormaPago {
  configuracion: {
    requiereComprobante: boolean
    permiteCambio: boolean
    limiteMaximo?: number
    limiteMinimo?: number
  }
}

export default function ConfiguracionFormasPagoPage() {
  const { user } = useAuth()
  const [vistaActual, setVistaActual] = useState<'formas-pago' | 'tipos'>('formas-pago')
  const [formasPagoList, setFormasPagoList] = useState<FormaPagoFrontend[]>([])
  const [tiposFormaPagoList, setTiposFormaPagoList] = useState<TipoFormaPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'crear' | 'editar' | 'eliminar' | 'ver'>('crear')
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<FormaPagoFrontend | null>(null)
  const [tipoFormaPagoSeleccionado, setTipoFormaPagoSeleccionado] = useState<TipoFormaPago | null>(null)
  const [formulario, setFormulario] = useState<Partial<FormaPagoFrontend>>({})
  const [formularioTipo, setFormularioTipo] = useState<Partial<TipoFormaPago>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sedes, setSedes] = useState<Sede[]>([])
  const [sedesSeleccionadas, setSedesSeleccionadas] = useState<string[]>([])

  const [filtros, setFiltros] = useState({
    nombre: '',
    tipo: '',
    activa: ''
  })

  // Cargar sedes y tipos al montar el componente
  useEffect(() => {
    loadSedes()
    loadTiposFormaPago()
  }, [])

  // Cargar datos según la vista actual
  useEffect(() => {
    if (vistaActual === 'formas-pago') {
      loadFormasPago()
    } else if (vistaActual === 'tipos') {
      loadTiposFormaPago()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaActual, filtros.nombre, filtros.tipo, filtros.activa])

  // Cargar tipos siempre para que estén disponibles en el selector
  useEffect(() => {
    if (tiposFormaPagoList.length === 0) {
      loadTiposFormaPago()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSedes = async () => {
    try {
      const data = await sedesAPI.getAll()
      setSedes(data)
    } catch (err: any) {
      console.error('Error loading sedes:', err)
    }
  }

  const loadFormasPago = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await formasPagoAPI.getAll({
        nombre: filtros.nombre || undefined,
        tipo: filtros.tipo || undefined,
        activa: filtros.activa || undefined
      })
      
      // Convertir a formato del frontend (con configuracion anidada)
      const formasPagoFormateadas: FormaPagoFrontend[] = data.map(fp => {
        // Debug: verificar estructura de datos
        if (process.env.NODE_ENV === 'development') {
          console.log('FormaPago recibida:', { id: fp.id, nombre: fp.nombre, sede: fp.sede, sedeId: fp.sedeId })
        }
        
        return {
          ...fp,
          sede: fp.sede || undefined, // Asegurar que sede se preserve
          sedes: fp.sedes?.map((fs: any) => fs.sede || fs) || undefined, // Mapear sedes desde la relación
          configuracion: {
            requiereComprobante: fp.requiereComprobante,
            permiteCambio: fp.permiteCambio,
            limiteMaximo: fp.limiteMaximo,
            limiteMinimo: fp.limiteMinimo
          }
        }
      })
      
      setFormasPagoList(formasPagoFormateadas)
    } catch (err: any) {
      setError(err.message || 'Error al cargar formas de pago')
      console.error('Error loading formas de pago:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTiposFormaPago = async () => {
    try {
      // No usar setLoading aquí para no bloquear la UI cuando se carga en segundo plano
      setError('')
      const data = await tiposFormaPagoAPI.getAll({
        activo: vistaActual === 'tipos' ? filtros.activa || undefined : undefined,
        nombre: vistaActual === 'tipos' ? filtros.nombre || undefined : undefined
      })
      setTiposFormaPagoList(data)
      console.log('Tipos cargados:', data.length, data)
    } catch (err: any) {
      console.error('Error loading tipos de formas de pago:', err)
      // No mostrar error si es solo para cargar en segundo plano
      if (vistaActual === 'tipos') {
        setError(err.message || 'Error al cargar tipos de formas de pago')
      }
    }
  }

  const abrirDialogo = (tipo: 'crear' | 'editar' | 'eliminar' | 'ver', formaPago?: FormaPagoFrontend) => {
    // Asegurar que los tipos estén cargados antes de abrir el diálogo
    if (tiposFormaPagoList.length === 0) {
      loadTiposFormaPago()
    }
    setTipoDialogo(tipo)
    setFormaPagoSeleccionada(formaPago || null)
    setError('')

    if (tipo === 'crear') {
      setFormulario({
        activa: true,
        requiereValidacion: false,
        requiereFolio: false,
        comisionPorcentaje: 0,
        diasLiquidacion: 0,
        requiereComprobante: false,
        permiteCambio: true,
        configuracion: {
          requiereComprobante: false,
          permiteCambio: true
        },
        usuarioCreacion: user?.nombres || user?.email || 'Sistema',
        usuarioModificacion: user?.nombres || user?.email || 'Sistema'
      })
      setSedesSeleccionadas([])
    } else if (tipo === 'editar' && formaPago) {
      setFormulario({ ...formaPago })
      // Si hay sedes asociadas, cargarlas
      if (formaPago.sedes && Array.isArray(formaPago.sedes)) {
        setSedesSeleccionadas(formaPago.sedes.map((s: any) => s.id || s.sedeId))
      } else if (formaPago.sedeId) {
        setSedesSeleccionadas([formaPago.sedeId])
      } else {
        setSedesSeleccionadas([])
      }
    }

    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setFormaPagoSeleccionada(null)
    setFormulario({})
    setSedesSeleccionadas([])
  }

  const manejarSeleccionarTodas = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (sedesSeleccionadas.length === sedes.length && sedes.length > 0) {
      setSedesSeleccionadas([])
    } else {
      setSedesSeleccionadas(sedes.map(s => s.id))
    }
  }

  const manejarCambioFormulario = (campo: string, valor: any) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }))
  }

  const manejarCambioConfiguracion = (campo: string, valor: any) => {
    setFormulario(prev => ({
      ...prev,
      configuracion: {
        ...prev.configuracion,
        [campo]: valor
      }
    }))
  }

  const guardarFormaPago = async () => {
    if (!formulario.nombre || !formulario.tipo || !formulario.descripcion) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    // Validar que se seleccione al menos una sede al crear
    if (tipoDialogo === 'crear' && sedesSeleccionadas.length === 0) {
      setError('Debes seleccionar al menos una sede para crear la forma de pago')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (tipoDialogo === 'crear') {
        await formasPagoAPI.create({
          nombre: formulario.nombre!,
          tipo: formulario.tipo!,
          descripcion: formulario.descripcion!,
          activa: formulario.activa !== undefined ? formulario.activa : true,
          requiereValidacion: formulario.requiereValidacion || false,
          requiereFolio: formulario.requiereFolio || false,
          comisionPorcentaje: formulario.comisionPorcentaje || 0,
          diasLiquidacion: formulario.diasLiquidacion || 0,
          bancoAsociado: formulario.bancoAsociado,
          requiereComprobante: formulario.configuracion?.requiereComprobante || false,
          permiteCambio: formulario.configuracion?.permiteCambio !== undefined ? formulario.configuracion.permiteCambio : true,
          limiteMaximo: formulario.configuracion?.limiteMaximo,
          limiteMinimo: formulario.configuracion?.limiteMinimo,
          sedeId: sedesSeleccionadas.length === 1 ? sedesSeleccionadas[0] : undefined,
          sedesIds: sedesSeleccionadas.length > 0 ? sedesSeleccionadas : undefined,
          usuarioCreacion: user?.nombres || user?.email || 'Sistema',
          usuarioModificacion: user?.nombres || user?.email || 'Sistema'
        })
      } else if (tipoDialogo === 'editar' && formaPagoSeleccionada) {
        await formasPagoAPI.update(formaPagoSeleccionada.id, {
          nombre: formulario.nombre,
          tipo: formulario.tipo,
          descripcion: formulario.descripcion,
          activa: formulario.activa,
          requiereValidacion: formulario.requiereValidacion,
          requiereFolio: formulario.requiereFolio,
          comisionPorcentaje: formulario.comisionPorcentaje,
          diasLiquidacion: formulario.diasLiquidacion,
          bancoAsociado: formulario.bancoAsociado,
          requiereComprobante: formulario.configuracion?.requiereComprobante,
          permiteCambio: formulario.configuracion?.permiteCambio,
          limiteMaximo: formulario.configuracion?.limiteMaximo,
          limiteMinimo: formulario.configuracion?.limiteMinimo,
          sedeId: sedesSeleccionadas.length === 1 ? sedesSeleccionadas[0] : undefined,
          sedesIds: sedesSeleccionadas.length > 0 ? sedesSeleccionadas : undefined,
          usuarioModificacion: user?.nombres || user?.email || 'Sistema'
        })
      }

      cerrarDialogo()
      await loadFormasPago() // Recargar la lista
    } catch (err: any) {
      setError(err.message || 'Error al guardar forma de pago')
    } finally {
      setSaving(false)
    }
  }

  const eliminarFormaPago = async () => {
    if (!formaPagoSeleccionada) return

    setDeleting(true)
    setError('')

    try {
      await formasPagoAPI.delete(formaPagoSeleccionada.id)
      cerrarDialogo()
      await loadFormasPago() // Recargar la lista
    } catch (err: any) {
      setError(err.message || 'Error al eliminar forma de pago')
    } finally {
      setDeleting(false)
    }
  }

  const manejarCambioFiltros = (campo: string, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  // Funciones para gestión de tipos
  const abrirDialogoTipo = (tipo: 'crear' | 'editar' | 'eliminar' | 'ver', tipoFormaPago?: TipoFormaPago) => {
    setTipoDialogo(tipo)
    setTipoFormaPagoSeleccionado(tipoFormaPago || null)
    setError('')

    if (tipo === 'crear') {
      setFormularioTipo({
        activo: true,
        orden: 0
      })
    } else if (tipo === 'editar' && tipoFormaPago) {
      setFormularioTipo({ ...tipoFormaPago })
    }

    setDialogoAbierto(true)
  }

  const cerrarDialogoTipo = () => {
    setDialogoAbierto(false)
    setTipoFormaPagoSeleccionado(null)
    setFormularioTipo({})
  }

  const guardarTipoFormaPago = async () => {
    if (!formularioTipo.codigo || !formularioTipo.nombre) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (tipoDialogo === 'crear') {
        await tiposFormaPagoAPI.create({
          codigo: formularioTipo.codigo!,
          nombre: formularioTipo.nombre!,
          descripcion: formularioTipo.descripcion,
          activo: formularioTipo.activo !== undefined ? formularioTipo.activo : true,
          orden: formularioTipo.orden || 0
        })
      } else if (tipoDialogo === 'editar' && tipoFormaPagoSeleccionado) {
        await tiposFormaPagoAPI.update(tipoFormaPagoSeleccionado.id, {
          codigo: formularioTipo.codigo,
          nombre: formularioTipo.nombre,
          descripcion: formularioTipo.descripcion,
          activo: formularioTipo.activo,
          orden: formularioTipo.orden
        })
      }

      cerrarDialogoTipo()
      await loadTiposFormaPago()
      // Recargar formas de pago si estamos en esa vista para actualizar los selectores
      if (vistaActual === 'formas-pago') {
        await loadFormasPago()
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar tipo de forma de pago')
    } finally {
      setSaving(false)
    }
  }

  const eliminarTipoFormaPago = async () => {
    if (!tipoFormaPagoSeleccionado) return

    setDeleting(true)
    setError('')

    try {
      await tiposFormaPagoAPI.delete(tipoFormaPagoSeleccionado.id)
      cerrarDialogoTipo()
      await loadTiposFormaPago()
      // Recargar formas de pago si estamos en esa vista para actualizar los selectores
      if (vistaActual === 'formas-pago') {
        await loadFormasPago()
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar tipo de forma de pago')
    } finally {
      setDeleting(false)
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'efectivo':
        return <AttachMoneyIcon />
      case 'terminal':
        return <CreditCardIcon />
      case 'transferencia':
        return <AccountBalanceIcon />
      case 'cheque':
        return <ReceiptIcon />
      case 'deposito':
        return <AccountBalanceIcon />
      case 'credito':
        return <PaymentIcon />
      default:
        return <PaymentIcon />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'efectivo':
        return 'success'
      case 'terminal':
        return 'primary'
      case 'transferencia':
        return 'info'
      case 'cheque':
        return 'warning'
      case 'deposito':
        return 'secondary'
      case 'credito':
        return 'error'
      default:
        return 'default'
    }
  }

  // Los filtros ya se aplican en el backend, así que usamos directamente la lista
  const formasPagoFiltradas = formasPagoList

  const tiposFormaPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'terminal', label: 'Terminal de Pago' },
    { value: 'transferencia', label: 'Transferencia Bancaria' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'deposito', label: 'Depósito Bancario' },
    { value: 'credito', label: 'Crédito' }
  ]

  return (
    <>
      <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Navegación con Tabs */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant={vistaActual === 'formas-pago' ? 'contained' : 'outlined'}
              onClick={() => setVistaActual('formas-pago')}
              startIcon={<PaymentIcon />}
            >
              Formas de Pago
            </Button>
            <Button
              variant={vistaActual === 'tipos' ? 'contained' : 'outlined'}
              onClick={() => setVistaActual('tipos')}
              startIcon={<CreditCardIcon />}
            >
              Tipos
            </Button>
          </Box>
        </Box>

        {/* Vista de Formas de Pago */}
        {vistaActual === 'formas-pago' && (
          <>
            {/* Filtros y Búsqueda */}
            <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Filtros y Búsqueda
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label='Buscar por Nombre'
                  value={filtros.nombre}
                  onChange={e => manejarCambioFiltros('nombre', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filtros.tipo}
                    onChange={e => manejarCambioFiltros('tipo', e.target.value)}
                    label='Tipo'
                  >
                    <MenuItem value=''>Todos los tipos</MenuItem>
                    {tiposFormaPagoList.length > 0 ? (
                      tiposFormaPagoList
                        .filter(t => t.activo)
                        .sort((a, b) => a.orden - b.orden)
                        .map(tipo => (
                          <MenuItem key={tipo.id} value={tipo.codigo}>
                            {tipo.nombre}
                          </MenuItem>
                        ))
                    ) : (
                      tiposFormaPago.map(tipo => (
                        <MenuItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtros.activa}
                    onChange={e => manejarCambioFiltros('activa', e.target.value)}
                    label='Estado'
                  >
                    <MenuItem value=''>Todos los estados</MenuItem>
                    <MenuItem value='activa'>Activa</MenuItem>
                    <MenuItem value='inactiva'>Inactiva</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant='contained' startIcon={<AddIcon />} onClick={() => abrirDialogo('crear')} fullWidth>
                    Nueva Forma de Pago
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Lista de Formas de Pago */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>Formas de Pago ({formasPagoFiltradas.length})</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title='Actualizar'>
                  <IconButton onClick={loadFormasPago} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Exportar'>
                  <IconButton onClick={() => console.log('Exportar formas de pago')}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {loading && formasPagoList.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : formasPagoFiltradas.length === 0 ? (
              <Typography variant='body1' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                No hay formas de pago registradas
              </Typography>
            ) : (
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Forma de Pago</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Sede</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                      <TableCell align='right'>Comisión</TableCell>
                      <TableCell align='right'>Días Liquidación</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formasPagoFiltradas.map(formaPago => (
                    <TableRow key={formaPago.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ color: `${getTipoColor(formaPago.tipo)}.main` }}>
                            {getTipoIcon(formaPago.tipo)}
                          </Box>
                          <Box>
                            <Typography variant='subtitle2' fontWeight='bold'>
                              {formaPago.nombre}
                            </Typography>
                            {formaPago.bancoAsociado && (
                              <Typography variant='caption' color='text.secondary'>
                                {formaPago.bancoAsociado}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tiposFormaPago.find(t => t.value === formaPago.tipo)?.label || formaPago.tipo}
                          color={getTipoColor(formaPago.tipo) as any}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {formaPago.descripcion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formaPago.sedes && formaPago.sedes.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {formaPago.sedes.map((sede: any, index: number) => (
                              <Chip 
                                key={sede.id || index} 
                                label={sede.nombre} 
                                size='small' 
                                color='primary' 
                                variant='outlined' 
                              />
                            ))}
                          </Box>
                        ) : formaPago.sede ? (
                          <Chip label={formaPago.sede.nombre} size='small' color='primary' variant='outlined' />
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            Sin sede
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={formaPago.activa ? 'Activa' : 'Inactiva'}
                          color={formaPago.activa ? 'success' : 'default'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2'>{formaPago.comisionPorcentaje}%</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2'>{formaPago.diasLiquidacion} días</Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title='Ver detalles'>
                            <IconButton size='small' onClick={() => abrirDialogo('ver', formaPago)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Editar'>
                            <IconButton size='small' onClick={() => abrirDialogo('editar', formaPago)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Eliminar'>
                            <IconButton size='small' onClick={() => abrirDialogo('eliminar', formaPago)} color='error'>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Modal Crear/Editar Forma de Pago */}
        <Dialog
          open={dialogoAbierto && (tipoDialogo === 'crear' || tipoDialogo === 'editar') && vistaActual === 'formas-pago'}
          onClose={cerrarDialogo}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {tipoDialogo === 'crear' ? <AddIcon /> : <EditIcon />}
              {tipoDialogo === 'crear' ? 'Crear Nueva Forma de Pago' : 'Editar Forma de Pago'}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Información Básica */}
              <Grid item xs={12}>
                <Typography variant='h6' gutterBottom>
                  Información Básica
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Nombre'
                  value={formulario.nombre || ''}
                  onChange={e => manejarCambioFormulario('nombre', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formulario.tipo || ''}
                    onChange={e => manejarCambioFormulario('tipo', e.target.value)}
                    label='Tipo'
                  >
                    {tiposFormaPagoList.length > 0 ? (
                      tiposFormaPagoList
                        .filter(t => t.activo)
                        .sort((a, b) => a.orden - b.orden)
                        .map(tipo => (
                          <MenuItem key={tipo.id} value={tipo.codigo}>
                            {tipo.nombre}
                          </MenuItem>
                        ))
                    ) : (
                      tiposFormaPago.map(tipo => (
                        <MenuItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {tiposFormaPagoList.length === 0 && (
                    <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                      No hay tipos disponibles. Crea tipos en la pestaña "Tipos"
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Descripción'
                  multiline
                  rows={2}
                  value={formulario.descripcion || ''}
                  onChange={e => manejarCambioFormulario('descripcion', e.target.value)}
                  required
                />
              </Grid>

              {/* Configuración */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant='h6' gutterBottom>
                  Configuración
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formulario.activa || false}
                      onChange={e => manejarCambioFormulario('activa', e.target.checked)}
                    />
                  }
                  label='Forma de Pago Activa'
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formulario.requiereValidacion || false}
                      onChange={e => manejarCambioFormulario('requiereValidacion', e.target.checked)}
                    />
                  }
                  label='Requiere Validación'
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formulario.requiereFolio || false}
                      onChange={e => manejarCambioFormulario('requiereFolio', e.target.checked)}
                    />
                  }
                  label='Requiere Folio'
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Comisión (%)'
                  type='number'
                  value={formulario.comisionPorcentaje || 0}
                  onChange={e => manejarCambioFormulario('comisionPorcentaje', Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position='end'>%</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Días de Liquidación'
                  type='number'
                  value={formulario.diasLiquidacion || 0}
                  onChange={e => manejarCambioFormulario('diasLiquidacion', Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position='end'>días</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Banco Asociado'
                  value={formulario.bancoAsociado || ''}
                  onChange={e => manejarCambioFormulario('bancoAsociado', e.target.value)}
                  placeholder='Opcional'
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={tipoDialogo === 'crear' && sedesSeleccionadas.length === 0}>
                  <InputLabel>Sedes *</InputLabel>
                  <Select
                    multiple
                    value={sedesSeleccionadas}
                    onChange={e => {
                      const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                      // Filtrar el valor especial "__select_all__"
                      const filteredValue = value.filter((v: string) => v !== '__select_all__')
                      
                      // Si el valor incluye "__select_all__", seleccionar/deseleccionar todas
                      if (value.includes('__select_all__')) {
                        if (sedesSeleccionadas.length === sedes.length && sedes.length > 0) {
                          setSedesSeleccionadas([])
                        } else {
                          setSedesSeleccionadas(sedes.map(s => s.id))
                        }
                      } else {
                        setSedesSeleccionadas(filteredValue)
                      }
                      
                      // Limpiar error si se selecciona al menos una sede
                      if (filteredValue.length > 0 && error.includes('sede')) {
                        setError('')
                      }
                    }}
                    label='Sedes *'
                    renderValue={(selected) => {
                      if (selected.length === 0) return 'Sin sedes'
                      if (selected.length === sedes.length && sedes.length > 0) return 'Todas las sedes'
                      if (selected.length === 1) {
                        const sede = sedes.find(s => s.id === selected[0])
                        return sede?.nombre || ''
                      }
                      return `${selected.length} sedes seleccionadas`
                    }}
                  >
                    <MenuItem 
                      value="__select_all__"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <Checkbox
                        checked={sedesSeleccionadas.length === sedes.length && sedes.length > 0}
                        indeterminate={sedesSeleccionadas.length > 0 && sedesSeleccionadas.length < sedes.length}
                      />
                      <em>Seleccionar todas</em>
                    </MenuItem>
                    {sedes.map(sede => (
                      <MenuItem key={sede.id} value={sede.id}>
                        <Checkbox checked={sedesSeleccionadas.indexOf(sede.id) > -1} />
                        {sede.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {tipoDialogo === 'crear' && sedesSeleccionadas.length === 0 && (
                    <Typography variant='caption' color='error' sx={{ mt: 0.5, ml: 1.75 }}>
                      Debes seleccionar al menos una sede
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Configuración Avanzada */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant='h6' gutterBottom>
                  Configuración Avanzada
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formulario.configuracion?.requiereComprobante || false}
                      onChange={e => manejarCambioConfiguracion('requiereComprobante', e.target.checked)}
                    />
                  }
                  label='Requiere Comprobante'
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formulario.configuracion?.permiteCambio || false}
                      onChange={e => manejarCambioConfiguracion('permiteCambio', e.target.checked)}
                    />
                  }
                  label='Permite Cambio'
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Límite Máximo'
                  type='number'
                  value={formulario.configuracion?.limiteMaximo || ''}
                  onChange={e => {
                    const value = e.target.value === '' ? undefined : Number(e.target.value)
                    manejarCambioConfiguracion('limiteMaximo', value)
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                  placeholder='Sin límite'
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Límite Mínimo'
                  type='number'
                  value={formulario.configuracion?.limiteMinimo || ''}
                  onChange={e => {
                    const value = e.target.value === '' ? undefined : Number(e.target.value)
                    manejarCambioConfiguracion('limiteMinimo', value)
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                  placeholder='Sin límite'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            {error && (
              <Alert severity='error' sx={{ flex: 1, mr: 2 }}>
                {error}
              </Alert>
            )}
            <Button onClick={cerrarDialogo} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              onClick={guardarFormaPago} 
              variant='contained' 
              startIcon={<SaveIcon />} 
              disabled={saving || (tipoDialogo === 'crear' && sedesSeleccionadas.length === 0)}
            >
              {saving ? 'Guardando...' : tipoDialogo === 'crear' ? 'Crear' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal Ver Detalles */}
        <Dialog open={dialogoAbierto && tipoDialogo === 'ver' && vistaActual === 'formas-pago'} onClose={cerrarDialogo} maxWidth='md' fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VisibilityIcon />
              Detalles de Forma de Pago
            </Box>
          </DialogTitle>
          <DialogContent>
            {formaPagoSeleccionada && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Box sx={{ color: `${getTipoColor(formaPagoSeleccionada.tipo)}.main` }}>
                        {getTipoIcon(formaPagoSeleccionada.tipo)}
                      </Box>
                      <Box>
                        <Typography variant='h5'>{formaPagoSeleccionada.nombre}</Typography>
                        <Chip
                          label={
                            tiposFormaPago.find(t => t.value === formaPagoSeleccionada.tipo)?.label ||
                            formaPagoSeleccionada.tipo
                          }
                          color={getTipoColor(formaPagoSeleccionada.tipo) as any}
                          size='small'
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='h6' gutterBottom>
                          Información General
                        </Typography>
                        <Typography variant='body2' color='text.secondary' gutterBottom>
                          Descripción
                        </Typography>
                        <Typography variant='body1' sx={{ mb: 2 }}>
                          {formaPagoSeleccionada.descripcion}
                        </Typography>

                        <Typography variant='body2' color='text.secondary' gutterBottom>
                          Estado
                        </Typography>
                        <Chip
                          label={formaPagoSeleccionada.activa ? 'Activa' : 'Inactiva'}
                          color={formaPagoSeleccionada.activa ? 'success' : 'default'}
                          size='small'
                          sx={{ mb: 2 }}
                        />

                        {formaPagoSeleccionada.bancoAsociado && (
                          <>
                            <Typography variant='body2' color='text.secondary' gutterBottom>
                              Banco Asociado
                            </Typography>
                            <Typography variant='body1' sx={{ mb: 2 }}>
                              {formaPagoSeleccionada.bancoAsociado}
                            </Typography>
                          </>
                        )}

                        <Typography variant='body2' color='text.secondary' gutterBottom>
                          Sedes
                        </Typography>
                        {formaPagoSeleccionada.sedes && formaPagoSeleccionada.sedes.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                            {formaPagoSeleccionada.sedes.map((sede: any, index: number) => (
                              <Chip 
                                key={sede.id || index} 
                                label={sede.nombre} 
                                size='small' 
                                color='primary' 
                              />
                            ))}
                          </Box>
                        ) : formaPagoSeleccionada.sede ? (
                          <Chip label={formaPagoSeleccionada.sede.nombre} size='small' color='primary' sx={{ mb: 2 }} />
                        ) : (
                          <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
                            Sin sedes asignadas
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='h6' gutterBottom>
                          Configuración Financiera
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Comisión
                            </Typography>
                            <Typography variant='h6' color='primary'>
                              {formaPagoSeleccionada.comisionPorcentaje}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Días Liquidación
                            </Typography>
                            <Typography variant='h6' color='primary'>
                              {formaPagoSeleccionada.diasLiquidacion}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Límite Máximo
                            </Typography>
                            <Typography variant='body1'>
                              {formaPagoSeleccionada.configuracion.limiteMaximo
                                ? `$${formaPagoSeleccionada.configuracion.limiteMaximo.toLocaleString()}`
                                : 'Sin límite'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Límite Mínimo
                            </Typography>
                            <Typography variant='body1'>
                              {formaPagoSeleccionada.configuracion.limiteMinimo
                                ? `$${formaPagoSeleccionada.configuracion.limiteMinimo.toLocaleString()}`
                                : 'Sin límite'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='h6' gutterBottom>
                          Configuración de Validación
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <FormControlLabel
                              control={<Checkbox checked={formaPagoSeleccionada.requiereValidacion} disabled />}
                              label='Requiere Validación'
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <FormControlLabel
                              control={<Checkbox checked={formaPagoSeleccionada.requiereFolio} disabled />}
                              label='Requiere Folio'
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <FormControlLabel
                              control={
                                <Checkbox checked={formaPagoSeleccionada.configuracion.requiereComprobante} disabled />
                              }
                              label='Requiere Comprobante'
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <FormControlLabel
                              control={
                                <Checkbox checked={formaPagoSeleccionada.configuracion.permiteCambio} disabled />
                              }
                              label='Permite Cambio'
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='h6' gutterBottom>
                          Información de Auditoría
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Creado por
                            </Typography>
                            <Typography variant='body1'>{formaPagoSeleccionada.usuarioCreacion}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Fecha de Creación
                            </Typography>
                            <Typography variant='body1'>
                              {new Date(formaPagoSeleccionada.fechaCreacion).toLocaleDateString('es-MX')}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Modificado por
                            </Typography>
                            <Typography variant='body1'>{formaPagoSeleccionada.usuarioModificacion}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Fecha de Modificación
                            </Typography>
                            <Typography variant='body1'>
                              {new Date(formaPagoSeleccionada.fechaModificacion).toLocaleDateString('es-MX')}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={cerrarDialogo}>Cerrar</Button>
            <Button
              onClick={() => abrirDialogo('editar', formaPagoSeleccionada || undefined)}
              variant='contained'
              startIcon={<EditIcon />}
            >
              Editar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal Confirmar Eliminación Forma de Pago */}
        <Dialog open={dialogoAbierto && tipoDialogo === 'eliminar' && vistaActual === 'formas-pago'} onClose={cerrarDialogo}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color='error' />
              Confirmar Eliminación
            </Box>
          </DialogTitle>
          <DialogContent>
             <DialogContentText>
               ¿Estás seguro de que deseas eliminar la forma de pago &quot;{formaPagoSeleccionada?.nombre}&quot;? Esta acción no se
               puede deshacer.
             </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cerrarDialogo} disabled={deleting}>
              Cancelar
            </Button>
            <Button onClick={eliminarFormaPago} variant='contained' color='error' startIcon={<DeleteIcon />} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
          </>
        )}

        {/* Vista de Tipos */}
        {vistaActual === 'tipos' && (
          <>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant='h6'>Tipos de Formas de Pago ({tiposFormaPagoList.length})</Typography>
                  <Button
                    variant='contained'
                    startIcon={<AddIcon />}
                    onClick={() => abrirDialogoTipo('crear')}
                  >
                    Nuevo Tipo
                  </Button>
                </Box>

                {loading && tiposFormaPagoList.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : tiposFormaPagoList.length === 0 ? (
                  <Typography variant='body1' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                    No hay tipos de formas de pago registrados
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Código</TableCell>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Descripción</TableCell>
                          <TableCell align='center'>Estado</TableCell>
                          <TableCell align='center'>Orden</TableCell>
                          <TableCell align='center'>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tiposFormaPagoList.map(tipo => (
                          <TableRow key={tipo.id} hover>
                            <TableCell>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {tipo.codigo}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{tipo.nombre}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' color='text.secondary'>
                                {tipo.descripcion || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Chip
                                label={tipo.activo ? 'Activo' : 'Inactivo'}
                                color={tipo.activo ? 'success' : 'default'}
                                size='small'
                              />
                            </TableCell>
                            <TableCell align='center'>
                              <Typography variant='body2'>{tipo.orden}</Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title='Editar'>
                                  <IconButton size='small' onClick={() => abrirDialogoTipo('editar', tipo)}>
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title='Eliminar'>
                                  <IconButton size='small' onClick={() => abrirDialogoTipo('eliminar', tipo)} color='error'>
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Modal Crear/Editar Tipo */}
            <Dialog
              open={dialogoAbierto && (tipoDialogo === 'crear' || tipoDialogo === 'editar') && vistaActual === 'tipos'}
              onClose={cerrarDialogoTipo}
              maxWidth='sm'
              fullWidth
            >
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tipoDialogo === 'crear' ? <AddIcon /> : <EditIcon />}
                  {tipoDialogo === 'crear' ? 'Crear Nuevo Tipo' : 'Editar Tipo'}
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Código'
                      value={formularioTipo.codigo || ''}
                      onChange={e => setFormularioTipo(prev => ({ ...prev, codigo: e.target.value }))}
                      required
                      placeholder='Ej: efectivo, terminal, transferencia, etc.'
                      helperText='El código puede ser libre y permitir duplicados'
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Nombre'
                      value={formularioTipo.nombre || ''}
                      onChange={e => setFormularioTipo(prev => ({ ...prev, nombre: e.target.value }))}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label='Descripción'
                      multiline
                      rows={2}
                      value={formularioTipo.descripcion || ''}
                      onChange={e => setFormularioTipo(prev => ({ ...prev, descripcion: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Orden'
                      type='number'
                      value={formularioTipo.orden || 0}
                      onChange={e => setFormularioTipo(prev => ({ ...prev, orden: Number(e.target.value) }))}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formularioTipo.activo || false}
                          onChange={e => setFormularioTipo(prev => ({ ...prev, activo: e.target.checked }))}
                        />
                      }
                      label='Tipo Activo'
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                {error && (
                  <Alert severity='error' sx={{ flex: 1, mr: 2 }}>
                    {error}
                  </Alert>
                )}
                <Button onClick={cerrarDialogoTipo} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={guardarTipoFormaPago} variant='contained' startIcon={<SaveIcon />} disabled={saving}>
                  {saving ? 'Guardando...' : tipoDialogo === 'crear' ? 'Crear' : 'Guardar Cambios'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Modal Confirmar Eliminación Tipo */}
            <Dialog open={dialogoAbierto && tipoDialogo === 'eliminar' && vistaActual === 'tipos'} onClose={cerrarDialogoTipo}>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color='error' />
                  Confirmar Eliminación
                </Box>
              </DialogTitle>
              <DialogContent>
                <DialogContentText>
                  ¿Estás seguro de que deseas eliminar el tipo &quot;{tipoFormaPagoSeleccionado?.nombre}&quot;? Esta acción no se puede deshacer.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={cerrarDialogoTipo} disabled={deleting}>
                  Cancelar
                </Button>
                <Button onClick={eliminarTipoFormaPago} variant='contained' color='error' startIcon={<DeleteIcon />} disabled={deleting}>
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Box>
    </>
  )
}
