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
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'clientes' | 'pagos-pendientes' | 'historial-pagos' | 'pagos-sbc'>('dashboard')
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
  const [filtroEstadoPagos, setFiltroEstadoPagos] = useState<string>('pendiente')
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
      if (!filtrosAPI.rutaId && primeraRutaId) {
        filtrosAPI.rutaId = primeraRutaId
      }
      // Solo enviar estadoCliente al API cuando es un valor del enum del backend (activo/suspendido/inactivo).
      // Los valores buen-pagador, vencido, critico, bloqueado son estado de crédito y se filtran en cliente.
      const estadoClienteValidos = ['activo', 'suspendido', 'inactivo']
      if (filtros.estado && estadoClienteValidos.includes(filtros.estado)) {
        filtrosAPI.estadoCliente = filtros.estado
      }
      if (filtros.saldoMin !== '') filtrosAPI.saldoMin = filtros.saldoMin
      if (filtros.saldoMax !== '') filtrosAPI.saldoMax = filtros.saldoMax

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

      const pagosPendientesFiltros: { estado: string; rutaId?: string } = { estado: 'pendiente' }
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
      setClientesCredito(clientesResp.clientes)
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
      const fecha = new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })
      const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Estado de Cuenta - ${clienteSeleccionado.nombre}</title>
        <style>body{font-family:system-ui,sans-serif;margin:2rem;max-width:800px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}h1{font-size:1.25rem}.totales{font-weight:bold;margin-top:1rem}</style></head>
        <body>
          <h1>Estado de Cuenta</h1>
          <p><strong>Cliente:</strong> ${clienteSeleccionado.nombre}</p>
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Límite de crédito:</strong> $${(clienteSeleccionado.limiteCredito ?? 0).toLocaleString()}</p>
          <p><strong>Saldo actual:</strong> $${(clienteSeleccionado.saldoActual ?? 0).toLocaleString()}</p>
          <p><strong>Crédito disponible:</strong> $${(clienteSeleccionado.creditoDisponible ?? 0).toLocaleString()}</p>
          <h2>Notas pendientes</h2>
          <table>
            <thead><tr><th>Número</th><th>Fecha venta</th><th>Vencimiento</th><th>Importe</th><th>Estado</th></tr></thead>
            <tbody>
              ${notas.map((n: NotaCredito) => `<tr><td>${n.numeroNota ?? ''}</td><td>${formatearFecha(n.fechaVenta)}</td><td>${formatearFecha(n.fechaVencimiento)}</td><td>$${(n.importe ?? 0).toLocaleString()}</td><td>${n.estado ?? ''}</td></tr>`).join('')}
            </tbody>
          </table>
          ${notas.length === 0 ? '<p>Sin notas pendientes.</p>' : ''}
          <p class="totales">Total pendiente: $${(clienteSeleccionado.saldoActual ?? 0).toLocaleString()}</p>
        </body></html>`
      const ventana = window.open('', '_blank')
      if (ventana) {
        ventana.document.write(html)
        ventana.document.close()
        if (formatoEstadoCuenta === 'pdf') {
          ventana.print()
        }
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
      await creditosAbonosAPI.updatePagoEstado(pagoSelModal.id, estado as any, notaAccionPago)
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
    return clientesCredito.filter(cliente => {
      // Solo deben aparecer los clientes con crédito utilizado (saldo pendiente mayor a 0)
      if ((cliente.saldoActual ?? 0) <= 0) return false

      const cumpleNombre = !filtros.nombre || cliente.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
      const cumpleRuta = !filtros.ruta || cliente.ruta === filtros.ruta
      const cumpleEstado = !filtros.estado || cliente.estado === filtros.estado
      const tieneDeuda = true // Como el saldo siempre es mayor a 0 por la condición anterior
      const cumpleDeuda =
        !filtros.deuda ||
        (filtros.deuda === 'con-deuda' && tieneDeuda) ||
        (filtros.deuda === 'sin-deuda' && !tieneDeuda)
      const cumpleSaldoMin = !filtros.saldoMin || cliente.saldoActual >= Number(filtros.saldoMin)
      const cumpleSaldoMax = !filtros.saldoMax || cliente.saldoActual <= Number(filtros.saldoMax)

      return cumpleNombre && cumpleRuta && cumpleEstado && cumpleDeuda && cumpleSaldoMin && cumpleSaldoMax
    })
  }, [clientesCredito, filtros])

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
    filtros.nombre, filtros.ruta, filtros.estado, 
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
            Pagos Pendientes
          </Button>
          <Button
            variant={vistaActual === 'historial-pagos' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('historial-pagos')}
            startIcon={<HistoryIcon />}
          >
            Historial de Pagos
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
                      <MenuItem value='activo'>Activo</MenuItem>
                      <MenuItem value='suspendido'>Suspendido</MenuItem>
                      <MenuItem value='inactivo'>Inactivo</MenuItem>
                      <MenuItem value='buen-pagador'>Buen Pagador</MenuItem>
                      <MenuItem value='vencido'>Vencido</MenuItem>
                      <MenuItem value='critico'>Crítico</MenuItem>
                      <MenuItem value='bloqueado'>Bloqueado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Deuda</InputLabel>
                    <Select
                      value={filtros.deuda}
                      onChange={(e) => manejarCambioFiltros('deuda', e.target.value)}
                      label='Deuda'
                    >
                      <MenuItem value=''>Todos</MenuItem>
                      <MenuItem value='con-deuda'>Con deuda</MenuItem>
                      <MenuItem value='sin-deuda'>Sin deuda (al día)</MenuItem>
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
                Lista de Clientes (solo primera ruta)
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
                            label={cliente.estado.replace('-', ' ').toUpperCase()}
                            color={getEstadoColor(cliente.estado) as any}
                            size='small'
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
          {/* KPIs rápidos */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            {[
              { label: 'Pendientes', valor: pagosPendientesAutorizacion.filter(p => !p.pagoCompleto?.estado || p.pagoCompleto?.estado === 'pendiente').length, color: 'warning.main' },
              { label: 'En Revisión', valor: pagosPendientesAutorizacion.filter(p => p.pagoCompleto?.estado === 'en_revision').length, color: 'info.main' },
              { label: 'Rechazados', valor: pagosPendientesAutorizacion.filter(p => p.pagoCompleto?.estado === 'rechazado').length, color: 'error.main' },
            ].map(k => (
              <Card key={k.label} sx={{ flex: 1, minWidth: 120, cursor: 'pointer', border: filtroEstadoPagos === k.label.toLowerCase().replace(' ', '_') ? '2px solid' : '1px solid #e0e0e0' }}
                onClick={() => setFiltroEstadoPagos(k.label === 'Pendientes' ? 'pendiente' : k.label === 'En Revisión' ? 'en_revision' : 'rechazado')}>
                <CardContent sx={{ pb: '8px !important', pt: 1.5 }}>
                  <Typography variant='caption' color='text.secondary'>{k.label}</Typography>
                  <Typography variant='h5' fontWeight='bold' sx={{ color: k.color }}>{k.valor}</Typography>
                </CardContent>
              </Card>
            ))}
            <Card sx={{ flex: 1, minWidth: 120, cursor: 'pointer', border: filtroEstadoPagos === 'todos' ? '2px solid' : '1px solid #e0e0e0' }}
              onClick={() => setFiltroEstadoPagos('todos')}>
              <CardContent sx={{ pb: '8px !important', pt: 1.5 }}>
                <Typography variant='caption' color='text.secondary'>Todos</Typography>
                <Typography variant='h5' fontWeight='bold'>{pagosPendientesAutorizacion.length}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Typography variant='h6' gutterBottom>
            {filtroEstadoPagos === 'pendiente' ? 'Pagos Pendientes' : filtroEstadoPagos === 'en_revision' ? 'En Revisión' : filtroEstadoPagos === 'rechazado' ? 'Rechazados' : 'Todos los Pagos'}
          </Typography>
          
          <Card>
            <CardContent>
              {/* Filtros */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <FormControl size='small' sx={{ minWidth: 160 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={filtroEstadoPagos} label='Estado' onChange={e => setFiltroEstadoPagos(e.target.value)}>
                    <MenuItem value='pendiente'>Pendientes</MenuItem>
                    <MenuItem value='en_revision'>En Revisión</MenuItem>
                    <MenuItem value='rechazado'>Rechazados</MenuItem>
                    <MenuItem value='todos'>Todos</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size='small'
                  placeholder='Buscar por cliente, nota o registrado por'
                  value={filtroBusquedaPagosPendientes}
                  onChange={(e) => {
                    setFiltroBusquedaPagosPendientes(e.target.value)
                    setPagePagosPendientes(0)
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon color='action' />
                      </InputAdornment>
                    )
                  }}
                  sx={{ minWidth: 280 }}
                />
                <FormControl size='small' sx={{ minWidth: 200 }}>
                  <InputLabel>Ruta</InputLabel>
                  <Select
                    label='Ruta'
                    value={filtroRutaPagosPendientes}
                    onChange={(e) => {
                      setFiltroRutaPagosPendientes(e.target.value)
                      setPagePagosPendientes(0)
                    }}
                  >
                    <MenuItem value='todas'>Todas las rutas</MenuItem>
                    {rutasUnicas.map((ruta) => (
                      <MenuItem key={ruta} value={ruta}>
                        {ruta}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell align='right'>Monto Pagado</TableCell>
                      <TableCell>Formas de Pago</TableCell>
                      <TableCell>Registrado por</TableCell>
                      <TableCell>Fecha/Hora</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagosPendientesFiltrados
                      .filter(p => filtroEstadoPagos === 'todos' ? true :
                        filtroEstadoPagos === 'pendiente' ? (!p.pagoCompleto?.estado || p.pagoCompleto?.estado === 'pendiente') :
                        p.pagoCompleto?.estado === filtroEstadoPagos)
                      .slice(
                        pagePagosPendientes * rowsPerPagePagosPendientes,
                        pagePagosPendientes * rowsPerPagePagosPendientes + rowsPerPagePagosPendientes
                      )
                      .map((pago) => (
                      <TableRow key={pago.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.cliente}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.ruta}
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
                            {pago.registradoPorNombre || pago.registradoPor}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.fechaHora}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {(!pago.pagoCompleto?.estado || pago.pagoCompleto?.estado === 'pendiente') ? (
                            <Chip label='Pendiente' size='small' color='warning' sx={{ fontWeight: 'bold', fontSize: 10 }} />
                          ) : pago.pagoCompleto?.estado === 'en_revision' ? (
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
                            <Tooltip title='Ver detalles'>
                              <IconButton size='small' onClick={async () => {
                                if (pago.pagoCompleto) {
                                  setPagoSeleccionadoDetalle(pago.pagoCompleto)
                                  setModalDetallePago(true)
                                  try {
                                    if (pago.pagoCompleto.usuarioRegistro) {
                                      const u = await usuariosAPI.getById(pago.pagoCompleto.usuarioRegistro)
                                      setUsuarioRegistroNombre(`${u.nombres} ${u.apellidoPaterno}`)
                                    }
                                  } catch {}
                                }
                              }}>
                                <VisibilityIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            {/* Marcar En Revisión — oficina, planta, admin */}
                            {(!pago.pagoCompleto?.estado || pago.pagoCompleto?.estado === 'pendiente') &&
                              ['superAdministrador', 'administrador', 'oficina', 'planta'].includes(usuario?.rol || '') && (
                              <Tooltip title='Marcar En Revisión'>
                                <IconButton size='small' sx={{ color: 'info.main' }} onClick={() => abrirModalPago(pago, 'revision')}>
                                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {/* Autorizar definitivo — solo admin/superAdmin */}
                            {pago.pagoCompleto?.estado === 'en_revision' &&
                              ['superAdministrador', 'administrador'].includes(usuario?.rol || '') && (
                              <Tooltip title='Autorizar — Dar de baja definitivo'>
                                <IconButton size='small' sx={{ color: 'success.main' }} onClick={() => abrirModalPago(pago, 'autorizar')}>
                                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {/* Rechazar — desde pendiente solo oficina+, desde en_revision solo admin */}
                            {((!pago.pagoCompleto?.estado || pago.pagoCompleto?.estado === 'pendiente') &&
                              ['superAdministrador', 'administrador', 'oficina', 'planta'].includes(usuario?.rol || '')) ||
                              (pago.pagoCompleto?.estado === 'en_revision' &&
                              ['superAdministrador', 'administrador'].includes(usuario?.rol || '')) ? (
                              <Tooltip title='Rechazar'>
                                <IconButton size='small' sx={{ color: 'error.main' }} onClick={() => abrirModalPago(pago, 'rechazar')}>
                                  <CancelIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                            {/* Reactivar — desde rechazado */}
                            {pago.pagoCompleto?.estado === 'rechazado' &&
                              ['superAdministrador', 'administrador', 'oficina', 'planta'].includes(usuario?.rol || '') && (
                              <Tooltip title='Reactivar a Pendiente'>
                                <IconButton size='small' sx={{ color: 'warning.main' }} onClick={() => abrirModalPago(pago, 'reactivar')}>
                                  <RefreshIcon sx={{ fontSize: 16 }} />
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
              <TablePagination
                component='div'
                count={pagosPendientesFiltrados.length}
                page={pagePagosPendientes}
                onPageChange={(_, newPage) => setPagePagosPendientes(newPage)}
                rowsPerPage={rowsPerPagePagosPendientes}
                onRowsPerPageChange={(e) => {
                  setRowsPerPagePagosPendientes(parseInt(e.target.value, 10))
                  setPagePagosPendientes(0)
                }}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                labelRowsPerPage='Filas por página'
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
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
              {/* Buscador, filtro por ruta (incl. Todas las rutas) y por fechas (por defecto hoy) */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
                <TextField
                  size='small'
                  placeholder='Buscar por cliente o nota'
                  value={filtroBusquedaHistorialPagos}
                  onChange={(e) => {
                    setFiltroBusquedaHistorialPagos(e.target.value)
                    setPageHistorialPagos(0)
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon color='action' />
                      </InputAdornment>
                    )
                  }}
                  sx={{ minWidth: 260 }}
                />
                <FormControl size='small' sx={{ minWidth: 200 }}>
                  <InputLabel>Ruta</InputLabel>
                  <Select
                    label='Ruta'
                    value={filtroRutaHistorialPagos}
                    onChange={(e) => {
                      setFiltroRutaHistorialPagos(e.target.value)
                      setPageHistorialPagos(0)
                    }}
                  >
                    <MenuItem value='todas'>Todas las rutas</MenuItem>
                    {rutasUnicas.map((ruta) => (
                      <MenuItem key={ruta} value={ruta}>
                        {ruta}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size='small'
                  label='Fecha desde'
                  type='date'
                  value={fechaDesdeHistorialPagos}
                  onChange={(e) => {
                    setFechaDesdeHistorialPagos(e.target.value)
                    setPageHistorialPagos(0)
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  size='small'
                  label='Fecha hasta'
                  type='date'
                  value={fechaHastaHistorialPagos}
                  onChange={(e) => {
                    setFechaHastaHistorialPagos(e.target.value)
                    setPageHistorialPagos(0)
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 160 }}
                />
              </Box>
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
                    {historialPagosFiltrado
                      .slice(
                        pageHistorialPagos * rowsPerPageHistorialPagos,
                        pageHistorialPagos * rowsPerPageHistorialPagos + rowsPerPageHistorialPagos
                      )
                      .map((pago) => (
                      <TableRow key={pago.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant='body2'>
                              {formatearFecha(pago.fechaPago)}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {pago.horaPago}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.cliente ? `${pago.cliente.nombre} ${pago.cliente.apellidoPaterno} ${pago.cliente.apellidoMaterno}` : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.notaCredito?.numeroNota || 'Abono general'}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${pago.montoTotal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {pago.formasPago.map((forma, index) => {
                              const metodoLabel = forma.metodo ?? (forma as any).formaPago?.nombre ?? (forma as any).formaPago?.tipo ?? 'Otro'
                              return (
                                <Chip
                                  key={index}
                                  label={`${metodoLabel}: $${forma.monto.toLocaleString()}`}
                                  color={getMetodoPagoColor(metodoLabel) as any}
                                  size='small'
                                />
                              )
                            })}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.usuarioRegistro
                              ? (usuariosNombresMapHistorial.get(pago.usuarioRegistro) || pago.usuarioRegistro)
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.usuarioAutorizacion
                              ? (usuariosNombresMapHistorial.get(pago.usuarioAutorizacion) || pago.usuarioAutorizacion)
                              : '-'}
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
              <TablePagination
                component='div'
                count={historialPagosFiltrado.length}
                page={pageHistorialPagos}
                onPageChange={(_, newPage) => setPageHistorialPagos(newPage)}
                rowsPerPage={rowsPerPageHistorialPagos}
                onRowsPerPageChange={(e) => {
                  setRowsPerPageHistorialPagos(parseInt(e.target.value, 10))
                  setPageHistorialPagos(0)
                }}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                labelRowsPerPage='Filas por página'
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </CardContent>
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
                    Se generará un estado de cuenta detallado para este cliente (imprimir o ver en nueva pestaña).
                  </Typography>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Formato</InputLabel>
                    <Select
                      label='Formato'
                      value={formatoEstadoCuenta}
                      onChange={(e) => setFormatoEstadoCuenta(e.target.value as 'pdf' | 'excel')}
                    >
                      <MenuItem value='pdf'>PDF (imprimir)</MenuItem>
                      <MenuItem value='excel'>Ver en pantalla</MenuItem>
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

                  <Card sx={{ bgcolor: 'success.light', mb: 2 }}>
                    <CardContent>
                      <Typography variant='h6' gutterBottom>
                        Resumen del Pago
                      </Typography>
                      <Typography variant='h4' color='primary'>
                        Total a pagar: ${totalPago.toLocaleString()}
                      </Typography>
                      {notaSeleccionada && (
                        <Typography variant='body2' color='text.secondary'>
                          Faltante: ${(notaSeleccionada.importe - totalPago).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  <TextField
                    fullWidth
                    label='Observaciones'
                    multiline
                    rows={3}
                    value={observacionesPago}
                    onChange={(e) => setObservacionesPago(e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder='Observaciones sobre el pago...'
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
      <Dialog 
        open={modalDetallePago} 
        onClose={() => {
          setModalDetallePago(false)
          setPagoSeleccionadoDetalle(null)
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon />
              <Typography variant="h6">
                Detalles del Pago
              </Typography>
            </Box>
            <IconButton 
              onClick={() => {
                setModalDetallePago(false)
                setPagoSeleccionadoDetalle(null)
                setUsuarioRegistroNombre('')
                setUsuarioAutorizacionNombre('')
              }} 
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {pagoSeleccionadoDetalle && (
            <Box sx={{ mt: 2 }}>
              {/* Información del Cliente */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    Información del Cliente
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Cliente
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {pagoSeleccionadoDetalle.cliente 
                          ? `${pagoSeleccionadoDetalle.cliente.nombre} ${pagoSeleccionadoDetalle.cliente.apellidoPaterno} ${pagoSeleccionadoDetalle.cliente.apellidoMaterno}`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Teléfono
                      </Typography>
                      <Typography variant="body1">
                        {pagoSeleccionadoDetalle.cliente?.telefono || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Información del Pago */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon />
                    Información del Pago
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Número de Nota
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {pagoSeleccionadoDetalle.notaCredito?.numeroNota || 'Abono general'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tipo de Pago
                      </Typography>
                      <Chip
                        label={pagoSeleccionadoDetalle.tipo === 'nota_especifica' ? 'Nota Específica' : 'Abono General'}
                        color={pagoSeleccionadoDetalle.tipo === 'nota_especifica' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Monto Total
                      </Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        ${pagoSeleccionadoDetalle.montoTotal.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Estado
                      </Typography>
                      <Chip
                        label={pagoSeleccionadoDetalle.estado.toUpperCase()}
                        color={
                          pagoSeleccionadoDetalle.estado === 'autorizado' ? 'success' :
                          pagoSeleccionadoDetalle.estado === 'pendiente' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Pago
                      </Typography>
                      <Typography variant="body1">
                        {new Date(pagoSeleccionadoDetalle.fechaPago).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'America/Mexico_City'
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Hora de Pago
                      </Typography>
                      <Typography variant="body1">
                        {pagoSeleccionadoDetalle.horaPago}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Formas de Pago */}
              {pagoSeleccionadoDetalle.formasPago && pagoSeleccionadoDetalle.formasPago.length > 0 && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoneyIcon />
                      Formas de Pago
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Método</TableCell>
                            <TableCell align="right">Monto</TableCell>
                            <TableCell>Referencia</TableCell>
                            <TableCell>Banco</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pagoSeleccionadoDetalle.formasPago.map((forma, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Chip
                                  label={forma.formaPago?.nombre || forma.formaPago?.tipo || 'N/A'}
                                  color={getMetodoPagoColor(forma.formaPago?.tipo || 'efectivo') as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" fontWeight="bold">
                                  ${forma.monto.toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {forma.referencia || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {forma.banco || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Información de Registro */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon />
                    Información de Registro
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Registrado por
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {usuarioRegistroNombre || pagoSeleccionadoDetalle.usuarioRegistro || 'N/A'}
                      </Typography>
                    </Grid>
                    {pagoSeleccionadoDetalle.usuarioAutorizacion && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Autorizado por
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {usuarioAutorizacionNombre || pagoSeleccionadoDetalle.usuarioAutorizacion}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Creación
                      </Typography>
                      <Typography variant="body1">
                        {new Date(pagoSeleccionadoDetalle.fechaCreacion).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Última Modificación
                      </Typography>
                      <Typography variant="body1">
                        {new Date(pagoSeleccionadoDetalle.fechaModificacion).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Observaciones */}
              {pagoSeleccionadoDetalle.observaciones && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Observaciones
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pagoSeleccionadoDetalle.observaciones}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setModalDetallePago(false)
              setPagoSeleccionadoDetalle(null)
              setUsuarioRegistroNombre('')
              setUsuarioAutorizacionNombre('')
            }}
          >
            Cerrar
          </Button>
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
                            <Tooltip title='Ver ticket'>
                              <IconButton size='small' onClick={() => abrirTicketSbc(p.pedidoId)}>
                                <ReceiptIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
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
              {tipoAccionPago === 'autorizar' && (
                <Alert severity='success' sx={{ mb: 2 }}>
                  Al autorizar, la nota de crédito quedará oficialmente pagada y el crédito del cliente se liberará.
                </Alert>
              )}
              <TextField fullWidth multiline rows={2} size='small'
                label={tipoAccionPago === 'rechazar' ? 'Motivo del rechazo' : tipoAccionPago === 'reactivar' ? 'Motivo de reactivación (opcional)' : 'Nota (opcional)'}
                placeholder={tipoAccionPago === 'rechazar' ? 'Ej: El efectivo no coincide...' : tipoAccionPago === 'autorizar' ? 'Ej: Confirmado en cuenta bancaria...' : ''}
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

          {/* Modal ticket SBC */}
          <Dialog open={ticketSbcAbierto} onClose={() => { setTicketSbcAbierto(false); setPedidoTicketSbc(null); setHtmlTicketSbc('') }} maxWidth='sm' fullWidth>
            <DialogTitle>Ticket — {pedidoTicketSbc?.numeroPedido}</DialogTitle>
            <DialogContent>
              {loadingTicketSbc ? <LinearProgress /> : htmlTicketSbc ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <iframe title='Ticket' srcDoc={htmlTicketSbc}
                    style={{ width: '280px', minHeight: '400px', border: '1px solid #e0e0e0', borderRadius: 4 }} />
                </Box>
              ) : null}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setTicketSbcAbierto(false); setPedidoTicketSbc(null); setHtmlTicketSbc('') }}>Cerrar</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}


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

