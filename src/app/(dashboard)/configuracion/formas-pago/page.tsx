'use client'

import React, { useState } from 'react'

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
  DialogContentText
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

// Tipos de datos
interface FormaPago {
  id: string
  nombre: string
  tipo: 'efectivo' | 'terminal' | 'transferencia' | 'cheque' | 'deposito' | 'credito'
  descripcion: string
  activa: boolean
  requiereValidacion: boolean
  requiereFolio: boolean
  comisionPorcentaje: number
  diasLiquidacion: number
  bancoAsociado?: string
  configuracion: {
    requiereComprobante: boolean
    permiteCambio: boolean
    limiteMaximo?: number
    limiteMinimo?: number
  }
  fechaCreacion: string
  fechaModificacion: string
  usuarioCreacion: string
  usuarioModificacion: string
}

// Datos de ejemplo
const formasPago: FormaPago[] = [
  {
    id: '1',
    nombre: 'Efectivo',
    tipo: 'efectivo',
    descripcion: 'Pago en efectivo al momento de la entrega',
    activa: true,
    requiereValidacion: false,
    requiereFolio: false,
    comisionPorcentaje: 0,
    diasLiquidacion: 0,
    configuracion: {
      requiereComprobante: false,
      permiteCambio: true,
      limiteMaximo: 50000,
      limiteMinimo: 1
    },
    fechaCreacion: '2024-01-01',
    fechaModificacion: '2024-01-01',
    usuarioCreacion: 'Admin Sistema',
    usuarioModificacion: 'Admin Sistema'
  },
  {
    id: '2',
    nombre: 'Terminal de Pago',
    tipo: 'terminal',
    descripcion: 'Pago con tarjeta de débito o crédito mediante terminal',
    activa: true,
    requiereValidacion: true,
    requiereFolio: true,
    comisionPorcentaje: 2.5,
    diasLiquidacion: 1,
    configuracion: {
      requiereComprobante: true,
      permiteCambio: false,
      limiteMaximo: 100000,
      limiteMinimo: 10
    },
    fechaCreacion: '2024-01-01',
    fechaModificacion: '2024-01-15',
    usuarioCreacion: 'Admin Sistema',
    usuarioModificacion: 'Gerente Ventas'
  },
  {
    id: '3',
    nombre: 'Transferencia Bancaria',
    tipo: 'transferencia',
    descripcion: 'Transferencia bancaria SPEI o interbancaria',
    activa: true,
    requiereValidacion: true,
    requiereFolio: true,
    comisionPorcentaje: 0,
    diasLiquidacion: 1,
    bancoAsociado: 'BBVA',
    configuracion: {
      requiereComprobante: true,
      permiteCambio: false,
      limiteMaximo: 200000,
      limiteMinimo: 100
    },
    fechaCreacion: '2024-01-01',
    fechaModificacion: '2024-01-20',
    usuarioCreacion: 'Admin Sistema',
    usuarioModificacion: 'Admin Sistema'
  },
  {
    id: '4',
    nombre: 'Cheque',
    tipo: 'cheque',
    descripcion: 'Pago mediante cheque bancario',
    activa: true,
    requiereValidacion: true,
    requiereFolio: true,
    comisionPorcentaje: 0,
    diasLiquidacion: 3,
    configuracion: {
      requiereComprobante: true,
      permiteCambio: false,
      limiteMaximo: 500000,
      limiteMinimo: 1000
    },
    fechaCreacion: '2024-01-01',
    fechaModificacion: '2024-01-10',
    usuarioCreacion: 'Admin Sistema',
    usuarioModificacion: 'Admin Sistema'
  },
  {
    id: '5',
    nombre: 'Depósito Bancario',
    tipo: 'deposito',
    descripcion: 'Depósito directo en cuenta bancaria',
    activa: true,
    requiereValidacion: true,
    requiereFolio: true,
    comisionPorcentaje: 0,
    diasLiquidacion: 1,
    bancoAsociado: 'Santander',
    configuracion: {
      requiereComprobante: true,
      permiteCambio: false,
      limiteMaximo: 300000,
      limiteMinimo: 50
    },
    fechaCreacion: '2024-01-01',
    fechaModificacion: '2024-01-05',
    usuarioCreacion: 'Admin Sistema',
    usuarioModificacion: 'Admin Sistema'
  },
  {
    id: '6',
    nombre: 'Crédito',
    tipo: 'credito',
    descripcion: 'Pago a crédito según límite autorizado',
    activa: true,
    requiereValidacion: false,
    requiereFolio: false,
    comisionPorcentaje: 0,
    diasLiquidacion: 30,
    configuracion: {
      requiereComprobante: false,
      permiteCambio: true,
      limiteMaximo: 1000000,
      limiteMinimo: 100
    },
    fechaCreacion: '2024-01-01',
    fechaModificacion: '2024-01-01',
    usuarioCreacion: 'Admin Sistema',
    usuarioModificacion: 'Admin Sistema'
  }
]

