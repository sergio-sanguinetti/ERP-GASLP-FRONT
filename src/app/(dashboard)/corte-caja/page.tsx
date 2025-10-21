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
  InputAdornment,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent
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
  LocalShipping as LocalShippingIcon,
  GasMeter as GasMeterIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material'

// Tipos de datos
interface RepartidorCorte {
  id: string
  nombre: string
  ruta: string
  tipo: 'pipas' | 'cilindros'
  horaEntrega: string
  totalDia: number
  estado: 'recibido' | 'validado' | 'pendiente'
  ventas: {
    montoTotal: number
    litrosServicios: number
  }
  abonos: {
    montoTotal: number
    cantidad: number
  }
  efectivo: {
    metodo: 'depositado-cajero' | 'entregado-planta'
    montoDepositado: number
    billetesRechazados: number
    monedasEntregadas: number
  }
  formasPago: {
    terminal: { monto: number; operaciones: OperacionTerminal[] }
    transferencias: { monto: number; operaciones: OperacionTransferencia[] }
    cheques: { monto: number; operaciones: OperacionCheque[] }
  }
  reporteFisico?: {
    totalServicios: number
    totalLitros: number
    rangoServicios: string
  }
}

interface OperacionTerminal {
  id: string
  monto: number
  folioTerminal: string
  fecha: string
  folioValidacion?: string
  archivoValidacion?: string
}

interface OperacionTransferencia {
  id: string
  monto: number
  folioBancario: string
  banco: string
  fecha: string
  folioValidacion?: string
  archivoValidacion?: string
}

interface OperacionCheque {
  id: string
  monto: number
  numeroCheque: string
  banco: string
  fecha: string
  folioValidacion?: string
  archivoValidacion?: string
}

interface ResumenCortes {
  pipas: {
    rutasProgramadas: number
    cortesEntregados: number
    cortesValidados: number
    cortesPendientes: number
    totalVentas: number
    totalAbonos: number
  }
  cilindros: {
    rutasProgramadas: number
    cortesEntregados: number
    cortesValidados: number
    cortesPendientes: number
    totalVentas: number
    totalAbonos: number
  }
  granTotalOperacion: number
  efectivoConsolidado: number
}

// Datos de ejemplo
const resumenCortes: ResumenCortes = {
  pipas: {
    rutasProgramadas: 8,
    cortesEntregados: 6,
    cortesValidados: 4,
    cortesPendientes: 2,
    totalVentas: 85000,
    totalAbonos: 12000
  },
  cilindros: {
    rutasProgramadas: 12,
    cortesEntregados: 10,
    cortesValidados: 8,
    cortesPendientes: 2,
    totalVentas: 40000,
    totalAbonos: 8000
  },
  granTotalOperacion: 125000,
  efectivoConsolidado: 20000
}

const repartidoresCorte: RepartidorCorte[] = [
  {
    id: '1',
    nombre: 'José Luis González',
    ruta: 'Ruta 002',
    tipo: 'pipas',
    horaEntrega: '14:30',
    totalDia: 12500,
    estado: 'recibido',
    ventas: {
      montoTotal: 12500,
      litrosServicios: 8
    },
    abonos: {
      montoTotal: 2500,
      cantidad: 3
    },
    efectivo: {
      metodo: 'depositado-cajero',
      montoDepositado: 8000,
      billetesRechazados: 0,
      monedasEntregadas: 0
    },
    formasPago: {
      terminal: {
        monto: 7250,
        operaciones: [
          { id: '1', monto: 3500, folioTerminal: 'TER001', fecha: '2024-01-25' },
          { id: '2', monto: 3750, folioTerminal: 'TER002', fecha: '2024-01-25' }
        ]
      },
      transferencias: {
        monto: 3200,
        operaciones: [
          { id: '1', monto: 1500, folioBancario: 'TRF001', banco: 'BBVA', fecha: '2024-01-25' },
          { id: '2', monto: 1700, folioBancario: 'TRF002', banco: 'Santander', fecha: '2024-01-25' }
        ]
      },
      cheques: {
        monto: 1800,
        operaciones: [{ id: '1', monto: 1800, numeroCheque: 'CHQ001', banco: 'Banorte', fecha: '2024-01-25' }]
      }
    },
    reporteFisico: {
      totalServicios: 8,
      totalLitros: 650,
      rangoServicios: '001-008'
    }
  },
  {
    id: '2',
    nombre: 'María Elena Ruiz',
    ruta: 'Ruta 005',
    tipo: 'cilindros',
    horaEntrega: '15:45',
    totalDia: 8500,
    estado: 'validado',
    ventas: {
      montoTotal: 8500,
      litrosServicios: 12
    },
    abonos: {
      montoTotal: 1500,
      cantidad: 2
    },
    efectivo: {
      metodo: 'entregado-planta',
      montoDepositado: 0,
      billetesRechazados: 0,
      monedasEntregadas: 7000
    },
    formasPago: {
      terminal: {
        monto: 1500,
        operaciones: [{ id: '1', monto: 1500, folioTerminal: 'TER003', fecha: '2024-01-25' }]
      },
      transferencias: {
        monto: 0,
        operaciones: []
      },
      cheques: {
        monto: 0,
        operaciones: []
      }
    }
  },
  {
    id: '3',
    nombre: 'Carlos Mendoza Silva',
    ruta: 'Ruta 003',
    tipo: 'pipas',
    horaEntrega: '16:20',
    totalDia: 15200,
    estado: 'pendiente',
    ventas: {
      montoTotal: 15200,
      litrosServicios: 10
    },
    abonos: {
      montoTotal: 3200,
      cantidad: 4
    },
    efectivo: {
      metodo: 'depositado-cajero',
      montoDepositado: 12000,
      billetesRechazados: 0,
      monedasEntregadas: 0
    },
    formasPago: {
      terminal: {
        monto: 3200,
        operaciones: [{ id: '1', monto: 3200, folioTerminal: 'TER004', fecha: '2024-01-25' }]
      },
      transferencias: {
        monto: 0,
        operaciones: []
      },
      cheques: {
        monto: 0,
        operaciones: []
      }
    },
    reporteFisico: {
      totalServicios: 10,
      totalLitros: 800,
      rangoServicios: '009-018'
    }
  }
]

