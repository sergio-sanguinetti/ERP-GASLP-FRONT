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
  Alert,
  AlertTitle,
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
  LinearProgress
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as LocalShippingIcon,
  GasMeter as GasMeterIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

// Tipos de datos
interface ResumenVentas {
  ventasHoy: number
  crecimientoPorcentaje: number
  pedidosCreados: number
  pedidosEntregados: number
  alertasCriticas: number
}

interface CortePipas {
  rutasProgramadas: number
  cortesEntregados: number
  cortesValidados: number
  cortesPendientes: number
  totalVentas: number
  totalServicios: number
  totalAbonos: number
}

interface CorteCilindros {
  rutasProgramadas: number
  cortesEntregados: number
  cortesValidados: number
  cortesPendientes: number
  totalVentas: number
  totalServicios: number
  totalAbonos: number
}

interface Producto {
  id: string
  nombre: string
  categoria: 'gas-lp' | 'cilindros' | 'tanques-nuevos'
  precio: number
  unidad: string
  descripcion: string
}

interface Repartidor {
  id: string
  nombre: string
  tipo: 'pipas' | 'cilindros'
  descuentoAutorizado: number
  estado: 'activo' | 'inactivo'
}

// Datos de ejemplo
const resumenVentas: ResumenVentas = {
  ventasHoy: 125000,
  crecimientoPorcentaje: 12.5,
  pedidosCreados: 45,
  pedidosEntregados: 38,
  alertasCriticas: 3
}

const cortePipas: CortePipas = {
  rutasProgramadas: 8,
  cortesEntregados: 6,
  cortesValidados: 5,
  cortesPendientes: 1,
  totalVentas: 85000,
  totalServicios: 32,
  totalAbonos: 12000
}

const corteCilindros: CorteCilindros = {
  rutasProgramadas: 12,
  cortesEntregados: 10,
  cortesValidados: 9,
  cortesPendientes: 1,
  totalVentas: 40000,
  totalServicios: 28,
  totalAbonos: 8000
}

const productos: Producto[] = [
  { id: '1', nombre: 'Gas LP', categoria: 'gas-lp', precio: 18.5, unidad: 'litro', descripcion: 'Precio por litro' },
  {
    id: '2',
    nombre: 'Cilindro 10 KG',
    categoria: 'cilindros',
    precio: 185,
    unidad: 'recarga',
    descripcion: 'Cilindro de 10 KG'
  },
  {
    id: '3',
    nombre: 'Cilindro 20 KG',
    categoria: 'cilindros',
    precio: 370,
    unidad: 'recarga',
    descripcion: 'Cilindro de 20 KG'
  },
  {
    id: '4',
    nombre: 'Cilindro 30 KG',
    categoria: 'cilindros',
    precio: 555,
    unidad: 'recarga',
    descripcion: 'Cilindro de 30 KG'
  },
  {
    id: '5',
    nombre: 'Tanque 100 L',
    categoria: 'tanques-nuevos',
    precio: 2500,
    unidad: 'pieza',
    descripcion: 'Tanque nuevo 100 litros'
  },
  {
    id: '6',
    nombre: 'Tanque 200 L',
    categoria: 'tanques-nuevos',
    precio: 4500,
    unidad: 'pieza',
    descripcion: 'Tanque nuevo 200 litros'
  },
  {
    id: '7',
    nombre: 'Tanque 500 L',
    categoria: 'tanques-nuevos',
    precio: 8500,
    unidad: 'pieza',
    descripcion: 'Tanque nuevo 500 litros'
  }
]

const repartidores: Repartidor[] = [
  { id: '1', nombre: 'Carlos Mendoza', tipo: 'pipas', descuentoAutorizado: 0.5, estado: 'activo' },
  { id: '2', nombre: 'Roberto Silva', tipo: 'pipas', descuentoAutorizado: 0.25, estado: 'activo' },
  { id: '3', nombre: 'Ana García', tipo: 'cilindros', descuentoAutorizado: 5.0, estado: 'activo' },
  { id: '4', nombre: 'Miguel López', tipo: 'cilindros', descuentoAutorizado: 0, estado: 'activo' },
  { id: '5', nombre: 'Patricia Ruiz', tipo: 'pipas', descuentoAutorizado: 0.75, estado: 'activo' }
]

