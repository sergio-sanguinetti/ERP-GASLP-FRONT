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
  Badge,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material'
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Block as BlockIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  CreditCard as CreditCardIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  Close as CloseIcon
} from '@mui/icons-material'

// Tipos de datos
interface ClienteCredito {
  id: string
  nombre: string
  direccion: string
  telefono: string
  ruta: string
  limiteCredito: number
  saldoActual: number
  creditoDisponible: number
  diasPromedioPago: number
  estado: 'buen-pagador' | 'vencido' | 'critico' | 'bloqueado'
  notasPendientes: NotaCredito[]
}

interface NotaCredito {
  id: string
  numeroNota: string
  fechaVenta: string
  fechaVencimiento: string
  importe: number
  diasVencimiento: number
  estado: 'vigente' | 'por-vencer' | 'vencida'
}

interface ResumenCredito {
  carteraTotal: number
  notasPendientes: number
  carteraVencida: number
  notasVencidas: number
  porcentajeVencida: number
  carteraPorVencer: number
  notasPorVencer: number
  porcentajePorVencer: number
}

interface AlertaCredito {
  id: string
  tipo: 'critica' | 'importante' | 'automatica'
  titulo: string
  descripcion: string
  fecha: string
  cliente?: string
  monto?: number
  diasVencimiento?: number
}

interface HistorialLimite {
  id: string
  cliente: string
  usuario: string
  fecha: string
  limiteAnterior: number
  limiteNuevo: number
  motivo: string
}

interface FormaPago {
  id: string
  metodo: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque'
  monto: number
  referencia?: string
  banco?: string
}

interface Pago {
  id: string
  clienteId: string
  clienteNombre: string
  notaId?: string
  numeroNota?: string
  montoTotal: number
  formasPago: FormaPago[]
  fechaPago: string
  horaPago: string
  observaciones: string
  usuarioRegistro: string
  usuarioAutorizacion?: string
  estado: 'pendiente' | 'autorizado' | 'rechazado'
  tipo: 'nota-especifica' | 'abono-general'
  aplicadoA: string[]
}

interface PagoPendienteAutorizacion {
  id: string
  cliente: string
  nota: string
  montoPagado: number
  formasPago: FormaPago[]
  registradoPor: string
  fechaHora: string
  observaciones: string
}

// Datos de ejemplo
const resumenCredito: ResumenCredito = {
  carteraTotal: 450000,
  notasPendientes: 125,
  carteraVencida: 125000,
  notasVencidas: 35,
  porcentajeVencida: 27.8,
  carteraPorVencer: 85000,
  notasPorVencer: 28,
  porcentajePorVencer: 18.9
}

const clientesCredito: ClienteCredito[] = [
  {
    id: '1',
    nombre: 'María González Pérez',
    direccion: 'Av. Insurgentes Sur 123, Col. Roma Norte, CDMX',
    telefono: '55-1234-5678',
    ruta: 'Ruta Centro',
    limiteCredito: 50000,
    saldoActual: 15000,
    creditoDisponible: 35000,
    diasPromedioPago: 25,
    estado: 'buen-pagador',
    notasPendientes: [
      {
        id: '1',
        numeroNota: 'NC-001234',
        fechaVenta: '2024-01-15',
        fechaVencimiento: '2024-02-15',
        importe: 8500,
        diasVencimiento: 0,
        estado: 'vigente'
      },
      {
        id: '2',
        numeroNota: 'NC-001235',
        fechaVenta: '2024-01-20',
        fechaVencimiento: '2024-02-20',
        importe: 6500,
        diasVencimiento: -5,
        estado: 'vencida'
      }
    ]
  },
  {
    id: '2',
    nombre: 'Carlos Rodríguez López',
    direccion: 'Calle Morelos 456, Col. Centro, Guadalajara, Jalisco',
    telefono: '33-9876-5432',
    ruta: 'Ruta Occidente',
    limiteCredito: 30000,
    saldoActual: 35000,
    creditoDisponible: -5000,
    diasPromedioPago: 45,
    estado: 'critico',
    notasPendientes: [
      {
        id: '3',
        numeroNota: 'NC-001236',
        fechaVenta: '2024-01-10',
        fechaVencimiento: '2024-02-10',
        importe: 25000,
        diasVencimiento: -10,
        estado: 'vencida'
      }
    ]
  },
  {
    id: '3',
    nombre: 'Ana Martínez Silva',
    direccion: 'Blvd. López Mateos 789, Col. Del Valle, Monterrey, NL',
    telefono: '81-5555-1234',
    ruta: 'Ruta Norte',
    limiteCredito: 75000,
    saldoActual: 0,
    creditoDisponible: 75000,
    diasPromedioPago: 15,
    estado: 'buen-pagador',
    notasPendientes: []
  }
]

