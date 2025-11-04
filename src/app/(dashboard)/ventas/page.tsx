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
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  InputAdornment
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
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon
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

interface Pedido {
  id: string
  numeroPedido: string
  cliente: string
  zona: string
  ruta: string
  fechaPedido: string
  horaPedido: string
  estado: 'entregado' | 'pendiente' | 'cancelado' | 'en-proceso'
  cantidadProductos: number
  ventaTotal: number
  tipoServicio: 'pipas' | 'cilindros'
  repartidor: string
  observaciones?: string
}

interface ClienteAnalisis {
  id: string
  nombre: string
  ruta: string
  totalComprasMes: number
  totalComprasAno: number
  totalComprasHistorico: number
  ticketPromedio: number
  frecuenciaCompra: number
  ultimaCompra: string
  productosMasComprados: string[]
  estadoCredito: 'buen-pagador' | 'vencido' | 'critico' | 'bloqueado'
  domicilios: string[]
  pedidos: Pedido[]
}

interface FiltrosPedidos {
  fechaDesde: string
  fechaHasta: string
  cliente: string
  tipoCliente: string
  zona: string
  estado: string
  mostrarTodos: boolean
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

const pedidos: Pedido[] = [
  {
    id: '1',
    numeroPedido: 'PED-001234',
    cliente: 'María González Pérez',
    zona: 'Centro',
    ruta: 'Ruta Centro',
    fechaPedido: '2024-01-25',
    horaPedido: '10:30',
    estado: 'entregado',
    cantidadProductos: 3,
    ventaTotal: 8500,
    tipoServicio: 'pipas',
    repartidor: 'Carlos Mendoza',
    observaciones: 'Entrega exitosa'
  },
  {
    id: '2',
    numeroPedido: 'PED-001235',
    cliente: 'Roberto Hernández García',
    zona: 'Norte',
    ruta: 'Ruta Norte',
    fechaPedido: '2024-01-25',
    horaPedido: '11:15',
    estado: 'pendiente',
    cantidadProductos: 2,
    ventaTotal: 6500,
    tipoServicio: 'cilindros',
    repartidor: 'Ana García',
    observaciones: 'Cliente no disponible'
  },
  {
    id: '3',
    numeroPedido: 'PED-001236',
    cliente: 'Patricia López Silva',
    zona: 'Sur',
    ruta: 'Ruta Sur',
    fechaPedido: '2024-01-25',
    horaPedido: '14:20',
    estado: 'en-proceso',
    cantidadProductos: 4,
    ventaTotal: 12000,
    tipoServicio: 'pipas',
    repartidor: 'Roberto Silva',
    observaciones: 'En ruta'
  },
  {
    id: '4',
    numeroPedido: 'PED-001237',
    cliente: 'Carlos Rodríguez López',
    zona: 'Occidente',
    ruta: 'Ruta Occidente',
    fechaPedido: '2024-01-25',
    horaPedido: '15:45',
    estado: 'cancelado',
    cantidadProductos: 1,
    ventaTotal: 3500,
    tipoServicio: 'cilindros',
    repartidor: 'Miguel López',
    observaciones: 'Cliente canceló pedido'
  },
  {
    id: '5',
    numeroPedido: 'PED-001238',
    cliente: 'Ana Martínez Silva',
    zona: 'Este',
    ruta: 'Ruta Este',
    fechaPedido: '2024-01-25',
    horaPedido: '16:30',
    estado: 'entregado',
    cantidadProductos: 2,
    ventaTotal: 7500,
    tipoServicio: 'cilindros',
    repartidor: 'Ana García',
    observaciones: 'Entrega puntual'
  }
]

const clientesAnalisis: ClienteAnalisis[] = [
  {
    id: '1',
    nombre: 'María González Pérez',
    ruta: 'Ruta Centro',
    totalComprasMes: 25000,
    totalComprasAno: 180000,
    totalComprasHistorico: 450000,
    ticketPromedio: 8500,
    frecuenciaCompra: 15,
    ultimaCompra: '2024-01-25',
    productosMasComprados: ['Gas LP', 'Cilindro 20 KG', 'Cilindro 10 KG'],
    estadoCredito: 'buen-pagador',
    domicilios: ['Av. Insurgentes Sur 123, Col. Roma Norte', 'Calle Reforma 456, Col. Centro'],
    pedidos: pedidos.filter(p => p.cliente === 'María González Pérez')
  },
  {
    id: '2',
    nombre: 'Roberto Hernández García',
    ruta: 'Ruta Norte',
    totalComprasMes: 15000,
    totalComprasAno: 120000,
    totalComprasHistorico: 280000,
    ticketPromedio: 6500,
    frecuenciaCompra: 20,
    ultimaCompra: '2024-01-25',
    productosMasComprados: ['Cilindro 30 KG', 'Gas LP', 'Cilindro 20 KG'],
    estadoCredito: 'vencido',
    domicilios: ['Blvd. López Mateos 789, Col. Del Valle'],
    pedidos: pedidos.filter(p => p.cliente === 'Roberto Hernández García')
  },
  {
    id: '3',
    nombre: 'Patricia López Silva',
    ruta: 'Ruta Sur',
    totalComprasMes: 35000,
    totalComprasAno: 250000,
    totalComprasHistorico: 520000,
    ticketPromedio: 12000,
    frecuenciaCompra: 12,
    ultimaCompra: '2024-01-25',
    productosMasComprados: ['Gas LP', 'Tanque 200 L', 'Cilindro 30 KG'],
    estadoCredito: 'buen-pagador',
    domicilios: ['Calle Morelos 456, Col. Centro', 'Av. Juárez 789, Col. Sur'],
    pedidos: pedidos.filter(p => p.cliente === 'Patricia López Silva')
  }
]

export default function VentasPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'catalogo' | 'pedidos' | 'listado-pedidos' | 'analisis-clientes'>(
    'dashboard'
  )

  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'precios' | 'descuentos' | 'pedido'>('precios')
  const [filtrosPedidos, setFiltrosPedidos] = useState<FiltrosPedidos>({
    fechaDesde: '',
    fechaHasta: '',
    cliente: '',
    tipoCliente: '',
    zona: '',
    estado: '',
    mostrarTodos: false
  })
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteAnalisis | null>(null)

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

