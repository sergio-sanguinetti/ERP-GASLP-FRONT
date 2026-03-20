'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { 
  creditosAbonosAPI, 
  clientesAPI, 
  rutasAPI, 
  formasPagoAPI,
  authAPI,
  sedesAPI,
  usuariosAPI,
  type ClienteCredito as ClienteCreditoAPI,
  type NotaCredito as NotaCreditoAPI,
  type Pago as PagoAPI,
  type ResumenCartera,
  type HistorialLimiteCredito,
  type Usuario,
  type Sede,
  type Ruta,
  type FormaPago,
  pedidosAPI,
  configuracionTicketsAPI,
  type Pedido,
  type ConfiguracionTicket
} from '@/lib/api'
import { generarHtmlTicketVenta } from '@/lib/ticketUtils'
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
  TablePagination,
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
  Radio
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
  Close as CloseIcon,
  Group as GroupIcon,
  SwapHoriz as SwapHorizIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  LocalAtm as LocalAtmIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

// Tipos de datos (usando los de la API)
type ClienteCredito = ClienteCreditoAPI
type NotaCredito = NotaCreditoAPI

type ResumenCredito = ResumenCartera

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
  registradoPorNombre?: string
  fechaHora: string
  fechaHora: string
  observaciones: string
  ruta?: string
  pagoCompleto?: PagoAPI
}