export default function ConfiguracionFormasPagoPage() {
  const [formasPagoList, setFormasPagoList] = useState<FormaPago[]>(formasPago)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'crear' | 'editar' | 'eliminar' | 'ver'>('crear')
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<FormaPago | null>(null)
  const [formulario, setFormulario] = useState<Partial<FormaPago>>({})

  const [filtros, setFiltros] = useState({
    nombre: '',
    tipo: '',
    activa: ''
  })

  const abrirDialogo = (tipo: 'crear' | 'editar' | 'eliminar' | 'ver', formaPago?: FormaPago) => {
    setTipoDialogo(tipo)
    setFormaPagoSeleccionada(formaPago || null)

    if (tipo === 'crear') {
      setFormulario({
        activa: true,
        requiereValidacion: false,
        requiereFolio: false,
        comisionPorcentaje: 0,
        diasLiquidacion: 0,
        configuracion: {
          requiereComprobante: false,
          permiteCambio: true
        },
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaModificacion: new Date().toISOString().split('T')[0],
        usuarioCreacion: 'Usuario Actual',
        usuarioModificacion: 'Usuario Actual'
      })
    } else if (tipo === 'editar' && formaPago) {
      setFormulario({ ...formaPago })
    }

    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setFormaPagoSeleccionada(null)
    setFormulario({})
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

  const guardarFormaPago = () => {
    if (tipoDialogo === 'crear') {
      const nuevaFormaPago: FormaPago = {
        id: Date.now().toString(),
        ...(formulario as FormaPago)
      }

      setFormasPagoList(prev => [...prev, nuevaFormaPago])
    } else if (tipoDialogo === 'editar' && formaPagoSeleccionada) {
      setFormasPagoList(prev =>
        prev.map(fp =>
          fp.id === formaPagoSeleccionada.id
            ? {
                ...fp,
                ...formulario,
                fechaModificacion: new Date().toISOString().split('T')[0],
                usuarioModificacion: 'Usuario Actual'
              }
            : fp
        )
      )
    }

    cerrarDialogo()
  }

  const eliminarFormaPago = () => {
    if (formaPagoSeleccionada) {
      setFormasPagoList(prev => prev.filter(fp => fp.id !== formaPagoSeleccionada.id))
    }

    cerrarDialogo()
  }

  const manejarCambioFiltros = (campo: string, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
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

  const formasPagoFiltradas = formasPagoList.filter(fp => {
    const cumpleNombre = !filtros.nombre || fp.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
    const cumpleTipo = !filtros.tipo || fp.tipo === filtros.tipo
    const cumpleActiva =
      !filtros.activa || (filtros.activa === 'activa' && fp.activa) || (filtros.activa === 'inactiva' && !fp.activa)

    return cumpleNombre && cumpleTipo && cumpleActiva
  })

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
                    {tiposFormaPago.map(tipo => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
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
                  <IconButton onClick={() => window.location.reload()}>
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

            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Forma de Pago</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descripción</TableCell>
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
          </CardContent>
        </Card>

        {/* Modal Crear/Editar Forma de Pago */}
        <Dialog
          open={dialogoAbierto && (tipoDialogo === 'crear' || tipoDialogo === 'editar')}
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
                    {tiposFormaPago.map(tipo => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </Select>
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
                  onChange={e => manejarCambioConfiguracion('limiteMaximo', Number(e.target.value))}
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
                  onChange={e => manejarCambioConfiguracion('limiteMinimo', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                  placeholder='Sin límite'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={cerrarDialogo}>Cancelar</Button>
            <Button onClick={guardarFormaPago} variant='contained' startIcon={<SaveIcon />}>
              {tipoDialogo === 'crear' ? 'Crear' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal Ver Detalles */}
        <Dialog open={dialogoAbierto && tipoDialogo === 'ver'} onClose={cerrarDialogo} maxWidth='md' fullWidth>
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

        {/* Modal Confirmar Eliminación */}
        <Dialog open={dialogoAbierto && tipoDialogo === 'eliminar'} onClose={cerrarDialogo}>
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
            <Button onClick={cerrarDialogo}>Cancelar</Button>
            <Button onClick={eliminarFormaPago} variant='contained' color='error' startIcon={<DeleteIcon />}>
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  )
}