const alertasCredito: AlertaCredito[] = [
  {
    id: '1',
    tipo: 'critica',
    titulo: 'Cliente excede límite de crédito',
    descripcion: 'Carlos Rodríguez López ha excedido su límite de crédito en $5,000',
    fecha: '2024-01-25',
    cliente: 'Carlos Rodríguez López',
    monto: 5000
  },
  {
    id: '2',
    tipo: 'critica',
    titulo: 'Deuda vencida más de 60 días',
    descripcion: 'Roberto Hernández García tiene deuda vencida desde hace 75 días',
    fecha: '2024-01-25',
    cliente: 'Roberto Hernández García',
    diasVencimiento: 75
  },
  {
    id: '3',
    tipo: 'importante',
    titulo: 'Solicitud de crédito pendiente',
    descripcion: 'Nueva solicitud de crédito de $25,000 para Patricia López',
    fecha: '2024-01-24',
    cliente: 'Patricia López',
    monto: 25000
  },
  {
    id: '4',
    tipo: 'automatica',
    titulo: 'Recordatorio enviado',
    descripcion: 'Recordatorio de pago enviado a María González Pérez',
    fecha: '2024-01-24',
    cliente: 'María González Pérez'
  }
]

const historialLimites: HistorialLimite[] = [
  {
    id: '1',
    cliente: 'María González Pérez',
    usuario: 'Admin Sistema',
    fecha: '2024-01-20',
    limiteAnterior: 40000,
    limiteNuevo: 50000,
    motivo: 'Cliente con buen historial de pagos'
  },
  {
    id: '2',
    cliente: 'Carlos Rodríguez López',
    usuario: 'Gerente Ventas',
    fecha: '2024-01-18',
    limiteAnterior: 35000,
    limiteNuevo: 30000,
    motivo: 'Reducción por incumplimiento de pagos'
  }
]

const pagosPendientesAutorizacion: PagoPendienteAutorizacion[] = [
  {
    id: '1',
    cliente: 'María González Pérez',
    nota: 'NC-001234',
    montoPagado: 8500,
    formasPago: [
      { id: '1', metodo: 'efectivo', monto: 5000 },
      { id: '2', metodo: 'transferencia', monto: 2500, referencia: 'TRF123456', banco: 'BBVA' },
      { id: '3', metodo: 'tarjeta', monto: 1000, referencia: 'TER789012' }
    ],
    registradoPor: 'Juan Pérez (Auxiliar)',
    fechaHora: '2024-01-25 10:30',
    observaciones: 'Pago completo de la nota'
  },
  {
    id: '2',
    cliente: 'Roberto Hernández García',
    nota: 'NC-001235',
    montoPagado: 3000,
    formasPago: [
      { id: '1', metodo: 'efectivo', monto: 3000 }
    ],
    registradoPor: 'Ana García (Auxiliar)',
    fechaHora: '2024-01-25 11:15',
    observaciones: 'Abono parcial'
  }
]

const historialPagos: Pago[] = [
  {
    id: '1',
    clienteId: '1',
    clienteNombre: 'María González Pérez',
    notaId: '1',
    numeroNota: 'NC-001234',
    montoTotal: 8500,
    formasPago: [
      { id: '1', metodo: 'efectivo', monto: 5000 },
      { id: '2', metodo: 'transferencia', monto: 2500, referencia: 'TRF123456', banco: 'BBVA' },
      { id: '3', metodo: 'tarjeta', monto: 1000, referencia: 'TER789012' }
    ],
    fechaPago: '2024-01-25',
    horaPago: '10:30',
    observaciones: 'Pago completo de la nota',
    usuarioRegistro: 'Juan Pérez',
    usuarioAutorizacion: 'Carlos Mendoza',
    estado: 'autorizado',
    tipo: 'nota-especifica',
    aplicadoA: ['NC-001234']
  }
]