export default function CreditosAbonosPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'clientes' | 'pagos-pendientes' | 'pagos-sbc'>('dashboard')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteCredito | null>(null)
  const refFichaCliente = useRef<HTMLDivElement | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'modificar-limite' | 'bloquear' | 'estado-cuenta' | 'registrar-pago' | 'registrar-abono'>('modificar-limite')
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaCredito | null>(null)
  const [formasPago, setFormasPago] = useState<Array<{ id: string; formaPagoId: string; metodo: string; monto: number; referencia?: string; banco?: string }>>([])
  const [montoTotalPago, setMontoTotalPago] = useState(0)
  const [filtros, setFiltros] = useState({
    nombre: '',
    ruta: '',
    estado: '',
    deuda: '', // '' = todos, 'con-deuda' = solo con saldo > 0, 'sin-deuda' = al día
    saldoMin: '',
    saldoMax: '',
    diasVencimientoMin: '',
    diasVencimientoMax: ''
  })
  const [tabValue, setTabValue] = useState(0)
  const [contadorId, setContadorId] = useState(0)
  
  // Estados para datos del servidor
  const [resumenCredito, setResumenCredito] = useState<ResumenCredito>({
    carteraTotal: 0,
    notasPendientes: 0,
    carteraVencida: 0,
    notasVencidas: 0,
    porcentajeVencida: 0,
    carteraPorVencer: 0,
    notasPorVencer: 0,
    porcentajePorVencer: 0
  })
  const [clientesCredito, setClientesCredito] = useState<ClienteCredito[]>([])
  const [clientesDashboard, setClientesDashboard] = useState<ClienteCredito[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [ordenClientes, setOrdenClientes] = useState<'saldo_desc' | 'saldo_asc' | 'nombre_asc' | 'reciente'>('saldo_desc')
  const [filtroChofer, setFiltroChofer] = useState('')
  const [pagosPendientesAutorizacion, setPagosPendientesAutorizacion] = useState<PagoPendienteAutorizacion[]>([])
  const [historialPagos, setHistorialPagos] = useState<Pago[]>([])
  const [historialLimites, setHistorialLimites] = useState<HistorialLimite[]>([])
  const [pedidosSBC, setPedidosSBC] = useState<any[]>([])
  const [loadingSBC, setLoadingSBC] = useState(false)
  const [errorSbc, setErrorSbc] = useState<string | null>(null)
  const [filtroEstadoSbc, setFiltroEstadoSbc] = useState<string>('pendiente')
  const [filtroBusquedaSbc, setFiltroBusquedaSbc] = useState('')
  const [modalSbc, setModalSbc] = useState(false)
  const [pagoSbcSel, setPagoSbcSel] = useState<any | null>(null)
  const [tipoAccionSbc, setTipoAccionSbc] = useState<'oficina' | 'sanluis' | 'rechazar' | 'reactivar'>('oficina')
  const [modalPago, setModalPago] = useState(false)
  const [pagoSelModal, setPagoSelModal] = useState<any>(null)
  const [tipoAccionPago, setTipoAccionPago] = useState<'revision' | 'autorizar' | 'rechazar' | 'reactivar'>('revision')
  const [notaAccionPago, setNotaAccionPago] = useState('')
  const [folioConfirmacionPago, setFolioConfirmacionPago] = useState('')
  const [filtroEstadoPagos, setFiltroEstadoPagos] = useState<string>('en_revision')
  const [folioConfSbc, setFolioConfSbc] = useState('')
  const [notaConfSbc, setNotaConfSbc] = useState('')
  const [filtroOperadorSbc, setFiltroOperadorSbc] = useState('')
  const [filtroTipoSbc, setFiltroTipoSbc] = useState('')
  const [filtroMetodoPagoSbc, setFiltroMetodoPagoSbc] = useState('')
  const [ticketSbcAbierto, setTicketSbcAbierto] = useState(false)
  const [pedidoTicketSbc, setPedidoTicketSbc] = useState<Pedido | null>(null)
  const [htmlTicketSbc, setHtmlTicketSbc] = useState('')
  const [loadingTicketSbc, setLoadingTicketSbc] = useState(false)
  const [kpisSbc, setKpisSbc] = useState({ totalPendiente: 0, totalPendienteCount: 0, totalConfOficina: 0, totalConfSanLuis: 0, transferencia: 0, cheque: 0, deposito: 0, urgentes: 0, montoUrgentes: 0 })
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [formasPagoDisponibles, setFormasPagoDisponibles] = useState<FormaPago[]>([])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [sedes, setSedes] = useState<Sede[]>([])
  const [sedeId, setSedeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [nuevoLimite, setNuevoLimite] = useState(0)
  const [motivoLimite, setMotivoLimite] = useState('')
  const [formatoEstadoCuenta, setFormatoEstadoCuenta] = useState<'pdf' | 'excel'>('pdf')
  const [periodoDesdeEC, setPeriodoDesdeEC] = useState('')
  const [periodoHastaEC, setPeriodoHastaEC] = useState(new Date().toISOString().split('T')[0])
  const [observacionesPago, setObservacionesPago] = useState('')
  const [limitesEditados, setLimitesEditados] = useState<Record<string, { limite: number; motivo: string }>>({})
  const [modalDetallePago, setModalDetallePago] = useState(false)
  const [pagoSeleccionadoDetalle, setPagoSeleccionadoDetalle] = useState<PagoAPI | null>(null)
  const [usuarioRegistroNombre, setUsuarioRegistroNombre] = useState<string>('')
  const [usuarioAutorizacionNombre, setUsuarioAutorizacionNombre] = useState<string>('')

  const [pageClientes, setPageClientes] = useState(0)
  const [rowsPerPageClientes, setRowsPerPageClientes] = useState(10)
  const [totalClientes, setTotalClientes] = useState(0)
  const [pageHistorial, setPageHistorial] = useState(0)
  const [rowsPerPageHistorial, setRowsPerPageHistorial] = useState(10)
  const [totalHistorial, setTotalHistorial] = useState(0)

  // Buscador y filtro de ruta propios de la sección Límites Individuales por Cliente
  const [filtroNombreLimites, setFiltroNombreLimites] = useState('')

  // Buscador y filtro por ruta en Pagos Pendientes e Historial de Pagos
  const [filtroBusquedaPagosPendientes, setFiltroBusquedaPagosPendientes] = useState('')
  const [filtroBusquedaHistorialPagos, setFiltroBusquedaHistorialPagos] = useState('')
  const [filtroRutaPagosPendientes, setFiltroRutaPagosPendientes] = useState<string>('todas')
  // Filtros propios del Historial de Pagos: ruta (todas por defecto) y fechas (hoy por defecto)
  const [filtroRutaHistorialPagos, setFiltroRutaHistorialPagos] = useState<string>('todas')
  const [fechaDesdeHistorialPagos, setFechaDesdeHistorialPagos] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [fechaHastaHistorialPagos, setFechaHastaHistorialPagos] = useState<string>(() => new Date().toISOString().slice(0, 10))

  // Filtros del Dashboard (resumen cartera): ruta y fechas
  const [filtroRutaDashboard, setFiltroRutaDashboard] = useState<string>('todas')
  const [fechaDesdeDashboard, setFechaDesdeDashboard] = useState<string>('')
  const [fechaHastaDashboard, setFechaHastaDashboard] = useState<string>('')

  // Paginación client-side: Pagos Pendientes e Historial de Pagos
  const [pagePagosPendientes, setPagePagosPendientes] = useState(0)
  const [rowsPerPagePagosPendientes, setRowsPerPagePagosPendientes] = useState(10)
  const [pageHistorialPagos, setPageHistorialPagos] = useState(0)
  const [rowsPerPageHistorialPagos, setRowsPerPageHistorialPagos] = useState(10)

  // Clientes duplicados
  const [clientesDuplicados, setClientesDuplicados] = useState<any[][]>([])
  const [loadingDuplicados, setLoadingDuplicados] = useState(false)
  const [principalSel, setPrincipalSel] = useState<Record<number, string>>({})
  const [pageDuplicados, setPageDuplicados] = useState(0)
  const [rowsPerPageDuplicados, setRowsPerPageDuplicados] = useState(10)


  const fetchSbc = async (path: string, options: RequestInit = {}) => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token') || '') : ''
    return fetch(API + path, {
      ...options,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', ...(options.headers || {}) }
    })
  }

  const cargarPedidosSBC = async (estado?: string) => {
    try {
      setLoadingSBC(true)
      setErrorSbc(null)
      // Cargar siempre todos para calcular KPIs, filtrar en frontend
      const params = new URLSearchParams()
      params.append('estado', 'todos')
      if (sedeId) params.append('sedeId', sedeId)
      const res = await fetchSbc('/sbc/?' + params.toString())
      if (!res.ok) throw new Error('Error al cargar pagos SBC')
      const data: any[] = await res.json()
      setPedidosSBC(Array.isArray(data) ? data : [])
      // Calcular KPIs
      const pendientes = data.filter(p => !p.estadoSbc || p.estadoSbc === 'pendiente')
      const confOficina = data.filter(p => p.estadoSbc === 'confirmado_oficina')
      const confSanLuis = data.filter(p => p.estadoSbc === 'confirmado_sanluis')
      const ahora = new Date()
      const urgentes = pendientes.filter(p => {
        if (!p.fechaPedido) return false
        const dias = (ahora.getTime() - new Date(p.fechaPedido).getTime()) / 86400000
        return dias >= 3
      })
      setKpisSbc({
        totalPendiente: pendientes.reduce((s, p) => s + (p.monto || 0), 0),
        totalPendienteCount: pendientes.length,
        totalConfOficina: confOficina.reduce((s, p) => s + (p.monto || 0), 0),
        totalConfSanLuis: confSanLuis.reduce((s, p) => s + (p.monto || 0), 0),
        transferencia: data.filter(p => p.metodoPago === 'TRANSFERENCIA' && (!p.estadoSbc || p.estadoSbc === 'pendiente')).length,
        cheque: data.filter(p => p.metodoPago === 'CHEQUE' && (!p.estadoSbc || p.estadoSbc === 'pendiente')).length,
        deposito: data.filter(p => p.metodoPago === 'DEPOSITO' && (!p.estadoSbc || p.estadoSbc === 'pendiente')).length,
        urgentes: urgentes.length,
        montoUrgentes: urgentes.reduce((s, p) => s + (p.monto || 0), 0),
      })
      // Aplicar filtro de estado si hay
      const estadoFiltro = estado || filtroEstadoSbc
      if (estadoFiltro && estadoFiltro !== 'todos') {
        // Filter is handled in the UI rendering
      }
    } catch (e: any) {
      setErrorSbc(e.message || 'Error al cargar pagos SBC')
    } finally {
      setLoadingSBC(false)
    }
  }

  const cargarClientesDashboard = async () => {
    if (loadingDashboard) return
    try {
      setLoadingDashboard(true)
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token') || '') : ''
      // Traer todas las páginas hasta agotar
      let todos: any[] = []
      let page = 1
      const PAGE_SIZE = 100
      while (true) {
        const params = new URLSearchParams()
        params.append('pageSize', String(PAGE_SIZE))
        params.append('page', String(page))
        params.append('saldoMin', '0.01')
        if (sedeId) params.append('sedeId', sedeId)
        const res = await fetch(API + '/creditos-abonos/clientes-credito?' + params.toString(), {
          headers: { 'Authorization': 'Bearer ' + token }
        })
        if (!res.ok) break
        const data = await res.json()
        const clientes = Array.isArray(data.clientes) ? data.clientes : []
        todos = [...todos, ...clientes]
        if (clientes.length < PAGE_SIZE || todos.length >= data.total) break
        page++
      }
      setClientesDashboard(todos)
    } catch (e) { console.error('Error dashboard clientes', e) }
    finally { setLoadingDashboard(false) }
  }

  const abrirTicketSbc = async (pedidoId: string) => {
    try {
      setLoadingTicketSbc(true)
      setTicketSbcAbierto(true)
      const pedido = await pedidosAPI.getById(pedidoId)
      setPedidoTicketSbc(pedido)
      let config: ConfiguracionTicket
      try { config = await configuracionTicketsAPI.get('venta') }
      catch { config = { id: '', tipoTicket: 'venta', nombreEmpresa: 'GAS PROVIDENCIA', razonSocial: '', direccion: '', telefono: '', email: '', sitioWeb: '', rfc: '', logo: '', mostrarLogo: false, tamañoLogo: 'mediano', redesSociales: {}, mostrarRedesSociales: false, textos: { encabezado: '', piePagina: '', mostrarMensaje: false }, diseño: { mostrarFecha: true, mostrarHora: true, mostrarCajero: true, mostrarCliente: true, colorPrincipal: '#1976d2', alineacion: 'centro' }, urlQR: '', activo: true, fechaCreacion: '', fechaModificacion: '' } }
      // Generate simple HTML ticket for SBC context
      setHtmlTicketSbc(generarHtmlTicketVenta(pedido, config))
    } catch (e: any) { setError('Error al cargar ticket: ' + e.message) }
    finally { setLoadingTicketSbc(false) }
  }

  const abrirModalSbc = (pago: any, accion: 'oficina' | 'sanluis' | 'rechazar' | 'reactivar') => {
    setPagoSbcSel(pago)
    setTipoAccionSbc(accion)
    setFolioConfSbc(pago.folioConfirmado || pago.folioOriginal || '')
    setNotaConfSbc('')
    setModalSbc(true)
  }

  const ejecutarAccionSbc = async () => {
    if (!pagoSbcSel) return
    // Validar permisos por rol
    const rolUsuario = usuario?.rol || ''
    const rolesSanLuis = ['superAdministrador', 'administrador']
    if (tipoAccionSbc === 'sanluis' && !rolesSanLuis.includes(rolUsuario)) {
      setError('Solo Administrador o SuperAdministrador puede confirmar como San Luis.')
      return
    }
    try {
      setSaving(true)
      const endpoint = tipoAccionSbc === 'oficina' ? 'confirmar-oficina'
        : tipoAccionSbc === 'sanluis' ? 'confirmar-sanluis'
        : tipoAccionSbc === 'reactivar' ? 'reactivar' : 'rechazar'
      const body: any = { notaConfirmacion: notaConfSbc }
      if (tipoAccionSbc === 'oficina') body.folioConfirmado = folioConfSbc
      const res = await fetchSbc('/sbc/' + pagoSbcSel.id + '/' + endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Error al actualizar pago SBC')
      setSuccessMessage(tipoAccionSbc === 'rechazar' ? 'Pago rechazado' : tipoAccionSbc === 'reactivar' ? 'Pago reactivado — vuelve a Pendiente' : 'Pago confirmado correctamente')
      setModalSbc(false)
      setPagoSbcSel(null)
      await cargarPedidosSBC()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const cargarDuplicados = async () => {
    try {
      setLoadingDuplicados(true)
      const data = await clientesAPI.getDuplicados()
      setClientesDuplicados(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingDuplicados(false)
    }
  }

  useEffect(() => {
    if (vistaActual === 'clientes-duplicados') {
      cargarDuplicados()
    }
  }, [vistaActual])

  const manejarUnificar = async (grupoIndex: number, principalId: string, secundariosIds: string[]) => {
    if (!principalId || secundariosIds.length === 0) {
      setError('Seleccione un cliente principal. Asegúrese de que hay al menos 2 clientes para unificar.')
      return
    }
    try {
      setSaving(true)
      await clientesAPI.unificar(principalId, secundariosIds)
      setSuccessMessage('Clientes unificados correctamente')
      cargarDuplicados()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Mapa ID usuario -> nombre para mostrar en historial de pagos (Registrado por / Autorizado por)
  const [usuariosNombresMapHistorial, setUsuariosNombresMapHistorial] = useState<Map<string, string>>(new Map())

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Flujo obligatorio: primero obtener todas las rutas de la sede, luego con la primera ruta traer clientes
  useEffect(() => {
    const cargarRutas = async (): Promise<Ruta[]> => {
      try {
        if (sedeId) {
          const rutasData = await rutasAPI.getAll({ sedeId })
          setRutas(rutasData)
          return rutasData
        }
        const rutasData = await rutasAPI.getAll()
        setRutas(rutasData)
        return rutasData
      } catch (err) {
        console.error('Error al cargar rutas:', err)
        if (sedeId) {
          try {
            const rutasData = await rutasAPI.getAll()
            setRutas(rutasData)
            return rutasData
          } catch (err2) {
            console.error('Error al cargar todas las rutas:', err2)
            return []
          }
        }
        return []
      }
    }
    cargarRutas().then((rutasData) => {
      if (rutasData && rutasData.length > 0) {
        cargarDatos(rutasData)
      } else {
        setClientesCredito([])
        setTotalClientes(0)
        setHistorialLimites([])
        setTotalHistorial(0)
        setResumenCredito({
          carteraTotal: 0,
          notasPendientes: 0,
          carteraVencida: 0,
          notasVencidas: 0,
          porcentajeVencida: 0,
          carteraPorVencer: 0,
          notasPorVencer: 0,
          porcentajePorVencer: 0
        })
        setPagosPendientesAutorizacion([])
        setHistorialPagos([])
        setLoading(false)
      }
    })
  }, [sedeId])

  useEffect(() => {
    if (sedeId) cargarClientesDashboard()
  }, [sedeId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const user = await authAPI.getProfile()
      setUsuario(user)
      
      const [sedesData, formasPagoData] = await Promise.all([
        sedesAPI.getAll(),
        formasPagoAPI.getAll()
      ])
      
      setSedes(sedesData)
      setFormasPagoDisponibles(formasPagoData)

      // Resolver sede: puede venir como ID (UUID) o como nombre
      let sedeUsuarioId: string | null = null
      if (user.sede) {
        const sedeEncontrada = sedesData.find(
          s => s.id === user.sede || s.nombre === user.sede || (typeof user.sede === 'string' && s.nombre.toUpperCase() === user.sede.toUpperCase())
        )
        sedeUsuarioId = sedeEncontrada?.id ?? null
      }

      // Solo superAdministrador puede elegir sede; Administrador y Gestor solo ven su sede asignada
      const initialSedeId = user.rol === 'superAdministrador'
        ? (sedeUsuarioId || sedesData[0]?.id || null)
        : sedeUsuarioId

      // El useEffect que depende de sedeId se encargará de cargar rutas de la sede y luego clientes (primera ruta)
      setSedeId(initialSedeId)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos iniciales')
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const cargarDatos = async (
    rutasRecienCargadas?: Ruta[],
    overrides?: { pageClientes?: number; pageHistorial?: number; rowsPerPageClientes?: number; rowsPerPageHistorial?: number }
  ) => {
    try {
      setLoading(true)
      setError(null)

      const listaRutas = rutasRecienCargadas ?? rutas
      const primeraRutaId = listaRutas.length > 0 ? listaRutas[0].id : undefined

      const filtrosAPI: any = {}
      if (sedeId) {
        filtrosAPI.sedeId = sedeId
      }
      if (filtros.nombre) {
        filtrosAPI.nombre = filtros.nombre
      }
      if (filtros.ruta) {
        const rutaEncontrada = listaRutas.find(r => r.nombre === filtros.ruta)
        if (rutaEncontrada) {
          filtrosAPI.rutaId = rutaEncontrada.id
        }
      }
      // Filtro por chofer — buscar todas las rutas que contengan el texto
      if (filtroChofer.trim()) {
        const rutasDelChofer = listaRutas.filter(r => r.nombre.toLowerCase().includes(filtroChofer.toLowerCase()))
        if (rutasDelChofer.length === 1) {
          filtrosAPI.rutaId = rutasDelChofer[0].id
        }
        // Si hay múltiples rutas con ese chofer, filtrar en frontend con cumpleChofer
      }
      // No forzar primera ruta — mostrar todos los clientes con saldo por defecto
      if (!filtrosAPI.saldoMin && filtros.deuda !== 'sin-deuda') {
        filtrosAPI.saldoMin = '0.01'
      }
      // Solo enviar estadoCliente al API cuando es un valor del enum del backend (activo/suspendido/inactivo).
      // Los valores buen-pagador, vencido, critico, bloqueado son estado de crédito y se filtran en cliente.
      const estadoClienteValidos = ['activo', 'suspendido', 'inactivo']
      if (filtros.estado && estadoClienteValidos.includes(filtros.estado)) {
        filtrosAPI.estadoCliente = filtros.estado
      }
      if (filtros.saldoMin !== '') filtrosAPI.saldoMin = filtros.saldoMin
      if (filtros.saldoMax !== '') filtrosAPI.saldoMax = filtros.saldoMax
      // Fix filtro "con-deuda": mandar saldoMin al backend en vez de filtrar en frontend
      if (filtros.deuda === 'con-deuda' && filtros.saldoMin === '') filtrosAPI.saldoMin = '0.01'
      if (filtros.deuda === 'sin-deuda') { filtrosAPI.saldoMin = '0'; filtrosAPI.saldoMax = '0' }

      const rutaIdParaCarga = filtrosAPI.rutaId
      const pageC = overrides?.pageClientes ?? pageClientes
      const pageH = overrides?.pageHistorial ?? pageHistorial
      const rppClientes = overrides?.rowsPerPageClientes ?? rowsPerPageClientes
      const rppHistorial = overrides?.rowsPerPageHistorial ?? rowsPerPageHistorial

      // Resumen de cartera: filtros propios del Dashboard (ruta + fechas)
      const resumenFiltros: Parameters<typeof creditosAbonosAPI.getResumenCartera>[0] = {}
      if (filtroRutaDashboard && filtroRutaDashboard !== 'todas') {
        const rutaDashboard = listaRutas.find(r => r.nombre === filtroRutaDashboard)
        if (rutaDashboard) resumenFiltros.rutaId = rutaDashboard.id
      }
      if (fechaDesdeDashboard) resumenFiltros.fechaDesde = fechaDesdeDashboard
      if (fechaHastaDashboard) resumenFiltros.fechaHasta = fechaHastaDashboard
      if (filtrosAPI.estadoCliente) resumenFiltros.estadoCliente = filtrosAPI.estadoCliente
      if (filtros.saldoMin !== '') resumenFiltros.saldoMin = filtros.saldoMin
      if (filtros.saldoMax !== '') resumenFiltros.saldoMax = filtros.saldoMax

      // Historial de pagos: filtros propios (ruta = todas por defecto, fechas = hoy por defecto)
      const historialFiltros: { rutaId?: string; fechaDesde?: string; fechaHasta?: string } = {}
      if (filtroRutaHistorialPagos && filtroRutaHistorialPagos !== 'todas') {
        const rutaHistorial = listaRutas.find(r => r.nombre === filtroRutaHistorialPagos)
        if (rutaHistorial) historialFiltros.rutaId = rutaHistorial.id
      }
      if (fechaDesdeHistorialPagos) historialFiltros.fechaDesde = fechaDesdeHistorialPagos
      if (fechaHastaHistorialPagos) historialFiltros.fechaHasta = fechaHastaHistorialPagos

      const pagosPendientesFiltros: { rutaId?: string } = {}
      if (filtroRutaPagosPendientes && filtroRutaPagosPendientes !== 'todas') {
        const rutaPed = listaRutas.find(r => r.nombre === filtroRutaPagosPendientes)
        if (rutaPed) pagosPendientesFiltros.rutaId = rutaPed.id
      }

      const [resumen, clientesResp, pagos, historial] = await Promise.all([
        creditosAbonosAPI.getResumenCartera(Object.keys(resumenFiltros).length > 0 ? resumenFiltros : undefined),
        creditosAbonosAPI.getClientesCredito({
          ...filtrosAPI,
          page: pageC + 1,
          pageSize: rppClientes
        }),
        creditosAbonosAPI.getAllPagos(pagosPendientesFiltros),
        creditosAbonosAPI.getAllPagos(Object.keys(historialFiltros).length > 0 ? historialFiltros : undefined)
      ])

      setResumenCredito(resumen)
      setClientesCredito([...clientesResp.clientes].sort((a,b) => (b.saldoActual ?? 0) - (a.saldoActual ?? 0)))
      setTotalClientes(clientesResp.total)
      
      // Convertir pagos pendientes al formato esperado
      // Obtener nombres de usuarios únicos
      const usuariosIds = [...new Set(pagos.map(p => p.usuarioRegistro).filter(Boolean))]
      const usuariosMap = new Map<string, Usuario>()
      
      // Cargar información de usuarios en paralelo
      await Promise.all(
        usuariosIds.map(async (userId) => {
          try {
            const usuario = await usuariosAPI.getById(userId)
            usuariosMap.set(userId, usuario)
          } catch (err) {
            console.error(`Error al obtener usuario ${userId}:`, err)
          }
        })
      )

      const pagosPendientes = pagos.map(p => {
        const usuario = usuariosMap.get(p.usuarioRegistro)
        const nombreUsuario = usuario 
          ? `${usuario.nombres} ${usuario.apellidoPaterno}`
          : p.usuarioRegistro

        return {
          id: p.id,
          cliente: p.cliente ? `${p.cliente.nombre} ${p.cliente.apellidoPaterno} ${p.cliente.apellidoMaterno}` : 'N/A',
          nota: p.notaCredito?.numeroNota || 'Abono general',
          ruta: p.cliente?.ruta?.nombre || 'Sin ruta',
          montoPagado: p.montoTotal,
          formasPago: p.formasPago?.map(fp => ({
            id: fp.id,
            metodo: fp.formaPago?.tipo || 'efectivo',
            monto: fp.monto,
            referencia: fp.referencia,
            banco: fp.banco
          })) || [],
          registradoPor: p.usuarioRegistro,
          registradoPorNombre: nombreUsuario,
          fechaHora: `${new Date(p.fechaPago).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })} ${p.horaPago}`,
          observaciones: p.observaciones || '',
          pagoCompleto: p
        }
      })
      setPagosPendientesAutorizacion(pagosPendientes)
      setHistorialPagos(historial)

      // Resolver IDs de usuario a nombres para historial de pagos (Registrado por / Autorizado por)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const idsHistorial = new Set<string>()
      historial.forEach((p: PagoAPI) => {
        if (p.usuarioRegistro && uuidRegex.test(p.usuarioRegistro)) idsHistorial.add(p.usuarioRegistro)
        if (p.usuarioAutorizacion && uuidRegex.test(p.usuarioAutorizacion)) idsHistorial.add(p.usuarioAutorizacion)
      })
      const mapNombres = new Map<string, string>()
      await Promise.all(
        Array.from(idsHistorial).map(async (userId) => {
          try {
            const u = await usuariosAPI.getById(userId)
            mapNombres.set(userId, `${u.nombres || ''} ${u.apellidoPaterno || ''}`.trim() || u.correo || userId)
          } catch {
            mapNombres.set(userId, userId)
          }
        })
      )
      setUsuariosNombresMapHistorial(mapNombres)

      setPagePagosPendientes(0)
      setPageHistorialPagos(0)

      // Cargar historial de límites (paginado; misma ruta que el resto)
      const historialLimitesResp = await creditosAbonosAPI.getHistorialLimites(
        rutaIdParaCarga
          ? { rutaId: rutaIdParaCarga, page: pageH + 1, pageSize: rppHistorial }
          : { page: pageH + 1, pageSize: rppHistorial }
      )
      setHistorialLimites(
        historialLimitesResp.historial.map(h => ({
          id: h.id,
          cliente: h.cliente ? `${h.cliente.nombre} ${h.cliente.apellidoPaterno} ${h.cliente.apellidoMaterno}` : 'N/A',
          usuario: h.usuario ? `${h.usuario.nombres} ${h.usuario.apellidoPaterno}` : 'N/A',
          fecha: h.fechaCreacion,
          limiteAnterior: h.limiteAnterior,
          limiteNuevo: h.limiteNuevo,
          motivo: h.motivo
        }))
      )
      setTotalHistorial(historialLimitesResp.total)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generar alertas basadas en los datos reales
  const alertasCredito = useMemo(() => {
    const alertas: Array<{
      id: string
      tipo: 'critica' | 'importante' | 'automatica'
      titulo: string
      descripcion: string
      fecha: string
      cliente?: string
      monto?: number
      diasVencimiento?: number
    }> = []
    const ahora = new Date()

    clientesDashboard.forEach(cliente => {
      // Alerta: excede límite de crédito
      if ((cliente.saldoActual ?? 0) > cliente.limiteCredito && cliente.limiteCredito > 0) {
        alertas.push({
          id: `alerta-${cliente.id}-excede`,
          tipo: 'critica',
          titulo: 'Cliente excede límite de crédito',
          descripcion: `Excede en $${((cliente.saldoActual ?? 0) - cliente.limiteCredito).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`,
          fecha: new Date().toISOString().split('T')[0],
          cliente: cliente.nombre,
          monto: (cliente.saldoActual ?? 0) - cliente.limiteCredito
        })
      }
      // Alerta: notas vencidas más de 30 días (calculado desde fechaVencimiento)
      const notasVencidas30 = (cliente.notasPendientes ?? []).filter(n => {
        if (!n.fechaVencimiento) return false
        const dias = (ahora.getTime() - new Date(n.fechaVencimiento).getTime()) / 86400000
        return dias > 30
      })
      if (notasVencidas30.length > 0) {
        const maxDias = Math.max(...notasVencidas30.map(n => (ahora.getTime() - new Date(n.fechaVencimiento!).getTime()) / 86400000))
        const montoVencido = notasVencidas30.reduce((s, n) => s + (n.saldoPendiente ?? 0), 0)
        alertas.push({
          id: `alerta-${cliente.id}-vencida30`,
          tipo: 'critica',
          titulo: `Deuda vencida +${Math.floor(maxDias)} días`,
          descripcion: `$${montoVencido.toLocaleString('es-MX', { maximumFractionDigits: 0 })} sin pagar`,
          fecha: new Date().toISOString().split('T')[0],
          cliente: cliente.nombre,
          monto: montoVencido,
          diasVencimiento: Math.floor(maxDias)
        })
      }
    })

    // Ordenar por monto descendente
    return alertas.sort((a, b) => (b.monto ?? 0) - (a.monto ?? 0))
  }, [clientesDashboard])

  // Función helper para formatear fechas de manera consistente
  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha)
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Mexico_City'
      })
    } catch {
      return fecha
    }
  }

  // Al seleccionar un cliente para ver detalle, hacer scroll al panel de la ficha
  useEffect(() => {
    if (clienteSeleccionado && vistaActual === 'clientes' && refFichaCliente.current) {
      const el = refFichaCliente.current
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [clienteSeleccionado, vistaActual])

  const abrirDialogo = (tipo: 'modificar-limite' | 'bloquear' | 'estado-cuenta' | 'registrar-pago' | 'registrar-abono', cliente?: ClienteCredito, nota?: NotaCredito) => {
    setTipoDialogo(tipo)
    setClienteSeleccionado(cliente || null)
    setNotaSeleccionada(nota || null)
    setFormasPago([])
    setMontoTotalPago(0)
    setNuevoLimite(cliente?.limiteCredito || 0)
    setMotivoLimite('')
    setObservacionesPago('')
    setDialogoAbierto(true)
  }

  const agregarFormaPago = () => {
    const formaPagoEfectivo = formasPagoDisponibles.find(fp => fp.tipo === 'efectivo')
    const nuevaFormaPago = {
      id: `fp-${contadorId}`,
      formaPagoId: formaPagoEfectivo?.id || '',
      metodo: 'efectivo',
      monto: 0
    }
    setFormasPago(prev => [...prev, nuevaFormaPago])
    setContadorId(prev => prev + 1)
  }

  const eliminarFormaPago = (id: string) => {
    setFormasPago(prev => prev.filter(fp => fp.id !== id))
  }

  const actualizarFormaPago = (id: string, campo: string, valor: any) => {
    setFormasPago(prev => prev.map(fp => {
      if (fp.id === id) {
        if (campo === 'metodo') {
          const formaPago = formasPagoDisponibles.find(f => f.tipo === valor)
          return { ...fp, formaPagoId: formaPago?.id || '', metodo: valor }
        }
        return { ...fp, [campo]: valor }
      }
      return fp
    }))
  }

  const guardarLimiteCredito = async () => {
    if (!clienteSeleccionado || nuevoLimite <= 0) return

    try {
      setSaving(true)
      setError(null)
      await creditosAbonosAPI.updateLimiteCredito(
        clienteSeleccionado.id,
        nuevoLimite,
        motivoLimite
      )
      await cargarDatos()
      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar límite de crédito')
    } finally {
      setSaving(false)
    }
  }

  const guardarBloquearCredito = async () => {
    if (!clienteSeleccionado) return
    try {
      setSaving(true)
      setError(null)
      await creditosAbonosAPI.updateLimiteCredito(
        clienteSeleccionado.id,
        0,
        'Crédito bloqueado desde Gestión de Créditos'
      )
      setSuccessMessage(`Crédito bloqueado para ${clienteSeleccionado.nombre}`)
      await cargarDatos()
      cerrarDialogo()
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Error al bloquear crédito')
    } finally {
      setSaving(false)
    }
  }

  const generarEstadoCuenta = async () => {
    if (!clienteSeleccionado) return
    try {
      setSaving(true)
      setError(null)
      const notas = clienteSeleccionado.notasPendientes ?? []
      const ahora = new Date()
      const fechaEmision = ahora.toLocaleDateString('es-MX', { dateStyle: 'long', timeZone: 'America/Mexico_City' })
      const periodoTexto = periodoDesdeEC
        ? `Del ${new Date(periodoDesdeEC + 'T12:00:00').toLocaleDateString('es-MX', { dateStyle: 'medium' })} al ${new Date(periodoHastaEC + 'T12:00:00').toLocaleDateString('es-MX', { dateStyle: 'medium' })}`
        : `Al ${fechaEmision}`
      const notasFiltradas = periodoDesdeEC
        ? notas.filter((n: NotaCredito) => {
            const fv = new Date(n.fechaVenta)
            const desde = new Date(periodoDesdeEC + 'T00:00:00')
            const hasta = new Date(periodoHastaEC + 'T23:59:59')
            return fv >= desde && fv <= hasta
          })
        : notas
      const totalPendiente = notasFiltradas.reduce((s: number, n: NotaCredito) => s + (n.saldoPendiente ?? n.importe ?? 0), 0)
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Estado de Cuenta — ${clienteSeleccionado.nombre}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Arial', sans-serif; color: #222; background: white; }
          .page { max-width: 800px; margin: 0 auto; padding: 32px; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #8B5E3C; padding-bottom:16px; margin-bottom:24px; }
          .logo-area h1 { font-size:22px; color:#8B5E3C; font-weight:900; letter-spacing:1px; }
          .logo-area p { font-size:11px; color:#666; margin-top:2px; }
          .doc-info { text-align:right; }
          .doc-info h2 { font-size:18px; color:#333; font-weight:700; }
          .doc-info p { font-size:11px; color:#666; margin-top:4px; }
          .cliente-box { background:#f9f6f2; border-left:4px solid #8B5E3C; padding:14px 18px; margin-bottom:20px; border-radius:0 6px 6px 0; }
          .cliente-box h3 { font-size:15px; font-weight:700; color:#333; }
          .cliente-box p { font-size:12px; color:#555; margin-top:3px; }
          .resumen { display:flex; gap:16px; margin-bottom:20px; }
          .resumen-card { flex:1; border:1px solid #e0d5c8; border-radius:8px; padding:12px; text-align:center; }
          .resumen-card .monto { font-size:20px; font-weight:900; color:#8B5E3C; }
          .resumen-card .label { font-size:10px; color:#888; text-transform:uppercase; margin-top:4px; }
          table { width:100%; border-collapse:collapse; font-size:12px; }
          thead { background:#8B5E3C; color:white; }
          thead th { padding:9px 10px; text-align:left; font-weight:600; }
          tbody tr:nth-child(even) { background:#faf7f4; }
          tbody td { padding:8px 10px; border-bottom:1px solid #ece5dc; }
          .estado-vencida { color:#c0392b; font-weight:bold; }
          .estado-vigente { color:#27ae60; font-weight:bold; }
          .estado-por_vencer { color:#e67e22; font-weight:bold; }
          .estado-pagada { color:#27ae60; }
          .total-row { background:#f0e8df !important; font-weight:700; }
          .footer { margin-top:32px; border-top:1px solid #ddd; padding-top:16px; display:flex; justify-content:space-between; }
          .firma { text-align:center; width:200px; }
          .firma .linea { border-top:1px solid #333; margin-top:40px; padding-top:6px; font-size:11px; }
          .nota-legal { font-size:10px; color:#aaa; margin-top:20px; text-align:center; }
          @media print { body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
        </style></head>
        <body><div class="page">
          <div class="header">
            <div class="logo-area">
              <div style="display:flex;align-items:center;gap:12px">
                <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAfQB9ADASIAAhEBAxEB/8QAHQABAAAHAQEAAAAAAAAAAAAAAAIDBAUGBwgBCf/EAGIQAAIBAgMDBwYICgYHBQUFCQABAgMEBQYRBxIhEyIxQVFhoQgUMnGBkRUWI0JSU7HRCRgzVmJygpLB0hdDVZOUlSRUY3OisuE0REXC8CUmV3SzNTY4dYOE8WSjpLRG0+L/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAQQFAwYC/8QANREBAAIBAgQEBQQBBAMBAQEAAAECAwQREiExUQUTFEEVM1JhcSIjMoGhQkORsWLR4cE08P/aAAwDAQACEQMRAD8A4yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/9k=" alt="Gas Providencia" style="background:white;border-radius:6px;padding:4px;height:70px;width:auto;object-fit:contain" />
                <div>
                  <p style="font-size:12px;color:#666;margin:2px 0 0">Distribución de Gas LP · San Luis de la Paz, Gto.</p>
                  <p style="font-size:12px;color:#666;margin:1px 0 0">Tel: 4696863030</p>
                </div>
              </div>
            </div>
            <div class="doc-info">
              <h2 style="font-size:22px;font-weight:900;color:#333;margin:0">ESTADO DE CUENTA</h2>
              <p style="font-size:13px;color:#555;margin-top:6px"><strong>Período:</strong> ${periodoTexto}</p>
              <p style="font-size:12px;color:#666;margin-top:3px"><strong>Emisión:</strong> ${fechaEmision}</p>
              <p style="font-size:12px;color:#666;margin-top:3px"><strong>Ruta:</strong> ${clienteSeleccionado.ruta || '—'}</p>
            </div>
          </div>
          <div class="cliente-box">
            <h3>${clienteSeleccionado.nombre}</h3>
            <p>${clienteSeleccionado.direccion || ''}</p>
            <p>Tel: ${clienteSeleccionado.telefono || '—'}</p>
          </div>
          <div class="resumen">
            <div class="resumen-card">
              <div class="monto">$${totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div class="label">Saldo Pendiente</div>
            </div>
            <div class="resumen-card">
              <div class="monto">${notasFiltradas.filter((n: NotaCredito) => { const d = n.fechaVencimiento ? Math.floor((new Date(n.fechaVencimiento).getTime()-ahora.getTime())/86400000) : 0; return d < 0 && n.estado !== 'pagada' }).length}</div>
              <div class="label">Notas Vencidas</div>
            </div>
            <div class="resumen-card">
              <div class="monto">${notasFiltradas.filter((n: NotaCredito) => n.estado !== 'pagada').length}</div>
              <div class="label">Notas Pendientes</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Folio</th><th>Fecha</th><th>Vencimiento</th><th>Importe</th><th>Saldo Pendiente</th><th>Estado</th></tr></thead>
            <tbody>
              ${notasFiltradas.map((n: NotaCredito) => {
                const fv = n.fechaVencimiento ? new Date(n.fechaVencimiento) : null
                const dias = fv ? Math.floor((fv.getTime()-ahora.getTime())/86400000) : null
                const estadoReal = n.estado === 'pagada' ? 'pagada' : dias === null ? 'vigente' : dias < 0 ? 'vencida' : dias <= 5 ? 'por_vencer' : 'vigente'
                const estadoLabel = estadoReal === 'pagada' ? 'Pagada' : estadoReal === 'vencida' ? `Vencida ${Math.abs(dias!)}d` : estadoReal === 'por_vencer' ? `Vence en ${dias}d` : 'Vigente'
                const saldo = (n.saldoPendiente ?? n.importe ?? 0)
                return `<tr><td><strong>${n.numeroNota||''}</strong></td><td>${formatearFecha(n.fechaVenta)}</td><td>${formatearFecha(n.fechaVencimiento)}</td><td>$${(n.importe??0).toLocaleString('es-MX',{minimumFractionDigits:2})}</td><td>$${saldo.toLocaleString('es-MX',{minimumFractionDigits:2})}</td><td class="estado-${estadoReal}">${estadoLabel}</td></tr>`
              }).join('')}
              <tr class="total-row"><td colspan="4">TOTAL PENDIENTE</td><td>$${totalPendiente.toLocaleString('es-MX',{minimumFractionDigits:2})}</td><td></td></tr>
            </tbody>
          </table>
          <div style="margin-top:24px;border-top:2px solid #8B5E3C;padding-top:12px;text-align:center">
            <p style="font-size:11px;color:#888">Documento generado el ${fechaEmision} · Gas Providencia · Tel: 4696863030 · San Luis de la Paz, Gto.</p>
            <p style="font-size:10px;color:#aaa;margin-top:4px">Para aclaraciones o pagos comuníquese con su repartidor o visítenos directamente.</p>
          </div>
        </div></body></html>`
      const ventana = window.open('', '_blank')
      if (ventana) {
        ventana.document.write(html)
        ventana.document.close()
        setTimeout(() => ventana.print(), 800)
      }
      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al generar estado de cuenta')
    } finally {
      setSaving(false)
    }
  }

  const actualizarLimiteCliente = async (clienteId: string) => {
    const datosLimite = limitesEditados[clienteId]
    if (!datosLimite || datosLimite.limite <= 0) {
      setError('Por favor ingrese un límite válido')
      return
    }

    const cliente = clientesCredito.find(c => c.id === clienteId)
    if (!cliente) return

    // Verificar que haya un cambio
    if (datosLimite.limite === cliente.limiteCredito && !datosLimite.motivo) {
      setError('No hay cambios para guardar')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)
      
      await creditosAbonosAPI.updateLimiteCredito(
        clienteId,
        datosLimite.limite,
        datosLimite.motivo || 'Actualización desde Control de Límites'
      )
      
      // Limpiar el estado editado para este cliente
      setLimitesEditados(prev => {
        const nuevo = { ...prev }
        delete nuevo[clienteId]
        return nuevo
      })
      
      setSuccessMessage(`Límite de crédito actualizado exitosamente para ${cliente.nombre}`)
      
      await cargarDatos()
      
      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar límite de crédito')
    } finally {
      setSaving(false)
    }
  }

  const manejarCambioLimite = (clienteId: string, limite: number) => {
    const cliente = clientesCredito.find(c => c.id === clienteId)
    if (!cliente) return
    
    setLimitesEditados(prev => ({
      ...prev,
      [clienteId]: {
        limite: limite || cliente.limiteCredito,
        motivo: prev[clienteId]?.motivo || ''
      }
    }))
  }

  const manejarCambioMotivo = (clienteId: string, motivo: string) => {
    setLimitesEditados(prev => ({
      ...prev,
      [clienteId]: {
        limite: prev[clienteId]?.limite || 0,
        motivo
      }
    }))
  }

  const registrarPago = async () => {
    if (!clienteSeleccionado || formasPago.length === 0 || montoTotalPago <= 0) return

    // Validar referencias
    const metodosRequierenFolio = ['transferencia', 'cheque', 'deposito', 'terminal']
    for (const fp of formasPago) {
      if (metodosRequierenFolio.includes(fp.metodo)) {
        if (!fp.referencia || fp.referencia.trim() === '') {
          const nombreMetodo = formasPagoDisponibles.find(f => f.tipo === fp.metodo)?.nombre || fp.metodo
          setError(`El campo "Folio / Referencia" es obligatorio para el método de pago: ${nombreMetodo}`)
          return
        }
      }
    }

    try {
      setSaving(true)
      setError(null)

      const formasPagoData = formasPago.map(fp => ({
        formaPagoId: fp.formaPagoId,
        monto: fp.monto,
        referencia: fp.referencia,
        banco: fp.banco
      }))

      const nombreUsuarioRegistro = usuario
        ? `${usuario.nombres || ''} ${usuario.apellidoPaterno || ''}`.trim() || usuario.correo
        : ''

      await creditosAbonosAPI.createPago({
        clienteId: clienteSeleccionado.id,
        notaCreditoId: notaSeleccionada?.id,
        montoTotal: montoTotalPago,
        tipo: notaSeleccionada ? 'nota_especifica' : 'abono_general',
        observaciones: observacionesPago,
        usuarioRegistro: nombreUsuarioRegistro,
        formasPago: formasPagoData
      })

      await cargarDatos()
      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago')
    } finally {
      setSaving(false)
    }
  }

  const abrirModalPago = (pago: any, accion: 'revision' | 'autorizar' | 'rechazar' | 'reactivar') => {
    setPagoSelModal(pago)
    setTipoAccionPago(accion)
    setNotaAccionPago('')
    setFolioConfirmacionPago('')
    setModalPago(true)
  }

  const ejecutarAccionPago = async () => {
    if (!pagoSelModal) return
    const rolUsuario = usuario?.rol || ''
    const rolesAdmin = ['superAdministrador', 'administrador']
    const rolesOficina = ['superAdministrador', 'administrador', 'oficina', 'planta']
    if (tipoAccionPago === 'autorizar' && !rolesAdmin.includes(rolUsuario)) {
      setError('Solo Administrador o SuperAdministrador puede autorizar pagos.')
      return
    }
    try {
      setSaving(true)
      const estado = tipoAccionPago === 'revision' ? 'en_revision'
        : tipoAccionPago === 'autorizar' ? 'autorizado'
        : tipoAccionPago === 'reactivar' ? 'pendiente' : 'rechazado'
      const notaFinal = folioConfirmacionPago ? `Folio confirmado: ${folioConfirmacionPago}${notaAccionPago ? ' — ' + notaAccionPago : ''}` : notaAccionPago
      await creditosAbonosAPI.updatePagoEstado(pagoSelModal.id, estado as any, notaFinal)
      setSuccessMessage(
        tipoAccionPago === 'revision' ? 'Pago marcado En Revisión' :
        tipoAccionPago === 'autorizar' ? '✅ Pago autorizado — nota de crédito cerrada' :
        tipoAccionPago === 'reactivar' ? 'Pago reactivado a Pendiente' : 'Pago rechazado'
      )
      setModalPago(false)
      setPagoSelModal(null)
      await cargarDatos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar pago')
    } finally {
      setSaving(false)
    }
  }

  const autorizarPago = async (pagoId: string) => {
    const pago = pagosPendientesAutorizacion.find(p => p.id === pagoId)
    if (pago) abrirModalPago(pago, 'autorizar')
  }

  const rechazarPago = async (pagoId: string) => {
    const pago = pagosPendientesAutorizacion.find(p => p.id === pagoId)
    if (pago) abrirModalPago(pago, 'rechazar')
  }

  // Calcular total del pago usando useMemo para evitar re-renders infinitos
  const totalPago = useMemo(() => {
    return formasPago.reduce((sum, fp) => sum + fp.monto, 0)
  }, [formasPago])

  // Actualizar montoTotalPago cuando cambie el total
  useEffect(() => {
    setMontoTotalPago(totalPago)
  }, [totalPago])

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
    setNuevoLimite(0)
    setMotivoLimite('')
    setObservacionesPago('')
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

  const clientesFiltrados = useMemo(() => {
    const ahora = new Date()
    return clientesCredito
      .filter(cliente => {
        if ((cliente.saldoActual ?? 0) <= 0 && filtros.deuda !== 'sin-deuda') return false
        const cumpleNombre = !filtros.nombre || cliente.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
        const cumpleChofer = !filtroChofer || (cliente.ruta || '').toLowerCase().includes(filtroChofer.toLowerCase())
        const cumpleRuta = !filtros.ruta || cliente.ruta === filtros.ruta
        // Estado dinámico: calcular desde notas del cliente
        let estadoDinamico = 'buen-pagador'
        const notas = cliente.notasPendientes ?? []
        const tieneVencida = notas.some(n => n.fechaVencimiento && new Date(n.fechaVencimiento) < ahora && n.estado !== 'pagada')
        const tienePorVencer = notas.some(n => {
          if (!n.fechaVencimiento || n.estado === 'pagada') return false
          const dias = (new Date(n.fechaVencimiento).getTime() - ahora.getTime()) / 86400000
          return dias >= 0 && dias <= 5
        })
        if ((cliente.saldoActual ?? 0) > cliente.limiteCredito) estadoDinamico = 'critico'
        else if (tieneVencida) estadoDinamico = 'vencido'
        else if (tienePorVencer) estadoDinamico = 'por_vencer'
        const cumpleEstado = !filtros.estado || estadoDinamico === filtros.estado || cliente.estadoCliente === filtros.estado
        const tieneDeuda = (cliente.saldoActual ?? 0) > 0
        const cumpleDeuda = !filtros.deuda || (filtros.deuda === 'con-deuda' && tieneDeuda) || (filtros.deuda === 'sin-deuda' && !tieneDeuda)
        const cumpleSaldoMin = !filtros.saldoMin || (cliente.saldoActual ?? 0) >= Number(filtros.saldoMin)
        const cumpleSaldoMax = !filtros.saldoMax || (cliente.saldoActual ?? 0) <= Number(filtros.saldoMax)
        return cumpleNombre && cumpleRuta && cumpleChofer && cumpleEstado && cumpleDeuda && cumpleSaldoMin && cumpleSaldoMax
      })
      .sort((a, b) => {
        if (ordenClientes === 'saldo_asc') return (a.saldoActual ?? 0) - (b.saldoActual ?? 0)
        if (ordenClientes === 'nombre_asc') return (a.nombre || '').localeCompare(b.nombre || '')
        return (b.saldoActual ?? 0) - (a.saldoActual ?? 0) // saldo_desc por defecto
      })
  }, [clientesCredito, filtros, ordenClientes])

  const rutasUnicas = useMemo(() => {
    // Usar las rutas cargadas de la API, no solo las de los clientes cargados
    const rutasDeClientes = [...new Set(clientesCredito.map(c => c.ruta))]
    const rutasDeAPI = rutas.map(r => r.nombre)
    // Combinar ambas y eliminar duplicados
    return [...new Set([...rutasDeAPI, ...rutasDeClientes])].filter(r => r && r !== 'Sin ruta')
  }, [clientesCredito, rutas])

  // Clientes filtrados por nombre dentro de Límites Individuales por Cliente (solo esta sección)
  const clientesCreditoFiltradosLimites = useMemo(() => {
    if (!filtroNombreLimites.trim()) return clientesCredito
    const busqueda = filtroNombreLimites.toLowerCase().trim()
    return clientesCredito.filter(c => c.nombre.toLowerCase().includes(busqueda))
  }, [clientesCredito, filtroNombreLimites])

  // Pagos pendientes filtrados por buscador (cliente, nota)
  const pagosPendientesFiltrados = useMemo(() => {
    if (!filtroBusquedaPagosPendientes.trim()) return pagosPendientesAutorizacion
    const busqueda = filtroBusquedaPagosPendientes.toLowerCase().trim()
    return pagosPendientesAutorizacion.filter(
      p =>
        (p.cliente && p.cliente.toLowerCase().includes(busqueda)) ||
        (p.nota && p.nota.toLowerCase().includes(busqueda)) ||
        (p.registradoPorNombre && p.registradoPorNombre.toLowerCase().includes(busqueda)) ||
        (p.ruta && p.ruta.toLowerCase().includes(busqueda))
    )
  }, [pagosPendientesAutorizacion, filtroBusquedaPagosPendientes])

  // Historial de pagos filtrado por buscador (cliente, nota)
  const historialPagosFiltrado = useMemo(() => {
    if (!filtroBusquedaHistorialPagos.trim()) return historialPagos
    const busqueda = filtroBusquedaHistorialPagos.toLowerCase().trim()
    return historialPagos.filter(p => {
      const pago = p as any
      const cliente = pago.cliente
      const nombreCliente = cliente
        ? `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`.trim()
        : ''
      const nota = pago.notaCredito?.numeroNota || 'Abono general'
      return nombreCliente.toLowerCase().includes(busqueda) || nota.toLowerCase().includes(busqueda)
    })
  }, [historialPagos, filtroBusquedaHistorialPagos])

  // Recargar datos cuando cambien los filtros (volver a página 1)
  useEffect(() => {
    if (rutas.length === 0) return
    setPageClientes(0)
    setPageHistorial(0)
    cargarDatos(undefined, { pageClientes: 0, pageHistorial: 0 })
  }, [
    filtros.nombre, filtros.ruta, filtros.estado, filtros.deuda, filtros.saldoMin, filtros.saldoMax,
    filtroRutaHistorialPagos, fechaDesdeHistorialPagos, fechaHastaHistorialPagos, 
    filtroRutaDashboard, fechaDesdeDashboard, fechaHastaDashboard,
    filtroRutaPagosPendientes
  ])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h4' component='h1'>
          Gestión de Créditos y Abonos
        </Typography>
        
        {/* Selector de Sede solo para superAdministrador; Administrador y Gestor solo ven el nombre de su sede */}
        {usuario?.rol === 'superAdministrador' && (
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Sede</InputLabel>
            <Select
              value={sedeId || ''}
              onChange={(e) => setSedeId(e.target.value || null)}
              label='Sede'
            >
              {sedes.map((sede) => (
                <MenuItem key={sede.id} value={sede.id}>
                  {sede.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {usuario && usuario.rol !== 'superAdministrador' && sedeId && (
          <Chip
            label={sedes.find(s => s.id === sedeId)?.nombre ?? 'N/A'}
            color='primary'
            variant='outlined'
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      )}

      {/* Navegación */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={vistaActual === 'dashboard' ? 'contained' : 'outlined'}
            onClick={() => { setVistaActual('dashboard'); cargarClientesDashboard(); }}
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
            variant={vistaActual === 'pagos-pendientes' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('pagos-pendientes')}
            startIcon={<PaymentIcon />}
          >
            Control de Pagos
          </Button>

          <Button
            variant={vistaActual === 'pagos-sbc' ? 'contained' : 'outlined'}
            onClick={() => { setVistaActual('pagos-sbc'); cargarPedidosSBC(); }}
            startIcon={<SwapHorizIcon />}
            sx={{ bgcolor: vistaActual === 'pagos-sbc' ? '#e65100' : 'transparent', color: vistaActual === 'pagos-sbc' ? 'white' : '#e65100', borderColor: '#e65100', '&:hover': { bgcolor: '#e65100', color: 'white' } }}
          >
            Pagos SBC
          </Button>
        </Box>
      </Box>

      {/* Dashboard Principal */}
      {vistaActual === 'dashboard' && (
        <Box>
          {/* Fila 1 — 4 KPIs */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'primary.main', height: '100%' }}>
                <CardContent>
                  <Typography variant='caption' color='text.secondary' fontWeight='bold' textTransform='uppercase'>Cartera Total</Typography>
                  <Typography variant='h4' fontWeight='bold' color='primary.main' sx={{ my: 0.5 }}>
                    ${resumenCredito.carteraTotal.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>{resumenCredito.notasPendientes} notas activas</Typography>
                  <Typography variant='caption' color='text.disabled'>{clientesDashboard.filter(c => (c.saldoActual ?? 0) > 0).length} clientes con saldo</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'error.main', height: '100%' }}>
                <CardContent>
                  <Typography variant='caption' color='error.main' fontWeight='bold' textTransform='uppercase'>Cartera Vencida</Typography>
                  <Typography variant='h4' fontWeight='bold' color='error.main' sx={{ my: 0.5 }}>
                    ${resumenCredito.carteraVencida.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant='body2' color='error.dark'>{resumenCredito.notasVencidas} notas vencidas</Typography>
                  <Typography variant='caption' color='text.disabled'>
                    {resumenCredito.carteraTotal > 0 ? resumenCredito.porcentajeVencida.toFixed(1) : '0'}% del total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'warning.main', height: '100%' }}>
                <CardContent>
                  <Typography variant='caption' color='warning.dark' fontWeight='bold' textTransform='uppercase'>Por Vencer (5 días)</Typography>
                  <Typography variant='h4' fontWeight='bold' color='warning.main' sx={{ my: 0.5 }}>
                    ${resumenCredito.carteraPorVencer.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant='body2' color='warning.dark'>{resumenCredito.notasPorVencer} notas próximas</Typography>
                  <Typography variant='caption' color='text.disabled'>
                    {resumenCredito.carteraTotal > 0 ? resumenCredito.porcentajePorVencer.toFixed(1) : '0'}% del total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'success.main', height: '100%' }}>
                <CardContent>
                  <Typography variant='caption' color='success.dark' fontWeight='bold' textTransform='uppercase'>Al Corriente</Typography>
                  <Typography variant='h4' fontWeight='bold' color='success.main' sx={{ my: 0.5 }}>
                    ${(resumenCredito.carteraTotal - resumenCredito.carteraVencida - resumenCredito.carteraPorVencer).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant='body2' color='success.dark'>
                    {resumenCredito.notasPendientes - resumenCredito.notasVencidas - resumenCredito.notasPorVencer} notas vigentes
                  </Typography>
                  <Typography variant='caption' color='text.disabled'>Sin riesgo inmediato</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Fila 2 — Distribución por estado de clientes */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant='subtitle2' fontWeight='bold' gutterBottom>Distribución por Estado</Typography>
                  {(() => {
                    const clientesCon = clientesDashboard.filter(c => (c.saldoActual ?? 0) > 0)
                    const grupos = [
                      { label: 'Buen pagador', key: 'buen-pagador', color: '#2e7d32', bg: '#e8f5e9' },
                      { label: 'Vencido', key: 'vencido', color: '#f57c00', bg: '#fff3e0' },
                      { label: 'Por vencer', key: 'por_vencer', color: '#ed6c02', bg: '#fff3e0' },
                      { label: 'Crítico', key: 'critico', color: '#c62828', bg: '#ffebee' },
                      { label: 'Bloqueado', key: 'bloqueado', color: '#424242', bg: '#f5f5f5' },
                    ]
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {grupos.map(g => {
                          const cantidad = clientesCon.filter(c => c.estado === g.key).length
                          const monto = clientesCon.filter(c => c.estado === g.key).reduce((s, c) => s + (c.saldoActual ?? 0), 0)
                          const pct = clientesCon.length > 0 ? (cantidad / clientesCon.length) * 100 : 0
                          return (
                            <Box key={g.key}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                <Typography variant='caption' fontWeight='bold' sx={{ color: g.color }}>{g.label}</Typography>
                                <Typography variant='caption' color='text.secondary'>{cantidad} clientes · ${monto.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</Typography>
                              </Box>
                              <Box sx={{ bgcolor: '#f0f0f0', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                                <Box sx={{ width: `${pct}%`, bgcolor: g.color, height: '100%', borderRadius: 1, transition: 'width 0.5s' }} />
                              </Box>
                            </Box>
                          )
                        })}
                      </Box>
                    )
                  })()}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={7}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant='subtitle2' fontWeight='bold' gutterBottom>⚠️ Alertas Críticas</Typography>
                  {alertasCredito.filter(a => a.tipo === 'critica').length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', mt: 1 }}>
                      <CheckCircleIcon />
                      <Typography variant='body2'>Sin alertas críticas en este momento</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 200, overflowY: 'auto' }}>
                      {alertasCredito.filter(a => a.tipo === 'critica').map((alerta) => (
                        <Alert key={alerta.id} severity='error' sx={{ py: 0.5 }}>
                          <Typography variant='caption' fontWeight='bold'>{alerta.titulo}</Typography>
                          {alerta.cliente && <Typography variant='caption' display='block'>{alerta.cliente}</Typography>}
                          {alerta.monto && <Typography variant='caption' display='block'>${alerta.monto.toLocaleString()}</Typography>}
                        </Alert>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Fila 3 — Top 10 deudores */}
          <Card>
            <CardContent>
              <Typography variant='subtitle2' fontWeight='bold' gutterBottom>Top Deudores</Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell><Typography variant='caption' fontWeight='bold'>#</Typography></TableCell>
                      <TableCell><Typography variant='caption' fontWeight='bold'>Cliente</Typography></TableCell>
                      <TableCell><Typography variant='caption' fontWeight='bold'>Ruta</Typography></TableCell>
                      <TableCell align='right'><Typography variant='caption' fontWeight='bold'>Saldo</Typography></TableCell>
                      <TableCell align='right'><Typography variant='caption' fontWeight='bold'>Límite</Typography></TableCell>
                      <TableCell><Typography variant='caption' fontWeight='bold'>Estado</Typography></TableCell>
                      <TableCell><Typography variant='caption' fontWeight='bold'>Uso</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...clientesDashboard]
                      .filter(c => (c.saldoActual ?? 0) > 0)
                      .sort((a, b) => (b.saldoActual ?? 0) - (a.saldoActual ?? 0))
                      .slice(0, 10)
                      .map((c, idx) => {
                        const pct = c.limiteCredito > 0 ? Math.min(((c.saldoActual ?? 0) / c.limiteCredito) * 100, 100) : 0
                        const estadoColor = c.estado === 'buen-pagador' ? 'success' : c.estado === 'critico' ? 'error' : c.estado === 'bloqueado' ? 'default' : c.estado === 'vencido' ? 'error' : 'warning'
                        const estadoLabel = c.estado === 'buen-pagador' ? 'Al corriente' : c.estado === 'vencido' ? 'Vencido' : c.estado === 'por_vencer' ? 'Por vencer' : c.estado === 'critico' ? 'Crítico' : 'Bloqueado'
                        return (
                          <TableRow key={c.id} hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => { setVistaActual('clientes'); setTimeout(() => setClienteSeleccionado(c), 100) }}>
                            <TableCell><Typography variant='caption' color='text.disabled'>{idx + 1}</Typography></TableCell>
                            <TableCell><Typography variant='caption' fontWeight='bold'>{c.nombre}</Typography></TableCell>
                            <TableCell><Typography variant='caption' color='text.secondary'>{c.ruta}</Typography></TableCell>
                            <TableCell align='right'>
                              <Typography variant='caption' fontWeight='bold' color={c.estado === 'critico' ? 'error.main' : 'text.primary'}>
                                ${(c.saldoActual ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='caption' color='text.secondary'>
                                ${c.limiteCredito.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={estadoLabel} size='small' color={estadoColor as any} sx={{ fontSize: 10, height: 20 }} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 80 }}>
                              <Box sx={{ bgcolor: '#f0f0f0', borderRadius: 1, height: 6, overflow: 'hidden' }}>
                                <Box sx={{ width: `${pct}%`, bgcolor: pct >= 100 ? '#c62828' : pct >= 75 ? '#f57c00' : '#2e7d32', height: '100%', borderRadius: 1 }} />
                              </Box>
                              <Typography variant='caption' color='text.disabled'>{pct.toFixed(0)}%</Typography>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Panel de Gestión por Cliente */}
      {vistaActual === 'clientes' && (
        <Box>
          {/* Filtros y Búsqueda Avanzada */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Grid container spacing={1.5} alignItems='center'>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size='small' placeholder='Buscar por nombre...'
                    value={filtros.nombre}
                    onChange={(e) => manejarCambioFiltros('nombre', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setPageClientes(0); cargarDatos(undefined, { pageClientes: 0 }) } }}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' /></InputAdornment>,
                      endAdornment: filtros.nombre ? (
                        <InputAdornment position='end'>
                          <IconButton size='small' onClick={() => { manejarCambioFiltros('nombre', ''); setTimeout(() => cargarDatos(undefined, { pageClientes: 0 }), 100) }}>
                            <CloseIcon fontSize='small' />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth size='small' placeholder='Chofer/Operador...'
                    value={filtroChofer}
                    onChange={e => setFiltroChofer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setPageClientes(0); cargarDatos(undefined, { pageClientes: 0 }) } }}
                    InputProps={{ startAdornment: <InputAdornment position='start'><PersonIcon fontSize='small' /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Ruta</InputLabel>
                    <Select value={filtros.ruta} label='Ruta' onChange={(e) => manejarCambioFiltros('ruta', e.target.value)}>
                      <MenuItem value=''>Todas</MenuItem>
                      {rutasUnicas.map((ruta) => <MenuItem key={ruta} value={ruta}>{ruta}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Estado</InputLabel>
                    <Select value={filtros.estado} label='Estado' onChange={(e) => manejarCambioFiltros('estado', e.target.value)}>
                      <MenuItem value=''>Todos</MenuItem>
                      <MenuItem value='buen-pagador'>Al corriente</MenuItem>
                      <MenuItem value='vencido'>Vencido</MenuItem>
                      <MenuItem value='por_vencer'>Por vencer</MenuItem>
                      <MenuItem value='critico'>Crítico</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>



                <Grid item xs={6} sm={3} md={1.5}>
                  <TextField fullWidth size='small' label='Saldo mín' type='number'
                    value={filtros.saldoMin} onChange={(e) => manejarCambioFiltros('saldoMin', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3} md={1.5}>
                  <TextField fullWidth size='small' label='Saldo máx' type='number'
                    value={filtros.saldoMax} onChange={(e) => manejarCambioFiltros('saldoMax', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Ordenar</InputLabel>
                    <Select value={ordenClientes} label='Ordenar' onChange={e => setOrdenClientes(e.target.value as any)}>
                      <MenuItem value='saldo_desc'>Mayor deuda</MenuItem>
                      <MenuItem value='saldo_asc'>Menor deuda</MenuItem>
                      <MenuItem value='nombre_asc'>Nombre A-Z</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3} md={1}>
                  <Button fullWidth variant='contained' size='small'
                    onClick={() => { setPageClientes(0); cargarDatos(undefined, { pageClientes: 0 }) }}>
                    Buscar
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3} md={1}>
                  <Button fullWidth variant='outlined' size='small' onClick={() => {
                    setFiltros({ nombre: '', ruta: '', estado: '', saldoMin: '', saldoMax: '', deuda: '', diasVencimientoMin: '', diasVencimientoMax: '' })
                    setOrdenClientes('saldo_desc')
                    setTimeout(() => cargarDatos(undefined, { pageClientes: 0 }), 100)
                  }}>
                    Limpiar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Lista de Clientes con Crédito
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
                      <TableCell>Deuda</TableCell>
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
                            label={
                              cliente.estado === 'buen-pagador' ? 'Al corriente' :
                              cliente.estado === 'vencido' ? 'Vencido' :
                              cliente.estado === 'por_vencer' ? 'Por vencer' :
                              cliente.estado === 'critico' ? 'Crítico' :
                              cliente.estado === 'bloqueado' ? 'Bloqueado' :
                              cliente.estado
                            }
                            color={
                              cliente.estado === 'buen-pagador' ? 'success' :
                              cliente.estado === 'vencido' ? 'error' :
                              cliente.estado === 'por_vencer' ? 'warning' :
                              cliente.estado === 'critico' ? 'error' : 'default'
                            }
                            size='small' sx={{ fontWeight: 'bold', fontSize: 10 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={(cliente.saldoActual ?? 0) > 0 ? 'Con deuda' : 'Al día'}
                            color={((cliente.saldoActual ?? 0) > 0 ? 'warning' : 'success') as any}
                            size='small'
                            variant='outlined'
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
                <TablePagination
                  component='div'
                  count={totalClientes}
                  page={pageClientes}
                  onPageChange={(_, newPage) => {
                    setPageClientes(newPage)
                    cargarDatos(undefined, { pageClientes: newPage })
                  }}
                  rowsPerPage={rowsPerPageClientes}
                  onRowsPerPageChange={(e) => {
                    const newRpp = parseInt(e.target.value, 10)
                    setRowsPerPageClientes(newRpp)
                    setPageClientes(0)
                    cargarDatos(undefined, { pageClientes: 0, rowsPerPageClientes: newRpp })
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage='Filas por página'
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </TableContainer>
            </CardContent>
          </Card>

          {/* Ficha Individual del Cliente */}
          {clienteSeleccionado && (
            <Box ref={refFichaCliente} sx={{ mt: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 50, height: 50 }}>
                      {(clienteSeleccionado.nombre || ' ').charAt(0)}
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
                        {clienteSeleccionado.direccion ?? '—'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize='small' color='action' />
                      <Typography variant='body2'>
                        {clienteSeleccionado.telefono ?? '—'}
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
                
                {(clienteSeleccionado.notasPendientes ?? []).length > 0 ? (
                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: 12 }}>Nota</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: 12 }}>Fecha venta</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: 12 }}>Vencimiento</TableCell>
                          <TableCell align='right' sx={{ fontWeight: 'bold', fontSize: 12 }}>Importe</TableCell>
                          <TableCell align='right' sx={{ fontWeight: 'bold', fontSize: 12 }}>Saldo</TableCell>
                          <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 12 }}>Días</TableCell>
                          <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 12 }}>Estado</TableCell>
                          <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: 12 }}>Acción</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(clienteSeleccionado.notasPendientes ?? []).map((nota) => (
                          <TableRow key={nota.id}>
                            <TableCell>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {nota.numeroNota}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {formatearFecha(nota.fechaVenta)}
                            </TableCell>
                            <TableCell>
                              {formatearFecha(nota.fechaVencimiento)}
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='caption' color='text.secondary' sx={{ textDecoration: nota.estado === 'pagada' ? 'none' : 'none' }}>
                                ${(nota.importe ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='caption' fontWeight='bold'>
                                ${(nota.saldoPendiente ?? nota.importe ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              {(() => {
                                const ahora = new Date()
                                const fv = nota.fechaVencimiento ? new Date(nota.fechaVencimiento) : null
                                const dias = fv ? Math.floor((fv.getTime() - ahora.getTime()) / 86400000) : null
                                const color = dias === null ? 'text.secondary' : dias < 0 ? 'error.main' : dias <= 5 ? 'warning.main' : 'success.main'
                                return (
                                  <Typography variant='caption' fontWeight='bold' sx={{ color }}>
                                    {dias === null ? '—' : dias < 0 ? `${Math.abs(dias)}d vencida` : dias === 0 ? 'Hoy' : `${dias}d`}
                                  </Typography>
                                )
                              })()}
                            </TableCell>
                          <TableCell align='center'>
                              {(() => {
                                const ahora = new Date()
                                const fv = nota.fechaVencimiento ? new Date(nota.fechaVencimiento) : null
                                const dias = fv ? Math.floor((fv.getTime() - ahora.getTime()) / 86400000) : null
                                const estadoReal = nota.estado === 'pagada' ? 'pagada'
                                  : dias === null ? nota.estado
                                  : dias < 0 ? 'vencida' : dias <= 5 ? 'por_vencer' : 'vigente'
                                const colorChip = estadoReal === 'pagada' ? 'success' : estadoReal === 'vencida' ? 'error' : estadoReal === 'por_vencer' ? 'warning' : 'info'
                                // Si la nota tiene un pago en revisión, mostrar ese estado
                                const pagoEnRevision = pagosPendientesAutorizacion.find(p => p.nota === nota.numeroNota && (p.pagoCompleto?.estado === 'en_revision' || p.pagoCompleto?.estado === 'pendiente'))
                                const labelChip = nota.estado === 'pagada' ? 'Pagada' : pagoEnRevision ? 'En Revisión' : estadoReal === 'vencida' ? 'Vencida' : estadoReal === 'por_vencer' ? 'Por vencer' : 'Vigente'
                                const colorChipFinal = nota.estado === 'pagada' ? 'success' : pagoEnRevision ? 'info' : estadoReal === 'vencida' ? 'error' : estadoReal === 'por_vencer' ? 'warning' : 'success'
                                return <Chip label={labelChip} color={colorChipFinal as any} size='small' sx={{ fontWeight: 'bold', fontSize: 10, height: 20 }} />
                              })()}
                          </TableCell>
                          <TableCell align='center'>
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              {(nota as any).pedidoId && (
                                <Tooltip title='Ver ticket del pedido'>
                                  <IconButton size='small' sx={{ color: 'text.secondary' }}
                                    onClick={() => abrirTicketSbc((nota as any).pedidoId)}>
                                    <ReceiptIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {nota.estado !== 'pagada' && (
                                <Tooltip title='Registrar pago'>
                                  <IconButton size='small' color='primary'
                                    onClick={() => abrirDialogo('registrar-pago', clienteSeleccionado, nota)}>
                                    <PaymentIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
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
            </Box>
          )}
        </Box>
      )}

      {/* Panel de Control de Límites de Crédito */}
      {/* Vista de Pagos Pendientes de Autorización */}
      {vistaActual === 'pagos-pendientes' && (
        <Box>
          {/* KPIs con monto */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {(() => {
              const enRevision = pagosPendientesAutorizacion.filter(p => ['en_revision','pendiente',undefined,null,''].includes(p.pagoCompleto?.estado as any))
              const autorizados = pagosPendientesAutorizacion.filter(p => p.pagoCompleto?.estado === 'autorizado')
              const rechazados = pagosPendientesAutorizacion.filter(p => p.pagoCompleto?.estado === 'rechazado')
              const kpis = [
                { label: 'En Revisión', count: enRevision.length, monto: enRevision.reduce((s,p)=>s+(p.montoPagado||0),0), color: 'info.main', val: 'en_revision', desc: 'Esperando autorización' },
                { label: 'Autorizados', count: autorizados.length, monto: autorizados.reduce((s,p)=>s+(p.montoPagado||0),0), color: 'success.main', val: 'autorizado', desc: 'Confirmados' },
                { label: 'Rechazados', count: rechazados.length, monto: rechazados.reduce((s,p)=>s+(p.montoPagado||0),0), color: 'error.main', val: 'rechazado', desc: 'Requieren atención' },
              ]
              return kpis.map(k => (
                <Grid item xs={6} sm={3} key={k.label}>
                  <Card sx={{ cursor: 'pointer', borderLeft: '4px solid', borderLeftColor: filtroEstadoPagos === k.val ? k.color : 'transparent', transition: 'all 0.2s', '&:hover': { boxShadow: 3 } }}
                    onClick={() => setFiltroEstadoPagos(k.val)}>
                    <CardContent sx={{ pb: '10px !important' }}>
                      <Typography variant='caption' color='text.secondary' fontWeight='bold' textTransform='uppercase'>{k.label}</Typography>
                      <Typography variant='h4' fontWeight='bold' sx={{ color: k.color, my: 0.3 }}>{k.count}</Typography>
                      <Typography variant='caption' color='text.secondary' display='block'>${k.monto.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</Typography>
                      <Typography variant='caption' color='text.disabled'>{k.desc}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            })()}
          </Grid>

          {/* Filtros */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Grid container spacing={1.5} alignItems='center'>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Estado</InputLabel>
                    <Select value={filtroEstadoPagos} label='Estado' onChange={e => setFiltroEstadoPagos(e.target.value)}>
                      <MenuItem value='en_revision'>En Revisión</MenuItem>
                      <MenuItem value='autorizado'>Autorizados</MenuItem>
                      <MenuItem value='rechazado'>Rechazados</MenuItem>
                      <MenuItem value='todos'>Todos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size='small' placeholder='Buscar cliente, nota, ruta...'
                    value={filtroBusquedaPagosPendientes}
                    onChange={e => { setFiltroBusquedaPagosPendientes(e.target.value); setPagePagosPendientes(0) }}
                    InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Ruta</InputLabel>
                    <Select value={filtroRutaPagosPendientes} label='Ruta'
                      onChange={e => { setFiltroRutaPagosPendientes(e.target.value); setPagePagosPendientes(0) }}>
                      <MenuItem value='todas'>Todas</MenuItem>
                      {rutasUnicas.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabla */}
          <Card>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ width: 32 }}></TableCell>
                    <TableCell><Typography variant='caption' fontWeight='bold'>Cliente</Typography></TableCell>
                    <TableCell><Typography variant='caption' fontWeight='bold'>Ruta / Registrado por</Typography></TableCell>
                    <TableCell><Typography variant='caption' fontWeight='bold'>Nota</Typography></TableCell>
                    <TableCell align='right'><Typography variant='caption' fontWeight='bold'>Monto</Typography></TableCell>
                    <TableCell><Typography variant='caption' fontWeight='bold'>Forma de pago</Typography></TableCell>
                    <TableCell><Typography variant='caption' fontWeight='bold'>Fecha</Typography></TableCell>
                    <TableCell><Typography variant='caption' fontWeight='bold'>Estado</Typography></TableCell>
                    <TableCell align='center'><Typography variant='caption' fontWeight='bold'>Acciones</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosPendientesFiltrados
                    .filter(p => filtroEstadoPagos === 'todos' ? true :
                      filtroEstadoPagos === 'pendiente' ? (!p.pagoCompleto?.estado || p.pagoCompleto?.estado === 'pendiente') :
                      p.pagoCompleto?.estado === filtroEstadoPagos)
                    .slice(pagePagosPendientes * rowsPerPagePagosPendientes, pagePagosPendientes * rowsPerPagePagosPendientes + rowsPerPagePagosPendientes)
                    .map(pago => (
                    <TableRow key={pago.id} hover>
                      <TableCell sx={{ p: 0.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                          {/* Botón detalle */}
                          <Tooltip title='Ver detalle completo del pago'>
                            <IconButton size='small' onClick={async () => {
                              if (pago.pagoCompleto) {
                                setPagoSeleccionadoDetalle(pago.pagoCompleto)
                                setModalDetallePago(true)
                                try {
                                  if (pago.pagoCompleto.usuarioRegistro) {
                                    const u = await usuariosAPI.getById(pago.pagoCompleto.usuarioRegistro)
                                    setUsuarioRegistroNombre(`${u.nombres} ${u.apellidoPaterno}`)
                                  }
                                  if (pago.pagoCompleto.usuarioAutorizacion) {
                                    const u = await usuariosAPI.getById(pago.pagoCompleto.usuarioAutorizacion)
                                    setUsuarioAutorizacionNombre(`${u.nombres} ${u.apellidoPaterno}`)
                                  }
                                } catch {}
                              }
                            }}>
                              <VisibilityIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          {/* Botón ticket */}
                          <Tooltip title='Ver ticket de venta'>
                            <IconButton size='small' sx={{ color: 'text.secondary' }} onClick={async () => {
                              try {
                                const nc = pago.pagoCompleto?.notaCreditoId
                                if (!nc) { setError('Sin nota asociada'); return }
                                const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                                const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token') || '') : ''
                                const res = await fetch(API + '/creditos-abonos/notas-credito/' + nc, { headers: { 'Authorization': 'Bearer ' + token } })
                                if (!res.ok) { setError('No se pudo cargar la nota'); return }
                                const nota = await res.json()
                                if (nota.pedidoId) abrirTicketSbc(nota.pedidoId)
                                else setError('Esta nota no tiene pedido asociado')
                              } catch(e: any) { setError(e.message) }
                            }}>
                              <ReceiptIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' fontWeight='bold'>{pago.cliente}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' display='block'>{pago.ruta}</Typography>
                        <Typography variant='caption' color='text.secondary'>{pago.registradoPorNombre || pago.registradoPor}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' fontWeight='bold'>{pago.nota}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight='bold' color='primary.main'>
                          ${pago.montoPagado?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {pago.formasPago?.map((forma, i) => (
                            <Chip key={i} label={`${forma.metodo}: $${forma.monto.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
                              size='small' color={getMetodoPagoColor(forma.metodo) as any} sx={{ fontSize: 10 }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption'>{pago.fechaHora}</Typography>
                      </TableCell>
                      <TableCell>
                        {(!pago.pagoCompleto?.estado || pago.pagoCompleto?.estado === 'pendiente' || pago.pagoCompleto?.estado === 'en_revision') ? (
                          <Chip label='En Revisión' size='small' color='info' sx={{ fontWeight: 'bold', fontSize: 10 }} />
                        ) : pago.pagoCompleto?.estado === 'en_revision_skip' ? (
                          <Box>
                            <Chip label='En Revisión' size='small' color='info' sx={{ fontWeight: 'bold', fontSize: 10, mb: 0.3 }} />
                            {pago.pagoCompleto?.revisadoPor && <Typography variant='caption' color='text.secondary' display='block'>{pago.pagoCompleto.revisadoPor}</Typography>}
                          </Box>
                        ) : pago.pagoCompleto?.estado === 'autorizado' ? (
                          <Box>
                            <Chip label='✓ Autorizado' size='small' color='success' sx={{ fontWeight: 'bold', fontSize: 10, mb: 0.3 }} />
                            {pago.pagoCompleto?.autorizadoPorNombre && <Typography variant='caption' color='text.secondary' display='block'>{pago.pagoCompleto.autorizadoPorNombre}</Typography>}
                          </Box>
                        ) : (
                          <Chip label='Rechazado' size='small' color='error' sx={{ fontWeight: 'bold', fontSize: 10 }} />
                        )}
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'center' }}>
                          {(() => {
                            const rol = usuario?.rol || ''
                            const esAdmin = ['superAdministrador', 'administrador'].includes(rol)
                            const esStaff = ['superAdministrador', 'administrador', 'oficina', 'planta'].includes(rol)
                            const estado = pago.pagoCompleto?.estado || 'pendiente'
                            return <>
                              {/* Autorizar — solo admin, solo desde en_revision */}
                              {esAdmin && estado === 'en_revision' && (
                                <Tooltip title='✅ Autorizar pago'>
                                  <IconButton size='small' sx={{ color: 'success.main' }} onClick={() => abrirModalPago(pago, 'autorizar')}>
                                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {/* Rechazar — admin desde en_revision, staff desde pendiente */}
                              {((esAdmin && estado === 'en_revision') || (esStaff && estado === 'pendiente')) && (
                                <Tooltip title='❌ Rechazar'>
                                  <IconButton size='small' sx={{ color: 'error.main' }} onClick={() => abrirModalPago(pago, 'rechazar')}>
                                    <CancelIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {/* Reactivar — desde rechazado */}
                              {esStaff && estado === 'rechazado' && (
                                <Tooltip title='🔄 Reactivar'>
                                  <IconButton size='small' sx={{ color: 'warning.main' }} onClick={() => abrirModalPago(pago, 'reactivar')}>
                                    <RefreshIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          })()}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component='div'
              count={pagosPendientesFiltrados.filter(p => filtroEstadoPagos === 'todos' ? true :
                filtroEstadoPagos === 'pendiente' ? (!p.pagoCompleto?.estado || p.pagoCompleto?.estado === 'pendiente') :
                p.pagoCompleto?.estado === filtroEstadoPagos).length}
              page={pagePagosPendientes}
              onPageChange={(_, newPage) => setPagePagosPendientes(newPage)}
              rowsPerPage={rowsPerPagePagosPendientes}
              onRowsPerPageChange={e => { setRowsPerPagePagosPendientes(parseInt(e.target.value, 10)); setPagePagosPendientes(0) }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage='Filas por página'
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
          </Card>
        </Box>
      )}


      {/* Modales */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          {tipoDialogo === 'modificar-limite' && 'Modificar Límite de Crédito'}
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
                    value={nuevoLimite}
                    onChange={(e) => setNuevoLimite(Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>$</InputAdornment>
                    }}
                    sx={{ mt: 2 }}
                  />
                  <TextField
                    fullWidth
                    label='Motivo del Cambio'
                    multiline
                    rows={3}
                    value={motivoLimite}
                    onChange={(e) => setMotivoLimite(e.target.value)}
                    sx={{ mt: 2 }}
                    required
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
                    Selecciona el período para el estado de cuenta. Si no seleccionas fechas, se incluirán todas las notas.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField fullWidth size='small' label='Desde (opcional)' type='date'
                      value={periodoDesdeEC} onChange={e => setPeriodoDesdeEC(e.target.value)}
                      InputLabelProps={{ shrink: true }} />
                    <TextField fullWidth size='small' label='Hasta' type='date'
                      value={periodoHastaEC} onChange={e => setPeriodoHastaEC(e.target.value)}
                      InputLabelProps={{ shrink: true }} />
                  </Box>
                  <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                    Se abrirá una ventana para imprimir el estado de cuenta membretado.
                  </Typography>
                </Box>
              )}

              {(tipoDialogo === 'registrar-pago' || tipoDialogo === 'registrar-abono') && (
                <Box>
                  {/* Info del cliente y contexto */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: '#f9f6f2', borderRadius: 1, border: '1px solid #e0d5c8' }}>
                    <Typography variant='subtitle2' fontWeight='bold' color='text.secondary' gutterBottom>CLIENTE</Typography>
                    <Typography variant='body1' fontWeight='bold'>{clienteSeleccionado?.nombre}</Typography>
                    <Typography variant='caption' color='text.secondary'>{clienteSeleccionado?.ruta} · Saldo: ${(clienteSeleccionado?.saldoActual ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</Typography>
                  </Box>
                  {notaSeleccionada && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#fff8e1', borderRadius: 1, border: '1px solid #ffb74d' }}>
                      <Typography variant='subtitle2' fontWeight='bold' color='warning.dark' gutterBottom>NOTA A LIQUIDAR</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant='body1' fontWeight='bold'>{notaSeleccionada.numeroNota}</Typography>
                          <Typography variant='caption' color='text.secondary'>Vence: {notaSeleccionada.fechaVencimiento ? new Date(notaSeleccionada.fechaVencimiento).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'medium' }) : '—'}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant='h6' fontWeight='bold' color='primary.main'>${(notaSeleccionada.saldoPendiente ?? notaSeleccionada.importe ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography>
                          <Typography variant='caption' color='text.secondary'>saldo pendiente</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  <Typography variant='subtitle1' fontWeight='bold' gutterBottom sx={{ mt: 1 }}>
                    Comprobantes de Pago
                  </Typography>
                  <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 1 }}>
                    Registra cada forma de pago con su folio o referencia del comprobante físico
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
                                {formasPagoDisponibles
                                  .filter(fp => fp.tipo !== 'credito')
                                  .map(fp => (
                                  <MenuItem key={fp.id} value={fp.tipo}>
                                    {fp.nombre}
                                  </MenuItem>
                                ))}
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
                          {['transferencia', 'cheque', 'deposito', 'terminal'].includes(forma.metodo) && (
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label='Folio / Referencia *'
                                value={forma.referencia || ''}
                                onChange={(e) => actualizarFormaPago(forma.id, 'referencia', e.target.value)}
                                error={!forma.referencia || forma.referencia.trim() === ''}
                              />
                            </Grid>
                          )}
                          {['transferencia', 'cheque', 'deposito'].includes(forma.metodo) && (
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

                  <Card sx={{ bgcolor: '#e8f5e9', mb: 2, border: '1px solid #a5d6a7' }}>
                    <CardContent sx={{ pb: '12px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant='caption' color='success.dark' fontWeight='bold' textTransform='uppercase'>Total registrado</Typography>
                          <Typography variant='h4' color='success.dark' fontWeight='bold'>${totalPago.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography>
                        </Box>
                        {notaSeleccionada && (
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant='caption' color={totalPago >= (notaSeleccionada.saldoPendiente ?? notaSeleccionada.importe ?? 0) ? 'success.dark' : 'warning.dark'} fontWeight='bold' textTransform='uppercase'>
                              {totalPago >= (notaSeleccionada.saldoPendiente ?? notaSeleccionada.importe ?? 0) ? '✅ Cubre el saldo' : 'Abono parcial'}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Pendiente después: ${Math.max(0, (notaSeleccionada.saldoPendiente ?? notaSeleccionada.importe ?? 0) - totalPago).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  <TextField
                    fullWidth
                    size='small'
                    label='Notas del cobrador (opcional)'
                    multiline
                    rows={2}
                    value={observacionesPago}
                    onChange={(e) => setObservacionesPago(e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder='Ej: Cliente pagó con 2 billetes, dio cambio de $50. Voucher firmado...'
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            variant='contained' 
            color={tipoDialogo === 'bloquear' ? 'error' : 'primary'}
            onClick={() => {
              if (tipoDialogo === 'modificar-limite') {
                guardarLimiteCredito()
              } else if (tipoDialogo === 'bloquear') {
                guardarBloquearCredito()
              } else if (tipoDialogo === 'estado-cuenta') {
                generarEstadoCuenta()
              } else if (tipoDialogo === 'registrar-pago' || tipoDialogo === 'registrar-abono') {
                registrarPago()
              }
            }}
            disabled={saving}
          >
            {saving ? 'Guardando...' : (
              <>
                {tipoDialogo === 'modificar-limite' && 'Actualizar Límite'}
                {tipoDialogo === 'bloquear' && 'Bloquear Crédito'}
                {tipoDialogo === 'estado-cuenta' && 'Generar Estado'}
                {tipoDialogo === 'registrar-pago' && 'Registrar Pago'}
                {tipoDialogo === 'registrar-abono' && 'Registrar Abono'}
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalles del Pago */}
      <Dialog open={modalDetallePago} onClose={() => { setModalDetallePago(false); setPagoSeleccionadoDetalle(null); setUsuarioRegistroNombre(''); setUsuarioAutorizacionNombre('') }}
        maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon />
            <Typography variant="h6">Detalle del Pago</Typography>
          </Box>
          <IconButton size="small" onClick={() => { setModalDetallePago(false); setPagoSeleccionadoDetalle(null) }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {pagoSeleccionadoDetalle && (
            <Box sx={{ mt: 1 }}>
              {/* SECCIÓN 1: La venta */}
              <Box sx={{ mb: 2, pb: 2, borderBottom: '2px solid #f0f0f0' }}>
                <Typography variant='caption' color='text.secondary' fontWeight='bold' textTransform='uppercase' display='block' sx={{ mb: 1 }}>📦 La Venta</Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>Cliente</Typography>
                    <Typography variant='body2' fontWeight='bold'>
                      {pagoSeleccionadoDetalle.cliente
                        ? `${pagoSeleccionadoDetalle.cliente.nombre} ${pagoSeleccionadoDetalle.cliente.apellidoPaterno || ''}`
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>Ruta / Repartidor</Typography>
                    <Typography variant='body2' fontWeight='bold'>{(pagoSeleccionadoDetalle.cliente as any)?.ruta?.nombre || '—'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>Nota de crédito</Typography>
                    <Typography variant='body2' fontWeight='bold'>{pagoSeleccionadoDetalle.notaCredito?.numeroNota || 'Abono general'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>Tipo</Typography>
                    <Chip label={pagoSeleccionadoDetalle.tipo === 'nota_especifica' ? 'Nota específica' : 'Abono general'}
                      size='small' color={pagoSeleccionadoDetalle.tipo === 'nota_especifica' ? 'primary' : 'secondary'} sx={{ fontSize: 10 }} />
                  </Grid>
                </Grid>
              </Box>

              {/* SECCIÓN 2: El cobro */}
              <Box sx={{ mb: 2, pb: 2, borderBottom: '2px solid #f0f0f0' }}>
                <Typography variant='caption' color='text.secondary' fontWeight='bold' textTransform='uppercase' display='block' sx={{ mb: 1 }}>💰 El Cobro</Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>Monto cobrado</Typography>
                    <Typography variant='h5' color='primary.main' fontWeight='bold'>${pagoSeleccionadoDetalle.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>Estado</Typography>
                    <Box sx={{ mt: 0.3 }}>
                      <Chip label={
                        pagoSeleccionadoDetalle.estado === 'autorizado' ? '✅ Autorizado' :
                        (pagoSeleccionadoDetalle.estado === 'en_revision' || pagoSeleccionadoDetalle.estado === 'pendiente') ? '🔍 En Revisión' : '❌ Rechazado'
                      } color={pagoSeleccionadoDetalle.estado === 'autorizado' ? 'success' : pagoSeleccionadoDetalle.estado === 'rechazado' ? 'error' : 'info'}
                      size='small' sx={{ fontWeight: 'bold' }} />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='caption' color='text.secondary'>Formas de pago</Typography>
                    {pagoSeleccionadoDetalle.formasPago?.map((fp: any, i: number) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2, mt: 0.5, p: 1, bgcolor: '#f9f6f2', borderRadius: 1 }}>
                        <Chip label={fp.formaPago?.tipo || fp.formaPago?.nombre || '—'} size='small' sx={{ fontSize: 10 }} />
                        <Typography variant='body2' fontWeight='bold'>${fp.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography>
                        {fp.referencia && <Typography variant='caption' color='text.secondary'>Folio: <strong>{fp.referencia}</strong></Typography>}
                        {fp.banco && <Typography variant='caption' color='text.secondary'>Banco: {fp.banco}</Typography>}
                      </Box>
                    ))}
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>Fecha y hora</Typography>
                    <Typography variant='body2'>{new Date(pagoSeleccionadoDetalle.fechaPago).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'medium' })} {pagoSeleccionadoDetalle.horaPago}</Typography>
                  </Grid>
                  {pagoSeleccionadoDetalle.observaciones && (
                    <Grid item xs={12}>
                      <Typography variant='caption' color='text.secondary'>Notas del cobrador</Typography>
                      <Typography variant='body2' sx={{ bgcolor: '#fff8e1', p: 0.8, borderRadius: 0.5, mt: 0.3 }}>{pagoSeleccionadoDetalle.observaciones}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* SECCIÓN 3: La autorización */}
              {((pagoSeleccionadoDetalle as any).revisadoPor || (pagoSeleccionadoDetalle as any).autorizadoPorNombre || pagoSeleccionadoDetalle.estado === 'autorizado') && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant='caption' color='text.secondary' fontWeight='bold' textTransform='uppercase' display='block' sx={{ mb: 1 }}>✅ La Autorización</Typography>
                  <Grid container spacing={1.5}>
                    {(pagoSeleccionadoDetalle as any).revisadoPor && (
                      <Grid item xs={6}>
                        <Typography variant='caption' color='text.secondary'>Revisado por (Oficina)</Typography>
                        <Typography variant='body2' fontWeight='bold' color='info.main'>{(pagoSeleccionadoDetalle as any).revisadoPor}</Typography>
                        {(pagoSeleccionadoDetalle as any).fechaRevision && (
                          <Typography variant='caption' color='text.disabled'>{new Date((pagoSeleccionadoDetalle as any).fechaRevision).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'medium' })}</Typography>
                        )}
                      </Grid>
                    )}
                    {(pagoSeleccionadoDetalle as any).autorizadoPorNombre && (
                      <Grid item xs={6}>
                        <Typography variant='caption' color='text.secondary'>Autorizado por (San Luis)</Typography>
                        <Typography variant='body2' fontWeight='bold' color='success.main'>{(pagoSeleccionadoDetalle as any).autorizadoPorNombre}</Typography>
                        {(pagoSeleccionadoDetalle as any).fechaAutorizacionReal && (
                          <Typography variant='caption' color='text.disabled'>{new Date((pagoSeleccionadoDetalle as any).fechaAutorizacionReal).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'medium' })}</Typography>
                        )}
                      </Grid>
                    )}
                    {(pagoSeleccionadoDetalle as any).notaAutorizacion && (
                      <Grid item xs={12}>
                        <Typography variant='caption' color='text.secondary'>Observación de autorización</Typography>
                        <Typography variant='body2' sx={{ bgcolor: '#e8f5e9', p: 0.8, borderRadius: 0.5, mt: 0.3 }}>{(pagoSeleccionadoDetalle as any).notaAutorizacion}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setModalDetallePago(false); setPagoSeleccionadoDetalle(null); setUsuarioRegistroNombre(''); setUsuarioAutorizacionNombre('') }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {vistaActual === 'pagos-sbc' && (
        <Box>
          {/* Mini Dashboard KPIs */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Typography variant='caption' color='warning.dark' fontWeight='bold'>PENDIENTE</Typography>
                  <Typography variant='h5' fontWeight='bold' color='warning.dark'>
                    ${kpisSbc.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant='caption' color='warning.dark'>{kpisSbc.totalPendienteCount} pagos</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Typography variant='caption' color='info.dark' fontWeight='bold'>EN REVISIÓN</Typography>
                  <Typography variant='h5' fontWeight='bold' color='info.dark'>
                    ${kpisSbc.totalConfOficina.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant='caption' color='info.dark'>Revisado por sucursal</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Typography variant='caption' color='success.dark' fontWeight='bold'>AUTORIZADO</Typography>
                  <Typography variant='h5' fontWeight='bold' color='success.dark'>
                    ${kpisSbc.totalConfSanLuis.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant='caption' color='success.dark'>Pago verificado</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: 'background.default' }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Typography variant='caption' color='text.secondary' fontWeight='bold'>PENDIENTES POR TIPO</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={`Transf. ${kpisSbc.transferencia}`} size='small' onClick={() => setFiltroMetodoPagoSbc(filtroMetodoPagoSbc === 'TRANSFERENCIA' ? '' : 'TRANSFERENCIA')} sx={{ bgcolor: filtroMetodoPagoSbc === 'TRANSFERENCIA' ? '#0d47a1' : '#1565c0', color: 'white', fontWeight: 'bold', cursor: 'pointer', outline: filtroMetodoPagoSbc === 'TRANSFERENCIA' ? '2px solid #90caf9' : 'none' }} />
                    <Chip label={`Cheque ${kpisSbc.cheque}`} size='small' onClick={() => setFiltroMetodoPagoSbc(filtroMetodoPagoSbc === 'CHEQUE' ? '' : 'CHEQUE')} sx={{ bgcolor: filtroMetodoPagoSbc === 'CHEQUE' ? '#bf360c' : '#e65100', color: 'white', fontWeight: 'bold', cursor: 'pointer', outline: filtroMetodoPagoSbc === 'CHEQUE' ? '2px solid #ffcc80' : 'none' }} />
                    <Chip label={`Depós. ${kpisSbc.deposito}`} size='small' onClick={() => setFiltroMetodoPagoSbc(filtroMetodoPagoSbc === 'DEPOSITO' ? '' : 'DEPOSITO')} sx={{ bgcolor: filtroMetodoPagoSbc === 'DEPOSITO' ? '#263238' : '#37474f', color: 'white', fontWeight: 'bold', cursor: 'pointer', outline: filtroMetodoPagoSbc === 'DEPOSITO' ? '2px solid #b0bec5' : 'none' }} />
                  </Box>
                  {filtroMetodoPagoSbc && <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>Filtrando por {filtroMetodoPagoSbc.toLowerCase()} — <span style={{cursor:'pointer',textDecoration:'underline'}} onClick={() => setFiltroMetodoPagoSbc('')}>limpiar</span></Typography>}
                </CardContent>
              </Card>
            </Grid>
            {kpisSbc.urgentes > 0 && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#fff3e0', border: '1px solid #ffb74d', cursor: 'pointer' }}
                  onClick={() => setFiltroEstadoSbc('pendiente')}>
                  <CardContent sx={{ pb: '12px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WarningIcon sx={{ color: 'error.main', fontSize: 28 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' fontWeight='bold' color='error.main'>
                        {kpisSbc.urgentes} PAGO{kpisSbc.urgentes > 1 ? 'S' : ''} CON MÁS DE 3 DÍAS SIN CONFIRMAR
                      </Typography>
                      <Typography variant='caption' color='error.dark'>
                        ${kpisSbc.montoUrgentes.toLocaleString('es-MX', { minimumFractionDigits: 0 })} en riesgo — requieren atención inmediata
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Filtros */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Grid container spacing={2} alignItems='center'>
                <Grid item xs={12} sm={4} md={3}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Estado</InputLabel>
                    <Select value={filtroEstadoSbc} label='Estado'
                      onChange={e => setFiltroEstadoSbc(e.target.value)}>
                      <MenuItem value='pendiente'>Pendientes</MenuItem>
                      <MenuItem value='rechazado'>Rechazados</MenuItem>
                      <MenuItem value='confirmado_oficina'>En Revisión</MenuItem>
                      <MenuItem value='confirmado_sanluis'>Autorizados</MenuItem>
                      <MenuItem value='todos'>Todos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={5} md={4}>
                  <TextField fullWidth size='small' placeholder='Buscar cliente, pedido, ruta, operador...'
                    value={filtroBusquedaSbc}
                    onChange={e => setFiltroBusquedaSbc(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                  <TextField fullWidth size='small' placeholder='Operador...'
                    value={filtroOperadorSbc} onChange={e => setFiltroOperadorSbc(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position='start'><PersonIcon fontSize='small' /></InputAdornment> }} />
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Tipo</InputLabel>
                    <Select value={filtroTipoSbc} label='Tipo' onChange={e => setFiltroTipoSbc(e.target.value)}>
                      <MenuItem value=''>Todos</MenuItem>
                      <MenuItem value='pipas'>Pipas</MenuItem>
                      <MenuItem value='cilindros'>Cilindros</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <Button variant='outlined' size='small' fullWidth onClick={() => cargarPedidosSBC()} disabled={loadingSBC}>
                    {loadingSBC ? 'Cargando...' : 'Actualizar'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {loadingSBC && <LinearProgress sx={{ mb: 1 }} />}
          {errorSbc && !loadingSBC && (
            <Alert severity='error' sx={{ mb: 2 }} onClose={() => setErrorSbc(null)}>
              Error al cargar pagos SBC: {errorSbc}
            </Alert>
          )}

          {/* Tabla */}
          {(() => {
            const ahora = new Date()
            const filtrados = pedidosSBC.filter(p => {
              const estadoOk = filtroEstadoSbc === 'todos' ? true
                : filtroEstadoSbc === 'pendiente' ? (!p.estadoSbc || p.estadoSbc === 'pendiente')
                : p.estadoSbc === filtroEstadoSbc
              if (!estadoOk) return false
              if (filtroTipoSbc && p.tipoServicio !== filtroTipoSbc) return false
              if (filtroMetodoPagoSbc && p.metodoPago !== filtroMetodoPagoSbc) return false
              if (filtroOperadorSbc.trim() && !p.repartidor?.toLowerCase().includes(filtroOperadorSbc.toLowerCase())) return false
              if (!filtroBusquedaSbc.trim()) return true
              const b = filtroBusquedaSbc.toLowerCase()
              return p.cliente?.toLowerCase().includes(b) || p.numeroPedido?.toLowerCase().includes(b) || p.ruta?.toLowerCase().includes(b) || p.repartidor?.toLowerCase().includes(b)
            })
            // Mark urgentes
            const filtradosConUrgente = filtrados.map(p => ({
              ...p,
              esUrgente: (!p.estadoSbc || p.estadoSbc === 'pendiente') && p.fechaPedido && (ahora.getTime() - new Date(p.fechaPedido).getTime()) / 86400000 >= 3
            }))
            if (filtradosConUrgente.length === 0 && !loadingSBC) return (
              <Alert severity='info'>No hay pagos SBC para el filtro seleccionado.</Alert>
            )
            return (
              <Card>
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.default' }}>
                        <TableCell sx={{ width: 32 }}></TableCell>
                        <TableCell><Typography variant='caption' fontWeight='bold'>Pedido</Typography></TableCell>
                        <TableCell><Typography variant='caption' fontWeight='bold'>Cliente</Typography></TableCell>
                        <TableCell><Typography variant='caption' fontWeight='bold'>Ruta / Operador</Typography></TableCell>
                        <TableCell><Typography variant='caption' fontWeight='bold'>Método / Folio</Typography></TableCell>
                        <TableCell align='right'><Typography variant='caption' fontWeight='bold'>Monto SBC</Typography></TableCell>
                        <TableCell><Typography variant='caption' fontWeight='bold'>Otros pagos</Typography></TableCell>
                        <TableCell><Typography variant='caption' fontWeight='bold'>Fecha</Typography></TableCell>
                        <TableCell sx={{ minWidth: 130 }}><Typography variant='caption' fontWeight='bold'>Estado / Quién</Typography></TableCell>
                        <TableCell sx={{ maxWidth: 140 }}><Typography variant='caption' fontWeight='bold'>Observación</Typography></TableCell>
                        <TableCell align='center'><Typography variant='caption' fontWeight='bold'>Acciones</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtradosConUrgente.map((p) => (
                        <TableRow key={p.id} hover sx={{ borderLeft: '3px solid', borderLeftColor: (p as any).esUrgente ? 'error.main' : p.estadoSbc === 'rechazado' ? '#9e9e9e' : p.estadoSbc === 'confirmado_sanluis' ? 'success.main' : p.estadoSbc === 'confirmado_oficina' ? 'info.main' : 'warning.main', bgcolor: (p as any).esUrgente ? '#fff8f0' : 'inherit' }}>
                          <TableCell sx={{ p: 0.5 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                              <Tooltip title='Ver detalle del pago SBC'>
                                <IconButton size='small' onClick={() => {
                                  // Construir un objeto compatible con pagoSeleccionadoDetalle
                                  const detalle: any = {
                                    cliente: { nombre: p.cliente, apellidoPaterno: '', ruta: { nombre: p.ruta } },
                                    notaCredito: { numeroNota: p.numeroPedido },
                                    tipo: 'nota_especifica',
                                    montoTotal: p.monto,
                                    estado: p.estadoSbc === 'confirmado_sanluis' ? 'autorizado' : p.estadoSbc === 'confirmado_oficina' ? 'en_revision' : p.estadoSbc === 'rechazado' ? 'rechazado' : 'pendiente',
                                    formasPago: [{ formaPago: { tipo: p.metodoPago }, monto: p.monto, referencia: p.folioConfirmado || p.folioOriginal }],
                                    fechaPago: p.fechaPedido || new Date().toISOString(),
                                    horaPago: p.fechaPedido ? new Date(p.fechaPedido).toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' }) : '—',
                                    observaciones: p.notaConfirmacion,
                                    revisadoPor: p.estadoSbc === 'confirmado_oficina' || p.estadoSbc === 'confirmado_sanluis' ? p.confirmadoPorOficina : null,
                                    fechaRevision: p.fechaConfOficina,
                                    autorizadoPorNombre: p.confirmadoPorSanLuis || null,
                                    fechaAutorizacionReal: p.fechaConfSanLuis,
                                    notaAutorizacion: p.confirmadoPorSanLuis ? p.notaConfirmacion : null,
                                  }
                                  setPagoSeleccionadoDetalle(detalle)
                                  setUsuarioRegistroNombre(p.repartidor || '—')
                                  setModalDetallePago(true)
                                }}>
                                  <VisibilityIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Ver ticket de venta'>
                                <IconButton size='small' onClick={() => abrirTicketSbc(p.pedidoId)}>
                                  <ReceiptIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption' fontWeight='bold'>{p.numeroPedido}</Typography>
                            <Box sx={{ mt: 0.3 }}>
                              <Chip label={p.tipoServicio === 'pipas' ? 'PIPA' : 'CIL'} size='small'
                                sx={{ fontSize: 9, height: 16, bgcolor: p.tipoServicio === 'pipas' ? 'primary.light' : 'warning.light', color: p.tipoServicio === 'pipas' ? 'primary.dark' : 'warning.dark' }} />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption' fontWeight='bold'>{p.cliente}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption' display='block'>{p.ruta}</Typography>
                            <Typography variant='caption' color='text.secondary'>{p.repartidor}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={p.metodoPago} size='small'
                              sx={{ fontWeight: 'bold', fontSize: 10, mb: 0.5,
                                bgcolor: p.metodoPago === 'TRANSFERENCIA' ? '#1565c0' : p.metodoPago === 'CHEQUE' ? '#e65100' : '#37474f',
                                color: 'white' }} />
                            <Typography variant='caption' display='block' color={p.folioConfirmado ? 'primary.main' : 'text.secondary'} fontWeight={p.folioConfirmado ? 'bold' : 'normal'}>
                              {p.folioConfirmado || p.folioOriginal || '—'}
                            </Typography>
                            {p.folioConfirmado && p.folioOriginal && p.folioConfirmado !== p.folioOriginal && (
                              <Typography variant='caption' color='text.disabled' sx={{ textDecoration: 'line-through' }}>{p.folioOriginal}</Typography>
                            )}
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='body2' fontWeight='bold' color='primary.main'>
                              ${p.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 120 }}>
                            {p.ventaTotal && p.monto && Math.abs(p.ventaTotal - p.monto) > 1 ? (
                              <Box>
                                <Typography variant='caption' color='success.main' fontWeight='bold'>
                                  + ${(p.ventaTotal - p.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} efectivo
                                </Typography>
                                <Typography variant='caption' color='text.disabled' display='block'>
                                  Total: ${p.ventaTotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant='caption' color='text.disabled'>—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption'>
                              {p.fechaPedido ? new Date(p.fechaPedido).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {(!p.estadoSbc || p.estadoSbc === 'pendiente') ? (
                              <Chip label='Pendiente' size='small' color='warning' sx={{ fontWeight: 'bold' }} />
                            ) : p.estadoSbc === 'confirmado_oficina' ? (
                              <Box>
                                <Chip label='En Revisión' size='small' color='info' sx={{ fontWeight: 'bold', mb: 0.3 }} />
                                <Typography variant='caption' color='text.secondary' display='block'>{p.confirmadoPorOficina}</Typography>
                                {p.fechaConfOficina && <Typography variant='caption' color='text.disabled' display='block'>{new Date(p.fechaConfOficina).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit' })}</Typography>}
                              </Box>
                            ) : p.estadoSbc === 'confirmado_sanluis' ? (
                              <Box>
                                <Chip label='✓ Autorizado' size='small' color='success' sx={{ fontWeight: 'bold', mb: 0.3 }} />
                                <Typography variant='caption' color='text.secondary' display='block'>{p.confirmadoPorSanLuis}</Typography>
                                {p.fechaConfSanLuis && <Typography variant='caption' color='text.disabled' display='block'>{new Date(p.fechaConfSanLuis).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit' })}</Typography>}
                              </Box>
                            ) : (
                              <Box>
                                <Chip label='Rechazado' size='small' color='error' sx={{ fontWeight: 'bold', mb: 0.3 }} />
                                <Typography variant='caption' color='text.secondary' display='block'>{p.confirmadoPorOficina}</Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 140 }}>
                            {p.notaConfirmacion ? (
                              <Typography variant='caption' color='text.secondary'
                                sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.notaConfirmacion}
                              </Typography>
                            ) : <Typography variant='caption' color='text.disabled'>—</Typography>}
                          </TableCell>
                          <TableCell align='center'>
                            <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'center' }}>
                              {(!p.estadoSbc || p.estadoSbc === 'pendiente') && ['superAdministrador', 'administrador', 'oficina', 'planta'].includes(usuario?.rol || '') && (
                                <Tooltip title='Marcar En Revisión'>
                                  <IconButton size='small' sx={{ color: 'info.main' }} onClick={() => abrirModalSbc(p, 'oficina')}>
                                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {p.estadoSbc === 'confirmado_oficina' && ['superAdministrador', 'administrador'].includes(usuario?.rol || '') && (
                                <Tooltip title='Autorizar pago'>
                                  <IconButton size='small' sx={{ color: 'success.main' }} onClick={() => abrirModalSbc(p, 'sanluis')}>
                                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {((!p.estadoSbc || p.estadoSbc === 'pendiente') && ['superAdministrador', 'administrador', 'oficina', 'planta'].includes(usuario?.rol || '') ||
                                (p.estadoSbc === 'confirmado_oficina' && ['superAdministrador', 'administrador'].includes(usuario?.rol || ''))) && (
                                <Tooltip title='Rechazar'>
                                  <IconButton size='small' sx={{ color: 'error.main' }} onClick={() => abrirModalSbc(p, 'rechazar')}>
                                    <CancelIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {p.estadoSbc === 'rechazado' && ['superAdministrador', 'administrador', 'oficina', 'planta'].includes(usuario?.rol || '') && (
                                <Tooltip title='Reactivar — volver a Pendiente'>
                                  <IconButton size='small' sx={{ color: 'warning.main' }} onClick={() => abrirModalSbc(p, 'reactivar')}>
                                    <RefreshIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )
          })()}

          {/* Modal acción pagos crédito */}
          <Dialog open={modalPago} onClose={() => setModalPago(false)} maxWidth='sm' fullWidth>
            <DialogTitle>
              {tipoAccionPago === 'revision' ? 'Marcar En Revisión' :
               tipoAccionPago === 'autorizar' ? '✅ Autorizar pago — Dar de baja definitivo' :
               tipoAccionPago === 'reactivar' ? 'Reactivar pago' : 'Rechazar pago'}
            </DialogTitle>
            <DialogContent>
              {pagoSelModal && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2'><strong>Cliente:</strong> {pagoSelModal.cliente}</Typography>
                  <Typography variant='body2'><strong>Nota:</strong> {pagoSelModal.nota}</Typography>
                  <Typography variant='body2'><strong>Monto:</strong> ${pagoSelModal.montoPagado?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography>
                  <Typography variant='body2' sx={{ mb: 2 }}><strong>Forma de pago:</strong> {pagoSelModal.formasPago?.map((f: any) => f.metodo).join(', ')}</Typography>
                </Box>
              )}
              {tipoAccionPago === 'autorizar' && pagoSelModal && (
                <Box sx={{ mb: 2 }}>
                  {/* Sección 1: La venta */}
                  <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                    <Typography variant='caption' fontWeight='bold' color='text.secondary' textTransform='uppercase'>📦 La Venta</Typography>
                    <Box sx={{ display: 'flex', gap: 4, mt: 0.5 }}>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>Cliente</Typography>
                        <Typography variant='body2' fontWeight='bold'>{pagoSelModal.cliente}</Typography>
                      </Box>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>Nota</Typography>
                        <Typography variant='body2' fontWeight='bold'>{pagoSelModal.nota}</Typography>
                      </Box>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>Ruta</Typography>
                        <Typography variant='body2'>{pagoSelModal.ruta}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  {/* Sección 2: El cobro */}
                  <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                    <Typography variant='caption' fontWeight='bold' color='text.secondary' textTransform='uppercase'>💰 El Cobro</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant='h5' fontWeight='bold' color='primary.main'>${pagoSelModal.montoPagado?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography>
                        <Typography variant='caption' color='text.secondary'>Registrado por: <strong>{pagoSelModal.registradoPorNombre || pagoSelModal.registradoPor}</strong></Typography>
                      </Box>
                      {pagoSelModal.formasPago?.map((f: any, i: number) => (
                        <Box key={i} sx={{ display: 'flex', gap: 2, p: 1, bgcolor: '#f9f6f2', borderRadius: 1, mb: 0.5, alignItems: 'center' }}>
                          <Chip label={f.metodo?.toUpperCase()} size='small'
                            color={f.metodo === 'transferencia' ? 'primary' : f.metodo === 'cheque' ? 'warning' : f.metodo === 'deposito' ? 'secondary' : 'default'}
                            sx={{ fontSize: 10, minWidth: 90 }} />
                          <Typography variant='body2' fontWeight='bold'>${f.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Typography>
                          {f.referencia && <Box><Typography variant='caption' color='text.secondary'>Folio registrado: </Typography><Typography variant='caption' fontWeight='bold'>{f.referencia}</Typography></Box>}
                          {f.banco && <Typography variant='caption' color='text.secondary'>Banco: {f.banco}</Typography>}
                        </Box>
                      ))}
                      {pagoSelModal.observaciones && (
                        <Typography variant='caption' sx={{ bgcolor: '#fff8e1', p: 0.8, borderRadius: 0.5, display: 'block', mt: 0.5 }}>
                          📝 {pagoSelModal.observaciones}
                        </Typography>
                      )}
                      <Typography variant='caption' color='text.disabled' display='block' sx={{ mt: 0.5 }}>Fecha: {pagoSelModal.fechaHora}</Typography>
                    </Box>
                  </Box>
                  {/* Sección 3: Confirmación */}
                  <Box>
                    <Typography variant='caption' fontWeight='bold' color='text.secondary' textTransform='uppercase'>✅ Tu Confirmación</Typography>
                    {pagoSelModal.formasPago?.some((f: any) => ['transferencia','cheque','deposito'].includes(f.metodo)) && (
                      <TextField fullWidth size='small' sx={{ mt: 1, mb: 1 }}
                        label='Folio confirmado en estado de cuenta / banco *'
                        placeholder='Ej: Referencia bancaria que aparece en tu cuenta...'
                        value={folioConfirmacionPago}
                        onChange={e => setFolioConfirmacionPago(e.target.value)} />
                    )}
                  </Box>
                </Box>
              )}
              {tipoAccionPago === 'revision' && (
                <Alert severity='info' sx={{ mb: 2 }}>
                  Confirmas que recibiste el pago y los comprobantes. El admin lo revisará para autorizar.
                </Alert>
              )}
              <TextField fullWidth multiline rows={2} size='small'
                label={tipoAccionPago === 'rechazar' ? 'Motivo del rechazo *' : tipoAccionPago === 'reactivar' ? 'Motivo de reactivación (opcional)' : 'Nota o referencia del comprobante (opcional)'}
                placeholder={tipoAccionPago === 'rechazar' ? 'Ej: El monto no coincide con lo registrado...' : tipoAccionPago === 'autorizar' ? 'Ej: Transferencia confirmada en cuenta BBVA...' : tipoAccionPago === 'revision' ? 'Ej: Efectivo recibido en caja, ticket #123...' : ''}
                value={notaAccionPago} onChange={e => setNotaAccionPago(e.target.value)} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setModalPago(false)} disabled={saving}>Cancelar</Button>
              <Button variant='contained'
                color={tipoAccionPago === 'rechazar' ? 'error' : tipoAccionPago === 'reactivar' ? 'warning' : tipoAccionPago === 'autorizar' ? 'success' : 'primary'}
                onClick={ejecutarAccionPago} disabled={saving}>
                {saving ? 'Procesando...' : tipoAccionPago === 'revision' ? 'Marcar En Revisión' : tipoAccionPago === 'autorizar' ? 'Autorizar definitivo' : tipoAccionPago === 'reactivar' ? 'Reactivar' : 'Rechazar'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal confirmar/rechazar SBC */}
          <Dialog open={modalSbc} onClose={() => setModalSbc(false)} maxWidth='sm' fullWidth>
            <DialogTitle>
              {tipoAccionSbc === 'oficina' ? 'Confirmar pago — Oficina DH'
                : tipoAccionSbc === 'sanluis' ? 'Confirmar pago — San Luis'
                : 'Rechazar pago SBC'}
            </DialogTitle>
            <DialogContent>
              {pagoSbcSel && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant='subtitle2' fontWeight='bold'>{pagoSbcSel.cliente}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {pagoSbcSel.numeroPedido} · {pagoSbcSel.metodoPago} · ${pagoSbcSel.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Typography>
                  {pagoSbcSel.ventaTotal && pagoSbcSel.monto && Math.abs(pagoSbcSel.ventaTotal - pagoSbcSel.monto) > 1 && (
                    <Typography variant='caption' color='success.main' display='block'>
                      + ${(pagoSbcSel.ventaTotal - pagoSbcSel.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} cobrado en efectivo
                    </Typography>
                  )}
                </Box>
              )}
              {tipoAccionSbc === 'oficina' && (
                <TextField fullWidth size='small' label='Folio / Referencia de confirmación'
                  value={folioConfSbc} onChange={e => setFolioConfSbc(e.target.value)}
                  sx={{ mb: 2 }} helperText='Puedes confirmar o modificar el folio que mandó el operador' />
              )}
              <TextField fullWidth size='small' multiline rows={2}
                label={tipoAccionSbc === 'rechazar' ? 'Motivo del rechazo' : tipoAccionSbc === 'reactivar' ? 'Motivo de reactivación (opcional)' : 'Nota (opcional)'}
                value={notaConfSbc} onChange={e => setNotaConfSbc(e.target.value)}
                placeholder={tipoAccionSbc === 'rechazar' ? 'Ej: No se recibió el depósito...' : tipoAccionSbc === 'reactivar' ? 'Ej: Error al rechazar, sí llegó el pago...' : 'Ej: Confirmado con Gustavo, visto en cuenta...'} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setModalSbc(false)}>Cancelar</Button>
              <Button variant='contained' color={tipoAccionSbc === 'rechazar' ? 'error' : tipoAccionSbc === 'reactivar' ? 'warning' : 'primary'}
                onClick={ejecutarAccionSbc} disabled={saving}>
                {tipoAccionSbc === 'rechazar' ? 'Rechazar' : tipoAccionSbc === 'reactivar' ? 'Reactivar' : 'Confirmar'}
              </Button>
            </DialogActions>
          </Dialog>

        </Box>
      )}

      {/* Modal ticket global — disponible en todas las vistas */}
      <Dialog open={ticketSbcAbierto} onClose={() => { setTicketSbcAbierto(false); setPedidoTicketSbc(null); setHtmlTicketSbc('') }} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Ticket — {pedidoTicketSbc?.numeroPedido}</span>
          <Button size='small' onClick={() => {
            if (htmlTicketSbc) {
              const w = window.open('', '_blank', 'width=400,height=600')
              if (w) { w.document.write(htmlTicketSbc); w.document.close(); setTimeout(() => w.print(), 500) }
            }
          }}>🖨️ Imprimir</Button>
        </DialogTitle>
        <DialogContent>
          {loadingTicketSbc ? <LinearProgress /> : htmlTicketSbc ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <iframe title='Ticket' srcDoc={htmlTicketSbc}
                style={{ width: '300px', minHeight: '450px', border: '1px solid #e0e0e0', borderRadius: 4 }} />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setTicketSbcAbierto(false); setPedidoTicketSbc(null); setHtmlTicketSbc('') }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Vista de Clientes Duplicados */}
      {vistaActual === 'clientes-duplicados' && (
        <Box>
          <Typography variant="h6" gutterBottom>Unificación de Clientes Duplicados</Typography>
          {loadingDuplicados ? <LinearProgress /> : clientesDuplicados.length === 0 ? (
            <Alert severity="info">No se encontraron clientes duplicados (por tener nombre y apellidos idénticos).</Alert>
          ) : (
            <Box>
              <Grid container spacing={3}>
                {clientesDuplicados
                  .slice(pageDuplicados * rowsPerPageDuplicados, pageDuplicados * rowsPerPageDuplicados + rowsPerPageDuplicados)
                  .map((grupo, idxLocal) => {
                  const idx = pageDuplicados * rowsPerPageDuplicados + idxLocal;
                  const pId = principalSel[idx] || grupo[0].id;
                  const secIds = grupo.filter(c => c.id !== pId).map(c => c.id);
                  return (
                    <Grid item xs={12} key={idx}>
                      <Card sx={{ border: '2px solid #ed6c02' }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Grupo {idx + 1}: {grupo[0].nombre} {grupo[0].apellidoPaterno} {grupo[0].apellidoMaterno}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Seleccione LA CUENTA PRINCIPAL a conservar (las demás se unificarán a ésta y desaparecerán).
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            {grupo.map(cliente => (
                              <Box key={cliente.id} sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, bgcolor: pId === cliente.id ? '#fcf0e3' : 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Radio
                                  checked={pId === cliente.id}
                                  onChange={() => setPrincipalSel(prev => ({ ...prev, [idx]: cliente.id }))}
                                />
                                <Box sx={{ flex: 1 }}>
                                  <Typography fontWeight="bold">Email: {cliente.email || 'N/A'}</Typography>
                                  <Typography variant="body2">Tel: {cliente.telefono || 'N/A'} · Domicilio: {cliente.calle} {cliente.numeroExterior}</Typography>
                                  <Typography variant="body2" color="error" fontWeight="bold">Saldo: ${cliente.saldoActual.toLocaleString()}</Typography>
                                </Box>
                                <Chip label={pId === cliente.id ? "Principal" : "A unificar"} color={pId === cliente.id ? "primary" : "default"} />
                              </Box>
                            ))}
                          </Box>
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="contained" color="warning" onClick={() => manejarUnificar(idx, pId, secIds)}>
                              Unificar seleccionados
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
              <TablePagination
                component="div"
                count={clientesDuplicados.length}
                page={pageDuplicados}
                onPageChange={(_, newPage) => setPageDuplicados(newPage)}
                rowsPerPage={rowsPerPageDuplicados}
                onRowsPerPageChange={(e) => {
                  setRowsPerPageDuplicados(parseInt(e.target.value, 10));
                  setPageDuplicados(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Grupos por página"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