// Tipos adicionales para apertura/cierre de caja
interface AperturaCierreCaja {
  id: string
  fecha: string
  tipo: 'apertura' | 'cierre'
  usuario: string
  hora: string
  montoInicial?: number
  montoFinal?: number
  observaciones: string
  estado: 'activo' | 'cerrado' | 'pendiente'
  efectivoFisico: number
  diferencias: number
  cortesValidados: number
  cortesPendientes: number
}

interface DepositoBancario {
  id: string
  repartidorId: string
  repartidorNombre: string
  folioRepartidor: string
  folioFisico?: string
  monto: number
  fechaDeposito: string
  horaDeposito: string
  estado: 'pendiente-validacion' | 'validado' | 'diferencia'
  comprobanteRecibido: boolean
  fotoComprobante?: string
  observaciones?: string
  validadoPor?: string
  fechaValidacion?: string
}

interface DepositoMultiple {
  id: string
  repartidorId: string
  repartidorNombre: string
  montoTotal: number
  depositos: DepositoBancario[]
  estado: 'pendiente-validacion' | 'validado' | 'diferencia'
  fechaCreacion: string
}

// Datos de ejemplo para depósitos bancarios
const depositosBancarios: DepositoBancario[] = [
  {
    id: '1',
    repartidorId: '1',
    repartidorNombre: 'José Luis González',
    folioRepartidor: 'DEP123456789',
    folioFisico: 'DEP123456789',
    monto: 8000,
    fechaDeposito: '2024-01-25',
    horaDeposito: '14:30',
    estado: 'validado',
    comprobanteRecibido: true,
    validadoPor: 'María González',
    fechaValidacion: '2024-01-25 15:00'
  },
  {
    id: '2',
    repartidorId: '3',
    repartidorNombre: 'Carlos Mendoza Silva',
    folioRepartidor: 'DEP987654321',
    folioFisico: 'DEP987654322',
    monto: 12000,
    fechaDeposito: '2024-01-25',
    horaDeposito: '16:20',
    estado: 'diferencia',
    comprobanteRecibido: true,
    observaciones: 'Folio físico diferente al reportado',
    validadoPor: 'María González',
    fechaValidacion: '2024-01-25 17:00'
  },
  {
    id: '3',
    repartidorId: '2',
    repartidorNombre: 'María Elena Ruiz',
    folioRepartidor: 'DEP555666777',
    monto: 7000,
    fechaDeposito: '2024-01-25',
    horaDeposito: '15:45',
    estado: 'pendiente-validacion',
    comprobanteRecibido: false
  }
]

const depositosMultiples: DepositoMultiple[] = [
  {
    id: '1',
    repartidorId: '1',
    repartidorNombre: 'José Luis González',
    montoTotal: 12500,
    depositos: [
      {
        id: '1',
        repartidorId: '1',
        repartidorNombre: 'José Luis González',
        folioRepartidor: 'DEP123456789',
        folioFisico: 'DEP123456789',
        monto: 8000,
        fechaDeposito: '2024-01-25',
        horaDeposito: '14:30',
        estado: 'validado',
        comprobanteRecibido: true,
        validadoPor: 'María González',
        fechaValidacion: '2024-01-25 15:00'
      },
      {
        id: '2',
        repartidorId: '1',
        repartidorNombre: 'José Luis González',
        folioRepartidor: 'DEP987654321',
        folioFisico: 'DEP987654321',
        monto: 4500,
        fechaDeposito: '2024-01-25',
        horaDeposito: '14:45',
        estado: 'validado',
        comprobanteRecibido: true,
        validadoPor: 'María González',
        fechaValidacion: '2024-01-25 15:15'
      }
    ],
    estado: 'validado',
    fechaCreacion: '2024-01-25'
  }
]

// Datos de ejemplo para historial
const historialAperturaCierre: AperturaCierreCaja[] = [
  {
    id: '1',
    fecha: '2024-01-25',
    tipo: 'apertura',
    usuario: 'María González',
    hora: '08:00',
    montoInicial: 5000,
    observaciones: 'Apertura normal del día',
    estado: 'activo',
    efectivoFisico: 5000,
    diferencias: 0,
    cortesValidados: 0,
    cortesPendientes: 0
  },
  {
    id: '2',
    fecha: '2024-01-24',
    tipo: 'cierre',
    usuario: 'María González',
    hora: '18:30',
    montoFinal: 25000,
    observaciones: 'Cierre exitoso del día',
    estado: 'cerrado',
    efectivoFisico: 25000,
    diferencias: 0,
    cortesValidados: 12,
    cortesPendientes: 0
  },
  {
    id: '3',
    fecha: '2024-01-24',
    tipo: 'apertura',
    usuario: 'María González',
    hora: '08:15',
    montoInicial: 5000,
    observaciones: 'Apertura con retraso por tráfico',
    estado: 'cerrado',
    efectivoFisico: 5000,
    diferencias: 0,
    cortesValidados: 0,
    cortesPendientes: 0
  }
]