export default function CreditosAbonosPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'clientes' | 'limites' | 'alertas' | 'reportes' | 'pagos-pendientes' | 'historial-pagos'>('dashboard')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteCredito | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'modificar-limite' | 'recordatorio' | 'bloquear' | 'estado-cuenta' | 'registrar-pago' | 'registrar-abono'>('modificar-limite')
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaCredito | null>(null)
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [montoTotalPago, setMontoTotalPago] = useState(0)
  const [filtros, setFiltros] = useState({
    nombre: '',
    ruta: '',
    estado: '',
    saldoMin: '',
    saldoMax: '',
    diasVencimientoMin: '',
    diasVencimientoMax: ''
  })
  const [tabValue, setTabValue] = useState(0)

  const abrirDialogo = (tipo: 'modificar-limite' | 'recordatorio' | 'bloquear' | 'estado-cuenta' | 'registrar-pago' | 'registrar-abono', cliente?: ClienteCredito, nota?: NotaCredito) => {
    setTipoDialogo(tipo)
    setClienteSeleccionado(cliente || null)
    setNotaSeleccionada(nota || null)
    setFormasPago([])
    setMontoTotalPago(0)
    setDialogoAbierto(true)
  }

  const agregarFormaPago = () => {
    const nuevaFormaPago: FormaPago = {
      id: Date.now().toString(),
      metodo: 'efectivo',
      monto: 0
    }
    setFormasPago(prev => [...prev, nuevaFormaPago])
  }

  const eliminarFormaPago = (id: string) => {
    setFormasPago(prev => prev.filter(fp => fp.id !== id))
  }

  const actualizarFormaPago = (id: string, campo: string, valor: any) => {
    setFormasPago(prev => prev.map(fp => 
      fp.id === id ? { ...fp, [campo]: valor } : fp
    ))
  }

  const calcularTotalPago = () => {
    const total = formasPago.reduce((sum, fp) => sum + fp.monto, 0)
    setMontoTotalPago(total)
    return total
  }

  const getMetodoPagoColor = (metodo: string) => {
    switch (metodo) {
      case 'efectivo': return 'success'
      case 'transferencia': return 'primary'
      case 'tarjeta': return 'secondary'
      case 'cheque': return 'warning'
      default: return 'default'
    }
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setClienteSeleccionado(null)
    setNotaSeleccionada(null)
    setFormasPago([])
    setMontoTotalPago(0)
  }

  const manejarCambioFiltros = (campo: string, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'buen-pagador': return 'success'
      case 'vencido': return 'warning'
      case 'critico': return 'error'
      case 'bloqueado': return 'default'
      default: return 'default'
    }
  }

  const getNotaEstadoColor = (estado: string) => {
    switch (estado) {
      case 'vigente': return 'success'
      case 'por-vencer': return 'warning'
      case 'vencida': return 'error'
      default: return 'default'
    }
  }

  const getAlertaColor = (tipo: string) => {
    switch (tipo) {
      case 'critica': return 'error'
      case 'importante': return 'warning'
      case 'automatica': return 'info'
      default: return 'default'
    }
  }

  const getAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'critica': return <WarningIcon />
      case 'importante': return <ScheduleIcon />
      case 'automatica': return <CheckCircleIcon />
      default: return <NotificationsIcon />
    }
  }

  const clientesFiltrados = clientesCredito.filter(cliente => {
    const cumpleNombre = !filtros.nombre || cliente.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
    const cumpleRuta = !filtros.ruta || cliente.ruta === filtros.ruta
    const cumpleEstado = !filtros.estado || cliente.estado === filtros.estado
    const cumpleSaldoMin = !filtros.saldoMin || cliente.saldoActual >= Number(filtros.saldoMin)
    const cumpleSaldoMax = !filtros.saldoMax || cliente.saldoActual <= Number(filtros.saldoMax)
    
    return cumpleNombre && cumpleRuta && cumpleEstado && cumpleSaldoMin && cumpleSaldoMax
  })

  const rutasUnicas = [...new Set(clientesCredito.map(c => c.ruta))]

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Gestión de Créditos y Abonos
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
            variant={vistaActual === 'clientes' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('clientes')}
            startIcon={<PersonIcon />}
          >
            Gestión por Cliente
          </Button>
          <Button
            variant={vistaActual === 'limites' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('limites')}
            startIcon={<CreditCardIcon />}
          >
            Control de Límites
          </Button>
          <Button
            variant={vistaActual === 'alertas' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('alertas')}
            startIcon={<NotificationsIcon />}
          >
            Centro de Alertas
          </Button>
          <Button
            variant={vistaActual === 'reportes' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('reportes')}
            startIcon={<DescriptionIcon />}
          >
            Reportes Financieros
          </Button>
          <Button
            variant={vistaActual === 'pagos-pendientes' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('pagos-pendientes')}
            startIcon={<PaymentIcon />}
          >
            Pagos Pendientes
          </Button>
          <Button
            variant={vistaActual === 'historial-pagos' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('historial-pagos')}
            startIcon={<HistoryIcon />}
          >
            Historial de Pagos
          </Button>
        </Box>
      </Box>

      {/* Dashboard Principal */}
      {vistaActual === 'dashboard' && (
        <Box>
          {/* Tarjetas de Resumen General */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        CARTERA TOTAL
                      </Typography>
                      <Typography variant='h4' component='div' color='primary'>
                        ${resumenCredito.carteraTotal.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {resumenCredito.notasPendientes} notas pendientes
                      </Typography>
                    </Box>
                    <AccountBalanceIcon color='primary' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        VENCIDA
                      </Typography>
                      <Typography variant='h4' component='div' color='error.main'>
                        ${resumenCredito.carteraVencida.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {resumenCredito.notasVencidas} notas • {resumenCredito.porcentajeVencida}%
                      </Typography>
                    </Box>
                    <WarningIcon color='error' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        POR VENCER
                      </Typography>
                      <Typography variant='h4' component='div' color='warning.main'>
                        ${resumenCredito.carteraPorVencer.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {resumenCredito.notasPorVencer} notas • {resumenCredito.porcentajePorVencer}%
                      </Typography>
                    </Box>
                    <ScheduleIcon color='warning' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Sección de Alertas Críticas */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Alertas Críticas
              </Typography>
              
              <Grid container spacing={2}>
                {alertasCredito.filter(a => a.tipo === 'critica').map((alerta) => (
                  <Grid item xs={12} md={6} key={alerta.id}>
                    <Alert severity={getAlertaColor(alerta.tipo) as any}>
                      <AlertTitle>{alerta.titulo}</AlertTitle>
                      <Typography variant='body2'>
                        {alerta.descripcion}
                      </Typography>
                      {alerta.cliente && (
                        <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
                          Cliente: {alerta.cliente}
                        </Typography>
                      )}
                      {alerta.monto && (
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          Monto: ${alerta.monto.toLocaleString()}
                        </Typography>
                      )}
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Panel de Gestión por Cliente */}
      {vistaActual === 'clientes' && (
        <Box>
          {/* Filtros y Búsqueda Avanzada */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Filtros y Búsqueda Avanzada
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label='Buscar por Nombre'
                    value={filtros.nombre}
                    onChange={(e) => manejarCambioFiltros('nombre', e.target.value)}
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
                    <InputLabel>Ruta</InputLabel>
                    <Select
                      value={filtros.ruta}
                      onChange={(e) => manejarCambioFiltros('ruta', e.target.value)}
                      label='Ruta'
                    >
                      <MenuItem value=''>Todas las rutas</MenuItem>
                      {rutasUnicas.map((ruta) => (
                        <MenuItem key={ruta} value={ruta}>
                          {ruta}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={filtros.estado}
                      onChange={(e) => manejarCambioFiltros('estado', e.target.value)}
                      label='Estado'
                    >
                      <MenuItem value=''>Todos los estados</MenuItem>
                      <MenuItem value='buen-pagador'>Buen Pagador</MenuItem>
                      <MenuItem value='vencido'>Vencido</MenuItem>
                      <MenuItem value='critico'>Crítico</MenuItem>
                      <MenuItem value='bloqueado'>Bloqueado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label='Saldo Mínimo'
                      type='number'
                      value={filtros.saldoMin}
                      onChange={(e) => manejarCambioFiltros('saldoMin', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label='Saldo Máximo'
                      type='number'
                      value={filtros.saldoMax}
                      onChange={(e) => manejarCambioFiltros('saldoMax', e.target.value)}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Lista de Clientes ({clientesFiltrados.length})
              </Typography>
              
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell align='right'>Límite Crédito</TableCell>
                      <TableCell align='right'>Saldo Actual</TableCell>
                      <TableCell align='right'>Crédito Disponible</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientesFiltrados.map((cliente) => (
                      <TableRow key={cliente.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 40, height: 40 }}>
                              {cliente.nombre.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {cliente.nombre}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                {cliente.telefono}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={cliente.ruta} size='small' variant='outlined' />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' fontWeight='bold'>
                            ${cliente.limiteCredito.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography 
                            variant='body2' 
                            fontWeight='bold'
                            color={cliente.saldoActual > cliente.limiteCredito ? 'error' : 'text.primary'}
                          >
                            ${cliente.saldoActual.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography 
                            variant='body2' 
                            fontWeight='bold'
                            color={cliente.creditoDisponible < 0 ? 'error' : 'success.main'}
                          >
                            ${cliente.creditoDisponible.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cliente.estado.replace('-', ' ').toUpperCase()}
                            color={getEstadoColor(cliente.estado) as any}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='Ver detalles'>
                              <IconButton size='small' onClick={() => setClienteSeleccionado(cliente)}>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Modificar límite'>
                              <IconButton size='small' onClick={() => abrirDialogo('modificar-limite', cliente)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Enviar recordatorio'>
                              <IconButton size='small' onClick={() => abrirDialogo('recordatorio', cliente)}>
                                <SendIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Registrar pago'>
                              <IconButton size='small' onClick={() => abrirDialogo('registrar-pago', cliente)}>
                                <PaymentIcon />
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

          {/* Ficha Individual del Cliente */}
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

                {/* Datos del Cliente */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant='h6' gutterBottom>
                      Datos del Cliente
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize='small' color='action' />
                      <Typography variant='body2'>
                        {clienteSeleccionado.direccion}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize='small' color='action' />
                      <Typography variant='body2'>
                        {clienteSeleccionado.telefono}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant='h6' gutterBottom>
                      Resumen Financiero
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Límite de Crédito
                        </Typography>
                        <Typography variant='h6' color='primary'>
                          ${clienteSeleccionado.limiteCredito.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Saldo Actual
                        </Typography>
                        <Typography variant='h6' color='text.primary'>
                          ${clienteSeleccionado.saldoActual.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Crédito Disponible
                        </Typography>
                        <Typography 
                          variant='h6' 
                          color={clienteSeleccionado.creditoDisponible < 0 ? 'error' : 'success.main'}
                        >
                          ${clienteSeleccionado.creditoDisponible.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Días Promedio de Pago
                        </Typography>
                        <Typography variant='h6' color='text.primary'>
                          {clienteSeleccionado.diasPromedioPago} días
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Tabla de Notas Pendientes */}
                <Typography variant='h6' gutterBottom>
                  Notas Pendientes
                </Typography>
                
                {clienteSeleccionado.notasPendientes.length > 0 ? (
                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Número de Nota</TableCell>
                          <TableCell>Fecha Venta</TableCell>
                          <TableCell>Fecha Vencimiento</TableCell>
                          <TableCell align='right'>Importe</TableCell>
                          <TableCell align='right'>Días Vencimiento</TableCell>
                          <TableCell align='center'>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clienteSeleccionado.notasPendientes.map((nota) => (
                          <TableRow key={nota.id}>
                            <TableCell>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {nota.numeroNota}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {new Date(nota.fechaVenta).toLocaleDateString('es-MX')}
                            </TableCell>
                            <TableCell>
                              {new Date(nota.fechaVencimiento).toLocaleDateString('es-MX')}
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='h6' color='primary'>
                                ${nota.importe.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography 
                                variant='body2'
                                color={nota.diasVencimiento < 0 ? 'error' : nota.diasVencimiento < 7 ? 'warning' : 'text.primary'}
                              >
                                {nota.diasVencimiento > 0 ? `+${nota.diasVencimiento}` : nota.diasVencimiento}
                              </Typography>
                            </TableCell>
                          <TableCell align='center'>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={nota.estado.replace('-', ' ').toUpperCase()}
                                color={getNotaEstadoColor(nota.estado) as any}
                                size='small'
                              />
                              <Tooltip title='Pagar esta nota'>
                                <IconButton 
                                  size='small' 
                                  onClick={() => abrirDialogo('registrar-pago', clienteSeleccionado, nota)}
                                >
                                  <PaymentIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity='success'>
                    No hay notas pendientes para este cliente.
                  </Alert>
                )}

                {/* Botones de Acción */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant='contained'
                    startIcon={<EditIcon />}
                    onClick={() => abrirDialogo('modificar-limite', clienteSeleccionado)}
                  >
                    Modificar Límite
                  </Button>
                  <Button
                    variant='outlined'
                    startIcon={<SendIcon />}
                    onClick={() => abrirDialogo('recordatorio', clienteSeleccionado)}
                  >
                    Enviar Recordatorio
                  </Button>
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={<PaymentIcon />}
                    onClick={() => abrirDialogo('registrar-pago', clienteSeleccionado)}
                  >
                    Registrar Pago
                  </Button>
                  <Button
                    variant='outlined'
                    color='success'
                    startIcon={<PaymentIcon />}
                    onClick={() => abrirDialogo('registrar-abono', clienteSeleccionado)}
                  >
                    Registrar Abono General
                  </Button>
                  <Button
                    variant='outlined'
                    color='error'
                    startIcon={<BlockIcon />}
                    onClick={() => abrirDialogo('bloquear', clienteSeleccionado)}
                  >
                    Bloquear Crédito
                  </Button>
                  <Button
                    variant='outlined'
                    startIcon={<DescriptionIcon />}
                    onClick={() => abrirDialogo('estado-cuenta', clienteSeleccionado)}
                  >
                    Generar Estado Cuenta
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Panel de Control de Límites de Crédito */}
      {vistaActual === 'limites' && (
        <Box>
          {/* Configuración Masiva */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Configuración Masiva de Límites
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Límite para Clientes Nuevos'
                    type='number'
                    defaultValue='25000'
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>$</InputAdornment>
                    }}
                  />
                  <Typography variant='caption' color='text.secondary'>
                    Se aplicará automáticamente a todos los clientes nuevos
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Ruta Específica</InputLabel>
                      <Select label='Ruta Específica'>
                        <MenuItem value=''>Seleccionar ruta</MenuItem>
                        {rutasUnicas.map((ruta) => (
                          <MenuItem key={ruta} value={ruta}>
                            {ruta}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label='Nuevo Límite'
                      type='number'
                      defaultValue='30000'
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>$</InputAdornment>
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Button variant='contained' startIcon={<AddIcon />}>
                  Aplicar Configuración Masiva
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Tabla de Límites Individuales */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Límites Individuales por Cliente
              </Typography>
              
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell align='right'>Límite Actual</TableCell>
                      <TableCell align='right'>Nuevo Límite</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientesCredito.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 40, height: 40 }}>
                              {cliente.nombre.charAt(0)}
                            </Avatar>
                            <Typography variant='subtitle2' fontWeight='bold'>
                              {cliente.nombre}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={cliente.ruta} size='small' variant='outlined' />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${cliente.limiteCredito.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <TextField
                            size='small'
                            type='number'
                            defaultValue={cliente.limiteCredito}
                            InputProps={{
                              startAdornment: <InputAdornment position='start'>$</InputAdornment>
                            }}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Button variant='outlined' size='small' startIcon={<EditIcon />}>
                            Actualizar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Historial de Cambios */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Historial de Cambios de Límites
              </Typography>
              
              <List>
                {historialLimites.map((cambio) => (
                  <ListItem key={cambio.id}>
                    <ListItemIcon>
                      <HistoryIcon color='primary' />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {cambio.cliente}
                          </Typography>
                          <Chip 
                            label={`$${cambio.limiteAnterior.toLocaleString()} → $${cambio.limiteNuevo.toLocaleString()}`}
                            size='small'
                            color={cambio.limiteNuevo > cambio.limiteAnterior ? 'success' : 'warning'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant='body2' color='text.secondary'>
                            {cambio.motivo}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {cambio.usuario} • {new Date(cambio.fecha).toLocaleDateString('es-MX')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Centro de Alertas y Notificaciones */}
      {vistaActual === 'alertas' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Centro de Alertas y Notificaciones
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab 
                label={
                  <Badge badgeContent={alertasCredito.filter(a => a.tipo === 'critica').length} color='error'>
                    Críticas
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={alertasCredito.filter(a => a.tipo === 'importante').length} color='warning'>
                    Importantes
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={alertasCredito.filter(a => a.tipo === 'automatica').length} color='info'>
                    Automáticas
                  </Badge>
                } 
              />
            </Tabs>
          </Box>

          <Grid container spacing={3}>
            {alertasCredito
              .filter(alerta => {
                if (tabValue === 0) return alerta.tipo === 'critica'
                if (tabValue === 1) return alerta.tipo === 'importante'
                if (tabValue === 2) return alerta.tipo === 'automatica'
                return false
              })
              .map((alerta) => (
                <Grid item xs={12} md={6} key={alerta.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ color: `${getAlertaColor(alerta.tipo)}.main` }}>
                          {getAlertaIcon(alerta.tipo)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='h6' gutterBottom>
                            {alerta.titulo}
                          </Typography>
                          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                            {alerta.descripcion}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant='caption' color='text.secondary'>
                              {new Date(alerta.fecha).toLocaleDateString('es-MX')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button size='small' variant='outlined'>
                                Ver Detalles
                              </Button>
                              {alerta.tipo === 'critica' && (
                                <Button size='small' variant='contained' color='error'>
                                  Resolver
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )}

      {/* Sección de Reportes Financieros */}
      {vistaActual === 'reportes' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Reportes de Cartera
          </Typography>
          
          <Grid container spacing={3}>
            {/* Reportes Ejecutivos */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <AssessmentIcon color='primary' sx={{ fontSize: 40 }} />
                    <Typography variant='h6' gutterBottom>
                      Reportes Ejecutivos
                    </Typography>
                  </Box>
                  
                  <List>
                    <ListItem button>
                      <ListItemText primary='Antigüedad de Cartera (30, 60, 90+ días)' />
                      <DownloadIcon />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary='Top 10 Mejores Pagadores' />
                      <DownloadIcon />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary='Top 10 Peores Pagadores' />
                      <DownloadIcon />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary='Análisis de Riesgo' />
                      <DownloadIcon />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Reportes Operativos */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <PersonIcon color='secondary' sx={{ fontSize: 40 }} />
                    <Typography variant='h6' gutterBottom>
                      Reportes Operativos
                    </Typography>
                  </Box>
                  
                  <List>
                    <ListItem button>
                      <ListItemText primary='Clientes para Visita de Cobranza (por Ruta)' />
                      <DownloadIcon />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary='Recordatorios por Enviar' />
                      <DownloadIcon />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary='Transferencias Pendientes Confirmación' />
                      <DownloadIcon />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary='Clientes con Límite Excedido' />
                      <DownloadIcon />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Reportes Estratégicos */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <TrendingUpIcon color='success' sx={{ fontSize: 40 }} />
                    <Typography variant='h6' gutterBottom>
                      Reportes Estratégicos
                    </Typography>
                  </Box>
                  
                  <List>
                    <ListItem button>
                      <ListItemText primary='Comparativo Cartera vs Ventas' />
                      <DownloadIcon />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary='Eficiencia de Cobranza por Repartidor' />
                      <DownloadIcon />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary='Análisis de Tendencias de Pago' />
                      <DownloadIcon />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary='Proyección de Flujo de Caja' />
                      <DownloadIcon />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Vista de Pagos Pendientes de Autorización */}
      {vistaActual === 'pagos-pendientes' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Pagos Pendientes de Autorización
          </Typography>
          
          <Card>
            <CardContent>
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell align='right'>Monto Pagado</TableCell>
                      <TableCell>Formas de Pago</TableCell>
                      <TableCell>Registrado por</TableCell>
                      <TableCell>Fecha/Hora</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagosPendientesAutorizacion.map((pago) => (
                      <TableRow key={pago.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.cliente}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.nota}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${pago.montoPagado.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {pago.formasPago.map((forma, index) => (
                              <Chip
                                key={index}
                                label={`${forma.metodo}: $${forma.monto.toLocaleString()}`}
                                color={getMetodoPagoColor(forma.metodo) as any}
                                size='small'
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.registradoPor}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.fechaHora}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='Ver detalles'>
                              <IconButton size='small'>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Autorizar'>
                              <IconButton size='small' color='success'>
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Rechazar'>
                              <IconButton size='small' color='error'>
                                <CloseIcon />
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

      {/* Vista de Historial de Pagos */}
      {vistaActual === 'historial-pagos' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Historial de Pagos
          </Typography>
          
          <Card>
            <CardContent>
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha/Hora</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell align='right'>Monto Total</TableCell>
                      <TableCell>Formas de Pago</TableCell>
                      <TableCell>Registrado por</TableCell>
                      <TableCell>Autorizado por</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historialPagos.map((pago) => (
                      <TableRow key={pago.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant='body2'>
                              {new Date(pago.fechaPago).toLocaleDateString('es-MX')}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {pago.horaPago}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.clienteNombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.numeroNota}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${pago.montoTotal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {pago.formasPago.map((forma, index) => (
                              <Chip
                                key={index}
                                label={`${forma.metodo}: $${forma.monto.toLocaleString()}`}
                                color={getMetodoPagoColor(forma.metodo) as any}
                                size='small'
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.usuarioRegistro}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.usuarioAutorizacion || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={pago.estado.toUpperCase()}
                            color={
                              pago.estado === 'autorizado' ? 'success' :
                              pago.estado === 'pendiente' ? 'warning' : 'error'
                            }
                            size='small'
                          />
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

      {/* Modales */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          {tipoDialogo === 'modificar-limite' && 'Modificar Límite de Crédito'}
          {tipoDialogo === 'recordatorio' && 'Enviar Recordatorio'}
          {tipoDialogo === 'bloquear' && 'Bloquear Crédito'}
          {tipoDialogo === 'estado-cuenta' && 'Generar Estado de Cuenta'}
          {tipoDialogo === 'registrar-pago' && 'Registrar Pago'}
          {tipoDialogo === 'registrar-abono' && 'Registrar Abono General'}
        </DialogTitle>
        <DialogContent>
          {clienteSeleccionado && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='h6' gutterBottom>
                Cliente: {clienteSeleccionado.nombre}
              </Typography>
              
              {tipoDialogo === 'modificar-limite' && (
                <Box>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    Límite actual: ${clienteSeleccionado.limiteCredito.toLocaleString()}
                  </Typography>
                  <TextField
                    fullWidth
                    label='Nuevo Límite de Crédito'
                    type='number'
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>$</InputAdornment>
                    }}
                  />
                  <TextField
                    fullWidth
                    label='Motivo del Cambio'
                    multiline
                    rows={3}
                    sx={{ mt: 2 }}
                  />
                </Box>
              )}
              
              {tipoDialogo === 'recordatorio' && (
                <Box>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    Saldo actual: ${clienteSeleccionado.saldoActual.toLocaleString()}
                  </Typography>
                  <TextField
                    fullWidth
                    label='Mensaje Personalizado'
                    multiline
                    rows={4}
                    defaultValue='Estimado cliente, le recordamos que tiene un saldo pendiente de pago. Agradecemos su pronta atención.'
                  />
                </Box>
              )}
              
              {tipoDialogo === 'bloquear' && (
                <Alert severity='warning' sx={{ mb: 2 }}>
                  <AlertTitle>Advertencia</AlertTitle>
                  Esta acción bloqueará el crédito del cliente inmediatamente.
                </Alert>
              )}
              
              {tipoDialogo === 'estado-cuenta' && (
                <Box>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    Se generará un estado de cuenta detallado para este cliente.
                  </Typography>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Formato</InputLabel>
                    <Select label='Formato'>
                      <MenuItem value='pdf'>PDF</MenuItem>
                      <MenuItem value='excel'>Excel</MenuItem>
                      <MenuItem value='email'>Enviar por Email</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {(tipoDialogo === 'registrar-pago' || tipoDialogo === 'registrar-abono') && (
                <Box>
                  {notaSeleccionada && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant='h6' gutterBottom>
                        Nota a Pagar: {notaSeleccionada.numeroNota}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Importe de la nota: ${notaSeleccionada.importe.toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant='h6' gutterBottom>
                    Formas de Pago
                  </Typography>

                  {formasPago.map((forma, index) => (
                    <Card key={forma.id} variant='outlined' sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems='center'>
                          <Grid item xs={12} sm={3}>
                            <FormControl fullWidth>
                              <InputLabel>Método</InputLabel>
                              <Select
                                value={forma.metodo}
                                onChange={(e) => actualizarFormaPago(forma.id, 'metodo', e.target.value)}
                                label='Método'
                              >
                                <MenuItem value='efectivo'>Efectivo</MenuItem>
                                <MenuItem value='transferencia'>Transferencia</MenuItem>
                                <MenuItem value='tarjeta'>Tarjeta</MenuItem>
                                <MenuItem value='cheque'>Cheque</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label='Monto'
                              type='number'
                              value={forma.monto}
                              onChange={(e) => actualizarFormaPago(forma.id, 'monto', Number(e.target.value))}
                              InputProps={{
                                startAdornment: <InputAdornment position='start'>$</InputAdornment>
                              }}
                            />
                          </Grid>
                          {(forma.metodo === 'transferencia' || forma.metodo === 'cheque') && (
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label='Referencia'
                                value={forma.referencia || ''}
                                onChange={(e) => actualizarFormaPago(forma.id, 'referencia', e.target.value)}
                              />
                            </Grid>
                          )}
                          {(forma.metodo === 'transferencia' || forma.metodo === 'cheque') && (
                            <Grid item xs={12} sm={2}>
                              <TextField
                                fullWidth
                                label='Banco'
                                value={forma.banco || ''}
                                onChange={(e) => actualizarFormaPago(forma.id, 'banco', e.target.value)}
                              />
                            </Grid>
                          )}
                          <Grid item xs={12} sm={1}>
                            <IconButton 
                              color='error' 
                              onClick={() => eliminarFormaPago(forma.id)}
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}

                  <Button 
                    variant='outlined' 
                    startIcon={<AddIcon />}
                    onClick={agregarFormaPago}
                    sx={{ mb: 2 }}
                  >
                    Agregar otra forma de pago
                  </Button>

                  <Card sx={{ bgcolor: 'success.light', mb: 2 }}>
                    <CardContent>
                      <Typography variant='h6' gutterBottom>
                        Resumen del Pago
                      </Typography>
                      <Typography variant='h4' color='primary'>
                        Total a pagar: ${calcularTotalPago().toLocaleString()}
                      </Typography>
                      {notaSeleccionada && (
                        <Typography variant='body2' color='text.secondary'>
                          Faltante: ${(notaSeleccionada.importe - calcularTotalPago()).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  <TextField
                    fullWidth
                    label='Observaciones'
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                    placeholder='Observaciones sobre el pago...'
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            Cancelar
          </Button>
          <Button variant='contained' color={tipoDialogo === 'bloquear' ? 'error' : 'primary'}>
            {tipoDialogo === 'modificar-limite' && 'Actualizar Límite'}
            {tipoDialogo === 'recordatorio' && 'Enviar Recordatorio'}
            {tipoDialogo === 'bloquear' && 'Bloquear Crédito'}
            {tipoDialogo === 'estado-cuenta' && 'Generar Estado'}
            {tipoDialogo === 'registrar-pago' && 'Registrar Pago'}
            {tipoDialogo === 'registrar-abono' && 'Registrar Abono'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

