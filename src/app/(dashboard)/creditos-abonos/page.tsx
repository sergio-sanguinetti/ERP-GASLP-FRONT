'use client'

import React, { useState, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { 
  creditosAbonosAPI, 
  clientesAPI, 
  rutasAPI, 
  formasPagoAPI,
  authAPI,
  sedesAPI,
  usuariosAPI,
  reportesFinancierosAPI,
  type ClienteCredito as ClienteCreditoAPI,
  type NotaCredito as NotaCreditoAPI,
  type Pago as PagoAPI,
  type ResumenCartera,
  type HistorialLimiteCredito,
  type Usuario,
  type Sede,
  type Ruta,
  type FormaPago
} from '@/lib/api'
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
  CircularProgress,
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
  observaciones: string
  pagoCompleto?: PagoAPI
}

export default function CreditosAbonosPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'clientes' | 'limites' | 'alertas' | 'reportes' | 'pagos-pendientes' | 'historial-pagos'>('dashboard')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteCredito | null>(null)
  const [pedidosPendientes, setPedidosPendientes] = useState<any[]>([])
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'modificar-limite' | 'recordatorio' | 'bloquear' | 'estado-cuenta' | 'registrar-pago' | 'registrar-abono' | 'cerrar-venta'>('modificar-limite')
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null)
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaCredito | null>(null)
  const [formasPago, setFormasPago] = useState<Array<{ id: string; formaPagoId: string; metodo: string; monto: number; referencia?: string; banco?: string; tipo?: 'metodo_pago' | 'credito' }>>([])
  const [montoTotalPago, setMontoTotalPago] = useState(0)
  const [creditoUsado, setCreditoUsado] = useState(0)
  const [usarCredito, setUsarCredito] = useState(false)
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
  const [pagosPendientesAutorizacion, setPagosPendientesAutorizacion] = useState<PagoPendienteAutorizacion[]>([])
  const [historialPagos, setHistorialPagos] = useState<Pago[]>([])
  const [historialLimites, setHistorialLimites] = useState<HistorialLimite[]>([])
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
  const [observacionesPago, setObservacionesPago] = useState('')
  const [limitesEditados, setLimitesEditados] = useState<Record<string, { limite: number; motivo: string }>>({})
  const [modalDetallePago, setModalDetallePago] = useState(false)
  const [pagoSeleccionadoDetalle, setPagoSeleccionadoDetalle] = useState<PagoAPI | null>(null)
  const [usuarioRegistroNombre, setUsuarioRegistroNombre] = useState<string>('')
  const [usuarioAutorizacionNombre, setUsuarioAutorizacionNombre] = useState<string>('')
  const [generandoReporte, setGenerandoReporte] = useState<string | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
    
    // Verificar si hay un pedidoId en la URL para abrir el diálogo de cerrar venta
    const params = new URLSearchParams(window.location.search)
    const pedidoIdParam = params.get('pedidoId')
    const clienteIdParam = params.get('clienteId')
    
    if (pedidoIdParam && clienteIdParam) {
      handlePedidoDesdeURL(pedidoIdParam, clienteIdParam)
    }
  }, [])

  const handlePedidoDesdeURL = async (pedidoId: string, clienteId: string) => {
    try {
      // Cargar datos del cliente y del pedido
      const [cliente, pedido] = await Promise.all([
        clientesAPI.getById(clienteId),
        pedidosAPI.getById(pedidoId)
      ])
      
      if (cliente && pedido) {
        // Convertir cliente al formato ClienteCredito si es necesario
        const clienteCredito: any = {
          ...cliente,
          creditoDisponible: cliente.limiteCredito - cliente.saldoActual,
          notasPendientes: [] // Se cargarán si es necesario
        }
        abrirDialogo('cerrar-venta', clienteCredito, pedido)
      }
    } catch (err) {
      console.error('Error al cargar datos desde URL:', err)
    }
  }

  useEffect(() => {
    if (sedeId !== null) {
      cargarDatos()
    }
  }, [sedeId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const user = await authAPI.getProfile()
      setUsuario(user)
      
      const [sedesData, rutasData, formasPagoData] = await Promise.all([
        sedesAPI.getAll(),
        rutasAPI.getAll(),
        formasPagoAPI.getAll()
      ])
      
      setSedes(sedesData)
      setRutas(rutasData)
      setFormasPagoDisponibles(formasPagoData)
      
      if (user.rol === 'superAdministrador') {
        setSedeId(user.sede || sedesData[0]?.id || null)
      } else {
        setSedeId(user.sede || null)
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos iniciales')
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filtrosAPI: any = {}
      if (sedeId) {
        filtrosAPI.sedeId = sedeId
      }
      if (filtros.nombre) {
        filtrosAPI.nombre = filtros.nombre
      }
      if (filtros.ruta) {
        const rutaEncontrada = rutas.find(r => r.nombre === filtros.ruta)
        if (rutaEncontrada) {
          filtrosAPI.rutaId = rutaEncontrada.id
        }
      }
      if (filtros.estado) {
        filtrosAPI.estadoCliente = filtros.estado
      }

      const [resumen, clientes, pagos, historial, pedidos] = await Promise.all([
        creditosAbonosAPI.getResumenCartera(),
        creditosAbonosAPI.getClientesCredito(filtrosAPI),
        creditosAbonosAPI.getAllPagos({ estado: 'pendiente' }),
        creditosAbonosAPI.getAllPagos(),
        creditosAbonosAPI.getPedidosPendientes ? creditosAbonosAPI.getPedidosPendientes() : Promise.resolve([])
      ])

      setResumenCredito(resumen)
      setClientesCredito(clientes)
      setPedidosPendientes(pedidos)
      
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
          fechaHora: `${new Date(p.fechaPago).toLocaleDateString('es-MX')} ${p.horaPago}`,
          observaciones: p.observaciones || '',
          pagoCompleto: p
        }
      })
      setPagosPendientesAutorizacion(pagosPendientes)
      setHistorialPagos(historial)

      // Cargar historial de límites
      const historialLimitesData = await creditosAbonosAPI.getHistorialLimites()
      setHistorialLimites(historialLimitesData.map(h => ({
        id: h.id,
        cliente: h.cliente ? `${h.cliente.nombre} ${h.cliente.apellidoPaterno} ${h.cliente.apellidoMaterno}` : 'N/A',
        usuario: h.usuario ? `${h.usuario.nombres} ${h.usuario.apellidoPaterno}` : 'N/A',
        fecha: h.fechaCreacion,
        limiteAnterior: h.limiteAnterior,
        limiteNuevo: h.limiteNuevo,
        motivo: h.motivo
      })))
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

    clientesCredito.forEach(cliente => {
      if (cliente.saldoActual > cliente.limiteCredito) {
        alertas.push({
          id: `alerta-${cliente.id}-excede`,
          tipo: 'critica',
          titulo: 'Cliente excede límite de crédito',
          descripcion: `${cliente.nombre} ha excedido su límite de crédito en $${(cliente.saldoActual - cliente.limiteCredito).toLocaleString()}`,
          fecha: new Date().toISOString().split('T')[0],
          cliente: cliente.nombre,
          monto: cliente.saldoActual - cliente.limiteCredito
        })
      }

      const notasVencidas = cliente.notasPendientes.filter(n => n.estado === 'vencida')
      notasVencidas.forEach(nota => {
        if (nota.diasVencimiento < -60) {
          alertas.push({
            id: `alerta-${nota.id}-vencida`,
            tipo: 'critica',
            titulo: 'Deuda vencida más de 60 días',
            descripcion: `${cliente.nombre} tiene deuda vencida desde hace ${Math.abs(nota.diasVencimiento)} días`,
            fecha: new Date().toISOString().split('T')[0],
            cliente: cliente.nombre,
            diasVencimiento: Math.abs(nota.diasVencimiento)
          })
        }
      })
    })

    return alertas
  }, [clientesCredito])

  // Función helper para formatear fechas de manera consistente
  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha)
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return fecha
    }
  }

  const abrirDialogo = (tipo: 'modificar-limite' | 'recordatorio' | 'bloquear' | 'estado-cuenta' | 'registrar-pago' | 'registrar-abono' | 'cerrar-venta', cliente?: ClienteCredito, item?: any) => {
    setTipoDialogo(tipo)
    setClienteSeleccionado(cliente || null)
    
    if (tipo === 'registrar-pago') {
      setNotaSeleccionada(item || null)
    } else if (tipo === 'cerrar-venta') {
      setPedidoSeleccionado(item || null)
    }
    
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
    if (!clienteSeleccionado || (formasPago.length === 0 && !usarCredito) || montoTotalPago <= 0) return

    try {
      setSaving(true)
      setError(null)

      const formasPagoData = formasPago.map(fp => ({
        formaPagoId: fp.formaPagoId,
        monto: fp.monto,
        referencia: fp.referencia,
        banco: fp.banco,
        tipo: 'metodo_pago'
      }))

      if (usarCredito && creditoUsado > 0) {
        formasPagoData.push({
          formaPagoId: '',
          monto: creditoUsado,
          referencia: undefined,
          banco: undefined,
          tipo: 'credito'
        } as any)
      }

      await creditosAbonosAPI.createPago({
        clienteId: clienteSeleccionado.id,
        pedidoId: pedidoSeleccionado?.id,
        notaCreditoId: notaSeleccionada?.id,
        montoTotal: montoTotalPago,
        tipo: notaSeleccionada ? 'nota_especifica' : 'abono_general',
        observaciones: observacionesPago,
        formasPago: formasPagoData,
        estado: 'autorizado' // En la web se autoriza directamente si tiene permisos
      })

      await cargarDatos()
      cerrarDialogo()
      setSuccessMessage('Venta cerrada y pago registrado correctamente')
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago')
    } finally {
      setSaving(false)
    }
  }

  const autorizarPago = async (pagoId: string) => {
    try {
      setSaving(true)
      setError(null)
      await creditosAbonosAPI.updatePagoEstado(pagoId, 'autorizado')
      await cargarDatos()
    } catch (err: any) {
      setError(err.message || 'Error al autorizar pago')
    } finally {
      setSaving(false)
    }
  }

  const rechazarPago = async (pagoId: string) => {
    try {
      setSaving(true)
      setError(null)
      await creditosAbonosAPI.updatePagoEstado(pagoId, 'rechazado')
      await cargarDatos()
    } catch (err: any) {
      setError(err.message || 'Error al rechazar pago')
    } finally {
      setSaving(false)
    }
  }

  // Calcular total del pago usando useMemo para evitar re-renders infinitos
  const totalPago = useMemo(() => {
    const totalMetodos = formasPago.reduce((sum, fp) => sum + fp.monto, 0)
    const totalCredito = usarCredito ? creditoUsado : 0
    return totalMetodos + totalCredito
  }, [formasPago, usarCredito, creditoUsado])

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
      case 'credito': return 'info'
      default: return 'default'
    }
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setClienteSeleccionado(null)
    setPedidoSeleccionado(null)
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
      case 'pagada': return 'info'
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
      const cumpleNombre = !filtros.nombre || cliente.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
      const cumpleRuta = !filtros.ruta || cliente.ruta === filtros.ruta
      const cumpleEstado = !filtros.estado || cliente.estado === filtros.estado
      const cumpleSaldoMin = !filtros.saldoMin || cliente.saldoActual >= Number(filtros.saldoMin)
      const cumpleSaldoMax = !filtros.saldoMax || cliente.saldoActual <= Number(filtros.saldoMax)
      
      return cumpleNombre && cumpleRuta && cumpleEstado && cumpleSaldoMin && cumpleSaldoMax
    })
  }, [clientesCredito, filtros])

  const rutasUnicas = useMemo(() => {
    return [...new Set(clientesCredito.map(c => c.ruta))]
  }, [clientesCredito])

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (sedeId !== null) {
      cargarDatos()
    }
  }, [filtros.nombre, filtros.ruta, filtros.estado])

  // Función para descargar datos como Excel
  const descargarExcel = (datos: any[] | any, nombreArchivo: string, hojas?: Array<{ nombre: string; datos: any[] }>) => {
    try {
      const workbook = XLSX.utils.book_new()
      const fecha = new Date().toISOString().split('T')[0]
      let hojasAgregadas = 0

      if (hojas && Array.isArray(hojas)) {
        // Múltiples hojas
        hojas.forEach(hoja => {
          if (hoja.datos && Array.isArray(hoja.datos) && hoja.datos.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(hoja.datos)
            XLSX.utils.book_append_sheet(workbook, worksheet, hoja.nombre)
            hojasAgregadas++
          } else if (hoja.datos && Array.isArray(hoja.datos) && hoja.datos.length === 0) {
            // Crear hoja vacía con encabezados si no hay datos
            const worksheet = XLSX.utils.aoa_to_sheet([['No hay datos disponibles']])
            XLSX.utils.book_append_sheet(workbook, worksheet, hoja.nombre)
            hojasAgregadas++
          }
        })
      } else if (Array.isArray(datos)) {
        // Una sola hoja con array de datos
        if (datos.length === 0) {
          // Crear hoja vacía con mensaje
          const worksheet = XLSX.utils.aoa_to_sheet([['No hay datos disponibles']])
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
          hojasAgregadas++
        } else {
          const worksheet = XLSX.utils.json_to_sheet(datos)
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
          hojasAgregadas++
        }
      } else if (datos && typeof datos === 'object') {
        // Objeto único - crear hojas separadas si es necesario
        const keys = Object.keys(datos)
        let tieneArrays = false
        
        keys.forEach(key => {
          if (Array.isArray(datos[key])) {
            tieneArrays = true
            if (datos[key].length > 0) {
              const worksheet = XLSX.utils.json_to_sheet(datos[key])
              XLSX.utils.book_append_sheet(workbook, worksheet, key)
              hojasAgregadas++
            } else {
              // Hoja vacía con mensaje
              const worksheet = XLSX.utils.aoa_to_sheet([['No hay datos disponibles']])
              XLSX.utils.book_append_sheet(workbook, worksheet, key)
              hojasAgregadas++
            }
          }
        })

        if (!tieneArrays) {
          // Si no tiene arrays, crear una hoja con el objeto
          const worksheet = XLSX.utils.json_to_sheet([datos])
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
          hojasAgregadas++
        }
      } else {
        setError('Formato de datos no válido')
        return
      }

      // Verificar que se agregó al menos una hoja
      if (hojasAgregadas === 0) {
        // Crear una hoja por defecto con mensaje
        const worksheet = XLSX.utils.aoa_to_sheet([['No hay datos disponibles para este reporte']])
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
      }

      // Generar el archivo Excel
      XLSX.writeFile(workbook, `${nombreArchivo}_${fecha}.xlsx`)
    } catch (error: any) {
      console.error('Error al generar Excel:', error)
      setError('Error al generar el archivo Excel: ' + (error.message || 'Error desconocido'))
    }
  }

  // Funciones para generar reportes
  const generarReporte = async (tipo: string) => {
    try {
      setGenerandoReporte(tipo)
      setError(null)

      switch (tipo) {
        case 'antiguedad-cartera': {
          const data = await reportesFinancierosAPI.getAntiguedadCartera()
          descargarExcel(null, 'Antiguedad_Cartera', [
            { nombre: 'Menos de 30 días', datos: data.menos30 },
            { nombre: '30 a 60 días', datos: data.entre30y60 },
            { nombre: '60 a 90 días', datos: data.entre60y90 },
            { nombre: 'Más de 90 días', datos: data.mas90 }
          ])
          break
        }
        case 'top-mejores-pagadores': {
          const data = await reportesFinancierosAPI.getTopMejoresPagadores(10)
          descargarExcel(data, 'Top_10_Mejores_Pagadores')
          break
        }
        case 'top-peores-pagadores': {
          const data = await reportesFinancierosAPI.getTopPeoresPagadores(10)
          descargarExcel(data, 'Top_10_Peores_Pagadores')
          break
        }
        case 'analisis-riesgo': {
          const data = await reportesFinancierosAPI.getAnalisisRiesgo()
          descargarExcel(null, 'Analisis_Riesgo', [
            { nombre: 'Crítico', datos: data.critico.map(c => ({ ...c, nivel: 'CRÍTICO' })) },
            { nombre: 'Alto', datos: data.alto.map(c => ({ ...c, nivel: 'ALTO' })) },
            { nombre: 'Medio', datos: data.medio.map(c => ({ ...c, nivel: 'MEDIO' })) },
            { nombre: 'Bajo', datos: data.bajo.map(c => ({ ...c, nivel: 'BAJO' })) }
          ])
          break
        }
        case 'clientes-visita-cobranza': {
          const data = await reportesFinancierosAPI.getClientesVisitaCobranza()
          descargarExcel(data, 'Clientes_Visita_Cobranza')
          break
        }
        case 'recordatorios-por-enviar': {
          const data = await reportesFinancierosAPI.getRecordatoriosPorEnviar()
          descargarExcel(data, 'Recordatorios_Por_Enviar')
          break
        }
        case 'transferencias-pendientes': {
          const data = await reportesFinancierosAPI.getTransferenciasPendientes()
          descargarExcel(data, 'Transferencias_Pendientes')
          break
        }
        case 'clientes-limite-excedido': {
          const data = await reportesFinancierosAPI.getClientesLimiteExcedido()
          descargarExcel(data, 'Clientes_Limite_Excedido')
          break
        }
        case 'comparativo-cartera-ventas': {
          const data = await reportesFinancierosAPI.getComparativoCarteraVentas()
          // Convertir objeto a formato de hoja Excel
          const datosFormateados = [
            { 'Métrica': 'Ventas Total', 'Valor': `$${data.ventas.total.toLocaleString()}` },
            { 'Métrica': 'Ventas Pagado', 'Valor': `$${data.ventas.pagado.toLocaleString()}` },
            { 'Métrica': 'Ventas Pendiente', 'Valor': `$${data.ventas.pendiente.toLocaleString()}` },
            { 'Métrica': 'Cartera Total', 'Valor': `$${data.cartera.total.toLocaleString()}` },
            { 'Métrica': 'Cartera Vigente', 'Valor': `$${data.cartera.vigente.toLocaleString()}` },
            { 'Métrica': 'Porcentaje sobre Ventas', 'Valor': `${data.cartera.porcentajeSobreVentas}%` },
            { 'Métrica': 'Ratio de Cobranza', 'Valor': `${data.indicadores.ratioCobranza}%` }
          ]
          descargarExcel(datosFormateados, 'Comparativo_Cartera_Ventas')
          break
        }
        case 'eficiencia-cobranza-repartidor': {
          const data = await reportesFinancierosAPI.getEficienciaCobranzaRepartidor()
          descargarExcel(data, 'Eficiencia_Cobranza_Repartidor')
          break
        }
        case 'tendencias-pago': {
          const data = await reportesFinancierosAPI.getTendenciasPago(12)
          descargarExcel(data, 'Tendencias_Pago')
          break
        }
        case 'proyeccion-flujo-caja': {
          const data = await reportesFinancierosAPI.getProyeccionFlujoCaja(6)
          descargarExcel(data, 'Proyeccion_Flujo_Caja')
          break
        }
        default:
          setError('Tipo de reporte no reconocido')
      }
      
      setSuccessMessage('Reporte generado y descargado exitosamente')
    } catch (err: any) {
      setError(err.message || 'Error al generar el reporte')
      console.error('Error generando reporte:', err)
    } finally {
      setGenerandoReporte(null)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Gestión de Créditos y Abonos
      </Typography>

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
                            <Tooltip title='Cerrar Venta'>
                              <IconButton 
                                size='small' 
                                color='primary'
                                onClick={async () => {
                                  // Intentar obtener pedidos pendientes para este cliente
                                  try {
                                    const pedidos = await creditosAbonosAPI.getPedidosPendientes(cliente.id)
                                    if (pedidos && pedidos.length > 0) {
                                      abrirDialogo('cerrar-venta', cliente, pedidos[0])
                                    } else {
                                      alert('El cliente no tiene pedidos pendientes para cerrar.')
                                    }
                                  } catch (err) {
                                    console.error('Error al obtener pedidos:', err)
                                  }
                                }}
                              >
                                <CheckCircleIcon />
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

                <Typography variant='h6' gutterBottom>
                  Notas del Cliente
                </Typography>
                
                {clienteSeleccionado.notasPendientes.length > 0 ? (
                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Número de Nota</TableCell>
                          <TableCell>Fecha Venta</TableCell>
                          <TableCell>Fecha Vencimiento</TableCell>
                          <TableCell align='right'>Importe Original</TableCell>
                          <TableCell align='right'>Saldo Pendiente</TableCell>
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
                              {formatearFecha(nota.fechaVenta)}
                            </TableCell>
                            <TableCell>
                              {formatearFecha(nota.fechaVencimiento)}
                            </TableCell>
                            <TableCell align='right'>
                              ${nota.importe.toLocaleString()}
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='subtitle1' color={nota.saldoPendiente > 0 ? 'primary' : 'text.disabled'} fontWeight='bold'>
                                ${nota.saldoPendiente.toLocaleString()}
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
                              {nota.estado !== 'pagada' && (
                                <Tooltip title='Pagar esta nota'>
                                  <IconButton 
                                    size='small' 
                                    onClick={() => abrirDialogo('registrar-pago', clienteSeleccionado, nota)}
                                  >
                                    <PaymentIcon />
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
                    color='primary'
                    startIcon={<CheckCircleIcon />}
                    onClick={async () => {
                      try {
                        const pedidos = await creditosAbonosAPI.getPedidosPendientes(clienteSeleccionado.id)
                        if (pedidos && pedidos.length > 0) {
                          abrirDialogo('cerrar-venta', clienteSeleccionado, pedidos[0])
                        } else {
                          alert('El cliente no tiene pedidos pendientes para cerrar.')
                        }
                      } catch (err) {
                        console.error('Error al obtener pedidos:', err)
                      }
                    }}
                  >
                    Cerrar Venta
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
                      <TableCell align='center' sx={{ minWidth: 400 }}>Acciones</TableCell>
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
                            value={limitesEditados[cliente.id]?.limite ?? cliente.limiteCredito}
                            onChange={(e) => manejarCambioLimite(cliente.id, Number(e.target.value))}
                            InputProps={{
                              startAdornment: <InputAdornment position='start'>$</InputAdornment>
                            }}
                            sx={{ minWidth: 150 }}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                              size='small'
                              placeholder='Motivo (opcional)'
                              value={limitesEditados[cliente.id]?.motivo || ''}
                              onChange={(e) => manejarCambioMotivo(cliente.id, e.target.value)}
                              sx={{ minWidth: 180, maxWidth: 250 }}
                            />
                            <Button 
                              variant='outlined' 
                              size='small' 
                              startIcon={<EditIcon />}
                              onClick={() => actualizarLimiteCliente(cliente.id)}
                              disabled={
                                saving || 
                                !limitesEditados[cliente.id] || 
                                limitesEditados[cliente.id].limite <= 0 ||
                                (limitesEditados[cliente.id].limite === cliente.limiteCredito && !limitesEditados[cliente.id].motivo)
                              }
                            >
                              {saving ? 'Guardando...' : 'Actualizar'}
                            </Button>
                          </Box>
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
                            {cambio.usuario} • {formatearFecha(cambio.fecha)}
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
                              {formatearFecha(alerta.fecha)}
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
                    <ListItem 
                      button 
                      onClick={() => generarReporte('antiguedad-cartera')}
                      disabled={generandoReporte === 'antiguedad-cartera'}
                    >
                      <ListItemText primary='Antigüedad de Cartera (30, 60, 90+ días)' />
                      {generandoReporte === 'antiguedad-cartera' ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => generarReporte('top-mejores-pagadores')}
                      disabled={generandoReporte === 'top-mejores-pagadores'}
                    >
                      <ListItemText primary='Top 10 Mejores Pagadores' />
                      {generandoReporte === 'top-mejores-pagadores' ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => generarReporte('top-peores-pagadores')}
                      disabled={generandoReporte === 'top-peores-pagadores'}
                    >
                      <ListItemText primary='Top 10 Peores Pagadores' />
                      {generandoReporte === 'top-peores-pagadores' ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => generarReporte('analisis-riesgo')}
                      disabled={generandoReporte === 'analisis-riesgo'}
                    >
                      <ListItemText primary='Análisis de Riesgo' />
                      {generandoReporte === 'analisis-riesgo' ? <CircularProgress size={20} /> : <DownloadIcon />}
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
                    <ListItem 
                      button 
                      onClick={() => generarReporte('clientes-visita-cobranza')}
                      disabled={generandoReporte === 'clientes-visita-cobranza'}
                    >
                      <ListItemText primary='Clientes para Visita de Cobranza (por Ruta)' />
                      {generandoReporte === 'clientes-visita-cobranza' ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => generarReporte('recordatorios-por-enviar')}
                      disabled={generandoReporte === 'recordatorios-por-enviar'}
                    >
                      <ListItemText primary='Recordatorios por Enviar' />
                      {generandoReporte === 'recordatorios-por-enviar' ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => generarReporte('transferencias-pendientes')}
                      disabled={generandoReporte === 'transferencias-pendientes'}
                    >
                      <ListItemText primary='Transferencias Pendientes Confirmación' />
                      {generandoReporte === 'transferencias-pendientes' ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => generarReporte('clientes-limite-excedido')}
                      disabled={generandoReporte === 'clientes-limite-excedido'}
                    >
                      <ListItemText primary='Clientes con Límite Excedido' />
                      {generandoReporte === 'clientes-limite-excedido' ? <CircularProgress size={20} /> : <DownloadIcon />}
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
                    <ListItem 
                      button 
                      onClick={() => generarReporte('comparativo-cartera-ventas')}
                      disabled={generandoReporte === 'comparativo-cartera-ventas'}
                    >
                      <ListItemText primary='Comparativo Cartera vs Ventas' />
                      {generandoReporte === 'comparativo-cartera-ventas' ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => generarReporte('eficiencia-cobranza-repartidor')}
                      disabled={generandoReporte === 'eficiencia-cobranza-repartidor'}
                    >
                      <ListItemText primary='Eficiencia de Cobranza por Repartidor' />
                      {generandoReporte === 'eficiencia-cobranza-repartidor' ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => generarReporte('tendencias-pago')}
                      disabled={generandoReporte === 'tendencias-pago'}
                    >
                      <ListItemText primary='Análisis de Tendencias de Pago' />
                      {generandoReporte === 'tendencias-pago' ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => generarReporte('proyeccion-flujo-caja')}
                      disabled={generandoReporte === 'proyeccion-flujo-caja'}
                    >
                      <ListItemText primary='Proyección de Flujo de Caja' />
                      {generandoReporte === 'proyeccion-flujo-caja' ? <CircularProgress size={20} /> : <DownloadIcon />}
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
                            {pago.registradoPorNombre || pago.registradoPor}
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
                              <IconButton 
                                size='small' 
                                onClick={async () => {
                                  if (pago.pagoCompleto) {
                                    setPagoSeleccionadoDetalle(pago.pagoCompleto)
                                    setModalDetallePago(true)
                                    
                                    // Cargar nombres de usuarios
                                    try {
                                      if (pago.pagoCompleto.usuarioRegistro) {
                                        const usuarioReg = await usuariosAPI.getById(pago.pagoCompleto.usuarioRegistro)
                                        setUsuarioRegistroNombre(`${usuarioReg.nombres} ${usuarioReg.apellidoPaterno}`)
                                      }
                                      if (pago.pagoCompleto.usuarioAutorizacion) {
                                        const usuarioAut = await usuariosAPI.getById(pago.pagoCompleto.usuarioAutorizacion)
                                        setUsuarioAutorizacionNombre(`${usuarioAut.nombres} ${usuarioAut.apellidoPaterno}`)
                                      }
                                    } catch (err) {
                                      console.error('Error al cargar información de usuarios:', err)
                                      setUsuarioRegistroNombre(pago.pagoCompleto.usuarioRegistro)
                                      if (pago.pagoCompleto.usuarioAutorizacion) {
                                        setUsuarioAutorizacionNombre(pago.pagoCompleto.usuarioAutorizacion)
                                      }
                                    }
                                  }
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Autorizar'>
                              <IconButton size='small' color='success' onClick={() => autorizarPago(pago.id)}>
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Rechazar'>
                              <IconButton size='small' color='error' onClick={() => rechazarPago(pago.id)}>
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
          {tipoDialogo === 'cerrar-venta' && 'Cerrar Venta - Registrar Pago'}
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

              {(tipoDialogo === 'registrar-pago' || tipoDialogo === 'registrar-abono' || tipoDialogo === 'cerrar-venta') && (
                <Box>
                  {notaSeleccionada && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant='h6' gutterBottom>
                        Nota a Pagar: {notaSeleccionada.numeroNota}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Importe de la nota: ${notaSeleccionada.importe.toLocaleString()}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="info"
                          startIcon={<CreditCardIcon />}
                          disabled={clienteSeleccionado.creditoDisponible <= 0}
                          onClick={() => {
                            const pending = notaSeleccionada.importe - totalPago
                            if (pending > 0) {
                              const amountToUse = Math.min(pending, clienteSeleccionado.creditoDisponible)
                              setUsarCredito(true)
                              setCreditoUsado(prev => prev + amountToUse)
                            }
                          }}
                        >
                          Usar Crédito
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          startIcon={<AttachMoneyIcon />}
                          onClick={() => {
                            const cashMethod = formasPagoDisponibles.find(fp => 
                              fp.tipo === 'efectivo' || 
                              fp.nombre.toLowerCase().includes('efectivo')
                            )
                            if (cashMethod) {
                              const pending = notaSeleccionada.importe - totalPago
                              if (pending > 0) {
                                const formaExistente = formasPago.find(fp => fp.formaPagoId === cashMethod.id)
                                if (formaExistente) {
                                  actualizarFormaPago(formaExistente.id, 'monto', formaExistente.monto + pending)
                                } else {
                                  const nuevaForma = {
                                    id: `fp-${contadorId}`,
                                    formaPagoId: cashMethod.id,
                                    metodo: 'efectivo',
                                    monto: pending,
                                    tipo: 'metodo_pago' as const
                                  }
                                  setFormasPago(prev => [...prev, nuevaForma])
                                  setContadorId(prev => prev + 1)
                                }
                              }
                            }
                          }}
                        >
                          Saldo en Efectivo
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {pedidoSeleccionado && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant='h6' gutterBottom>
                        Pedido a Cerrar: {pedidoSeleccionado.numeroPedido}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Total Venta: ${pedidoSeleccionado.ventaTotal.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        Crédito Disponible: ${clienteSeleccionado.creditoDisponible.toLocaleString()}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="info"
                          startIcon={<CreditCardIcon />}
                          disabled={clienteSeleccionado.creditoDisponible <= 0}
                          onClick={() => {
                            const pending = pedidoSeleccionado.ventaTotal - totalPago
                            if (pending > 0) {
                              const amountToUse = Math.min(pending, clienteSeleccionado.creditoDisponible)
                              setUsarCredito(true)
                              setCreditoUsado(prev => prev + amountToUse)
                            }
                          }}
                        >
                          Usar Crédito
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          startIcon={<AttachMoneyIcon />}
                          onClick={() => {
                            const cashMethod = formasPagoDisponibles.find(fp => 
                              fp.tipo === 'efectivo' || 
                              fp.nombre.toLowerCase().includes('efectivo')
                            )
                            if (cashMethod) {
                              const pending = pedidoSeleccionado.ventaTotal - totalPago
                              if (pending > 0) {
                                const formaExistente = formasPago.find(fp => fp.formaPagoId === cashMethod.id)
                                if (formaExistente) {
                                  actualizarFormaPago(formaExistente.id, 'monto', formaExistente.monto + pending)
                                } else {
                                  const nuevaForma = {
                                    id: `fp-${contadorId}`,
                                    formaPagoId: cashMethod.id,
                                    metodo: 'efectivo',
                                    monto: pending,
                                    tipo: 'metodo_pago' as const
                                  }
                                  setFormasPago(prev => [...prev, nuevaForma])
                                  setContadorId(prev => prev + 1)
                                }
                              }
                            }
                          }}
                        >
                          Saldo en Efectivo
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => {
                            setFormasPago([])
                            setUsarCredito(false)
                            setCreditoUsado(0)
                          }}
                        >
                          Limpiar
                        </Button>
                      </Box>
                    </Box>
                  )}

                  <Typography variant='h6' gutterBottom>
                    Pago con Crédito Disponible
                  </Typography>
                  <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: usarCredito ? 'info.light' : 'transparent' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={usarCredito} 
                            onChange={(e) => setUsarCredito(e.target.checked)}
                            disabled={clienteSeleccionado.creditoDisponible <= 0}
                          />
                        }
                        label="Usar Crédito del Cliente"
                      />
                      <Typography variant="body2" fontWeight="bold">
                        Disponible: ${clienteSeleccionado.creditoDisponible.toLocaleString()}
                      </Typography>
                    </Box>
                    {usarCredito && (
                      <TextField
                        fullWidth
                        label="Monto a cargar al crédito"
                        type="number"
                        size="small"
                        value={creditoUsado}
                        onChange={(e) => setCreditoUsado(Number(e.target.value))}
                        sx={{ mt: 2 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                      />
                    )}
                  </Card>

                  <Typography variant='h6' gutterBottom>
                    Otras Formas de Pago
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
                                {formasPagoDisponibles.map(fp => (
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
                          {(forma.metodo === 'transferencia' || forma.metodo === 'cheque' || forma.metodo === 'tarjeta' || forma.metodo === 'terminal') && (
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label='Referencia / Folio'
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
                        Total a pagar: ${totalPago.toLocaleString()}
                      </Typography>
                      {notaSeleccionada && (
                        <Typography variant='body2' color='text.secondary'>
                          Faltante: ${(notaSeleccionada.importe - totalPago).toLocaleString()}
                        </Typography>
                      )}
                      {pedidoSeleccionado && (
                        <Typography variant='body2' color='text.secondary'>
                          Diferencia: ${(pedidoSeleccionado.ventaTotal - totalPago).toLocaleString()}
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
              } else if (tipoDialogo === 'registrar-pago' || tipoDialogo === 'registrar-abono' || tipoDialogo === 'cerrar-venta') {
                registrarPago()
              }
            }}
            disabled={saving}
          >
            {saving ? 'Guardando...' : (
              <>
                {tipoDialogo === 'modificar-limite' && 'Actualizar Límite'}
                {tipoDialogo === 'recordatorio' && 'Enviar Recordatorio'}
                {tipoDialogo === 'bloquear' && 'Bloquear Crédito'}
                {tipoDialogo === 'estado-cuenta' && 'Generar Estado'}
                {tipoDialogo === 'registrar-pago' && 'Registrar Pago'}
                {tipoDialogo === 'registrar-abono' && 'Registrar Abono'}
                {tipoDialogo === 'cerrar-venta' && 'Finalizar Venta'}
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
                          day: 'numeric'
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
    </Box>
  )
}