export default function CorteCajaPage() {
  const [vistaActual, setVistaActual] = useState<
    'dashboard' | 'validacion' | 'admin' | 'apertura-cierre' | 'historial' | 'depositos'
  >('dashboard')
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<RepartidorCorte | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'validacion' | 'observaciones' | 'apertura' | 'cierre' | 'validar-deposito'>('validacion')
  const [modoAuxiliar, setModoAuxiliar] = useState(false)
  const [pasoActual, setPasoActual] = useState(0)
  const [depositoSeleccionado, setDepositoSeleccionado] = useState<DepositoBancario | null>(null)

  const [validaciones, setValidaciones] = useState({
    efectivo: false,
    deposito: false,
    terminal: false,
    transferencias: false,
    cheques: false,
    reporteFisico: false
  })

  const [foliosArchivosValidacion, setFoliosArchivosValidacion] = useState({
    terminal: { folio: '', archivo: '' },
    transferencias: { folio: '', archivo: '' },
    cheques: { folio: '', archivo: '' }
  })

  const [observaciones, setObservaciones] = useState('')
  const [estadoFinal, setEstadoFinal] = useState('')
  const [historialCaja, setHistorialCaja] = useState<AperturaCierreCaja[]>(historialAperturaCierre)
  const [cajaAbierta, setCajaAbierta] = useState(true) // Estado actual de la caja

  const [formularioCaja, setFormularioCaja] = useState({
    montoInicial: 0,
    montoFinal: 0,
    efectivoFisico: 0,
    observaciones: ''
  })

  const abrirValidacion = (repartidor: RepartidorCorte) => {
    setRepartidorSeleccionado(repartidor)
    setTipoDialogo('validacion')
    setDialogoAbierto(true)
    setPasoActual(0)
  }

  const abrirValidacionDeposito = (deposito: DepositoBancario) => {
    setDepositoSeleccionado(deposito)
    setTipoDialogo('validar-deposito')
    setDialogoAbierto(true)
  }

  const getEstadoDepositoColor = (estado: string) => {
    switch (estado) {
      case 'validado': return 'success'
      case 'pendiente-validacion': return 'warning'
      case 'diferencia': return 'error'
      default: return 'default'
    }
  }

  const abrirDialogoCaja = (tipo: 'apertura' | 'cierre') => {
    setTipoDialogo(tipo)
    setFormularioCaja({
      montoInicial: 0,
      montoFinal: 0,
      efectivoFisico: 0,
      observaciones: ''
    })
    setDialogoAbierto(true)
  }

  const procesarAperturaCierre = () => {
    const nuevaOperacion: AperturaCierreCaja = {
      id: Date.now().toString(),
      fecha: new Date().toISOString().split('T')[0],
      tipo: tipoDialogo,
      usuario: 'Usuario Actual',
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      montoInicial: tipoDialogo === 'apertura' ? formularioCaja.montoInicial : undefined,
      montoFinal: tipoDialogo === 'cierre' ? formularioCaja.montoFinal : undefined,
      observaciones: formularioCaja.observaciones,
      estado: tipoDialogo === 'apertura' ? 'activo' : 'cerrado',
      efectivoFisico: formularioCaja.efectivoFisico,
      diferencias: 0,
      cortesValidados: repartidoresCorte.filter(r => r.estado === 'validado').length,
      cortesPendientes: repartidoresCorte.filter(r => r.estado === 'pendiente').length
    }

    setHistorialCaja(prev => [nuevaOperacion, ...prev])
    setCajaAbierta(tipoDialogo === 'apertura')
    cerrarDialogo()
  }

  const manejarCambioFormularioCaja = (campo: string, valor: any) => {
    setFormularioCaja(prev => ({ ...prev, [campo]: valor }))
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setRepartidorSeleccionado(null)
    setDepositoSeleccionado(null)
    setPasoActual(0)
    setValidaciones({
      efectivo: false,
      deposito: false,
      terminal: false,
      transferencias: false,
      cheques: false,
      reporteFisico: false
    })
    setFoliosArchivosValidacion({
      terminal: { folio: '', archivo: '' },
      transferencias: { folio: '', archivo: '' },
      cheques: { folio: '', archivo: '' }
    })
    setObservaciones('')
    setEstadoFinal('')
  }

  const manejarValidacion = (campo: string, valor: boolean) => {
    setValidaciones(prev => ({ ...prev, [campo]: valor }))
  }

  const manejarCambioFolioArchivo = (tipo: 'terminal' | 'transferencias' | 'cheques', campo: 'folio' | 'archivo', valor: string) => {
    setFoliosArchivosValidacion(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [campo]: valor
      }
    }))
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'recibido':
        return '📄'
      case 'validado':
        return '✅'
      case 'pendiente':
        return '⏳'
      default:
        return '❓'
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'recibido':
        return 'warning'
      case 'validado':
        return 'success'
      case 'pendiente':
        return 'info'
      default:
        return 'default'
    }
  }

  const pasosValidacion = [
    'Resumen Recibido',
    'Efectivo Registrado',
    'Formas de Pago',
    'Reporte Físico',
    'Estado Final'
  ]

  const repartidoresPipas = repartidoresCorte.filter(r => r.tipo === 'pipas')
  const repartidoresCilindros = repartidoresCorte.filter(r => r.tipo === 'cilindros')

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Corte de Caja
      </Typography>

      {/* Navegación */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={vistaActual === 'dashboard' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('dashboard')}
            startIcon={<AssessmentIcon />}
          >
            Dashboard Principal
          </Button>
          {/* <Button
            variant={vistaActual === 'validacion' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('validacion')}
            startIcon={<CheckCircleIcon />}
          >
            Validación Individual
          </Button> */}
          <Button
            variant={vistaActual === 'apertura-cierre' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('apertura-cierre')}
            startIcon={<AccountBalanceWalletIcon />}
          >
            Apertura/Cierre Caja
          </Button>
          <Button
            variant={vistaActual === 'historial' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('historial')}
            startIcon={<HistoryIcon />}
          >
            Historial Caja
          </Button>
          <Button
            variant={vistaActual === 'depositos' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('depositos')}
            startIcon={<AccountBalanceIcon />}
          >
            Validación Depósitos
          </Button>
          <Button
            variant={vistaActual === 'admin' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('admin')}
            startIcon={<PersonIcon />}
          >
            Vista Administrador
          </Button>
        </Box>
      </Box>

      {/* Dashboard Principal de Cortes */}
      {vistaActual === 'dashboard' && (
        <Box>
          {/* Encabezado Principal */}
          <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant='h4' gutterBottom>
                CORTES ENTREGADOS - PENDIENTES VALIDACIÓN
              </Typography>
              <Typography variant='h6'>
                Fecha:{' '}
                {new Date().toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Sección Repartidores Pipas */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <LocalShippingIcon color='primary' sx={{ mr: 1, fontSize: 30 }} />
                    <Typography variant='h5' color='primary'>
                      REPARTIDORES PIPAS
                    </Typography>
                  </Box>

                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Repartidor</TableCell>
                          <TableCell>Ruta</TableCell>
                          <TableCell>Hora Entrega</TableCell>
                          <TableCell align='right'>Total Día</TableCell>
                          <TableCell align='center'>Estado</TableCell>
                          <TableCell align='center'>Acción</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {repartidoresPipas.map(repartidor => (
                          <TableRow key={repartidor.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 40, height: 40 }}>{repartidor.nombre.charAt(0)}</Avatar>
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {repartidor.nombre}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={repartidor.ruta} size='small' variant='outlined' />
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{repartidor.horaEntrega}</Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='h6' color='primary'>
                                ${repartidor.totalDia.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Chip
                                label={`${repartidor.estado.toUpperCase()} ${getEstadoIcon(repartidor.estado)}`}
                                color={getEstadoColor(repartidor.estado) as any}
                                size='small'
                              />
                            </TableCell>
                            <TableCell align='center'>
                              <Button
                                variant='outlined'
                                size='small'
                                onClick={() => abrirValidacion(repartidor)}
                                startIcon={<VisibilityIcon />}
                              >
                                VER DETALLE
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Sección Repartidores Cilindros */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <GasMeterIcon color='secondary' sx={{ mr: 1, fontSize: 30 }} />
                    <Typography variant='h5' color='secondary'>
                      REPARTIDORES CILINDROS
                    </Typography>
                  </Box>

                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Repartidor</TableCell>
                          <TableCell>Ruta</TableCell>
                          <TableCell>Hora Entrega</TableCell>
                          <TableCell align='right'>Total Día</TableCell>
                          <TableCell align='center'>Estado</TableCell>
                          <TableCell align='center'>Acción</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {repartidoresCilindros.map(repartidor => (
                          <TableRow key={repartidor.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 40, height: 40 }}>{repartidor.nombre.charAt(0)}</Avatar>
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {repartidor.nombre}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={repartidor.ruta} size='small' variant='outlined' />
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{repartidor.horaEntrega}</Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='h6' color='primary'>
                                ${repartidor.totalDia.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Chip
                                label={`${repartidor.estado.toUpperCase()} ${getEstadoIcon(repartidor.estado)}`}
                                color={getEstadoColor(repartidor.estado) as any}
                                size='small'
                              />
                            </TableCell>
                            <TableCell align='center'>
                              <Button
                                variant='outlined'
                                size='small'
                                onClick={() => abrirValidacion(repartidor)}
                                startIcon={<VisibilityIcon />}
                              >
                                VER DETALLE
                              </Button>
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

      {/* Vista para Administrador/Encargado */}
      {vistaActual === 'admin' && (
        <Box>
          {/* Dashboard General de Cortes */}
          <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant='h4' gutterBottom>
                CONTROL GENERAL DE CORTES
              </Typography>
              <Typography variant='h6'>Fecha: {new Date().toLocaleDateString('es-MX')}</Typography>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Sección Consolidada Pipas */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <LocalShippingIcon color='primary' sx={{ mr: 1, fontSize: 30 }} />
                    <Typography variant='h5' color='primary'>
                      PIPAS
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Rutas Programadas
                      </Typography>
                      <Typography variant='h6'>{resumenCortes.pipas.rutasProgramadas}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Entregados
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        {resumenCortes.pipas.cortesEntregados}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Validados
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        {resumenCortes.pipas.cortesValidados}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Pendientes
                      </Typography>
                      <Typography variant='h6' color='warning.main'>
                        {resumenCortes.pipas.cortesPendientes}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Ventas
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        ${resumenCortes.pipas.totalVentas.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Abonos
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        ${resumenCortes.pipas.totalAbonos.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Sección Consolidada Cilindros */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <GasMeterIcon color='secondary' sx={{ mr: 1, fontSize: 30 }} />
                    <Typography variant='h5' color='secondary'>
                      CILINDROS
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Rutas Programadas
                      </Typography>
                      <Typography variant='h6'>{resumenCortes.cilindros.rutasProgramadas}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Entregados
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        {resumenCortes.cilindros.cortesEntregados}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Validados
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        {resumenCortes.cilindros.cortesValidados}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Pendientes
                      </Typography>
                      <Typography variant='h6' color='warning.main'>
                        {resumenCortes.cilindros.cortesPendientes}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Ventas
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        ${resumenCortes.cilindros.totalVentas.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Abonos
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        ${resumenCortes.cilindros.totalAbonos.toLocaleString()}
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
                        GRAN TOTAL OPERACIÓN
                      </Typography>
                      <Typography variant='h3'>${resumenCortes.granTotalOperacion.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant='h6' gutterBottom>
                        EFECTIVO CONSOLIDADO
                      </Typography>
                      <Typography variant='h4'>${resumenCortes.efectivoConsolidado.toLocaleString()}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Función de Auxiliar Rápida */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant='h6'>Función de Auxiliar Rápida</Typography>
                <Button
                  variant={modoAuxiliar ? 'contained' : 'outlined'}
                  onClick={() => setModoAuxiliar(!modoAuxiliar)}
                  startIcon={<PersonIcon />}
                >
                  {modoAuxiliar ? 'SALIR MODO AUXILIAR' : 'RECIBIR CORTES COMO AUXILIAR'}
                </Button>
              </Box>

              {modoAuxiliar && (
                <Box>
                  <Typography variant='h6' gutterBottom>
                    Repartidores Pendientes de Validar
                  </Typography>

                  <List>
                    {repartidoresCorte
                      .filter(r => r.estado === 'recibido')
                      .map(repartidor => (
                        <ListItem key={repartidor.id}>
                          <ListItemAvatar>
                            <Avatar>{repartidor.nombre.charAt(0)}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {repartidor.nombre} - {repartidor.ruta}
                                </Typography>
                                <Chip
                                  label={repartidor.tipo.toUpperCase()}
                                  size='small'
                                  color={repartidor.tipo === 'pipas' ? 'primary' : 'secondary'}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant='body2' color='text.secondary'>
                                  Total: ${repartidor.totalDia.toLocaleString()} • Hora: {repartidor.horaEntrega}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Estado: {repartidor.estado.toUpperCase()} {getEstadoIcon(repartidor.estado)}
                                </Typography>
                              </Box>
                            }
                          />
                          <Button variant='outlined' size='small' onClick={() => abrirValidacion(repartidor)}>
                            Validar
                          </Button>
                        </ListItem>
                      ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Vista de Apertura/Cierre de Caja */}
      {vistaActual === 'apertura-cierre' && (
        <Box>
          {/* Estado Actual de la Caja */}
          <Card sx={{ mb: 3, bgcolor: cajaAbierta ? 'success.main' : 'error.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant='h5' gutterBottom>
                    Estado Actual de la Caja
                  </Typography>
                  <Typography variant='h3'>{cajaAbierta ? 'CAJA ABIERTA' : 'CAJA CERRADA'}</Typography>
                  <Typography variant='body1'>
                    {cajaAbierta ? 'La caja está operativa' : 'La caja no está operativa'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant='h6' gutterBottom>
                    Fecha: {new Date().toLocaleDateString('es-MX')}
                  </Typography>
                  <Typography variant='h6'>
                    Hora: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography variant='h6' gutterBottom>
                    Apertura de Caja
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                    Iniciar operaciones del día con el monto inicial
                  </Typography>
                  <Button
                    variant='contained'
                    color='success'
                    size='large'
                    onClick={() => abrirDialogoCaja('apertura')}
                    disabled={cajaAbierta}
                    startIcon={<AddIcon />}
                  >
                    {cajaAbierta ? 'Caja ya está abierta' : 'Abrir Caja'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                  <Typography variant='h6' gutterBottom>
                    Cierre de Caja
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                    Finalizar operaciones del día y realizar arqueo
                  </Typography>
                  <Button
                    variant='contained'
                    color='error'
                    size='large'
                    onClick={() => abrirDialogoCaja('cierre')}
                    disabled={!cajaAbierta}
                    startIcon={<CloseIcon />}
                  >
                    {!cajaAbierta ? 'Caja ya está cerrada' : 'Cerrar Caja'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Resumen del Día */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Resumen del Día
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant='body2' color='text.secondary' gutterBottom>
                      Cortes Entregados
                    </Typography>
                    <Typography variant='h4' color='primary'>
                      {repartidoresCorte.length}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant='body2' color='text.secondary' gutterBottom>
                      Cortes Validados
                    </Typography>
                    <Typography variant='h4' color='success.main'>
                      {repartidoresCorte.filter(r => r.estado === 'validado').length}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant='body2' color='text.secondary' gutterBottom>
                      Cortes Pendientes
                    </Typography>
                    <Typography variant='h4' color='warning.main'>
                      {repartidoresCorte.filter(r => r.estado === 'pendiente').length}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant='body2' color='text.secondary' gutterBottom>
                      Total del Día
                    </Typography>
                    <Typography variant='h4' color='primary'>
                      ${repartidoresCorte.reduce((sum, r) => sum + r.totalDia, 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Vista de Historial de Caja */}
      {vistaActual === 'historial' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Historial de Aperturas y Cierres de Caja
          </Typography>

          <Card>
            <CardContent>
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Hora</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell align='right'>Monto</TableCell>
                      <TableCell>Observaciones</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                      <TableCell align='center'>Cortes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historialCaja.map(operacion => (
                      <TableRow key={operacion.id} hover>
                        <TableCell>{new Date(operacion.fecha).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>{operacion.hora}</TableCell>
                        <TableCell>
                          <Chip
                            label={operacion.tipo.toUpperCase()}
                            color={operacion.tipo === 'apertura' ? 'success' : 'error'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30 }}>{operacion.usuario.charAt(0)}</Avatar>
                            <Typography variant='body2'>{operacion.usuario}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${(operacion.montoInicial || operacion.montoFinal || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='text.secondary'>
                            {operacion.observaciones}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={operacion.estado.toUpperCase()}
                            color={
                              operacion.estado === 'activo'
                                ? 'success'
                                : operacion.estado === 'cerrado'
                                  ? 'default'
                                  : 'warning'
                            }
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant='body2' color='success.main'>
                              {operacion.cortesValidados} validados
                            </Typography>
                            <Typography variant='body2' color='warning.main'>
                              {operacion.cortesPendientes} pendientes
                            </Typography>
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

      {/* Vista de Validación de Depósitos Bancarios */}
      {vistaActual === 'depositos' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Validación de Depósitos Bancarios
          </Typography>

          {/* Resumen de Depósitos */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Total Depositado
                  </Typography>
                  <Typography variant='h4' color='primary'>
                    ${depositosBancarios.reduce((sum, d) => sum + d.monto, 0).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Depósitos Validados
                  </Typography>
                  <Typography variant='h4' color='success.main'>
                    {depositosBancarios.filter(d => d.estado === 'validado').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Pendientes Validación
                  </Typography>
                  <Typography variant='h4' color='warning.main'>
                    {depositosBancarios.filter(d => d.estado === 'pendiente-validacion').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Con Diferencias
                  </Typography>
                  <Typography variant='h4' color='error.main'>
                    {depositosBancarios.filter(d => d.estado === 'diferencia').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabla de Depósitos */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Depósitos Bancarios
              </Typography>
              
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Repartidor</TableCell>
                      <TableCell>Folio Repartidor</TableCell>
                      <TableCell>Folio Físico</TableCell>
                      <TableCell align='right'>Monto</TableCell>
                      <TableCell>Fecha/Hora</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                      <TableCell align='center'>Comprobante</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {depositosBancarios.map((deposito) => (
                      <TableRow key={deposito.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {deposito.repartidorNombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' fontWeight='bold'>
                            {deposito.folioRepartidor}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' fontWeight='bold'>
                            {deposito.folioFisico || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${deposito.monto.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant='body2'>
                              {new Date(deposito.fechaDeposito).toLocaleDateString('es-MX')}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {deposito.horaDeposito}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={deposito.estado.replace('-', ' ').toUpperCase()}
                            color={getEstadoDepositoColor(deposito.estado) as any}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={deposito.comprobanteRecibido ? 'RECIBIDO' : 'PENDIENTE'}
                            color={deposito.comprobanteRecibido ? 'success' : 'warning'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='Validar depósito'>
                              <IconButton 
                                size='small'
                                onClick={() => abrirValidacionDeposito(deposito)}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Ver detalles'>
                              <IconButton size='small'>
                                <VisibilityIcon />
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

          {/* Depósitos Múltiples */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Depósitos Múltiples
              </Typography>
              
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Repartidor</TableCell>
                      <TableCell align='right'>Monto Total</TableCell>
                      <TableCell align='center'>Cantidad Depósitos</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {depositosMultiples.map((depositoMultiple) => (
                      <TableRow key={depositoMultiple.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {depositoMultiple.repartidorNombre}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${depositoMultiple.montoTotal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Typography variant='h6'>
                            {depositoMultiple.depositos.length}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={depositoMultiple.estado.replace('-', ' ').toUpperCase()}
                            color={getEstadoDepositoColor(depositoMultiple.estado) as any}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Tooltip title='Ver detalles'>
                            <IconButton size='small'>
                              <VisibilityIcon />
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
        </Box>
      )}

      {/* Modal de Validación Individual */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} maxWidth='lg' fullWidth>
        <DialogTitle>
          {repartidorSeleccionado && (
            <Box>
              <Typography variant='h6'>
                VALIDACIÓN CORTE - {repartidorSeleccionado.nombre.toUpperCase()} - {repartidorSeleccionado.ruta} -{' '}
                {repartidorSeleccionado.tipo.toUpperCase()}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {repartidorSeleccionado && (
            <Box>
              <Stepper activeStep={pasoActual} orientation='vertical'>
                {/* Paso 1: Resumen Recibido */}
                <Step>
                  <StepLabel>Resumen Recibido</StepLabel>
                  <StepContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card variant='outlined'>
                          <CardContent>
                            <Typography variant='h6' gutterBottom>
                              Resumen de Ventas
                            </Typography>
                            <Typography variant='h4' color='primary'>
                              ${repartidorSeleccionado.ventas.montoTotal.toLocaleString()}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {repartidorSeleccionado.ventas.litrosServicios}{' '}
                              {repartidorSeleccionado.tipo === 'pipas' ? 'litros' : 'servicios'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card variant='outlined'>
                          <CardContent>
                            <Typography variant='h6' gutterBottom>
                              Resumen de Abonos
                            </Typography>
                            <Typography variant='h4' color='success.main'>
                              ${repartidorSeleccionado.abonos.montoTotal.toLocaleString()}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {repartidorSeleccionado.abonos.cantidad} abonos
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12}>
                        <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                          <CardContent>
                            <Typography variant='h6' gutterBottom>
                              TOTAL DÍA
                            </Typography>
                            <Typography variant='h3'>${repartidorSeleccionado.totalDia.toLocaleString()}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2 }}>
                      <Button variant='contained' onClick={() => setPasoActual(1)}>
                        Continuar
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Paso 2: Efectivo Registrado */}
                <Step>
                  <StepLabel>Efectivo Registrado</StepLabel>
                  <StepContent>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='h6' gutterBottom>
                          EFECTIVO REGISTRADO POR REPARTIDOR
                        </Typography>

                        <Box sx={{ mb: 3 }}>
                          <Typography variant='body1' gutterBottom>
                            Método elegido:{' '}
                            {repartidorSeleccionado.efectivo.metodo === 'depositado-cajero'
                              ? 'DEPOSITADO EN CAJERO'
                              : 'ENTREGADO EN PLANTA'}
                          </Typography>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label='Monto Depositado'
                              value={repartidorSeleccionado.efectivo.montoDepositado}
                              InputProps={{
                                startAdornment: <InputAdornment position='start'>$</InputAdornment>
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label='Billetes Rechazados'
                              value={repartidorSeleccionado.efectivo.billetesRechazados}
                              InputProps={{
                                startAdornment: <InputAdornment position='start'>$</InputAdornment>
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label='Monedas Entregadas'
                              value={repartidorSeleccionado.efectivo.monedasEntregadas}
                              InputProps={{
                                startAdornment: <InputAdornment position='start'>$</InputAdornment>
                              }}
                            />
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 2 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={validaciones.efectivo}
                                onChange={e => manejarValidacion('efectivo', e.target.checked)}
                              />
                            }
                            label={
                              repartidorSeleccionado.efectivo.metodo === 'depositado-cajero'
                                ? 'Confirmar depósito en cajero'
                                : 'Confirmar recepción efectivo'
                            }
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Button onClick={() => setPasoActual(0)}>Anterior</Button>
                      <Button variant='contained' onClick={() => setPasoActual(2)}>
                        Continuar
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Paso 3: Formas de Pago */}
                <Step>
                  <StepLabel>Formas de Pago</StepLabel>
                  <StepContent>
                    <Typography variant='h6' gutterBottom>
                      Pendientes de Validar
                    </Typography>

                    {/* Pago Terminal */}
                    {repartidorSeleccionado.formasPago.terminal.monto > 0 && (
                      <Card variant='outlined' sx={{ mb: 3 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={validaciones.terminal}
                                  onChange={e => manejarValidacion('terminal', e.target.checked)}
                                />
                              }
                              label={
                                <Typography variant='h6' color='primary'>
                                  Pago terminal: ${repartidorSeleccionado.formasPago.terminal.monto.toLocaleString()}
                                </Typography>
                              }
                            />
                          </Box>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label='Folio de validación'
                                placeholder='Ingrese el folio del comprobante'
                                value={foliosArchivosValidacion.terminal.folio}
                                onChange={e => manejarCambioFolioArchivo('terminal', 'folio', e.target.value)}
                                disabled={!validaciones.terminal}
                                required={validaciones.terminal}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                  fullWidth
                                  label='Archivo adjunto'
                                  placeholder='Seleccionar archivo'
                                  value={foliosArchivosValidacion.terminal.archivo}
                                  disabled
                                />
                                <Button
                                  variant='outlined'
                                  component='label'
                                  disabled={!validaciones.terminal}
                                  startIcon={<AddIcon />}
                                >
                                  Adjuntar
                                  <input
                                    type='file'
                                    hidden
                                    onChange={e => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        manejarCambioFolioArchivo('terminal', 'archivo', file.name)
                                      }
                                    }}
                                  />
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    )}

                    {/* Transferencias */}
                    {repartidorSeleccionado.formasPago.transferencias.monto > 0 && (
                      <Card variant='outlined' sx={{ mb: 3 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={validaciones.transferencias}
                                  onChange={e => manejarValidacion('transferencias', e.target.checked)}
                                />
                              }
                              label={
                                <Typography variant='h6' color='success.main'>
                                  Transferencias: ${repartidorSeleccionado.formasPago.transferencias.monto.toLocaleString()}
                                </Typography>
                              }
                            />
                          </Box>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label='Folio de validación'
                                placeholder='Ingrese el folio del comprobante'
                                value={foliosArchivosValidacion.transferencias.folio}
                                onChange={e => manejarCambioFolioArchivo('transferencias', 'folio', e.target.value)}
                                disabled={!validaciones.transferencias}
                                required={validaciones.transferencias}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                  fullWidth
                                  label='Archivo adjunto'
                                  placeholder='Seleccionar archivo'
                                  value={foliosArchivosValidacion.transferencias.archivo}
                                  disabled
                                />
                                <Button
                                  variant='outlined'
                                  component='label'
                                  disabled={!validaciones.transferencias}
                                  startIcon={<AddIcon />}
                                >
                                  Adjuntar
                                  <input
                                    type='file'
                                    hidden
                                    onChange={e => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        manejarCambioFolioArchivo('transferencias', 'archivo', file.name)
                                      }
                                    }}
                                  />
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    )}

                    {/* Cheques */}
                    {repartidorSeleccionado.formasPago.cheques.monto > 0 && (
                      <Card variant='outlined' sx={{ mb: 3 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={validaciones.cheques}
                                  onChange={e => manejarValidacion('cheques', e.target.checked)}
                                />
                              }
                              label={
                                <Typography variant='h6' color='warning.main'>
                                  Cheques: ${repartidorSeleccionado.formasPago.cheques.monto.toLocaleString()}
                                </Typography>
                              }
                            />
                          </Box>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label='Folio de validación'
                                placeholder='Ingrese el folio del comprobante'
                                value={foliosArchivosValidacion.cheques.folio}
                                onChange={e => manejarCambioFolioArchivo('cheques', 'folio', e.target.value)}
                                disabled={!validaciones.cheques}
                                required={validaciones.cheques}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                  fullWidth
                                  label='Archivo adjunto'
                                  placeholder='Seleccionar archivo'
                                  value={foliosArchivosValidacion.cheques.archivo}
                                  disabled
                                />
                                <Button
                                  variant='outlined'
                                  component='label'
                                  disabled={!validaciones.cheques}
                                  startIcon={<AddIcon />}
                                >
                                  Adjuntar
                                  <input
                                    type='file'
                                    hidden
                                    onChange={e => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        manejarCambioFolioArchivo('cheques', 'archivo', file.name)
                                      }
                                    }}
                                  />
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Button onClick={() => setPasoActual(1)}>Anterior</Button>
                      <Button variant='contained' onClick={() => setPasoActual(3)}>
                        Continuar
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Paso 4: Reporte Físico (Solo Pipas) */}
                {repartidorSeleccionado.tipo === 'pipas' && repartidorSeleccionado.reporteFisico && (
                  <Step>
                    <StepLabel>Validación Reporte Físico</StepLabel>
                    <StepContent>
                      <Card variant='outlined'>
                        <CardContent>
                          <Typography variant='h6' gutterBottom>
                            VALIDACIÓN REPORTE FÍSICO
                          </Typography>

                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label='Total Servicios según Reporte'
                                defaultValue={repartidorSeleccionado.reporteFisico.totalServicios}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label='Total Litros según Reporte'
                                defaultValue={repartidorSeleccionado.reporteFisico.totalLitros}
                              />
                            </Grid>
                          </Grid>

                          <Typography variant='h6' gutterBottom>
                            Comparativa Sistema vs Reporte
                          </Typography>

                          <TableContainer component={Paper} variant='outlined'>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Concepto</TableCell>
                                  <TableCell align='center'>Sistema</TableCell>
                                  <TableCell align='center'>Reporte</TableCell>
                                  <TableCell align='center'>Estado</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell>Total Servicios</TableCell>
                                  <TableCell align='center'>{repartidorSeleccionado.ventas.litrosServicios}</TableCell>
                                  <TableCell align='center'>
                                    {repartidorSeleccionado.reporteFisico.totalServicios}
                                  </TableCell>
                                  <TableCell align='center'>
                                    <CheckIcon color='success' />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Total Litros</TableCell>
                                  <TableCell align='center'>650</TableCell>
                                  <TableCell align='center'>
                                    {repartidorSeleccionado.reporteFisico.totalLitros}
                                  </TableCell>
                                  <TableCell align='center'>
                                    <CheckIcon color='success' />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Rango Servicios</TableCell>
                                  <TableCell align='center'>001-008</TableCell>
                                  <TableCell align='center'>
                                    {repartidorSeleccionado.reporteFisico.rangoServicios}
                                  </TableCell>
                                  <TableCell align='center'>
                                    <CheckIcon color='success' />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>

                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={validaciones.reporteFisico}
                                  onChange={e => manejarValidacion('reporteFisico', e.target.checked)}
                                />
                              }
                              label='Confirmar validación reporte físico'
                            />
                          </Box>
                        </CardContent>
                      </Card>

                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button onClick={() => setPasoActual(2)}>Anterior</Button>
                        <Button variant='contained' onClick={() => setPasoActual(4)}>
                          Continuar
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                )}

                {/* Paso 5: Estado Final */}
                <Step>
                  <StepLabel>Estado Final</StepLabel>
                  <StepContent>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='h6' gutterBottom>
                          OBSERVACIONES DEL CORTE
                        </Typography>

                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          placeholder='Ingrese observaciones sobre el corte...'
                          value={observaciones}
                          onChange={e => setObservaciones(e.target.value)}
                          sx={{ mb: 3 }}
                        />

                        <Typography variant='h6' gutterBottom>
                          Estado Final
                        </Typography>

                        <RadioGroup value={estadoFinal} onChange={e => setEstadoFinal(e.target.value)}>
                          <FormControlLabel
                            value='aprobado-sin-observaciones'
                            control={<Radio />}
                            label='APROBADO SIN OBSERVACIONES'
                          />
                          <FormControlLabel
                            value='aprobado-con-observaciones'
                            control={<Radio />}
                            label='APROBADO CON OBSERVACIONES'
                          />
                          <FormControlLabel
                            value='rechazado'
                            control={<Radio />}
                            label='RECHAZADO - REQUIERE CORRECCIÓN'
                          />
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Button onClick={() => setPasoActual(repartidorSeleccionado.tipo === 'pipas' ? 3 : 2)}>
                        Anterior
                      </Button>
                      <Button variant='contained' color='success' startIcon={<CheckIcon />}>
                        APROBAR Y NOTIFICAR REPARTIDOR
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Apertura de Caja */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'apertura'} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWalletIcon color='success' />
            Apertura de Caja
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity='info' sx={{ mb: 3 }}>
              <AlertTitle>Información</AlertTitle>
              Al abrir la caja, se registrará el monto inicial y se iniciarán las operaciones del día.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Monto Inicial de Caja'
                  type='number'
                  value={formularioCaja.montoInicial}
                  onChange={e => manejarCambioFormularioCaja('montoInicial', Number(e.target.value))}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Efectivo Físico Verificado'
                  type='number'
                  value={formularioCaja.efectivoFisico}
                  onChange={e => manejarCambioFormularioCaja('efectivoFisico', Number(e.target.value))}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Observaciones'
                  multiline
                  rows={3}
                  value={formularioCaja.observaciones}
                  onChange={e => manejarCambioFormularioCaja('observaciones', e.target.value)}
                  placeholder='Observaciones sobre la apertura de caja...'
                />
              </Grid>
            </Grid>

            {formularioCaja.montoInicial !== formularioCaja.efectivoFisico && (
              <Alert severity='warning' sx={{ mt: 2 }}>
                <AlertTitle>Diferencia Detectada</AlertTitle>
                El monto inicial y el efectivo físico no coinciden. Verifique los montos antes de continuar.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button
            onClick={procesarAperturaCierre}
            variant='contained'
            color='success'
            startIcon={<AddIcon />}
            disabled={formularioCaja.montoInicial <= 0 || formularioCaja.efectivoFisico <= 0}
          >
            Abrir Caja
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Cierre de Caja */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'cierre'} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWalletIcon color='error' />
            Cierre de Caja
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity='warning' sx={{ mb: 3 }}>
              <AlertTitle>Advertencia</AlertTitle>
              Al cerrar la caja, se finalizarán las operaciones del día. Asegúrese de que todos los cortes estén
              validados.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Monto Final de Caja'
                  type='number'
                  value={formularioCaja.montoFinal}
                  onChange={e => manejarCambioFormularioCaja('montoFinal', Number(e.target.value))}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Efectivo Físico Verificado'
                  type='number'
                  value={formularioCaja.efectivoFisico}
                  onChange={e => manejarCambioFormularioCaja('efectivoFisico', Number(e.target.value))}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Observaciones'
                  multiline
                  rows={3}
                  value={formularioCaja.observaciones}
                  onChange={e => manejarCambioFormularioCaja('observaciones', e.target.value)}
                  placeholder='Observaciones sobre el cierre de caja...'
                />
              </Grid>
            </Grid>

            {/* Resumen de Cortes */}
            <Card variant='outlined' sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Resumen de Cortes del Día
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Cortes Entregados
                    </Typography>
                    <Typography variant='h6' color='primary'>
                      {repartidoresCorte.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Cortes Validados
                    </Typography>
                    <Typography variant='h6' color='success.main'>
                      {repartidoresCorte.filter(r => r.estado === 'validado').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Cortes Pendientes
                    </Typography>
                    <Typography variant='h6' color='warning.main'>
                      {repartidoresCorte.filter(r => r.estado === 'pendiente').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Total del Día
                    </Typography>
                    <Typography variant='h6' color='primary'>
                      ${repartidoresCorte.reduce((sum, r) => sum + r.totalDia, 0).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {formularioCaja.montoFinal !== formularioCaja.efectivoFisico && (
              <Alert severity='error' sx={{ mt: 2 }}>
                <AlertTitle>Diferencia Detectada</AlertTitle>
                El monto final y el efectivo físico no coinciden. Verifique los montos antes de continuar.
              </Alert>
            )}

            {repartidoresCorte.filter(r => r.estado === 'pendiente').length > 0 && (
              <Alert severity='warning' sx={{ mt: 2 }}>
                <AlertTitle>Cortes Pendientes</AlertTitle>
                Hay {repartidoresCorte.filter(r => r.estado === 'pendiente').length} cortes pendientes de validar. Se
                recomienda validarlos antes del cierre.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button
            onClick={procesarAperturaCierre}
            variant='contained'
            color='error'
            startIcon={<CloseIcon />}
            disabled={formularioCaja.montoFinal <= 0 || formularioCaja.efectivoFisico <= 0}
          >
            Cerrar Caja
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Validación de Depósito */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'validar-deposito'} onClose={cerrarDialogo} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon color='primary' />
            Validación de Depósito Bancario
          </Box>
        </DialogTitle>
        <DialogContent>
          {depositoSeleccionado && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='h6' gutterBottom>
                Repartidor: {depositoSeleccionado.repartidorNombre}
              </Typography>
              
              <Card variant='outlined' sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Información del Depósito
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Folio reportado por repartidor
                      </Typography>
                      <Typography variant='h6' fontWeight='bold'>
                        {depositoSeleccionado.folioRepartidor}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Monto depositado
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        ${depositoSeleccionado.monto.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Fecha y hora del depósito
                      </Typography>
                      <Typography variant='body2'>
                        {new Date(depositoSeleccionado.fechaDeposito).toLocaleDateString('es-MX')} - {depositoSeleccionado.horaDeposito}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Estado actual
                      </Typography>
                      <Chip
                        label={depositoSeleccionado.estado.replace('-', ' ').toUpperCase()}
                        color={getEstadoDepositoColor(depositoSeleccionado.estado) as any}
                        size='small'
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Typography variant='h6' gutterBottom>
                Validación del Auxiliar
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Folio en comprobante físico'
                    placeholder='Capturar folio del comprobante físico'
                    required
                    helperText='Campo obligatorio para validar'
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Monto verificado'
                    type='number'
                    defaultValue={depositoSeleccionado.monto}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>$</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Checkbox />}
                    label='Comprobante físico recibido'
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    sx={{ mb: 2 }}
                  >
                    Subir foto del ticket físico
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Observaciones'
                    multiline
                    rows={3}
                    placeholder='Observaciones sobre la validación...'
                  />
                </Grid>
              </Grid>

              {/* Comparación de Folios */}
              <Card variant='outlined' sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Comparación de Folios
                  </Typography>
                  
                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Concepto</TableCell>
                          <TableCell align='center'>Folio Repartidor</TableCell>
                          <TableCell align='center'>Folio Físico</TableCell>
                          <TableCell align='center'>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Folio de Depósito</TableCell>
                          <TableCell align='center'>{depositoSeleccionado.folioRepartidor}</TableCell>
                          <TableCell align='center'>
                            <TextField
                              size='small'
                              placeholder='Capturar folio físico'
                            />
                          </TableCell>
                          <TableCell align='center'>
                            <Chip
                              label='PENDIENTE'
                              color='warning'
                              size='small'
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            Cancelar
          </Button>
          <Button variant='contained' color='error'>
            Marcar Diferencia
          </Button>
          <Button variant='contained' color='success'>
            Validar Depósito
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