  const manejarCambioFiltros = (campo: string, valor: any) => {
    setFiltrosPedidos(prev => ({ ...prev, [campo]: valor }))
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'entregado': return 'success'
      case 'pendiente': return 'warning'
      case 'cancelado': return 'error'
      case 'en-proceso': return 'info'
      default: return 'default'
    }
  }

  const getEstadoCreditoColor = (estado: string) => {
    switch (estado) {
      case 'buen-pagador': return 'success'
      case 'vencido': return 'warning'
      case 'critico': return 'error'
      case 'bloqueado': return 'default'
      default: return 'default'
    }
  }

  const pedidosFiltrados = pedidos.filter(pedido => {
    const cumpleFechaDesde = !filtrosPedidos.fechaDesde || pedido.fechaPedido >= filtrosPedidos.fechaDesde
    const cumpleFechaHasta = !filtrosPedidos.fechaHasta || pedido.fechaPedido <= filtrosPedidos.fechaHasta
    const cumpleCliente = !filtrosPedidos.cliente || pedido.cliente.toLowerCase().includes(filtrosPedidos.cliente.toLowerCase())
    const cumpleZona = !filtrosPedidos.zona || pedido.zona === filtrosPedidos.zona
    const cumpleEstado = !filtrosPedidos.estado || pedido.estado === filtrosPedidos.estado
    const cumpleMostrarTodos = filtrosPedidos.mostrarTodos || pedido.estado !== 'cancelado'
    
    return cumpleFechaDesde && cumpleFechaHasta && cumpleCliente && cumpleZona && cumpleEstado && cumpleMostrarTodos
  })

  const zonasUnicas = [...new Set(pedidos.map(p => p.zona))]
  const rutasUnicas = [...new Set(pedidos.map(p => p.ruta))]

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
          <Button
            variant={vistaActual === 'listado-pedidos' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('listado-pedidos')}
            startIcon={<AssignmentIcon />}
          >
            Listado de Pedidos
          </Button>
          <Button
            variant={vistaActual === 'analisis-clientes' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('analisis-clientes')}
            startIcon={<TrendingUpIcon />}
          >
            Análisis de Clientes
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
                <CardContent sx={{ color: 'white', '& .MuiTypography-root': { color: 'white' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant='h6' gutterBottom sx={{ color: 'white' }}>
                        TOTAL OPERACIÓN
                      </Typography>
                      <Typography variant='h3' sx={{ color: 'white' }}>${granTotalOperacion.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant='h6' gutterBottom sx={{ color: 'white' }}>
                        EFECTIVO CONSOLIDADO
                      </Typography>
                      <Typography variant='h4' sx={{ color: 'white' }}>${efectivoConsolidado.toLocaleString()}</Typography>
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

      {/* Listado Completo de Pedidos/Ventas */}
      {vistaActual === 'listado-pedidos' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Listado Completo de Pedidos/Ventas
          </Typography>

          {/* Filtros Avanzados */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Filtros Avanzados
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label='Fecha Desde'
                    type='date'
                    value={filtrosPedidos.fechaDesde}
                    onChange={(e) => manejarCambioFiltros('fechaDesde', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label='Fecha Hasta'
                    type='date'
                    value={filtrosPedidos.fechaHasta}
                    onChange={(e) => manejarCambioFiltros('fechaHasta', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label='Buscar por Cliente'
                    value={filtrosPedidos.cliente}
                    onChange={(e) => manejarCambioFiltros('cliente', e.target.value)}
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
                    <InputLabel>Zona/Ruta</InputLabel>
                    <Select
                      value={filtrosPedidos.zona}
                      onChange={(e) => manejarCambioFiltros('zona', e.target.value)}
                      label='Zona/Ruta'
                    >
                      <MenuItem value=''>Todas las zonas</MenuItem>
                      {zonasUnicas.map((zona) => (
                        <MenuItem key={zona} value={zona}>
                          {zona}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={filtrosPedidos.estado}
                      onChange={(e) => manejarCambioFiltros('estado', e.target.value)}
                      label='Estado'
                    >
                      <MenuItem value=''>Todos los estados</MenuItem>
                      <MenuItem value='entregado'>Entregado</MenuItem>
                      <MenuItem value='pendiente'>Pendiente</MenuItem>
                      <MenuItem value='en-proceso'>En Proceso</MenuItem>
                      <MenuItem value='cancelado'>Cancelado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filtrosPedidos.mostrarTodos}
                        onChange={(e) => manejarCambioFiltros('mostrarTodos', e.target.checked)}
                      />
                    }
                    label='Mostrar todos los pedidos'
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant='contained' startIcon={<SearchIcon />}>
                      Buscar
                    </Button>
                    <Button variant='outlined' onClick={() => setFiltrosPedidos({
                      fechaDesde: '',
                      fechaHasta: '',
                      cliente: '',
                      tipoCliente: '',
                      zona: '',
                      estado: '',
                      mostrarTodos: false
                    })}>
                      Limpiar
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabla de Pedidos */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant='h6'>
                  Pedidos ({pedidosFiltrados.length})
                </Typography>
                <Button variant='outlined' startIcon={<DownloadIcon />}>
                  Exportar Datos
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID del Pedido</TableCell>
                      <TableCell>Zona/Ruta</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fecha y Hora</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                      <TableCell align='right'>Cantidad</TableCell>
                      <TableCell align='right'>Venta Total</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pedidosFiltrados.map((pedido) => (
                      <TableRow key={pedido.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pedido.numeroPedido}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant='body2'>{pedido.zona}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {pedido.ruta}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pedido.cliente}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant='body2'>
                              {new Date(pedido.fechaPedido).toLocaleDateString('es-MX')}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {pedido.horaPedido}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={pedido.estado.replace('-', ' ').toUpperCase()}
                            color={getEstadoColor(pedido.estado) as any}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>
                            {pedido.cantidadProductos} productos
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${pedido.ventaTotal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='Ver detalles'>
                              <IconButton size='small'>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Ver cliente'>
                              <IconButton 
                                size='small'
                                onClick={() => {
                                  const cliente = clientesAnalisis.find(c => c.nombre === pedido.cliente)
                                  if (cliente) {
                                    setClienteSeleccionado(cliente)
                                    setVistaActual('analisis-clientes')
                                  }
                                }}
                              >
                                <PersonIcon />
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
        </Box>
      )}

      {/* Análisis de Clientes y Ventas */}
      {vistaActual === 'analisis-clientes' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Análisis de Clientes y Ventas
          </Typography>

          {/* Panel Superior con Métricas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Top 10 Mejores Clientes del Mes
                  </Typography>
                  <List>
                    {clientesAnalisis
                      .sort((a, b) => b.totalComprasMes - a.totalComprasMes)
                      .slice(0, 3)
                      .map((cliente, index) => (
                        <ListItem key={cliente.id}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={cliente.nombre}
                            secondary={`$${cliente.totalComprasMes.toLocaleString()}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Top 10 Mejores Clientes del Año
                  </Typography>
                  <List>
                    {clientesAnalisis
                      .sort((a, b) => b.totalComprasAno - a.totalComprasAno)
                      .slice(0, 3)
                      .map((cliente, index) => (
                        <ListItem key={cliente.id}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'success.main' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={cliente.nombre}
                            secondary={`$${cliente.totalComprasAno.toLocaleString()}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Clientes Frecuentes
                  </Typography>
                  <Typography variant='h4' color='primary'>
                    {clientesAnalisis.filter(c => c.frecuenciaCompra <= 15).length}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Compran cada 15 días o menos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Ticket Promedio
                  </Typography>
                  <Typography variant='h4' color='primary'>
                    ${Math.round(clientesAnalisis.reduce((sum, c) => sum + c.ticketPromedio, 0) / clientesAnalisis.length).toLocaleString()}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Por cliente
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Clientes Nuevos vs Recurrentes
                  </Typography>
                  <Typography variant='h4' color='success.main'>
                    {clientesAnalisis.filter(c => c.totalComprasHistorico < 100000).length}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Nuevos este año
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Lista de Clientes */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Lista de Clientes para Análisis
              </Typography>
              
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell align='right'>Total Mes</TableCell>
                      <TableCell align='right'>Total Año</TableCell>
                      <TableCell align='right'>Ticket Promedio</TableCell>
                      <TableCell align='right'>Frecuencia</TableCell>
                      <TableCell>Estado Crédito</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientesAnalisis.map((cliente) => (
                      <TableRow key={cliente.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {cliente.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={cliente.ruta} size='small' variant='outlined' />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${cliente.totalComprasMes.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${cliente.totalComprasAno.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>
                            ${cliente.ticketPromedio.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>
                            {cliente.frecuenciaCompra} días
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cliente.estadoCredito.replace('-', ' ').toUpperCase()}
                            color={getEstadoCreditoColor(cliente.estadoCredito) as any}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={() => setClienteSeleccionado(cliente)}
                            startIcon={<VisibilityIcon />}
                          >
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Vista Detallada del Cliente */}
          {clienteSeleccionado && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 50, height: 50 }}>
                      {clienteSeleccionado.nombre.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant='h6'>
                        {clienteSeleccionado.nombre}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {clienteSeleccionado.ruta}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setClienteSeleccionado(null)}>
                    ×
                  </IconButton>
                </Box>

                {/* Resumen Financiero */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={3}>
                    <Typography variant='body2' color='text.secondary'>
                      Total Histórico
                    </Typography>
                    <Typography variant='h6' color='primary'>
                      ${clienteSeleccionado.totalComprasHistorico.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant='body2' color='text.secondary'>
                      Total Este Mes
                    </Typography>
                    <Typography variant='h6' color='primary'>
                      ${clienteSeleccionado.totalComprasMes.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant='body2' color='text.secondary'>
                      Total Este Año
                    </Typography>
                    <Typography variant='h6' color='primary'>
                      ${clienteSeleccionado.totalComprasAno.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant='body2' color='text.secondary'>
                      Promedio de Compra
                    </Typography>
                    <Typography variant='h6' color='primary'>
                      ${clienteSeleccionado.ticketPromedio.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Historial de Compras */}
                <Typography variant='h6' gutterBottom>
                  Historial de Compras
                </Typography>
                
                <TableContainer component={Paper} variant='outlined'>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Número de Pedido</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align='right'>Monto</TableCell>
                        <TableCell>Observaciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clienteSeleccionado.pedidos.map((pedido) => (
                        <TableRow key={pedido.id}>
                          <TableCell>
                            <Typography variant='subtitle2' fontWeight='bold'>
                              {pedido.numeroPedido}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {new Date(pedido.fechaPedido).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={pedido.estado.replace('-', ' ').toUpperCase()}
                              color={getEstadoColor(pedido.estado) as any}
                              size='small'
                            />
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='h6' color='primary'>
                              ${pedido.ventaTotal.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' color='text.secondary'>
                              {pedido.observaciones}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Productos Más Comprados */}
                <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                  Productos Más Comprados
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {clienteSeleccionado.productosMasComprados.map((producto, index) => (
                    <Chip
                      key={index}
                      label={producto}
                      color={index === 0 ? 'primary' : 'default'}
                      variant={index === 0 ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>

                {/* Domicilios */}
                <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
                  Domicilios de Servicio
                </Typography>
                <List>
                  {clienteSeleccionado.domicilios.map((domicilio, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <LocationOnIcon />
                      </ListItemIcon>
                      <ListItemText primary={domicilio} />
                    </ListItem>
                  ))}
                </List>

                {/* Botones de Acción */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant='contained'
                    startIcon={<AddIcon />}
                    onClick={() => {
                      // Lógica para crear pedido para este cliente
                      setVistaActual('pedidos')
                    }}
                  >
                    Crear Pedido
                  </Button>
                  <Button
                    variant='outlined'
                    startIcon={<DownloadIcon />}
                  >
                    Generar Reporte
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
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