export default function VentasPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'catalogo' | 'pedidos' | 'reportes' | 'directivos'>(
    'dashboard'
  )

  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'precios' | 'descuentos' | 'pedido'>('precios')

  const [formularioPedido, setFormularioPedido] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    tipoServicio: 'pipas',
    horario: '',
    prioridad: 'normal',
    repartidor: ''
  })

  const abrirDialogo = (tipo: 'precios' | 'descuentos' | 'pedido') => {
    setTipoDialogo(tipo)
    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setFormularioPedido({
      nombre: '',
      telefono: '',
      direccion: '',
      tipoServicio: 'pipas',
      horario: '',
      prioridad: 'normal',
      repartidor: ''
    })
  }

  const manejarCambioFormulario = (campo: string, valor: any) => {
    setFormularioPedido(prev => ({ ...prev, [campo]: valor }))
  }

  const crearPedido = () => {
    // Lógica para crear pedido
    console.log('Creando pedido:', formularioPedido)
    cerrarDialogo()
  }

  const granTotalOperacion = cortePipas.totalVentas + corteCilindros.totalVentas
  const efectivoConsolidado = cortePipas.totalAbonos + corteCilindros.totalAbonos

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Sistema de Ventas
      </Typography>

      {/* Navegación */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={vistaActual === 'dashboard' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('dashboard')}
            startIcon={<AssessmentIcon />}
          >
            Dashboard
          </Button>
          <Button
            variant={vistaActual === 'catalogo' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('catalogo')}
            startIcon={<GasMeterIcon />}
          >
            Catálogo y Precios
          </Button>
          <Button
            variant={vistaActual === 'pedidos' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('pedidos')}
            startIcon={<AddIcon />}
          >
            Crear Pedidos
          </Button>
          {/* <Button
            variant={vistaActual === 'reportes' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('reportes')}
            startIcon={<AssignmentIcon />}
          >
            Reportes
          </Button> */}
          <Button
            variant={vistaActual === 'directivos' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('directivos')}
            startIcon={<TrendingUpIcon />}
          >
            Vista Directivos
          </Button>
        </Box>
      </Box>

      {/* Dashboard Principal */}
      {vistaActual === 'dashboard' && (
        <Box>
          {/* Tarjetas Dinámicas de Resumen */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        VENTAS HOY
                      </Typography>
                      <Typography variant='h4' component='div'>
                        ${resumenVentas.ventasHoy.toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {resumenVentas.crecimientoPorcentaje > 0 ? (
                          <TrendingUpIcon color='success' fontSize='small' />
                        ) : (
                          <TrendingDownIcon color='error' fontSize='small' />
                        )}
                        <Typography
                          variant='body2'
                          color={resumenVentas.crecimientoPorcentaje > 0 ? 'success.main' : 'error.main'}
                          sx={{ ml: 0.5 }}
                        >
                          {resumenVentas.crecimientoPorcentaje > 0 ? '+' : ''}
                          {resumenVentas.crecimientoPorcentaje}%
                        </Typography>
                      </Box>
                    </Box>
                    <AttachMoneyIcon color='primary' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        PEDIDOS
                      </Typography>
                      <Typography variant='h4' component='div'>
                        {resumenVentas.pedidosCreados}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {resumenVentas.pedidosEntregados} entregados
                      </Typography>
                    </Box>
                    <ScheduleIcon color='primary' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        ALERTAS
                      </Typography>
                      <Typography variant='h4' component='div' color='warning.main'>
                        {resumenVentas.alertasCriticas}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Críticas
                      </Typography>
                    </Box>
                    <WarningIcon color='warning' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        EFECTIVO
                      </Typography>
                      <Typography variant='h4' component='div' color='success.main'>
                        ${efectivoConsolidado.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Consolidado
                      </Typography>
                    </Box>
                    <AttachMoneyIcon color='success' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Vista Consolidada de Cortes */}
          <Grid container spacing={3}>
            {/* Repartidores Pipas */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocalShippingIcon color='primary' sx={{ mr: 1 }} />
                    <Typography variant='h6'>REPARTIDORES PIPAS</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Rutas Programadas
                      </Typography>
                      <Typography variant='h6'>{cortePipas.rutasProgramadas}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Entregados
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        {cortePipas.cortesEntregados}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Validados
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        {cortePipas.cortesValidados}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Pendientes
                      </Typography>
                      <Typography variant='h6' color='warning.main'>
                        {cortePipas.cortesPendientes}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Ventas
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        ${cortePipas.totalVentas.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Servicios
                      </Typography>
                      <Typography variant='h6'>{cortePipas.totalServicios}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Abonos
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        ${cortePipas.totalAbonos.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Repartidores Cilindros */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GasMeterIcon color='secondary' sx={{ mr: 1 }} />
                    <Typography variant='h6'>REPARTIDORES CILINDROS</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Rutas Programadas
                      </Typography>
                      <Typography variant='h6'>{corteCilindros.rutasProgramadas}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Entregados
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        {corteCilindros.cortesEntregados}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Validados
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        {corteCilindros.cortesValidados}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Pendientes
                      </Typography>
                      <Typography variant='h6' color='warning.main'>
                        {corteCilindros.cortesPendientes}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Ventas
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        ${corteCilindros.totalVentas.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Servicios
                      </Typography>
                      <Typography variant='h6'>{corteCilindros.totalServicios}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Abonos
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        ${corteCilindros.totalAbonos.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Gran Total Operación */}
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant='h6' gutterBottom>
                        TOTAL OPERACIÓN
                      </Typography>
                      <Typography variant='h3'>${granTotalOperacion.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant='h6' gutterBottom>
                        EFECTIVO CONSOLIDADO
                      </Typography>
                      <Typography variant='h4'>${efectivoConsolidado.toLocaleString()}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Alertas Críticas */}
          {/* <Box sx={{ mt: 3 }}>
            <Alert severity="warning">
              <AlertTitle>Alertas Críticas</AlertTitle>
              <Typography variant="body2">
                • Cliente "María González" con cartera vencida de $15,000
              </Typography>
              <Typography variant="body2">
                • Ruta Norte con retraso de 2 horas
              </Typography>
              <Typography variant="body2">
                • Stock bajo en cilindros de 20 KG
              </Typography>
            </Alert>
          </Box> */}
        </Box>
      )}

      {/* Gestión de Catálogo, Precios y Descuentos */}
      {vistaActual === 'catalogo' && (
        <Box>
          <Grid container spacing={3}>
            {/* Catálogo de Productos */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Catálogo de Productos
                  </Typography>

                  {/* Gas LP */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant='h6' color='primary' gutterBottom>
                      GAS LP
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align='right'>Precio</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell align='center'>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productos
                            .filter(p => p.categoria === 'gas-lp')
                            .map(producto => (
                              <TableRow key={producto.id}>
                                <TableCell>
                                  <Typography variant='subtitle2'>{producto.nombre}</Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    {producto.descripcion}
                                  </Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='h6' color='primary'>
                                    ${producto.precio}
                                  </Typography>
                                </TableCell>
                                <TableCell>{producto.unidad}</TableCell>
                                <TableCell align='center'>
                                  <Tooltip title='Editar precio'>
                                    <IconButton size='small' onClick={() => abrirDialogo('precios')}>
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Cilindros */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant='h6' color='secondary' gutterBottom>
                      CILINDROS
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align='right'>Precio</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell align='center'>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productos
                            .filter(p => p.categoria === 'cilindros')
                            .map(producto => (
                              <TableRow key={producto.id}>
                                <TableCell>
                                  <Typography variant='subtitle2'>{producto.nombre}</Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    {producto.descripcion}
                                  </Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='h6' color='primary'>
                                    ${producto.precio}
                                  </Typography>
                                </TableCell>
                                <TableCell>{producto.unidad}</TableCell>
                                <TableCell align='center'>
                                  <Tooltip title='Editar precio'>
                                    <IconButton size='small' onClick={() => abrirDialogo('precios')}>
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Tanques Nuevos */}
                  <Box>
                    <Typography variant='h6' color='success.main' gutterBottom>
                      TANQUES NUEVOS
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align='right'>Precio</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell align='center'>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productos
                            .filter(p => p.categoria === 'tanques-nuevos')
                            .map(producto => (
                              <TableRow key={producto.id}>
                                <TableCell>
                                  <Typography variant='subtitle2'>{producto.nombre}</Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    {producto.descripcion}
                                  </Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='h6' color='primary'>
                                    ${producto.precio.toLocaleString()}
                                  </Typography>
                                </TableCell>
                                <TableCell>{producto.unidad}</TableCell>
                                <TableCell align='center'>
                                  <Tooltip title='Editar precio'>
                                    <IconButton size='small' onClick={() => abrirDialogo('precios')}>
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Panel de Actualización de Precios */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Actualización de Precios
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label='Precio por Litro Gas LP'
                      type='number'
                      defaultValue='18.50'
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label='Precio por KG'
                      type='number'
                      defaultValue='18.50'
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                      }}
                    />
                    <Typography variant='caption' color='text.secondary'>
                      Calcula automáticamente precios de cilindros
                    </Typography>
                  </Box>

                  <Button variant='contained' fullWidth startIcon={<EditIcon />}>
                    Actualizar Precios
                  </Button>
                </CardContent>
              </Card>

              {/* Gestión de Descuentos */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Gestión de Descuentos por Repartidor
                  </Typography>

                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Repartidor</TableCell>
                          <TableCell align='right'>Descuento</TableCell>
                          <TableCell align='center'>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {repartidores.map(repartidor => (
                          <TableRow key={repartidor.id}>
                            <TableCell>
                              <Typography variant='subtitle2'>{repartidor.nombre}</Typography>
                              <Chip
                                label={repartidor.tipo}
                                size='small'
                                color={repartidor.tipo === 'pipas' ? 'primary' : 'secondary'}
                              />
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='h6' color='success.main'>
                                ${repartidor.descuentoAutorizado}
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Tooltip title='Gestionar descuentos'>
                                <IconButton size='small' onClick={() => abrirDialogo('descuentos')}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Creación de Pedidos */}
      {vistaActual === 'pedidos' && (
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant='h6'>Crear Nuevo Pedido desde Oficina</Typography>
                <Button variant='contained' startIcon={<AddIcon />} onClick={() => abrirDialogo('pedido')}>
                  Nuevo Pedido
                </Button>
              </Box>

              <Alert severity='info'>
                <Typography variant='body2'>
                  Utiliza el botón "Nuevo Pedido" para crear pedidos básicos con información del cliente, tipo de
                  servicio, horario preferido y asignación de repartidor.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Reportes */}
      {vistaActual === 'reportes' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Reportes y Vistas Detalladas
          </Typography>

          <Grid container spacing={3}>
            {[
              { titulo: 'Ventas por Repartidor', icono: <LocalShippingIcon />, color: 'primary' },
              { titulo: 'Casos con Problemas de Medición', icono: <WarningIcon />, color: 'warning' },
              { titulo: 'Fotos de Evidencia por Venta', icono: <VisibilityIcon />, color: 'info' },
              { titulo: 'Análisis de Descuentos Aplicados', icono: <AttachMoneyIcon />, color: 'success' },
              { titulo: 'Corte Diario Completo', icono: <AssessmentIcon />, color: 'primary' },
              { titulo: 'Lista de Clientes Perdidos', icono: <TrendingDownIcon />, color: 'error' }
            ].map((reporte, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%', cursor: 'pointer' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: `${reporte.color}.main`, mb: 2 }}>{reporte.icono}</Box>
                    <Typography variant='h6' gutterBottom>
                      {reporte.titulo}
                    </Typography>
                    <Button variant='outlined' startIcon={<DownloadIcon />}>
                      Generar Reporte
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Vista para Directivos */}
      {vistaActual === 'directivos' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Dashboard Ejecutivo Simplificado
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Indicadores Clave
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant='h4' color='primary'>
                        ${resumenVentas.ventasHoy.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Ventas del Día
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon color='success' />
                        <Typography variant='h6' color='success.main' sx={{ ml: 1 }}>
                          +{resumenVentas.crecimientoPorcentaje}%
                        </Typography>
                      </Box>
                      <Typography variant='body2' color='text.secondary'>
                        vs día anterior
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Alertas Críticas
                  </Typography>
                  <Alert severity='warning' sx={{ mb: 2 }}>
                    <Typography variant='body2'>• Cartera vencida: $15,000</Typography>
                  </Alert>
                  <Alert severity='error' sx={{ mb: 2 }}>
                    <Typography variant='body2'>• Cliente importante sin comprar: 3 días</Typography>
                  </Alert>
                  <Alert severity='info'>
                    <Typography variant='body2'>• Stock bajo en productos clave</Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Modal Crear Pedido */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'pedido'} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon />
            Crear Nuevo Pedido
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Nombre del Cliente'
                value={formularioPedido.nombre}
                onChange={e => manejarCambioFormulario('nombre', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Teléfono'
                value={formularioPedido.telefono}
                onChange={e => manejarCambioFormulario('telefono', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Dirección'
                multiline
                rows={2}
                value={formularioPedido.direccion}
                onChange={e => manejarCambioFormulario('direccion', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Servicio</InputLabel>
                <Select
                  value={formularioPedido.tipoServicio}
                  onChange={e => manejarCambioFormulario('tipoServicio', e.target.value)}
                  label='Tipo de Servicio'
                >
                  <MenuItem value='pipas'>PIPA</MenuItem>
                  <MenuItem value='cilindros'>CILINDROS</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Horario Preferido'
                type='time'
                value={formularioPedido.horario}
                onChange={e => manejarCambioFormulario('horario', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formularioPedido.prioridad}
                  onChange={e => manejarCambioFormulario('prioridad', e.target.value)}
                  label='Prioridad'
                >
                  <MenuItem value='normal'>Normal</MenuItem>
                  <MenuItem value='urgente'>Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Asignar a Repartidor</InputLabel>
                <Select
                  value={formularioPedido.repartidor}
                  onChange={e => manejarCambioFormulario('repartidor', e.target.value)}
                  label='Asignar a Repartidor'
                >
                  {repartidores
                    .filter(r => r.estado === 'activo')
                    .map(repartidor => (
                      <MenuItem key={repartidor.id} value={repartidor.id}>
                        {repartidor.nombre} - {repartidor.tipo}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button onClick={crearPedido} variant='contained' startIcon={<AddIcon />}>
            Crear Pedido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
