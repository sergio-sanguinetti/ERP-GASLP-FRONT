'use client'

import React, { useState, useEffect } from 'react'
import {
  authAPI,
  clientesAPI,
  usuariosAPI,
  productosAPI,
  pedidosAPI,
  ventasAPI,
  descuentosRepartidorAPI,
  sedesAPI,
  configuracionesAPI,
  categoriasProductoAPI,
  rutasAPI,
  configuracionTicketsAPI,
  formasPagoAPI,
  creditosAbonosAPI,
  type Cliente,
  type Usuario,
  type Producto,
  type Pedido,
  type ResumenVentas,
  type CorteRepartidor,
  type DescuentoRepartidor,
  type CategoriaProducto,
  type CreateProductoRequest,
  type CreatePedidoRequest,
  type CreateCategoriaProductoRequest,
  type Sede,
  type Ruta,
  type CreateClienteRequest,
  type ConfiguracionTicket,
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
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  InputAdornment,
  Autocomplete
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
  LocationOn as LocationOnIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material'

// Tipos locales
interface FiltrosPedidos {
  fechaDesde: string
  fechaHasta: string
  cliente: string
  tipoCliente: string
  zona: string
  rutaId: string
  estado: string
  mostrarTodos: boolean
}

interface ClienteAnalisis extends Cliente {
  totalComprasMes: number
  totalComprasAno: number
  totalComprasHistorico: number
  ticketPromedio: number
  frecuenciaCompra: number
  ultimaCompra: string
  productosMasComprados: string[]
  estadoCredito: 'buen-pagador' | 'vencido' | 'critico' | 'bloqueado'
  pedidos: Pedido[]
}

export default function VentasPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'catalogo' | 'listado-pedidos' | 'analisis-clientes' | 'categorias'>(
    'dashboard'
  )

  // Estados de datos
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [sedes, setSedes] = useState<Sede[]>([])
  const [sedeSeleccionada, setSedeSeleccionada] = useState<string | null>(null)
  const [sedeId, setSedeId] = useState<string | null>(null)
  const [resumenVentas, setResumenVentas] = useState<ResumenVentas | null>(null)
  const [cortePipas, setCortePipas] = useState<CorteRepartidor | null>(null)
  const [corteCilindros, setCorteCilindros] = useState<CorteRepartidor | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [repartidores, setRepartidores] = useState<Usuario[]>([])
  const [descuentosRepartidor, setDescuentosRepartidor] = useState<DescuentoRepartidor[]>([])
  const [categoriasProducto, setCategoriasProducto] = useState<CategoriaProducto[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [clientesAnalisis, setClientesAnalisis] = useState<ClienteAnalisis[]>([])
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [clienteBuscado, setClienteBuscado] = useState<Cliente | null>(null)
  const [mostrarCrearCliente, setMostrarCrearCliente] = useState(false)
  const [formularioClienteRapido, setFormularioClienteRapido] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    calle: '',
    numeroExterior: '',
    colonia: '',
    rutaId: '',
    zonaId: '' // Se asigna automáticamente al seleccionar la ruta
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Estados de UI
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'precios' | 'descuentos' | 'pedido' | 'producto' | 'pedido-detalles' | 'categoria'>(
    'precios'
  )
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<Usuario | null>(null)
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null)
  const [pedidoEditando, setPedidoEditando] = useState<Pedido | null>(null)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaProducto | null>(null)
  const getFechaHoy = () =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
  const [filtrosPedidos, setFiltrosPedidos] = useState<FiltrosPedidos>({
    fechaDesde: getFechaHoy(),
    fechaHasta: getFechaHoy(),
    cliente: '',
    tipoCliente: '',
    zona: '',
    rutaId: '',
    estado: '',
    mostrarTodos: false
  })
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteAnalisis | null>(null)
  const [paginaPedidos, setPaginaPedidos] = useState(0)
  const [filasPorPaginaPedidos, setFilasPorPaginaPedidos] = useState(10)
  const [pedidoParaTicket, setPedidoParaTicket] = useState<Pedido | null>(null)
  const [dialogoTicketAbierto, setDialogoTicketAbierto] = useState(false)
  const [htmlTicket, setHtmlTicket] = useState('')
  const [loadingTicket, setLoadingTicket] = useState(false)

  // Cerrar pedido desde panel: diálogo con formas de pago (como en la app)
  const [pedidoACerrar, setPedidoACerrar] = useState<Pedido | null>(null)
  const [formasPagoCerrar, setFormasPagoCerrar] = useState<FormaPago[]>([])
  const [pagosCerrarPedido, setPagosCerrarPedido] = useState<Record<string, { monto: string; referencia?: string }>>({})
  const [creditMontoCerrar, setCreditMontoCerrar] = useState('')
  const [loadingCerrarPedido, setLoadingCerrarPedido] = useState(false)
  const [errorCerrarPedido, setErrorCerrarPedido] = useState<string | null>(null)

  // Estado para carga de clientes en modal de pedido: buscar en BD o por sede/ruta
  const [modoCargaCliente, setModoCargaCliente] = useState<'buscar' | 'por-ruta'>('buscar')
  const [sedeIdModal, setSedeIdModal] = useState<string | null>(null)
  const [rutaIdModal, setRutaIdModal] = useState<string | null>(null)
  const [rutasModal, setRutasModal] = useState<Ruta[]>([])
  const [clientesPorRuta, setClientesPorRuta] = useState<Cliente[]>([])
  const [busquedaClienteTerm, setBusquedaClienteTerm] = useState('')
  const [clientesBusqueda, setClientesBusqueda] = useState<Cliente[]>([])
  const [loadingClientesBusqueda, setLoadingClientesBusqueda] = useState(false)
  const [loadingClientesPorRuta, setLoadingClientesPorRuta] = useState(false)

  const [formularioPedido, setFormularioPedido] = useState({
    clienteId: '',
    tipoServicio: 'pipas' as 'pipas' | 'cilindros',
    horario: '',
    prioridad: 'normal' as 'normal' | 'urgente',
    repartidorId: '',
    observaciones: '',
    productos: [] as Array<{ 
      id?: string; // ID único para identificar cada carga
      productoId: string; 
      cantidad: number; 
      precio: number; 
      nombre?: string;
      litros?: number;
      subtotal?: number;
      descripcion?: string;
      calculoPipas?: any;
    }>
  })

  const [productoAgregar, setProductoAgregar] = useState({
    productoId: '',
    cantidad: 1,
    categoriaFiltro: '' // Filtro por categoría del catálogo
  })

  // Estado para cálculo de pipas
  const [calculoPipas, setCalculoPipas] = useState({
    tipoCalculo: 'ninguno' as 'ninguno' | 'litros' | 'porcentajes' | 'dinero', // Tipo de cálculo seleccionado
    // Para cálculo por litros
    cantidadLitros: 0,
    precioPorLitro: 18.50,
    totalPorLitros: 0,
    // Para cálculo por porcentajes
    capacidadTanque: 0, // Litros del tanque
    porcentajeInicial: 0, // Porcentaje inicial de llenado
    porcentajeFinal: 100, // Porcentaje final deseado
    litrosALlenar: 0, // Calculado automáticamente
    totalPorPorcentajes: 0, // Total calculado en dinero
    // Para cálculo por dinero
    cantidadDinero: 0,
    litrosPorDinero: 0 // Calculado automáticamente
  })

  const [formularioProducto, setFormularioProducto] = useState<CreateProductoRequest>({
    nombre: '',
    categoriaId: '',
    precio: 0,
    unidad: '',
    descripcion: '',
    cantidadKilos: undefined,
    activo: true
    // No incluir sedeId - los productos son para todas las sedes
  })

  const [formularioDescuento, setFormularioDescuento] = useState({
    repartidorId: '',
    nombre: '',
    descripcion: '',
    descuentoAutorizado: 0,
    descuentoPorLitro: 0
  })
  const [descuentoEditando, setDescuentoEditando] = useState<DescuentoRepartidor | null>(null)

  const [formularioCategoria, setFormularioCategoria] = useState<CreateCategoriaProductoRequest>({
    nombre: '',
    codigo: '',
    descripcion: '',
    activa: true
  })

  // Estados para actualización de precios
  const [preciosBase, setPreciosBase] = useState({
    precioPorLitro: 18.50,
    precioPorKG: 18.50
  })
  const [actualizandoPrecios, setActualizandoPrecios] = useState(false)

  // Estados para el modal de eliminación
  const [eliminando, setEliminando] = useState(false)
  const [dialogoEliminar, setDialogoEliminar] = useState(false)
  const [pedidoAEliminar, setPedidoAEliminar] = useState<Pedido | null>(null)
  const [descuentoAEliminar, setDescuentoAEliminar] = useState<DescuentoRepartidor | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Recargar datos cuando cambia la vista
  useEffect(() => {
    if (vistaActual === 'dashboard') {
      loadDashboardData()
    } else if (vistaActual === 'catalogo') {
      loadProductos()
      loadCategoriasProducto()
      loadDescuentos()
      loadConfiguraciones()
      loadRepartidores() // Cargar repartidores para la gestión de descuentos
    } else if (vistaActual === 'listado-pedidos') {
      loadClientes()
      loadRepartidores()
      loadPedidos()
      // loadRutas se llama cuando usuario esté disponible
    } else if (vistaActual === 'analisis-clientes') {
      loadClientesAnalisis()
    } else if (vistaActual === 'categorias') {
      loadCategoriasProducto()
    }
  }, [vistaActual, sedeId])

  // Cargar rutas cuando el usuario esté disponible y estemos en la vista de pedidos
  useEffect(() => {
    if (usuario && vistaActual === 'listado-pedidos') {
      loadRutas()
    }
  }, [usuario, vistaActual, sedeId])

  // Cargar rutas cuando se abre el modal de crear cliente
  useEffect(() => {
    if (mostrarCrearCliente && usuario) {
      loadRutas()
    }
  }, [mostrarCrearCliente, usuario, sedeId])

  // Búsqueda de clientes en BD (debounce) cuando el usuario escribe en el modal de pedido
  useEffect(() => {
    if (modoCargaCliente !== 'buscar' || !dialogoAbierto || tipoDialogo !== 'pedido') return
    if (!busquedaClienteTerm.trim()) {
      setClientesBusqueda([])
      return
    }
    const timer = setTimeout(async () => {
      setLoadingClientesBusqueda(true)
      try {
        const data = await clientesAPI.getAll({
          estadoCliente: 'activo',
          nombre: busquedaClienteTerm.trim()
        })
        setClientesBusqueda(data)
      } catch (err) {
        setClientesBusqueda([])
      } finally {
        setLoadingClientesBusqueda(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [busquedaClienteTerm, modoCargaCliente, dialogoAbierto, tipoDialogo])

  // Actualizar precio por litro cuando cambie la configuración
  useEffect(() => {
    if (preciosBase.precioPorLitro > 0) {
      setCalculoPipas(prev => ({
        ...prev,
        precioPorLitro: preciosBase.precioPorLitro
      }))
    }
  }, [preciosBase.precioPorLitro])

  // Cargar configuración de ticket y generar HTML cuando se abre el diálogo de ticket
  useEffect(() => {
    if (!dialogoTicketAbierto || !pedidoParaTicket) {
      if (!dialogoTicketAbierto) setHtmlTicket('')
      return
    }
    let cancelled = false
    setLoadingTicket(true)
    configuracionTicketsAPI
      .get('venta')
      .then(config => {
        if (!cancelled && pedidoParaTicket) {
          setHtmlTicket(generarHtmlTicketVenta(pedidoParaTicket, config))
        }
      })
      .catch(() => {
        if (!cancelled) {
          const configDefault: ConfiguracionTicket = {
            id: '',
            tipoTicket: 'venta',
            nombreEmpresa: 'ERPGASLP',
            razonSocial: '',
            direccion: 'Av. Principal #123',
            telefono: '',
            email: '',
            sitioWeb: '',
            rfc: '',
            logo: '',
            mostrarLogo: true,
            tamañoLogo: 'mediano',
            redesSociales: {},
            mostrarRedesSociales: false,
            textos: { encabezado: '', piePagina: '', mostrarMensaje: false },
            diseño: { mostrarFecha: true, mostrarHora: true, mostrarCajero: true, mostrarCliente: true, colorPrincipal: '#1976d2', alineacion: 'centro' },
            urlQR: '',
            activo: true,
            fechaCreacion: '',
            fechaModificacion: ''
          }
          setHtmlTicket(generarHtmlTicketVenta(pedidoParaTicket, configDefault))
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTicket(false)
      })
    return () => {
      cancelled = true
    }
  }, [dialogoTicketAbierto, pedidoParaTicket])

  const esSuperAdministrador = usuario?.rol === 'superAdministrador'

  const loadInitialData = async () => {
    try {
      setLoading(true)
      // Obtener usuario autenticado
      const user = await authAPI.getProfile()
      setUsuario(user)

      // Cargar sedes
      const sedesData = await sedesAPI.getAll()
      setSedes(sedesData)

      // Si es super administrador, permitir seleccionar sede
      // Si no, usar la sede del usuario
      // Nota: user.sede puede venir como nombre de sede (string) o como UUID
      let sedeUsuarioId: string | null = null

      if (user.sede) {
        // Buscar la sede por ID (UUID) o por nombre
        const sedeEncontrada = sedesData.find(
          s => s.id === user.sede || s.nombre === user.sede || s.nombre.toUpperCase() === user.sede.toUpperCase()
        )
        sedeUsuarioId = sedeEncontrada?.id || null
      }

      if (user.rol === 'superAdministrador') {
        // Por defecto, usar la sede del usuario o la primera disponible
        setSedeId(sedeUsuarioId || sedesData[0]?.id || null)
        setSedeSeleccionada(sedeUsuarioId || sedesData[0]?.id || null)
      } else {
        // Para otros roles, usar la sede del usuario
        setSedeId(sedeUsuarioId || null)
        setSedeSeleccionada(sedeUsuarioId || null)
      }

      // Debug: verificar qué sede tiene el usuario
      console.log('Usuario sede (raw):', user.sede)
      console.log('Sede encontrada (ID):', sedeUsuarioId)
      console.log(
        'Sedes disponibles:',
        sedesData.map(s => ({ id: s.id, nombre: s.nombre }))
      )

      // Cargar datos del dashboard
      await loadDashboardData()
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSedeChange = (nuevaSedeId: string) => {
    setSedeSeleccionada(nuevaSedeId)
    setSedeId(nuevaSedeId)
  }

  const loadDashboardData = async () => {
    try {
      const [resumen, pipas, cilindros] = await Promise.all([
        ventasAPI.getResumen(sedeId || undefined),
        ventasAPI.getCortePipas(sedeId || undefined),
        ventasAPI.getCorteCilindros(sedeId || undefined)
      ])
      setResumenVentas(resumen)
      setCortePipas(pipas)
      setCorteCilindros(cilindros)
    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
    }
  }

  const loadProductos = async () => {
    try {
      // El catálogo NO se filtra por sede (según requerimiento)
      const data = await productosAPI.getAll({ activo: true })
      console.log('Productos cargados:', data.length)
      console.log('Productos con categorías:', data.map(p => ({
        id: p.id,
        nombre: p.nombre,
        categoriaId: p.categoriaId,
        categoria: p.categoria ? { id: p.categoria.id, nombre: p.categoria.nombre, codigo: p.categoria.codigo } : null
      })))
      setProductos(data)
    } catch (err: any) {
      console.error('Error loading productos:', err)
    }
  }

  const loadDescuentos = async () => {
    try {
      const data = await descuentosRepartidorAPI.getAll()
      setDescuentosRepartidor(data)
    } catch (err: any) {
      console.error('Error loading descuentos:', err)
    }
  }

  const loadConfiguraciones = async () => {
    try {
      // Cargar la configuración única
      const configuracion = await configuracionesAPI.get()

      if (configuracion) {
        setPreciosBase({
          precioPorLitro: configuracion.precioPorLitroGasLP,
          precioPorKG: configuracion.precioPorKG
        })
        // Actualizar el precio por litro en el cálculo de pipas
        setCalculoPipas(prev => ({
          ...prev,
          precioPorLitro: configuracion.precioPorLitroGasLP
        }))
      }
    } catch (err: any) {
      console.error('Error loading configuraciones:', err)
      // Si no existe la configuración, usar valores por defecto
    }
  }

  const loadClientes = async () => {
    try {
      const data = await clientesAPI.getAll({ estadoCliente: 'activo' })
      // Filtrar por sede si es necesario
      const clientesFiltrados = sedeId
        ? data.filter(c => true) // Ajustar según estructura de datos
        : data
      setClientes(clientesFiltrados)
    } catch (err: any) {
      console.error('Error loading clientes:', err)
    }
  }

  const loadRutasModal = async (sedeIdValue: string | null): Promise<Ruta[]> => {
    try {
      const params: any = { activa: 'true' }
      if (sedeIdValue) params.sedeId = sedeIdValue
      let lista = await rutasAPI.getAll(params)
      if (lista.length === 0) lista = await rutasAPI.getAll({})
      if (sedeIdValue && lista.length > 0) {
        lista = lista.filter(r => r.sedeId === sedeIdValue || r.sede?.id === sedeIdValue)
      }
      setRutasModal(lista)
      return lista
    } catch (err: any) {
      console.error('Error loading rutas modal:', err)
      setRutasModal([])
      return []
    }
  }

  const loadClientesPorRuta = async (rutaIdValue: string | null) => {
    if (!rutaIdValue) {
      setClientesPorRuta([])
      return
    }
    setLoadingClientesPorRuta(true)
    try {
      const data = await clientesAPI.getAll({ estadoCliente: 'activo', rutaId: rutaIdValue })
      setClientesPorRuta(data)
    } catch (err: any) {
      console.error('Error loading clientes por ruta:', err)
      setClientesPorRuta([])
    } finally {
      setLoadingClientesPorRuta(false)
    }
  }

  const loadRutas = async () => {
    try {
      // Obtener todas las rutas activas primero (sin filtro de activa para ver todas)
      let todasLasRutas = await rutasAPI.getAll({ activa: 'true' })
      console.log('Todas las rutas activas:', todasLasRutas.length)
      console.log('Rutas con sede:', todasLasRutas.map(r => ({ nombre: r.nombre, sedeId: r.sedeId, sede: r.sede?.nombre, activa: r.activa })))
      
      // Si no hay rutas con el filtro activa, intentar sin filtro
      if (todasLasRutas.length === 0) {
        console.log('No se encontraron rutas con filtro activa=true, intentando sin filtro...')
        todasLasRutas = await rutasAPI.getAll({})
        console.log('Todas las rutas (sin filtro):', todasLasRutas.length)
        // Filtrar solo las activas en el frontend
        todasLasRutas = todasLasRutas.filter(r => r.activa === true)
        console.log('Rutas activas (filtradas en frontend):', todasLasRutas.length)
        console.log('Detalles de rutas:', todasLasRutas.map(r => ({ nombre: r.nombre, activa: r.activa, sedeId: r.sedeId })))
      }
      
      let rutasFiltradas = todasLasRutas
      
      // Si hay una sede seleccionada, filtrar por esa sede
      if (sedeId) {
        console.log(`Filtrando por sedeId: ${sedeId}`)
        const rutasConSede = rutasFiltradas.filter(ruta => {
          const coincide = ruta.sedeId === sedeId || ruta.sede?.id === sedeId
          if (!coincide) {
            console.log(`Ruta ${ruta.nombre} no coincide - sedeId: ${ruta.sedeId}, sede?.id: ${ruta.sede?.id}`)
          }
          return coincide
        })
        
        // Si hay rutas con sede asignada, usarlas
        // Si no hay rutas con sede, mostrar todas (las rutas pueden no tener sede asignada aún)
        if (rutasConSede.length > 0) {
          rutasFiltradas = rutasConSede
          console.log(`✅ Rutas filtradas por sede ${sedeId}: ${rutasFiltradas.length} rutas`)
          console.log('Rutas encontradas:', rutasFiltradas.map(r => r.nombre))
        } else {
          console.warn(`⚠️ No se encontraron rutas con sedeId ${sedeId}. Mostrando todas las rutas activas.`)
          console.log('Rutas disponibles:', rutasFiltradas.map(r => ({ nombre: r.nombre, sedeId: r.sedeId })))
          console.log('Sugerencia: Verifica que las rutas tengan la sede correcta asignada')
          // Mantener todas las rutas si no hay ninguna con esa sede
        }
      }
      
      // Si el usuario es repartidor, mostrar solo las rutas asignadas al repartidor
      if (usuario?.rol === 'repartidor' && usuario?.id) {
        const rutasDelUsuario = rutasFiltradas.filter(ruta =>
          ruta.repartidores?.some((rep: any) => rep.id === usuario.id)
        )
        if (rutasDelUsuario.length > 0) {
          rutasFiltradas = rutasDelUsuario
          console.log(`Rutas asignadas al repartidor: ${rutasFiltradas.length}`, rutasFiltradas.map(r => r.nombre))
        } else {
          rutasFiltradas = []
          console.log('El repartidor no tiene rutas asignadas')
        }
      }
      
      setRutas(rutasFiltradas)
      console.log(`Rutas finales: ${rutasFiltradas.length}`, rutasFiltradas.map(r => ({ nombre: r.nombre, sedeId: r.sedeId, sede: r.sede?.nombre })))
    } catch (err: any) {
      console.error('Error loading rutas:', err)
      setRutas([])
    }
  }

  const loadRepartidores = async () => {
    try {
      // Cargar todos los repartidores activos sin filtrar por sede
      // Los repartidores se gestionan desde /configuracion/usuarios
      const data = await usuariosAPI.getAll({
        rol: 'repartidor',
        estado: 'activo'
      })

      console.log('Repartidores cargados:', data.length, 'repartidores')
      console.log(
        'Repartidores:',
        data.map(r => ({ id: r.id, nombre: `${r.nombres} ${r.apellidoPaterno}`, sede: r.sede }))
      )
      setRepartidores(data)
    } catch (err: any) {
      console.error('Error loading repartidores:', err)
      setRepartidores([])
    }
  }

  const loadPedidos = async (overrideFiltros?: Partial<FiltrosPedidos>) => {
    try {
      const f = overrideFiltros ?? filtrosPedidos
      console.log('Cargando pedidos con sedeId:', sedeId)

      const filtros: any = {
        sedeId: sedeId || undefined
      }
      if (f.fechaDesde) filtros.fechaDesde = f.fechaDesde
      if (f.fechaHasta) filtros.fechaHasta = f.fechaHasta
      if (f.estado) filtros.estado = f.estado
      if (f.rutaId) filtros.rutaId = f.rutaId

      console.log('Filtros enviados:', filtros)

      const data = await pedidosAPI.getAll(filtros)
      setPaginaPedidos(0)

      console.log('Pedidos recibidos:', data.length, 'pedidos')
      console.log(
        'Pedidos:',
        data.map(p => ({ id: p.id, numeroPedido: p.numeroPedido, sedeId: p.sedeId }))
      )

      setPedidos(data)
    } catch (err: any) {
      console.error('Error loading pedidos:', err)
      setPedidos([])
    }
  }

  const loadClientesAnalisis = async () => {
    try {
      const data = await clientesAPI.getAll()
      // Calcular estadísticas para cada cliente
      const clientesConAnalisis: ClienteAnalisis[] = await Promise.all(
        data.map(async cliente => {
          const pedidosCliente = await pedidosAPI.getAll({ clienteId: cliente.id })
          const totalComprasHistorico = pedidosCliente
            .filter(p => p.estado === 'entregado')
            .reduce((sum, p) => sum + p.ventaTotal, 0)

          const hoy = new Date()
          const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
          const inicioAno = new Date(hoy.getFullYear(), 0, 1)

          const totalComprasMes = pedidosCliente
            .filter(p => p.estado === 'entregado' && new Date(p.fechaPedido) >= inicioMes)
            .reduce((sum, p) => sum + p.ventaTotal, 0)

          const totalComprasAno = pedidosCliente
            .filter(p => p.estado === 'entregado' && new Date(p.fechaPedido) >= inicioAno)
            .reduce((sum, p) => sum + p.ventaTotal, 0)

          const pedidosEntregados = pedidosCliente.filter(p => p.estado === 'entregado')
          const ticketPromedio = pedidosEntregados.length > 0 ? totalComprasHistorico / pedidosEntregados.length : 0

          return {
            ...cliente,
            totalComprasMes,
            totalComprasAno,
            totalComprasHistorico,
            ticketPromedio,
            frecuenciaCompra: 15, // Calcular basado en fechas de pedidos
            ultimaCompra: pedidosCliente.length > 0 ? pedidosCliente[0].fechaPedido : '',
            productosMasComprados: [],
            estadoCredito: cliente.saldoActual > cliente.limiteCredito ? 'vencido' : 'buen-pagador',
            pedidos: pedidosCliente
          }
        })
      )
      setClientesAnalisis(clientesConAnalisis)
    } catch (err: any) {
      console.error('Error loading clientes analisis:', err)
    }
  }

  const abrirDialogo = async (tipo: 'precios' | 'descuentos' | 'pedido' | 'producto' | 'categoria', item?: any) => {
    setTipoDialogo(tipo)
    if (tipo === 'categoria' && item) {
      setCategoriaSeleccionada(item)
      setFormularioCategoria({
        nombre: item.nombre,
        codigo: item.codigo,
        descripcion: item.descripcion || '',
        activa: item.activa
      })
    } else if (tipo === 'categoria') {
      setCategoriaSeleccionada(null)
      setFormularioCategoria({
        nombre: '',
        codigo: '',
        descripcion: '',
        activa: true
      })
    } else if (tipo === 'producto' && item) {
      setProductoSeleccionado(item)
      setFormularioProducto({
        nombre: item.nombre,
        categoriaId: item.categoriaId || (item.categoria?.id || ''),
        precio: item.precio,
        unidad: item.unidad,
        descripcion: item.descripcion,
        cantidadKilos: item.cantidadKilos,
        activo: item.activo
        // No incluir sedeId - los productos del catálogo son para todas las sedes
      })
    } else if (tipo === 'descuentos') {
      // Cargar repartidores si no están cargados
      if (repartidores.length === 0) {
        console.log('Cargando repartidores para diálogo de descuentos...')
        await loadRepartidores()
      }
      
      if (item) {
        setRepartidorSeleccionado(item)
        setDescuentoEditando(null)
        setFormularioDescuento({
          repartidorId: item.id,
          nombre: '',
          descripcion: '',
          descuentoAutorizado: 0,
          descuentoPorLitro: 0
        })
      } else {
        // Abrir diálogo para crear nuevo descuento sin repartidor seleccionado
        setRepartidorSeleccionado(null)
        setDescuentoEditando(null)
        setFormularioDescuento({
          repartidorId: '',
          nombre: '',
          descripcion: '',
          descuentoAutorizado: 0,
          descuentoPorLitro: 0
        })
      }
    } else if (tipo === 'pedido') {
      // Cargar productos, clientes, repartidores y categorías cuando se abre el diálogo de pedido
      console.log('Abriendo diálogo de pedido, cargando datos...')
      if (categoriasProducto.length === 0) {
        console.log('Cargando categorías...')
        await loadCategoriasProducto()
      }
      if (productos.length === 0) {
        console.log('Cargando productos...')
        await loadProductos()
      }
      if (clientes.length === 0) {
        console.log('Cargando clientes...')
        await loadClientes()
      }
      if (repartidores.length === 0) {
        console.log('Cargando repartidores...')
        await loadRepartidores()
      }
      if (rutas.length === 0) {
        console.log('Cargando rutas...')
        await loadRutas()
      }
      // Resetear cliente buscado y modo edición
      setClienteBuscado(null)
      setPedidoEditando(null)
      // Modo de carga de cliente: buscar o por sede/ruta
      setModoCargaCliente('buscar')
      setSedeIdModal(sedeId)
      setBusquedaClienteTerm('')
      setClientesBusqueda([])
      setRutaIdModal(null)
      setClientesPorRuta([])
      // Cargar rutas de la sede para el selector "por sede y ruta"
      const rutasSede = await loadRutasModal(sedeId)
      const primeraRutaId = rutasSede[0]?.id ?? null
      setRutaIdModal(primeraRutaId)
      if (primeraRutaId) {
        loadClientesPorRuta(primeraRutaId)
      }
      console.log('Categorías disponibles:', categoriasProducto.length)
      console.log('Productos disponibles:', productos.length)
    }
    setDialogoAbierto(true)
  }

  const abrirDialogoEditarPedido = async (pedido: Pedido) => {
    setTipoDialogo('pedido')
    if (categoriasProducto.length === 0) await loadCategoriasProducto()
    if (productos.length === 0) await loadProductos()
    if (clientes.length === 0) await loadClientes()
    if (repartidores.length === 0) await loadRepartidores()
    if (rutas.length === 0) await loadRutas()
    try {
      const pedidoCompleto = await pedidosAPI.getById(pedido.id)
      const prods = pedidoCompleto.productosPedido || []
      setFormularioPedido({
        clienteId: pedidoCompleto.clienteId,
        tipoServicio: pedidoCompleto.tipoServicio,
        horario: pedidoCompleto.horaPedido || '',
        prioridad: 'normal',
        repartidorId: pedidoCompleto.repartidorId || '',
        observaciones: pedidoCompleto.observaciones || '',
        productos: prods.map((pp: any) => ({
          productoId: pp.productoId,
          cantidad: pp.cantidad,
          precio: pp.precio,
          nombre: pp.producto?.nombre,
          litros: pp.cantidad,
          subtotal: pp.subtotal ?? pp.precio * pp.cantidad,
          descripcion: pp.producto?.descripcion
        }))
      })
      const cliente = pedidoCompleto.cliente ?? null
      setClienteBuscado(cliente)
      if (cliente) {
        const nombreCompleto = `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim()
        const direccion = `${cliente.calle} ${cliente.numeroExterior}, ${cliente.colonia}`.trim()
        setBusquedaClienteTerm(`${nombreCompleto} - ${direccion}`)
      }
      setPedidoEditando(pedidoCompleto)
    } catch (err: any) {
      alert('Error al cargar el pedido: ' + (err.message || 'Error desconocido'))
      console.error('Error loading pedido for edit:', err)
      return
    }
    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setProductoSeleccionado(null)
    setRepartidorSeleccionado(null)
    setPedidoSeleccionado(null)
    setPedidoEditando(null)
    setFormularioPedido({
      clienteId: '',
      tipoServicio: 'pipas',
      horario: '',
      prioridad: 'normal',
      repartidorId: '',
      observaciones: '',
      productos: []
    })
    setProductoAgregar({
      productoId: '',
      cantidad: 1,
      categoriaFiltro: ''
    })
    setCalculoPipas({
      tipoCalculo: 'ninguno',
      cantidadLitros: 0,
      precioPorLitro: preciosBase.precioPorLitro || 18.50,
      totalPorLitros: 0,
      capacidadTanque: 0,
      porcentajeInicial: 0,
      porcentajeFinal: 100,
      litrosALlenar: 0,
      totalPorPorcentajes: 0,
      cantidadDinero: 0,
      litrosPorDinero: 0
    })
    setFormularioProducto({
      nombre: '',
      categoriaId: categoriasProducto.length > 0 ? categoriasProducto[0].id : '',
      precio: 0,
      unidad: '',
      descripcion: '',
      cantidadKilos: undefined,
      activo: true
      // No incluir sedeId - los productos del catálogo son para todas las sedes
    })
    setFormularioCategoria({
      nombre: '',
      codigo: '',
      descripcion: '',
      activa: true
    })
    setFormularioDescuento({
      repartidorId: '',
      nombre: '',
      descripcion: '',
      descuentoAutorizado: 0,
      descuentoPorLitro: 0
    })
    setDescuentoEditando(null)
    setClienteBuscado(null)
    setModoCargaCliente('buscar')
    setSedeIdModal(null)
    setRutaIdModal(null)
    setRutasModal([])
    setClientesPorRuta([])
    setBusquedaClienteTerm('')
    setClientesBusqueda([])
  }

  const abrirDialogoEliminar = (pedido: Pedido) => {
    setPedidoAEliminar(pedido)
    setDialogoEliminar(true)
  }

  const cerrarDialogoEliminar = () => {
    setDialogoEliminar(false)
    setPedidoAEliminar(null)
  }

  const abrirDialogoCerrarPedido = (pedido: Pedido) => {
    setPedidoACerrar(pedido)
    setPagosCerrarPedido({})
    setCreditMontoCerrar('')
    setErrorCerrarPedido(null)
  }

  const cerrarDialogoCerrarPedido = () => {
    setPedidoACerrar(null)
    setFormasPagoCerrar([])
    setPagosCerrarPedido({})
    setCreditMontoCerrar('')
    setErrorCerrarPedido(null)
  }

  useEffect(() => {
    if (!pedidoACerrar) return
    let cancelled = false
    const filtrarActivas = (list: FormaPago[]) =>
      (list || []).filter((f) => f.tipo !== 'credito' && f.activa !== false)
    const aplicar = (list: FormaPago[]) => {
      if (cancelled) return
      setFormasPagoCerrar(filtrarActivas(list))
    }
    formasPagoAPI.getAll({ activa: 'true' })
      .then((list) => {
        const activas = filtrarActivas(list || [])
        if (cancelled) return
        if (activas.length > 0) {
          setFormasPagoCerrar(activas)
        } else {
          formasPagoAPI.getAll().then((all) => { aplicar(all || []) }).catch(() => { if (!cancelled) setFormasPagoCerrar([]) })
        }
      })
      .catch(() => {
        if (cancelled) return
        formasPagoAPI.getAll().then((all) => aplicar(all || [])).catch((err) => {
          if (!cancelled) {
            setFormasPagoCerrar([])
            console.warn('Error al cargar formas de pago para cerrar pedido:', err)
          }
        })
      })
    return () => { cancelled = true }
  }, [pedidoACerrar])

  const registrarPagoYCerrarPedido = async () => {
    if (!pedidoACerrar || !usuario) return
    const total = Number(pedidoACerrar.ventaTotal) || 0
    const items: Array<{ formaPagoId?: string | null; tipo: string; monto: number; referencia?: string }> = []
    let sum = 0
    for (const [methodId, val] of Object.entries(pagosCerrarPedido)) {
      const m = parseFloat(String(val.monto).replace(',', '.'))
      if (!Number.isNaN(m) && m > 0) {
        items.push({
          formaPagoId: methodId,
          tipo: 'metodo_pago',
          monto: m,
          referencia: val.referencia || undefined
        })
        sum += m
      }
    }
    const creditMonto = parseFloat(String(creditMontoCerrar).replace(',', '.'))
    if (!Number.isNaN(creditMonto) && creditMonto > 0) {
      items.push({ formaPagoId: null as any, tipo: 'credito', monto: creditMonto })
      sum += creditMonto
    }
    const diff = Math.abs(sum - total)
    if (diff > 0.02) {
      setErrorCerrarPedido(`El total ingresado ($${sum.toFixed(2)}) no coincide con el total del pedido ($${total.toFixed(2)}).`)
      return
    }
    if (items.length === 0) {
      setErrorCerrarPedido('Indica al menos una forma de pago y monto.')
      return
    }
    setErrorCerrarPedido(null)
    setLoadingCerrarPedido(true)
    try {
      await creditosAbonosAPI.createPago({
        clienteId: pedidoACerrar.clienteId,
        pedidoId: pedidoACerrar.id,
        montoTotal: total,
        tipo: 'nota_especifica',
        estado: 'autorizado',
        usuarioRegistro: usuario.id,
        formasPago: items.map((it) =>
          it.tipo === 'credito'
            ? { formaPagoId: null, tipo: 'credito', monto: it.monto, referencia: it.referencia }
            : { formaPagoId: it.formaPagoId!, tipo: 'metodo_pago', monto: it.monto, referencia: it.referencia }
        )
      })
      setSuccessMessage('Pedido cerrado exitosamente.')
      setTimeout(() => setSuccessMessage(null), 4000)
      cerrarDialogoCerrarPedido()
      loadPedidos()
    } catch (err: any) {
      setErrorCerrarPedido(err.message || 'Error al registrar el pago.')
    } finally {
      setLoadingCerrarPedido(false)
    }
  }

  const eliminarPedido = async () => {
    if (!pedidoAEliminar) return

    try {
      setEliminando(true)
      setError(null)
      await pedidosAPI.delete(pedidoAEliminar.id)
      cerrarDialogoEliminar()
      // Recargar la lista de pedidos
      if (vistaActual === 'listado-pedidos') {
        loadPedidos()
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar pedido')
    } finally {
      setEliminando(false)
    }
  }

  const manejarCambioFormulario = (campo: string, valor: any) => {
    setFormularioPedido(prev => ({ ...prev, [campo]: valor }))
  }

  const crearClienteRapido = async () => {
    try {
      if (!formularioClienteRapido.nombre || !formularioClienteRapido.apellidoPaterno || !formularioClienteRapido.calle) {
        alert('Debe completar al menos nombre, apellido y dirección')
        return
      }

      const clienteData: CreateClienteRequest = {
        nombre: formularioClienteRapido.nombre,
        apellidoPaterno: formularioClienteRapido.apellidoPaterno,
        apellidoMaterno: formularioClienteRapido.apellidoMaterno || '',
        email: '', // Email opcional
        telefono: '', // Teléfono opcional
        calle: formularioClienteRapido.calle,
        numeroExterior: formularioClienteRapido.numeroExterior || 'S/N',
        colonia: formularioClienteRapido.colonia || '',
        municipio: '', // Valores por defecto
        estado: '',
        codigoPostal: '',
        rutaId: formularioClienteRapido.rutaId || undefined,
        zonaId: formularioClienteRapido.zonaId || undefined, // Zona de la ruta seleccionada
        estadoCliente: 'activo',
        limiteCredito: 0,
        saldoActual: 0,
        pagosEspecialesAutorizados: false
      }

      const nuevoCliente = await clientesAPI.create(clienteData)
      
      // Recargar clientes
      await loadClientes()
      
      // Seleccionar el nuevo cliente
      setClienteBuscado(nuevoCliente)
      setFormularioPedido(prev => ({ ...prev, clienteId: nuevoCliente.id }))
      
      // Cerrar modal y limpiar formulario
      setMostrarCrearCliente(false)
      setFormularioClienteRapido({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        calle: '',
        numeroExterior: '',
        colonia: '',
        rutaId: '',
        zonaId: ''
      })
      
      alert('Cliente creado exitosamente')
    } catch (err: any) {
      alert('Error al crear cliente: ' + (err.message || 'Error desconocido'))
      console.error('Error creating cliente:', err)
    }
  }

  const crearPedido = async () => {
    try {
      if (!formularioPedido.clienteId) {
        alert('Debe seleccionar un cliente')
        return
      }

      // Si es tipo PIPA y método "Sin especificar", el repartidor llenará el pedido en la app (no requiere productos aquí)
      const sinEspecificar = formularioPedido.tipoServicio === 'pipas' && calculoPipas.tipoCalculo === 'ninguno'
      if (formularioPedido.productos.length === 0 && !sinEspecificar) {
        alert('Debe agregar al menos un producto al pedido')
        return
      }

      const ahora = new Date()
      const tzMexico = 'America/Mexico_City'
      const fechaPedidoMexico = ahora.toLocaleDateString('en-CA', { timeZone: tzMexico })
      const horaPedidoMexico = ahora.toLocaleTimeString('en-GB', { timeZone: tzMexico, hour: '2-digit', minute: '2-digit', hour12: false })

      // Calcular totales
      const totalLitros = formularioPedido.productos.reduce((sum, p) => sum + (p.litros || p.cantidad || 0), 0)
      const totalMonto = formularioPedido.productos.reduce((sum, p) => sum + (p.subtotal || (p.cantidad * p.precio) || 0), 0)
      
      // Preparar productos con todos los datos necesarios
      const productos = formularioPedido.productos.map((p, index) => ({
        productoId: p.productoId,
        cantidad: p.litros || p.cantidad, // Usar litros exactos si están disponibles
        precio: p.precio,
        // Incluir información adicional
        litros: p.litros || p.cantidad,
        subtotal: p.subtotal || (p.cantidad * p.precio),
        descripcion: p.descripcion,
        indice: index + 1,
      }))
      
      // Preparar el objeto de cálculo para guardar en JSON
      // Si hay múltiples productos con cálculos diferentes, crear un array
      let calculoPipasData: any = undefined
      
      if (formularioPedido.tipoServicio === 'pipas') {
        // Obtener todos los cálculos de los productos
        const calculos = formularioPedido.productos
          .filter(p => p.calculoPipas)
          .map(p => p.calculoPipas)
        
        if (calculos.length === 1) {
          // Si hay un solo cálculo, enviar el objeto con cargaIndex y totalCargas
          calculoPipasData = {
            ...calculos[0],
            cargaIndex: 1,
            totalCargas: 1
          }
        } else if (calculos.length > 1) {
          // Si hay múltiples cálculos, enviar un array con cargaIndex y totalCargas
          calculoPipasData = calculos.map((calculo, index) => ({
            ...calculo,
            cargaIndex: index + 1,
            totalCargas: calculos.length,
          }))
        } else if (calculoPipas.tipoCalculo !== 'ninguno') {
          // Fallback: usar el cálculo del estado si no hay en productos
          calculoPipasData = {
            tipoCalculo: calculoPipas.tipoCalculo
          }
          
          if (calculoPipas.tipoCalculo === 'litros') {
            calculoPipasData.cantidadLitros = calculoPipas.cantidadLitros
            calculoPipasData.precioPorLitro = calculoPipas.precioPorLitro
            calculoPipasData.totalPorLitros = calculoPipas.totalPorLitros
          } else if (calculoPipas.tipoCalculo === 'porcentajes') {
            calculoPipasData.capacidadTanque = calculoPipas.capacidadTanque
            calculoPipasData.porcentajeInicial = calculoPipas.porcentajeInicial
            calculoPipasData.porcentajeFinal = calculoPipas.porcentajeFinal
            calculoPipasData.litrosALlenar = calculoPipas.litrosALlenar
            calculoPipasData.precioPorLitro = calculoPipas.precioPorLitro
            calculoPipasData.totalPorPorcentajes = calculoPipas.totalPorPorcentajes
          } else if (calculoPipas.tipoCalculo === 'dinero') {
            calculoPipasData.cantidadDinero = calculoPipas.cantidadDinero
            calculoPipasData.precioPorLitro = calculoPipas.precioPorLitro
            calculoPipasData.litrosPorDinero = calculoPipas.litrosPorDinero
          }
        }
      }
      
      const productosPayload = formularioPedido.productos.map((p) => ({
        productoId: p.productoId,
        cantidad: p.litros ?? p.cantidad,
        precio: p.precio
      }))

      const data: CreatePedidoRequest = {
        clienteId: formularioPedido.clienteId,
        tipoServicio: formularioPedido.tipoServicio,
        horaPedido: formularioPedido.horario || horaPedidoMexico,
        fechaPedido: pedidoEditando
          ? (pedidoEditando.fechaPedido && String(pedidoEditando.fechaPedido).slice(0, 10)) || fechaPedidoMexico
          : fechaPedidoMexico,
        repartidorId: formularioPedido.repartidorId || undefined,
        observaciones: formularioPedido.observaciones || undefined,
        calculoPipas: calculoPipasData,
        sedeId: sedeId || undefined,
        productos: productosPayload
      }

      if (pedidoEditando) {
        await pedidosAPI.update(pedidoEditando.id, data)
        alert('Pedido actualizado exitosamente')
      } else {
        await pedidosAPI.create(data)
        alert('Pedido creado exitosamente')
      }
      cerrarDialogo()
      if (vistaActual === 'listado-pedidos') {
        loadPedidos()
      }
    } catch (err: any) {
      alert((pedidoEditando ? 'Error al actualizar pedido: ' : 'Error al crear pedido: ') + (err.message || 'Error desconocido'))
      console.error(pedidoEditando ? 'Error updating pedido:' : 'Error creating pedido:', err)
    }
  }

  const guardarProducto = async () => {
    try {
      // Validar que se haya seleccionado una categoría
      if (!formularioProducto.categoriaId) {
        alert('Por favor seleccione una categoría para el producto.')
        return
      }

      // Validar que no se intente crear un nuevo producto de GAS LP (solo debe existir uno)
      const categoriaSeleccionada = categoriasProducto.find(c => c.id === formularioProducto.categoriaId)
      if (!productoSeleccionado && categoriaSeleccionada && (categoriaSeleccionada.codigo === 'gas_lp' || categoriaSeleccionada.codigo === 'gas-lp')) {
        const productoGasLPExistente = productos.find(
          p => p.categoriaId === formularioProducto.categoriaId && p.id === 'b9d63c0e-22b5-4022-a359-72657bc127a4'
        )
        if (productoGasLPExistente) {
          alert('Ya existe un producto de la categoría GAS LP. Solo se permite un producto de esta categoría.')
          return
        }
      }

      // No permitir editar el producto específico de GAS LP desde el diálogo
      if (productoSeleccionado && productoSeleccionado.id === 'b9d63c0e-22b5-4022-a359-72657bc127a4') {
        alert('Este producto no se puede editar manualmente. Use la sección "Actualización de Precios" para modificar su precio.')
        return
      }

      // Asegurar que el precio sea un número
      // Los productos del catálogo NO tienen sede asignada (son para todas las sedes)
      const datosProducto: CreateProductoRequest = {
        nombre: formularioProducto.nombre,
        categoriaId: formularioProducto.categoriaId,
        precio:
          typeof formularioProducto.precio === 'string'
            ? parseFloat(formularioProducto.precio.replace(/[^0-9.]/g, '')) || 0
            : formularioProducto.precio,
        unidad: formularioProducto.unidad,
        descripcion: formularioProducto.descripcion || undefined,
        cantidadKilos: formularioProducto.cantidadKilos,
        activo: formularioProducto.activo !== undefined ? formularioProducto.activo : true
        // No incluir sedeId - los productos son para todas las sedes
      }

      if (productoSeleccionado) {
        await productosAPI.update(productoSeleccionado.id, datosProducto)
        alert('Producto actualizado exitosamente')
      } else {
        await productosAPI.create(datosProducto)
        alert('Producto creado exitosamente')
      }
      cerrarDialogo()
      loadProductos()
    } catch (err: any) {
      alert('Error al guardar producto: ' + (err.message || 'Error desconocido'))
      console.error('Error saving producto:', err)
    }
  }

  const guardarDescuento = async () => {
    try {
      if (descuentoEditando) {
        // Actualizar descuento existente
        await descuentosRepartidorAPI.update(descuentoEditando.id, {
          nombre: formularioDescuento.nombre,
          descripcion: formularioDescuento.descripcion,
          descuentoAutorizado: formularioDescuento.descuentoAutorizado,
          descuentoPorLitro: formularioDescuento.descuentoPorLitro
        })
        alert('Descuento actualizado exitosamente')
      } else {
        // Crear nuevo descuento (permite múltiples por repartidor)
        await descuentosRepartidorAPI.create({
          repartidorId: formularioDescuento.repartidorId,
          nombre: formularioDescuento.nombre || undefined,
          descripcion: formularioDescuento.descripcion || undefined,
          descuentoAutorizado: formularioDescuento.descuentoAutorizado,
          descuentoPorLitro: formularioDescuento.descuentoPorLitro,
          activo: true
        })
        alert('Descuento creado exitosamente')
      }
      cerrarDialogo()
      loadDescuentos()
    } catch (err: any) {
      alert('Error al guardar descuento: ' + (err.message || 'Error desconocido'))
      console.error('Error saving descuento:', err)
    }
  }

  const abrirDialogoEditarDescuento = (descuento: DescuentoRepartidor) => {
    setDescuentoEditando(descuento)
    const repartidor = repartidores.find(r => r.id === descuento.repartidorId)
    setRepartidorSeleccionado(repartidor || null)
    setFormularioDescuento({
      repartidorId: descuento.repartidorId,
      nombre: descuento.nombre || '',
      descripcion: descuento.descripcion || '',
      descuentoAutorizado: descuento.descuentoAutorizado,
      descuentoPorLitro: descuento.descuentoPorLitro || 0
    })
    setTipoDialogo('descuentos')
    setDialogoAbierto(true)
  }

  const actualizarPrecios = async () => {
    try {
      setActualizandoPrecios(true)
      setError(null)

      // Actualizar la configuración única en la base de datos
      await configuracionesAPI.update({
        precioPorLitroGasLP: preciosBase.precioPorLitro,
        precioPorKG: preciosBase.precioPorKG
      })

      // Actualizar el producto específico de GAS LP
      const productoGasLPId = 'b9d63c0e-22b5-4022-a359-72657bc127a4'
      const productoGasLP = productos.find(p => p.id === productoGasLPId)
      
      if (productoGasLP) {
        await productosAPI.update(productoGasLPId, {
          nombre: productoGasLP.nombre,
          categoriaId: productoGasLP.categoriaId,
          precio: preciosBase.precioPorLitro,
          unidad: productoGasLP.unidad,
          descripcion: productoGasLP.descripcion,
          activo: productoGasLP.activo
        })
      }

      // Actualizar todos los productos de cilindros que tengan cantidadKilos definida
      const productosCilindros = productos.filter(
        p => (p.categoria?.codigo === 'cilindros' || p.categoriaId && categoriasProducto.find(c => c.id === p.categoriaId)?.codigo === 'cilindros') && p.cantidadKilos && p.cantidadKilos > 0
      )
      
      for (const producto of productosCilindros) {
        const nuevoPrecio = parseFloat((preciosBase.precioPorKG * producto.cantidadKilos!).toFixed(2))
        await productosAPI.update(producto.id, {
          nombre: producto.nombre,
          categoriaId: producto.categoriaId,
          precio: nuevoPrecio,
          unidad: producto.unidad,
          descripcion: producto.descripcion,
          cantidadKilos: producto.cantidadKilos,
          activo: producto.activo
        })
      }

      // Recargar productos para reflejar los cambios
      await loadProductos()

      setSuccessMessage('Configuraciones de precios actualizadas exitosamente')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      const errorMsg = 'Error al actualizar configuraciones: ' + (err.message || 'Error desconocido')
      setError(errorMsg)
      console.error('Error updating configuraciones:', err)
      alert(errorMsg)
    } finally {
      setActualizandoPrecios(false)
    }
  }

  const eliminarDescuento = async () => {
    if (!descuentoAEliminar) return

    try {
      setEliminando(true)
      setError(null)
      await descuentosRepartidorAPI.delete(descuentoAEliminar.id)
      setDialogoEliminar(false)
      setDescuentoAEliminar(null)
      await loadDescuentos()
      alert('Descuento eliminado exitosamente')
    } catch (err: any) {
      setError('Error al eliminar descuento: ' + (err.message || 'Error desconocido'))
      console.error('Error deleting descuento:', err)
    } finally {
      setEliminando(false)
    }
  }

  const loadCategoriasProducto = async () => {
    try {
      const data = await categoriasProductoAPI.getAll()
      console.log('Categorías cargadas:', data.length, data.map(c => ({ id: c.id, nombre: c.nombre, codigo: c.codigo })))
      setCategoriasProducto(data)
    } catch (err: any) {
      console.error('Error loading categorias:', err)
    }
  }

  const guardarCategoria = async () => {
    try {
      if (categoriaSeleccionada) {
        await categoriasProductoAPI.update(categoriaSeleccionada.id, formularioCategoria)
        alert('Categoría actualizada exitosamente')
      } else {
        await categoriasProductoAPI.create(formularioCategoria)
        alert('Categoría creada exitosamente')
      }
      cerrarDialogo()
      loadCategoriasProducto()
    } catch (err: any) {
      alert('Error al guardar categoría: ' + (err.message || 'Error desconocido'))
      console.error('Error saving categoria:', err)
    }
  }

  const eliminarCategoria = async () => {
    if (!categoriaSeleccionada) return

    try {
      setEliminando(true)
      setError(null)
      await categoriasProductoAPI.delete(categoriaSeleccionada.id)
      setDialogoEliminar(false)
      setCategoriaSeleccionada(null)
      await loadCategoriasProducto()
      alert('Categoría eliminada exitosamente')
    } catch (err: any) {
      setError('Error al eliminar categoría: ' + (err.message || 'Error desconocido'))
      console.error('Error deleting categoria:', err)
    } finally {
      setEliminando(false)
    }
  }

  const manejarCambioFiltros = (campo: string, valor: any) => {
    setFiltrosPedidos(prev => ({ ...prev, [campo]: valor }))
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'entregado':
        return 'success'
      case 'pendiente':
        return 'warning'
      case 'cancelado':
        return 'error'
      case 'en_proceso':
        return 'info'
      case 'en-proceso':
        return 'info' // Compatibilidad con formato anterior
      default:
        return 'default'
    }
  }

  const numberToWords = (num: number) => {
    const ones = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
    const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
    const integerPart = Math.floor(num)
    const decimalPart = Math.round((num - integerPart) * 100)
    if (integerPart === 0) return `CERO ${decimalPart}/100 M.N.`
    if (integerPart < 10) return `${ones[integerPart]} ${decimalPart}/100 M.N.`
    if (integerPart < 20) return `${teens[integerPart - 10]} ${decimalPart}/100 M.N.`
    if (integerPart < 100) {
      const tensDigit = Math.floor(integerPart / 10)
      const onesDigit = integerPart % 10
      if (onesDigit === 0) return `${tens[tensDigit]} ${decimalPart}/100 M.N.`
      return `${tens[tensDigit]} Y ${ones[onesDigit]} ${decimalPart}/100 M.N.`
    }
    return `${integerPart.toLocaleString('es-MX')} ${decimalPart}/100 M.N.`
  }

  const generarHtmlTicketVenta = (pedido: Pedido, config: ConfiguracionTicket) => {
    const total = pedido.ventaTotal ?? 0
    const clientName = pedido.cliente
      ? `${pedido.cliente.nombre} ${pedido.cliente.apellidoPaterno ?? ''} ${pedido.cliente.apellidoMaterno ?? ''}`.trim()
      : 'Público en General'
    const clientAddress = pedido.cliente
      ? [pedido.cliente.calle, pedido.cliente.numeroExterior, pedido.cliente.colonia].filter(Boolean).join(', ')
      : ''
    const repartidorName = pedido.repartidor
      ? `${pedido.repartidor.nombres} ${pedido.repartidor.apellidoPaterno ?? ''} ${pedido.repartidor.apellidoMaterno ?? ''}`.trim()
      : 'Operador'
    const folio = pedido.numeroPedido || `F${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    const formattedDate = new Date(pedido.fechaPedido).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    let productsHTML = ''
    if (pedido.productosPedido && pedido.productosPedido.length > 0) {
      productsHTML = pedido.productosPedido
        .map((pp) => {
          const descuentoMonto = typeof pp.descuentoMonto === 'number' ? pp.descuentoMonto : 0
          const hasDescuento = descuentoMonto > 0
          const subtotal = (pp.subtotal ?? pp.cantidad * (pp.precio ?? 0)).toFixed(2)
          let row = `<tr>
              <td style="text-align: left; padding: 2px; font-size: 9px;">${pp.producto?.nombre ?? 'Producto'}</td>
              <td style="text-align: center; padding: 2px; font-size: 9px;">${pp.cantidad}</td>
              <td style="text-align: right; padding: 2px; font-size: 9px;">$${(pp.precio ?? 0).toFixed(2)}</td>
              <td style="text-align: right; padding: 2px; font-size: 9px;">$${subtotal}</td>
            </tr>`
          if (hasDescuento) {
            row += `<tr>
              <td colspan="3" style="text-align: right; padding: 1px 2px; font-size: 8px; color: #666;">Descuento ${pp.descuento || ''}</td>
              <td style="text-align: right; padding: 1px 2px; font-size: 8px; color: #666;">-$${descuentoMonto.toFixed(2)}</td>
            </tr>`
          }
          return row
        })
        .join('')
    } else {
      const label = pedido.tipoServicio === 'pipas' ? 'Litro de Gas LP' : 'Cilindro de Gas LP'
      productsHTML = `<tr>
        <td style="text-align: left; padding: 2px; font-size: 9px;">${label}</td>
        <td style="text-align: center; padding: 2px; font-size: 9px;">1</td>
        <td style="text-align: right; padding: 2px; font-size: 9px;">$${total.toFixed(2)}</td>
        <td style="text-align: right; padding: 2px; font-size: 9px;">$${total.toFixed(2)}</td>
      </tr>`
    }

    const paymentMethodsHTML =
      pedido.pagos
        ?.map(
          (p) =>
            `<p style="margin: 4px 0;">${p.tipo === 'credito' ? 'Uso de Crédito' : p.metodo?.nombre ?? 'Pago'}: $${(p.monto ?? 0).toFixed(2)}${p.folio ? ` (Folio: ${p.folio})` : ''}</p>`
        )
        .join('') ?? ''
    const signatureFromPago = pedido.pagos?.find((p) => p.firmaCliente)?.firmaCliente
    const signatureHTML =
      signatureFromPago && typeof signatureFromPago === 'string'
        ? `<div style="margin: 10px 0;"><p style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">Firma del cliente:</p><img src="${signatureFromPago}" alt="Firma" style="max-width: 100%; max-height: 80px; border: 1px solid #ccc; display: block;" /></div>`
        : ''

    const companyInfo = {
      name: config.nombreEmpresa ?? 'ERPGASLP',
      address: config.direccion ?? '',
      city: config.razonSocial ?? '',
      phone: config.telefono ? `Tel: ${config.telefono}` : '',
      email: config.email ?? '',
      sitioWeb: config.sitioWeb ?? '',
      rfc: config.rfc ?? '',
      logo: config.logo,
      mostrarLogo: config.mostrarLogo ?? true,
      tamañoLogo: config.tamañoLogo ?? 'mediano',
      textos: config.textos ?? {},
      diseño: config.diseño ?? { mostrarFecha: true, mostrarHora: true, mostrarCajero: true, mostrarCliente: true, colorPrincipal: '#1976d2', alineacion: 'centro' }
    }
    const qrData =
      config.urlQR && String(config.urlQR).trim()
        ? String(config.urlQR).trim()
        : JSON.stringify({
            folio,
            fecha: formattedDate,
            monto: total.toFixed(2),
            cliente: clientName,
            repartidor: repartidorName,
            tipo: 'venta'
          })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @media print { @page { margin: 0; size: 80mm auto; } body { margin: 0; max-width: 80mm; width: 80mm; } }
          body { font-family: Arial, sans-serif; max-width: 80mm; width: 80mm; margin: 0 auto; padding: 10px 8px; font-size: 11px; color: #000; box-sizing: border-box; }
          * { box-sizing: border-box; }
          .header { text-align: center; margin-bottom: 10px; }
          .company-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
          .separator { border-top: 1px solid #000; margin: 8px 0; }
          .title { text-align: center; font-size: 12px; font-weight: bold; margin: 8px 0; }
          .folio { text-align: center; font-size: 10px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; table-layout: fixed; }
          th { border-bottom: 2px solid #000; padding: 3px; font-size: 9px; font-weight: bold; text-align: left; }
          th.col-qty { text-align: center; width: 15%; }
          th.col-price, th.col-amount { text-align: right; width: 25%; }
          td { padding: 3px; font-size: 9px; }
          .total-row { display: flex; justify-content: space-between; margin: 8px 0; font-weight: bold; font-size: 12px; border-top: 1px solid #000; padding-top: 4px; }
          .total-words { text-align: center; font-style: italic; font-size: 9px; margin: 8px 0; }
          .footer { text-align: center; font-size: 10px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${companyInfo.mostrarLogo && companyInfo.logo ? `<img src="${companyInfo.logo}" style="max-width: ${companyInfo.tamañoLogo === 'pequeño' ? '60px' : companyInfo.tamañoLogo === 'mediano' ? '100px' : '140px'}; max-height: 80px; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;" />` : ''}
          <div class="company-name">${companyInfo.name}</div>
          ${companyInfo.address ? `<div>${companyInfo.address}</div>` : ''}
          ${companyInfo.city ? `<div>${companyInfo.city}</div>` : ''}
          ${companyInfo.phone ? `<div>${companyInfo.phone}</div>` : ''}
          ${companyInfo.email ? `<div>${companyInfo.email}</div>` : ''}
          ${companyInfo.rfc ? `<div><strong>RFC: ${companyInfo.rfc}</strong></div>` : ''}
        </div>
        <div class="separator"></div>
        <div class="title">TICKET VENTA</div>
        <div class="folio">Folio: ${folio}</div>
        ${companyInfo.diseño?.mostrarFecha ? `<p style="text-align: center; font-size: 11px;"><strong>Fecha:</strong> ${formattedDate}</p>` : ''}
        <div class="separator"></div>
        <div><p><strong>Cliente:</strong> ${clientName}</p>${clientAddress ? `<p><strong>Dirección:</strong> ${clientAddress}</p>` : ''}</div>
        <div class="separator"></div>
        <table>
          <thead><tr><th>Producto</th><th class="col-qty">Cant.</th><th class="col-price">Precio Unit.</th><th class="col-amount">Importe</th></tr></thead>
          <tbody>${productsHTML}</tbody>
        </table>
        <div class="separator"></div>
        <div class="total-row"><span>TOTAL:</span><span>$${total.toFixed(2)}</span></div>
        <div class="total-words">${numberToWords(total)}</div>
        <div class="separator"></div>
        ${paymentMethodsHTML ? `<div><p><strong>Forma de Pago:</strong></p>${paymentMethodsHTML}</div><div class="separator"></div>` : ''}
        ${signatureHTML}
        <p><strong>Repartidor(a):</strong> ${repartidorName}</p>
        <div class="separator"></div>
        <div class="footer"><p>Representación impresa de la factura electrónica</p><p>Gracias por su preferencia</p></div>
        <div style="text-align: center; margin: 10px 0;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" alt="QR" style="max-width: 150px; height: auto;" /><p style="font-size: 9px;">Folio: ${folio}</p></div>
      </body>
      </html>
    `
  }

  const abrirDialogoTicket = (pedido: Pedido) => {
    setPedidoParaTicket(pedido)
    setDialogoTicketAbierto(true)
  }

  const descargarTicketPdf = () => {
    if (!htmlTicket) return
    const ventana = window.open('', '_blank')
    if (ventana) {
      ventana.document.write(htmlTicket)
      ventana.document.close()
      ventana.focus()
      setTimeout(() => {
        ventana.print()
      }, 300)
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'entregado':
        return 'Entregado'
      case 'pendiente':
        return 'Pendiente'
      case 'cancelado':
        return 'Cancelado'
      case 'en_proceso':
        return 'En Proceso'
      case 'en-proceso':
        return 'En Proceso' // Compatibilidad
      default:
        return estado
    }
  }

  const getEstadoCreditoColor = (estado: string) => {
    switch (estado) {
      case 'buen-pagador':
        return 'success'
      case 'vencido':
        return 'warning'
      case 'critico':
        return 'error'
      case 'bloqueado':
        return 'default'
      default:
        return 'default'
    }
  }

  const pedidosFiltrados = pedidos.filter(pedido => {
    const fechaPedidoStr = pedido.fechaPedido ? String(pedido.fechaPedido).slice(0, 10) : ''
    const cumpleFechaDesde = !filtrosPedidos.fechaDesde || fechaPedidoStr >= filtrosPedidos.fechaDesde
    const cumpleFechaHasta = !filtrosPedidos.fechaHasta || fechaPedidoStr <= filtrosPedidos.fechaHasta
    const nombreCliente = pedido.cliente?.nombre || pedido.cliente?.apellidoPaterno || ''
    const cumpleCliente =
      !filtrosPedidos.cliente || nombreCliente.toLowerCase().includes(filtrosPedidos.cliente.toLowerCase())
    const cumpleZona = !filtrosPedidos.zona || pedido.zona === filtrosPedidos.zona
    const cumpleRuta =
      !filtrosPedidos.rutaId || pedido.rutaId === filtrosPedidos.rutaId || pedido.ruta?.id === filtrosPedidos.rutaId
    const cumpleEstado = !filtrosPedidos.estado || pedido.estado === filtrosPedidos.estado
    const cumpleMostrarTodos = filtrosPedidos.mostrarTodos || pedido.estado !== 'cancelado'

    return (
      cumpleFechaDesde &&
      cumpleFechaHasta &&
      cumpleCliente &&
      cumpleZona &&
      cumpleRuta &&
      cumpleEstado &&
      cumpleMostrarTodos
    )
  })

  const zonasUnicas = [...new Set(pedidos.map(p => p.zona).filter(Boolean))]
  const rutasUnicas = [...new Set(pedidos.map(p => p.ruta?.nombre).filter(Boolean))]

  // Paginación del listado de pedidos (página efectiva para no quedar fuera de rango al filtrar)
  const totalFilas = pedidosFiltrados.length
  const totalPaginas = filasPorPaginaPedidos > 0 ? Math.max(1, Math.ceil(totalFilas / filasPorPaginaPedidos)) : 1
  const paginaEfectiva = totalFilas === 0 ? 0 : Math.min(paginaPedidos, totalPaginas - 1)
  const inicioPagina = paginaEfectiva * filasPorPaginaPedidos
  const pedidosPaginados = pedidosFiltrados.slice(inicioPagina, inicioPagina + filasPorPaginaPedidos)

  const granTotalOperacion = (cortePipas?.totalVentas || 0) + (corteCilindros?.totalVentas || 0)
  const efectivoConsolidado = (cortePipas?.totalAbonos || 0) + (corteCilindros?.totalAbonos || 0)

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    )
  }

  const fechaHoy = new Date()
  const diaNumero = fechaHoy.getDate()
  const diaSemana = fechaHoy.toLocaleDateString('es-MX', { weekday: 'long' })
  const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant='h4' component='h1'>
            Sistema de Ventas
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 0.5 }}>
            Hoy: {diaSemanaCapitalizado} {diaNumero}
          </Typography>
        </Box>
        {/* Selector de sede solo para super administradores y solo en vistas que no sean catálogo */}
        {esSuperAdministrador && vistaActual !== 'catalogo' && (
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Sede</InputLabel>
            <Select value={sedeSeleccionada || ''} onChange={e => handleSedeChange(e.target.value)} label='Sede'>
              {sedes.map(sede => (
                <MenuItem key={sede.id} value={sede.id}>
                  {sede.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {/* Administrador y Gestor: solo muestran el nombre de su sede (sin selector) */}
        {!esSuperAdministrador && sedeId && vistaActual !== 'catalogo' && (
          <Chip
            label={sedes.find(s => s.id === sedeId)?.nombre ?? 'N/A'}
            color='primary'
            variant='outlined'
          />
        )}
      </Box>

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
          <Button
            variant={vistaActual === 'categorias' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('categorias')}
            startIcon={<GasMeterIcon />}
          >
            Categorías
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
                        ${(resumenVentas?.ventasHoy || 0).toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {(resumenVentas?.crecimientoPorcentaje || 0) > 0 ? (
                          <TrendingUpIcon color='success' fontSize='small' />
                        ) : (
                          <TrendingDownIcon color='error' fontSize='small' />
                        )}
                        <Typography
                          variant='body2'
                          color={(resumenVentas?.crecimientoPorcentaje || 0) > 0 ? 'success.main' : 'error.main'}
                          sx={{ ml: 0.5 }}
                        >
                          {(resumenVentas?.crecimientoPorcentaje || 0) > 0 ? '+' : ''}
                          {resumenVentas?.crecimientoPorcentaje || 0}%
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
                        {resumenVentas?.pedidosCreados || 0}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {resumenVentas?.pedidosEntregados || 0} entregados
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
                        {resumenVentas?.alertasCriticas || 0}
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
                      <Typography variant='h6'>{cortePipas?.rutasProgramadas || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Entregados
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        {cortePipas?.cortesEntregados || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Validados
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        {cortePipas?.cortesValidados || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Pendientes
                      </Typography>
                      <Typography variant='h6' color='warning.main'>
                        {cortePipas?.cortesPendientes || 0}
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
                        ${(cortePipas?.totalVentas || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Servicios
                      </Typography>
                      <Typography variant='h6'>{cortePipas?.totalServicios || 0}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Abonos
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        ${(cortePipas?.totalAbonos || 0).toLocaleString()}
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
                      <Typography variant='h6'>{corteCilindros?.rutasProgramadas || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Entregados
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        {corteCilindros?.cortesEntregados || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Validados
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        {corteCilindros?.cortesValidados || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Cortes Pendientes
                      </Typography>
                      <Typography variant='h6' color='warning.main'>
                        {corteCilindros?.cortesPendientes || 0}
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
                        ${(corteCilindros?.totalVentas || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Servicios
                      </Typography>
                      <Typography variant='h6'>{corteCilindros?.totalServicios || 0}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Abonos
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        ${(corteCilindros?.totalAbonos || 0).toLocaleString()}
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
                      <Typography variant='h3' sx={{ color: 'white' }}>
                        ${granTotalOperacion.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant='h6' gutterBottom sx={{ color: 'white' }}>
                        EFECTIVO CONSOLIDADO
                      </Typography>
                      <Typography variant='h4' sx={{ color: 'white' }}>
                        ${efectivoConsolidado.toLocaleString()}
                      </Typography>
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
          {error && (
            <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}
          <Grid container spacing={3}>
            {/* Catálogo de Productos */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant='h6' gutterBottom>
                      Catálogo de Productos
                    </Typography>
                    <Button
                      variant='contained'
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setProductoSeleccionado(null)
                        setFormularioProducto({
                          nombre: '',
                          categoriaId: categoriasProducto.length > 0 ? categoriasProducto[0].id : '',
                          precio: 0,
                          unidad: '',
                          descripcion: '',
                          cantidadKilos: undefined,
                          activo: true
                          // No incluir sedeId - los productos del catálogo son para todas las sedes
                        })
                        abrirDialogo('producto')
                      }}
                    >
                      Nuevo Producto
                    </Button>
                  </Box>

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
                            .filter(p => {
                              const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                              const categoriaNombre = p.categoria?.nombre || categoriasProducto.find(c => c.id === p.categoriaId)?.nombre
                              // Buscar por código o por nombre (por si el código no coincide)
                              const esGasLP = (categoriaCodigo === 'gas_lp' || categoriaCodigo === 'gas-lp' || categoriaNombre?.toLowerCase().includes('gas lp')) && p.id === 'b9d63c0e-22b5-4022-a359-72657bc127a4'
                              return esGasLP
                            })
                            .slice(0, 1) // Solo mostrar el primer producto (el único permitido)
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
                                    ${typeof producto.precio === 'number' ? producto.precio.toFixed(2) : parseFloat(producto.precio || 0).toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell>{producto.unidad}</TableCell>
                                <TableCell align='center'>
                                  {/* No mostrar botón de editar para el producto de GAS LP */}
                                </TableCell>
                              </TableRow>
                            ))}
                          {productos.filter(p => {
                            const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                            const categoriaNombre = p.categoria?.nombre || categoriasProducto.find(c => c.id === p.categoriaId)?.nombre
                            const esGasLP = (categoriaCodigo === 'gas_lp' || categoriaCodigo === 'gas-lp' || categoriaNombre?.toLowerCase().includes('gas lp')) && p.id === 'b9d63c0e-22b5-4022-a359-72657bc127a4'
                            return esGasLP
                          }).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} align='center'>
                                <Typography variant='body2' color='text.secondary'>
                                  No hay productos de GAS LP disponibles
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
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
                            .filter(p => {
                              const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                              const categoriaNombre = p.categoria?.nombre || categoriasProducto.find(c => c.id === p.categoriaId)?.nombre
                              // Buscar por código o por nombre (por si el código no coincide)
                              return categoriaCodigo === 'cilindros' || categoriaNombre?.toLowerCase().includes('cilindro')
                            })
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
                                    ${typeof producto.precio === 'number' ? producto.precio.toFixed(2) : parseFloat(producto.precio || 0).toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell>{producto.unidad}</TableCell>
                                <TableCell align='center'>
                                  <Tooltip title='Editar producto'>
                                    <IconButton size='small' onClick={() => abrirDialogo('producto', producto)}>
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          {productos.filter(p => {
                            const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                            const categoriaNombre = p.categoria?.nombre || categoriasProducto.find(c => c.id === p.categoriaId)?.nombre
                            return categoriaCodigo === 'cilindros' || categoriaNombre?.toLowerCase().includes('cilindro')
                          }).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} align='center'>
                                <Typography variant='body2' color='text.secondary'>
                                  No hay productos de CILINDROS disponibles
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Válvulas (para cilindros) */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant='h6' sx={{ color: 'info.main' }} gutterBottom>
                      VÁLVULAS
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
                            .filter(p => {
                              const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                              const categoriaNombre = p.categoria?.nombre || categoriasProducto.find(c => c.id === p.categoriaId)?.nombre
                              return categoriaCodigo === 'val' || categoriaNombre?.toLowerCase().includes('valvula')
                            })
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
                                    ${typeof producto.precio === 'number' ? producto.precio.toFixed(2) : parseFloat(producto.precio || 0).toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell>{producto.unidad}</TableCell>
                                <TableCell align='center'>
                                  <Tooltip title='Editar producto'>
                                    <IconButton size='small' onClick={() => abrirDialogo('producto', producto)}>
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          {productos.filter(p => {
                            const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                            const categoriaNombre = p.categoria?.nombre || categoriasProducto.find(c => c.id === p.categoriaId)?.nombre
                            return categoriaCodigo === 'val' || categoriaNombre?.toLowerCase().includes('valvula')
                          }).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} align='center'>
                                <Typography variant='body2' color='text.secondary'>
                                  No hay productos de VÁLVULAS disponibles
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
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
                            .filter(p => {
                              const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                              const categoriaNombre = p.categoria?.nombre || categoriasProducto.find(c => c.id === p.categoriaId)?.nombre
                              // Buscar por código o por nombre (por si el código no coincide)
                              return categoriaCodigo === 'tanques_nuevos' || categoriaCodigo === 'tanques-nuevos' || categoriaNombre?.toLowerCase().includes('tanque nuevo') || categoriaNombre?.toLowerCase().includes('tanques nuevo')
                            })
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
                                    ${typeof producto.precio === 'number' ? producto.precio.toFixed(2) : parseFloat(producto.precio || 0).toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell>{producto.unidad}</TableCell>
                                <TableCell align='center'>
                                  <Tooltip title='Editar producto'>
                                    <IconButton size='small' onClick={() => abrirDialogo('producto', producto)}>
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          {productos.filter(p => {
                            const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                            const categoriaNombre = p.categoria?.nombre || categoriasProducto.find(c => c.id === p.categoriaId)?.nombre
                            return categoriaCodigo === 'tanques_nuevos' || categoriaCodigo === 'tanques-nuevos' || categoriaNombre?.toLowerCase().includes('tanque nuevo') || categoriaNombre?.toLowerCase().includes('tanques nuevo')
                          }).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} align='center'>
                                <Typography variant='body2' color='text.secondary'>
                                  No hay productos de TANQUES NUEVOS disponibles
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
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
                      value={preciosBase.precioPorLitro}
                      onChange={(e) => setPreciosBase(prev => ({ ...prev, precioPorLitro: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label='Precio por KG'
                      type='number'
                      value={preciosBase.precioPorKG}
                      onChange={(e) => setPreciosBase(prev => ({ ...prev, precioPorKG: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                    <Typography variant='caption' color='text.secondary'>
                      Calcula automáticamente precios de cilindros
                    </Typography>
                  </Box>

                  <Button 
                    variant='contained' 
                    fullWidth 
                    startIcon={<EditIcon />}
                    onClick={actualizarPrecios}
                    disabled={actualizandoPrecios}
                  >
                    {actualizandoPrecios ? 'Actualizando...' : 'Actualizar Precios'}
                  </Button>
                </CardContent>
              </Card>

              {/* Gestión de Descuentos */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant='h6' gutterBottom>
                      Gestión de Descuentos por Repartidor
                    </Typography>
                    <Button
                      variant='outlined'
                      size='small'
                      startIcon={<AddIcon />}
                      onClick={() => abrirDialogo('descuentos')}
                    >
                      Agregar Descuento
                    </Button>
                  </Box>

                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Repartidor</TableCell>
                          <TableCell>Nombre Descuento</TableCell>
                          <TableCell align='right'>Descuento (%)</TableCell>
                          <TableCell align='right'>Descuento por Litro</TableCell>
                          <TableCell align='center'>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {repartidores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align='center'>
                              <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
                                No hay repartidores disponibles
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          repartidores.map(repartidor => {
                            const descuentosDelRepartidor = descuentosRepartidor.filter(d => d.repartidorId === repartidor.id)
                            
                            if (descuentosDelRepartidor.length === 0) {
                              return (
                                <TableRow key={repartidor.id}>
                                  <TableCell>
                                    <Typography variant='subtitle2'>
                                      {repartidor.nombres} {repartidor.apellidoPaterno}
                                    </Typography>
                                    <Chip
                                      label={repartidor.tipoRepartidor || 'N/A'}
                                      size='small'
                                      color={repartidor.tipoRepartidor === 'pipas' ? 'primary' : 'secondary'}
                                    />
                                  </TableCell>
                                  <TableCell colSpan={3}>
                                    <Typography variant='body2' color='text.secondary'>
                                      Sin descuentos configurados
                                    </Typography>
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Tooltip title='Agregar descuento'>
                                      <IconButton size='small' onClick={() => abrirDialogo('descuentos', repartidor)}>
                                        <AddIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              )
                            }
                            
                            return descuentosDelRepartidor.map((descuento, index) => (
                              <TableRow key={`${repartidor.id}-${descuento.id}`}>
                                {index === 0 && (
                                  <TableCell rowSpan={descuentosDelRepartidor.length}>
                                    <Typography variant='subtitle2'>
                                      {repartidor.nombres} {repartidor.apellidoPaterno}
                                    </Typography>
                                    <Chip
                                      label={repartidor.tipoRepartidor || 'N/A'}
                                      size='small'
                                      color={repartidor.tipoRepartidor === 'pipas' ? 'primary' : 'secondary'}
                                    />
                                  </TableCell>
                                )}
                                <TableCell>
                                  <Typography variant='body2' fontWeight={descuento.nombre ? 'bold' : 'normal'}>
                                    {descuento.nombre || `Descuento ${index + 1}`}
                                  </Typography>
                                  {descuento.descripcion && (
                                    <Typography variant='caption' color='text.secondary' display='block'>
                                      {descuento.descripcion}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='h6' color='success.main'>
                                    {descuento.descuentoAutorizado}%
                                  </Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='h6' color='info.main'>
                                    ${descuento.descuentoPorLitro || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                    <Tooltip title='Editar descuento'>
                                      <IconButton size='small' onClick={() => abrirDialogoEditarDescuento(descuento)}>
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title='Eliminar descuento'>
                                      <IconButton 
                                        size='small' 
                                        color='error'
                                        onClick={() => {
                                          setDescuentoAEliminar(descuento)
                                          setDialogoEliminar(true)
                                        }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant='h6'>Listado Completo de Pedidos/Ventas</Typography>
            <Button variant='contained' startIcon={<AddIcon />} onClick={() => abrirDialogo('pedido')}>
              Nuevo Pedido
            </Button>
          </Box>

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
                    onChange={e => manejarCambioFiltros('fechaDesde', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label='Fecha Hasta'
                    type='date'
                    value={filtrosPedidos.fechaHasta}
                    onChange={e => manejarCambioFiltros('fechaHasta', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label='Buscar por Cliente'
                    value={filtrosPedidos.cliente}
                    onChange={e => manejarCambioFiltros('cliente', e.target.value)}
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
                      value={filtrosPedidos.rutaId}
                      onChange={e => manejarCambioFiltros('rutaId', e.target.value)}
                      label='Ruta'
                    >
                      <MenuItem value=''>Todas las rutas</MenuItem>
                      {rutas.map(ruta => (
                        <MenuItem key={ruta.id} value={ruta.id}>
                          {ruta.nombre} {ruta.codigo ? `(${ruta.codigo})` : ''}
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
                      onChange={e => manejarCambioFiltros('estado', e.target.value)}
                      label='Estado'
                    >
                      <MenuItem value=''>Todos los estados</MenuItem>
                      <MenuItem value='pendiente'>Pendiente</MenuItem>
                      <MenuItem value='en_proceso'>En Proceso</MenuItem>
                      <MenuItem value='entregado'>Entregado</MenuItem>
                      <MenuItem value='cancelado'>Cancelado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filtrosPedidos.mostrarTodos}
                        onChange={e => manejarCambioFiltros('mostrarTodos', e.target.checked)}
                      />
                    }
                    label='Mostrar todos los pedidos'
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant='contained' startIcon={<SearchIcon />} onClick={() => loadPedidos()}>
                      Buscar
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
                        const nuevosFiltros: FiltrosPedidos = {
                          fechaDesde: hoy,
                          fechaHasta: hoy,
                          cliente: '',
                          tipoCliente: '',
                          zona: '',
                          rutaId: '',
                          estado: '',
                          mostrarTodos: false
                        }
                        setFiltrosPedidos(nuevosFiltros)
                        loadPedidos(nuevosFiltros)
                      }}
                    >
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
                <Typography variant='h6'>Pedidos ({pedidosFiltrados.length})</Typography>
                <Button variant='outlined' startIcon={<DownloadIcon />}>
                  Exportar Datos
                </Button>
              </Box>

              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID del Pedido</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell>Operador</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fecha y Hora</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                      <TableCell align='right'>Costo</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pedidosPaginados.map(pedido => (
                      <TableRow key={pedido.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pedido.numeroPedido}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{pedido.ruta?.nombre || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pedido.repartidor
                              ? `${pedido.repartidor.nombres} ${pedido.repartidor.apellidoPaterno} ${pedido.repartidor.apellidoMaterno || ''}`.trim()
                              : 'Sin asignar'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pedido.cliente
                              ? `${pedido.cliente.nombre} ${pedido.cliente.apellidoPaterno} ${pedido.cliente.apellidoMaterno || ''}`.trim()
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant='body2'>
                              {new Date(pedido.fechaPedido).toLocaleDateString('es-MX')}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {pedido.horaPedido || 'N/A'}
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
                          <Typography variant='h6' color='primary'>
                            ${pedido.ventaTotal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='Ver ticket'>
                              <IconButton
                                size='small'
                                onClick={() => abrirDialogoTicket(pedido)}
                              >
                                <ReceiptIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Ver detalles'>
                              <IconButton
                                size='small'
                                onClick={() => {
                                  setPedidoSeleccionado(pedido)
                                  setTipoDialogo('pedido-detalles')
                                  setDialogoAbierto(true)
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            {pedido.estado !== 'entregado' && (
                              <Tooltip title='Editar pedido'>
                                <IconButton
                                  size='small'
                                  color='primary'
                                  onClick={() => abrirDialogoEditarPedido(pedido)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}

                            {pedido.estado === 'pendiente' && (
                              <Tooltip title='Cerrar Venta (Registrar Pago)'>
                                <IconButton
                                  size='small'
                                  color='primary'
                                  onClick={() => abrirDialogoCerrarPedido(pedido)}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title='Eliminar pedido'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  abrirDialogoEliminar(pedido)
                                }}
                              >
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
              <TablePagination
                component='div'
                count={totalFilas}
                page={paginaEfectiva}
                onPageChange={(_, nuevaPagina) => setPaginaPedidos(nuevaPagina)}
                rowsPerPage={filasPorPaginaPedidos}
                onRowsPerPageChange={e => {
                  setFilasPorPaginaPedidos(parseInt(e.target.value, 10))
                  setPaginaPedidos(0)
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage='Filas por página:'
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </CardContent>
          </Card>

          {/* Diálogo Cerrar pedido - Registrar pago (formas de pago como en la app) */}
          <Dialog open={!!pedidoACerrar} onClose={cerrarDialogoCerrarPedido} maxWidth='sm' fullWidth>
            <DialogTitle>Cerrar pedido - Registrar pago</DialogTitle>
            <DialogContent>
              {pedidoACerrar && (
                <>
                  <DialogContentText sx={{ mb: 2 }}>
                    Pedido <strong>{pedidoACerrar.numeroPedido || pedidoACerrar.id}</strong>
                    {' · '}
                    Cliente: {pedidoACerrar.cliente ? `${(pedidoACerrar.cliente as any).nombre} ${(pedidoACerrar.cliente as any).apellidoPaterno || ''}`.trim() : pedidoACerrar.clienteId}
                    {' · '}
                    Total: <strong>${Number(pedidoACerrar.ventaTotal).toFixed(2)}</strong>
                  </DialogContentText>
                  <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                    Formas de pago (la suma debe coincidir con el total)
                  </Typography>
                  {formasPagoCerrar.map((fp) => (
                    <Box key={fp.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                      <Typography sx={{ minWidth: 140 }}>{fp.nombre || fp.tipo}</Typography>
                      <TextField
                        size='small'
                        type='number'
                        placeholder='Monto'
                        value={pagosCerrarPedido[fp.id]?.monto ?? ''}
                        onChange={(e) =>
                          setPagosCerrarPedido((prev) => ({
                            ...prev,
                            [fp.id]: { ...prev[fp.id], monto: e.target.value }
                          }))
                        }
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 120 }}
                      />
                      <TextField
                        size='small'
                        placeholder='Folio/Ref.'
                        value={pagosCerrarPedido[fp.id]?.referencia ?? ''}
                        onChange={(e) =>
                          setPagosCerrarPedido((prev) => ({
                            ...prev,
                            [fp.id]: { ...prev[fp.id], referencia: e.target.value }
                          }))
                        }
                        sx={{ flex: 1, maxWidth: 140 }}
                      />
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, mt: 2 }}>
                    <Typography sx={{ minWidth: 140 }}>Crédito (opcional)</Typography>
                    <TextField
                      size='small'
                      type='number'
                      placeholder='Monto'
                      value={creditMontoCerrar}
                      onChange={(e) => setCreditMontoCerrar(e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ width: 120 }}
                    />
                  </Box>
                  {errorCerrarPedido && (
                    <Alert severity='error' sx={{ mt: 1 }} onClose={() => setErrorCerrarPedido(null)}>
                      {errorCerrarPedido}
                    </Alert>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={cerrarDialogoCerrarPedido}>Cancelar</Button>
              <Button
                variant='contained'
                onClick={registrarPagoYCerrarPedido}
                disabled={loadingCerrarPedido}
                startIcon={loadingCerrarPedido ? undefined : <CheckCircleIcon />}
              >
                {loadingCerrarPedido ? 'Registrando...' : 'Registrar pago y marcar como entregado'}
              </Button>
            </DialogActions>
          </Dialog>
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
                            <Avatar sx={{ bgcolor: 'primary.main' }}>{index + 1}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim()}
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
                            <Avatar sx={{ bgcolor: 'success.main' }}>{index + 1}</Avatar>
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
                    $
                    {Math.round(
                      clientesAnalisis.reduce((sum, c) => sum + c.ticketPromedio, 0) / clientesAnalisis.length
                    ).toLocaleString()}
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
                    {clientesAnalisis.map(cliente => (
                      <TableRow key={cliente.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {`${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={cliente.ruta?.nombre || 'Sin ruta'} size='small' variant='outlined' />
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
                          <Typography variant='body2'>${cliente.ticketPromedio.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>{cliente.frecuenciaCompra} días</Typography>
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
                    <Avatar sx={{ width: 50, height: 50 }}>{clienteSeleccionado.nombre.charAt(0).toUpperCase()}</Avatar>
                    <Box>
                      <Typography variant='h6'>
                        {clienteSeleccionado.nombre} {clienteSeleccionado.apellidoPaterno}{' '}
                        {clienteSeleccionado.apellidoMaterno || ''}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {clienteSeleccionado.ruta?.nombre || 'Sin ruta'}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setClienteSeleccionado(null)}>×</IconButton>
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
                      {clienteSeleccionado.pedidos.map(pedido => (
                        <TableRow key={pedido.id}>
                          <TableCell>
                            <Typography variant='subtitle2' fontWeight='bold'>
                              {pedido.numeroPedido}
                            </Typography>
                          </TableCell>
                          <TableCell>{new Date(pedido.fechaPedido).toLocaleDateString('es-MX')}</TableCell>
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
                      // Pre-seleccionar el cliente en el formulario
                      setFormularioPedido(prev => ({
                        ...prev,
                        clienteId: clienteSeleccionado.id
                      }))
                      setVistaActual('listado-pedidos')
                      abrirDialogo('pedido')
                    }}
                  >
                    Crear Pedido
                  </Button>
                  <Button variant='outlined' startIcon={<DownloadIcon />}>
                    Generar Reporte
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Modal Crear/Editar Producto */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'producto'} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon />
            {productoSeleccionado ? 'Editar Producto' : 'Nuevo Producto'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Nombre del Producto'
                value={formularioProducto.nombre}
                onChange={e => setFormularioProducto(prev => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formularioProducto.categoriaId}
                  onChange={e => {
                    const nuevaCategoriaId = e.target.value as string
                    const categoriaSeleccionada = categoriasProducto.find(c => c.id === nuevaCategoriaId)
                    setFormularioProducto(prev => {
                      const nuevo = { ...prev, categoriaId: nuevaCategoriaId }
                      // Si cambia a cilindros y hay cantidadKilos, calcular precio automáticamente
                      if (categoriaSeleccionada && (categoriaSeleccionada.codigo === 'cilindros') && prev.cantidadKilos) {
                        nuevo.precio = parseFloat((preciosBase.precioPorKG * prev.cantidadKilos).toFixed(2))
                      }
                      // Si cambia de cilindros a otra categoría, limpiar cantidadKilos
                      const categoriaAnterior = categoriasProducto.find(c => c.id === prev.categoriaId)
                      if (categoriaAnterior && categoriaAnterior.codigo === 'cilindros' && categoriaSeleccionada && categoriaSeleccionada.codigo !== 'cilindros') {
                        nuevo.cantidadKilos = undefined
                      }
                      return nuevo
                    })
                  }}
                  label='Categoría'
                  disabled={productoSeleccionado?.id === 'b9d63c0e-22b5-4022-a359-72657bc127a4'}
                >
                  {categoriasProducto.length === 0 ? (
                    <MenuItem disabled>Cargando categorías...</MenuItem>
                  ) : (
                    categoriasProducto
                      .filter(c => c.activa)
                      .map(categoria => {
                        const productoGasLPExistente = productos.find(
                          p => p.categoriaId === categoria.id && p.id === 'b9d63c0e-22b5-4022-a359-72657bc127a4'
                        )
                        const isGasLP = categoria.codigo === 'gas_lp' || categoria.codigo === 'gas-lp'
                        return (
                          <MenuItem
                            key={categoria.id}
                            value={categoria.id}
                            disabled={!productoSeleccionado && isGasLP && !!productoGasLPExistente}
                          >
                            {categoria.nombre}
                          </MenuItem>
                        )
                      })
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Unidad'
                value={formularioProducto.unidad}
                onChange={e => setFormularioProducto(prev => ({ ...prev, unidad: e.target.value }))}
                required
                placeholder='litro, recarga, pieza, etc.'
              />
            </Grid>
            {(() => {
              const categoriaSeleccionada = categoriasProducto.find(c => c.id === formularioProducto.categoriaId)
              return categoriaSeleccionada && categoriaSeleccionada.codigo === 'cilindros'
            })() && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Cantidad de Kilos'
                  type='number'
                  value={formularioProducto.cantidadKilos || ''}
                  onChange={e => {
                    const cantidadKilos = parseFloat(e.target.value) || 0
                    setFormularioProducto(prev => ({
                      ...prev,
                      cantidadKilos: cantidadKilos > 0 ? cantidadKilos : undefined,
                      precio: cantidadKilos > 0 ? parseFloat((preciosBase.precioPorKG * cantidadKilos).toFixed(2)) : prev.precio
                    }))
                  }}
                  required
                  InputProps={{
                    endAdornment: <Typography sx={{ ml: 1 }}>KG</Typography>
                  }}
                  helperText={`Precio calculado: $${((formularioProducto.cantidadKilos || 0) * preciosBase.precioPorKG).toFixed(2)}`}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={(() => {
              const categoriaSeleccionada = categoriasProducto.find(c => c.id === formularioProducto.categoriaId)
              return categoriaSeleccionada && categoriaSeleccionada.codigo === 'cilindros'
            })() ? 6 : 12}>
              <TextField
                fullWidth
                label='Precio'
                type='number'
                value={formularioProducto.precio}
                onChange={e => setFormularioProducto(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
                required
                disabled={(() => {
                  const categoriaSeleccionada = categoriasProducto.find(c => c.id === formularioProducto.categoriaId)
                  return categoriaSeleccionada && categoriaSeleccionada.codigo === 'cilindros' && formularioProducto.cantidadKilos !== undefined && formularioProducto.cantidadKilos > 0
                })()}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
                helperText={(() => {
                  const categoriaSeleccionada = categoriasProducto.find(c => c.id === formularioProducto.categoriaId)
                  return categoriaSeleccionada && categoriaSeleccionada.codigo === 'cilindros' && formularioProducto.cantidadKilos ? 'Calculado automáticamente' : ''
                })()}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Descripción'
                multiline
                rows={2}
                value={formularioProducto.descripcion}
                onChange={e => setFormularioProducto(prev => ({ ...prev, descripcion: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formularioProducto.activo}
                    onChange={e => setFormularioProducto(prev => ({ ...prev, activo: e.target.checked }))}
                  />
                }
                label='Producto Activo'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button onClick={guardarProducto} variant='contained' startIcon={<AddIcon />}>
            {productoSeleccionado ? 'Actualizar' : 'Crear'} Producto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Gestionar Descuento */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'descuentos'} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {descuentoEditando ? <EditIcon /> : <AddIcon />}
            {descuentoEditando ? 'Editar Descuento' : 'Agregar Descuento por Repartidor'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Repartidor</InputLabel>
                <Select
                  value={formularioDescuento.repartidorId}
                  onChange={(e) => setFormularioDescuento(prev => ({ ...prev, repartidorId: e.target.value }))}
                  label='Repartidor'
                  disabled={!!repartidorSeleccionado || !!descuentoEditando}
                >
                  {repartidores.length === 0 ? (
                    <MenuItem disabled>No hay repartidores disponibles. Cargando...</MenuItem>
                  ) : (
                    repartidores.map(repartidor => {
                      const descuentosDelRepartidor = descuentosRepartidor.filter(d => d.repartidorId === repartidor.id)
                      return (
                        <MenuItem key={repartidor.id} value={repartidor.id}>
                          {repartidor.nombres} {repartidor.apellidoPaterno}
                          {descuentosDelRepartidor.length > 0 && (
                            ` (${descuentosDelRepartidor.length} descuento${descuentosDelRepartidor.length > 1 ? 's' : ''})`
                          )}
                        </MenuItem>
                      )
                    })
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Nombre del Descuento'
                value={formularioDescuento.nombre}
                onChange={e => setFormularioDescuento(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder='Ej: Descuento por volumen, Descuento especial, etc.'
                helperText='Nombre identificador para este descuento (opcional)'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Descripción'
                multiline
                rows={2}
                value={formularioDescuento.descripcion}
                onChange={e => setFormularioDescuento(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder='Descripción opcional del descuento'
                helperText='Descripción adicional del descuento (opcional)'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Descuento Autorizado (%)'
                type='number'
                value={formularioDescuento.descuentoAutorizado}
                onChange={e =>
                  setFormularioDescuento(prev => ({ ...prev, descuentoAutorizado: parseFloat(e.target.value) || 0 }))
                }
                required
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">%</InputAdornment>
                }}
                helperText='Porcentaje máximo de descuento que puede aplicar este repartidor (0-100%)'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Descuento por Litro ($)'
                type='number'
                value={formularioDescuento.descuentoPorLitro}
                onChange={e =>
                  setFormularioDescuento(prev => ({ ...prev, descuentoPorLitro: parseFloat(e.target.value) || 0 }))
                }
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                helperText='Descuento fijo por litro que puede aplicar este repartidor'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button 
            onClick={guardarDescuento} 
            variant='contained' 
            startIcon={descuentoEditando ? <EditIcon /> : <AddIcon />}
            disabled={!formularioDescuento.repartidorId}
          >
            {descuentoEditando ? 'Actualizar Descuento' : 'Crear Descuento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación para Eliminar Descuento */}
      <Dialog open={dialogoEliminar && !!descuentoAEliminar} onClose={() => {
        setDialogoEliminar(false)
        setDescuentoAEliminar(null)
      }}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el descuento del repartidor{' '}
            <strong>
              {repartidores.find(r => r.id === descuentoAEliminar?.repartidorId)?.nombres} {repartidores.find(r => r.id === descuentoAEliminar?.repartidorId)?.apellidoPaterno}
            </strong>
            ? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogoEliminar(false)
            setDescuentoAEliminar(null)
          }} disabled={eliminando}>
            Cancelar
          </Button>
          <Button 
            onClick={eliminarDescuento} 
            color="error" 
            variant="contained" 
            disabled={eliminando}
          >
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Crear Pedido */}
      {/* Diálogo de Detalles del Pedido */}
      <Dialog
        open={dialogoAbierto && tipoDialogo === 'pedido-detalles'}
        onClose={cerrarDialogo}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon />
            <Typography variant='h6'>Detalles del Pedido</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {pedidoSeleccionado && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Información General */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' fontWeight='bold' sx={{ mb: 1 }}>
                  Información General
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>
                  Número de Pedido
                </Typography>
                <Typography variant='body1' fontWeight='bold'>
                  {pedidoSeleccionado.numeroPedido}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={getEstadoLabel(pedidoSeleccionado.estado)}
                    color={getEstadoColor(pedidoSeleccionado.estado) as any}
                    size='small'
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>
                  Fecha y Hora
                </Typography>
                <Typography variant='body1'>
                  {new Date(pedidoSeleccionado.fechaPedido).toLocaleDateString('es-MX')} {pedidoSeleccionado.horaPedido}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>
                  Tipo de Servicio
                </Typography>
                <Typography variant='body1' fontWeight='bold' sx={{ textTransform: 'uppercase' }}>
                  {pedidoSeleccionado.tipoServicio}
                </Typography>
              </Grid>

              {/* Información del Cliente */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' fontWeight='bold' sx={{ mt: 2, mb: 1 }}>
                  Información del Cliente
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {pedidoSeleccionado.cliente ? (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Nombre Completo
                    </Typography>
                    <Typography variant='body1' fontWeight='bold'>
                      {pedidoSeleccionado.cliente.nombre} {pedidoSeleccionado.cliente.apellidoPaterno}{' '}
                      {pedidoSeleccionado.cliente.apellidoMaterno}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Email
                    </Typography>
                    <Typography variant='body1'>{pedidoSeleccionado.cliente.email || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Teléfono
                    </Typography>
                    <Typography variant='body1'>{pedidoSeleccionado.cliente.telefono || 'N/A'}</Typography>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Typography variant='body2' color='text.secondary'>
                    Cliente no disponible
                  </Typography>
                </Grid>
              )}

              {/* Información de Ruta y Repartidor */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' fontWeight='bold' sx={{ mt: 2, mb: 1 }}>
                  Ruta y Repartidor
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>
                  Ruta
                </Typography>
                <Typography variant='body1'>{pedidoSeleccionado.ruta?.nombre || 'Sin asignar'}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>
                  Repartidor
                </Typography>
                {pedidoSeleccionado.repartidor ? (
                  <Typography variant='body1' fontWeight='bold'>
                    {pedidoSeleccionado.repartidor.nombres} {pedidoSeleccionado.repartidor.apellidoPaterno}
                  </Typography>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    Sin asignar
                  </Typography>
                )}
              </Grid>

              {/* Información de Productos y Venta */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' fontWeight='bold' sx={{ mt: 2, mb: 1 }}>
                  Productos del Pedido
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {pedidoSeleccionado.productosPedido && pedidoSeleccionado.productosPedido.length > 0 ? (
                <>
                  <Grid item xs={12}>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align='right'>Cantidad</TableCell>
                            <TableCell align='right'>Precio Unitario</TableCell>
                            <TableCell align='right'>Descuento</TableCell>
                            <TableCell align='right'>Subtotal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pedidoSeleccionado.productosPedido.map((item, index) => {
                            const producto = item.producto
                            const descuentoMonto = typeof item.descuentoMonto === 'number' ? item.descuentoMonto : 0
                            const hasDescuento = descuentoMonto > 0
                            let nombreCategoria = ''
                            if (producto) {
                              const categoriaCodigo = producto.categoria?.codigo || categoriasProducto.find(c => c.id === producto.categoriaId)?.codigo
                              if (categoriaCodigo === 'gas_lp' || categoriaCodigo === 'gas-lp') {
                                nombreCategoria = 'GAS LP'
                              } else if (categoriaCodigo === 'cilindros') {
                                nombreCategoria = 'CILINDROS'
                              } else if (categoriaCodigo === 'tanques_nuevos' || categoriaCodigo === 'tanques-nuevos') {
                                nombreCategoria = 'TANQUES NUEVOS'
                              } else {
                                nombreCategoria = producto.categoria?.nombre || 'OTROS'
                              }
                            }

                            return (
                              <TableRow key={item.id || index}>
                                <TableCell>
                                  <Box>
                                    <Typography variant='body2' fontWeight='bold'>
                                      {producto?.nombre || 'Producto no disponible'}
                                    </Typography>
                                    {nombreCategoria && (
                                      <Typography variant='caption' color='text.secondary'>
                                        {nombreCategoria} - {producto?.unidad || ''}
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell align='right'>
                                  {typeof item.cantidad === 'number' ? item.cantidad.toFixed(2) : item.cantidad} {pedidoSeleccionado.tipoServicio === 'pipas' ? 'L' : ''}
                                </TableCell>
                                <TableCell align='right'>
                                  ${typeof item.precio === 'number' ? item.precio.toFixed(2) : item.precio.toLocaleString()}
                                </TableCell>
                                <TableCell align='right'>
                                  {hasDescuento ? (
                                    <Typography variant='body2' color='success.main'>
                                      {item.descuento || ''} -${descuentoMonto.toFixed(2)}
                                    </Typography>
                                  ) : (
                                    <Typography variant='caption' color='text.secondary'>—</Typography>
                                  )}
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='body2' fontWeight='bold' color='primary'>
                                    ${typeof item.subtotal === 'number' ? item.subtotal.toFixed(2) : item.subtotal.toLocaleString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                          <TableRow>
                            <TableCell colSpan={4} align='right'>
                              <Typography variant='h6' fontWeight='bold'>
                                Total:
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='h6' fontWeight='bold' color='primary'>
                                ${typeof pedidoSeleccionado.ventaTotal === 'number' ? pedidoSeleccionado.ventaTotal.toFixed(2) : pedidoSeleccionado.ventaTotal.toLocaleString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Alert severity='info'>
                    <Typography variant='body2'>
                      Cantidad de Productos: {pedidoSeleccionado.cantidadProductos}
                    </Typography>
                    <Typography variant='h6' color='primary' sx={{ mt: 1 }}>
                      Costo Total: ${pedidoSeleccionado.ventaTotal.toLocaleString()}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                      Los productos individuales no están disponibles para este pedido.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {/* Información de Cálculo de Pipas */}
              {pedidoSeleccionado.tipoServicio === 'pipas' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant='subtitle1' fontWeight='bold' sx={{ mt: 2, mb: 1 }}>
                      Información de Cálculo de Pipas
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    {pedidoSeleccionado.calculoPipas ? (
                      Array.isArray(pedidoSeleccionado.calculoPipas) ? (
                        // Múltiples cargas
                        <Box>
                          <Typography variant='body1' fontWeight='bold' gutterBottom sx={{ mb: 2 }}>
                            Múltiples Cargas ({pedidoSeleccionado.calculoPipas.length})
                          </Typography>
                          {pedidoSeleccionado.calculoPipas.map((calculo: any, index: number) => (
                            <Paper 
                              key={index} 
                              variant='outlined' 
                              sx={{ p: 2, mb: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}
                            >
                              <Typography variant='body1' fontWeight='bold' gutterBottom sx={{ mb: 1 }}>
                                Carga {index + 1} - {calculo.tipoCalculo === 'litros' ? 'Por Cantidad de Litros' :
                                  calculo.tipoCalculo === 'porcentajes' ? 'Por Porcentajes de Llenado' :
                                  calculo.tipoCalculo === 'dinero' ? 'Por Cantidad de Dinero' : 'No especificado'}
                              </Typography>
                              {calculo.tipoCalculo === 'litros' && (
                                <Box sx={{ mt: 1 }}>
                                  <Grid container spacing={1}>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant='body2'><strong>Cantidad de Litros:</strong> {calculo.cantidadLitros?.toFixed(2) || '0.00'} L</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant='body2'><strong>Precio por Litro:</strong> ${calculo.precioPorLitro?.toFixed(2) || '0.00'}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Divider sx={{ my: 1 }} />
                                      <Typography variant='body1' fontWeight='bold' color='success.main'>
                                        Total: ${calculo.totalPorLitros?.toFixed(2) || '0.00'}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                              )}
                              {calculo.tipoCalculo === 'porcentajes' && (
                                <Box sx={{ mt: 1 }}>
                                  <Grid container spacing={1}>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant='body2'><strong>Capacidad del Tanque:</strong> {calculo.capacidadTanque?.toFixed(2) || '0.00'} litros</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant='body2'><strong>Precio por Litro:</strong> ${calculo.precioPorLitro?.toFixed(2) || '0.00'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant='body2'><strong>Porcentaje Inicial:</strong> {calculo.porcentajeInicial?.toFixed(2) || '0.00'}%</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant='body2'><strong>Porcentaje Final:</strong> {calculo.porcentajeFinal?.toFixed(2) || '0.00'}%</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant='body2'><strong>Litros a Llenar:</strong> {calculo.litrosALlenar?.toFixed(2) || '0.00'} L</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Divider sx={{ my: 1 }} />
                                      <Typography variant='body1' fontWeight='bold' color='success.main'>
                                        Total: ${calculo.totalPorPorcentajes?.toFixed(2) || '0.00'}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                              )}
                              {calculo.tipoCalculo === 'dinero' && (
                                <Box sx={{ mt: 1 }}>
                                  <Grid container spacing={1}>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant='body2'><strong>Cantidad de Dinero:</strong> ${calculo.cantidadDinero?.toFixed(2) || '0.00'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant='body2'><strong>Precio por Litro:</strong> ${calculo.precioPorLitro?.toFixed(2) || '0.00'}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Divider sx={{ my: 1 }} />
                                      <Typography variant='body1' fontWeight='bold' color='info.main'>
                                        Litros Calculados: {calculo.litrosPorDinero?.toFixed(2) || '0.00'} L
                                      </Typography>
                                      <Typography variant='body1' fontWeight='bold' color='success.main' sx={{ mt: 1 }}>
                                        Total: ${calculo.cantidadDinero?.toFixed(2) || '0.00'}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                              )}
                            </Paper>
                          ))}
                        </Box>
                      ) : pedidoSeleccionado.calculoPipas.tipoCalculo && pedidoSeleccionado.calculoPipas.tipoCalculo !== 'ninguno' ? (
                        // Una sola carga
                        <Paper variant='outlined' sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                          <Typography variant='body1' fontWeight='bold' gutterBottom sx={{ mb: 2 }}>
                            Método de Cálculo: {
                              pedidoSeleccionado.calculoPipas.tipoCalculo === 'litros' ? 'Por Cantidad de Litros' :
                              pedidoSeleccionado.calculoPipas.tipoCalculo === 'porcentajes' ? 'Por Porcentajes de Llenado' :
                              pedidoSeleccionado.calculoPipas.tipoCalculo === 'dinero' ? 'Por Cantidad de Dinero' : 'No especificado'
                            }
                          </Typography>
                          {pedidoSeleccionado.calculoPipas.tipoCalculo === 'litros' && (
                            <Box>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant='body2'><strong>Cantidad de Litros:</strong> {pedidoSeleccionado.calculoPipas.cantidadLitros?.toFixed(2) || '0.00'} L</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant='body2'><strong>Precio por Litro:</strong> ${pedidoSeleccionado.calculoPipas.precioPorLitro?.toFixed(2) || '0.00'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Divider sx={{ my: 1 }} />
                                  <Typography variant='body1' fontWeight='bold' color='success.main'>
                                    Total: ${pedidoSeleccionado.calculoPipas.totalPorLitros?.toFixed(2) || '0.00'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                          {pedidoSeleccionado.calculoPipas.tipoCalculo === 'porcentajes' && (
                            <Box>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant='body2'><strong>Capacidad del Tanque:</strong> {pedidoSeleccionado.calculoPipas.capacidadTanque?.toFixed(2) || '0.00'} litros</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant='body2'><strong>Precio por Litro:</strong> ${pedidoSeleccionado.calculoPipas.precioPorLitro?.toFixed(2) || '0.00'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant='body2'><strong>Porcentaje Inicial:</strong> {pedidoSeleccionado.calculoPipas.porcentajeInicial?.toFixed(2) || '0.00'}%</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant='body2'><strong>Porcentaje Final:</strong> {pedidoSeleccionado.calculoPipas.porcentajeFinal?.toFixed(2) || '0.00'}%</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant='body2'><strong>Litros a Llenar:</strong> {pedidoSeleccionado.calculoPipas.litrosALlenar?.toFixed(2) || '0.00'} L</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Divider sx={{ my: 1 }} />
                                  <Typography variant='body1' fontWeight='bold' color='success.main'>
                                    Total: ${pedidoSeleccionado.calculoPipas.totalPorPorcentajes?.toFixed(2) || '0.00'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                          {pedidoSeleccionado.calculoPipas.tipoCalculo === 'dinero' && (
                            <Box>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant='body2'><strong>Cantidad de Dinero:</strong> ${pedidoSeleccionado.calculoPipas.cantidadDinero?.toFixed(2) || '0.00'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant='body2'><strong>Precio por Litro:</strong> ${pedidoSeleccionado.calculoPipas.precioPorLitro?.toFixed(2) || '0.00'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Divider sx={{ my: 1 }} />
                                  <Typography variant='body1' fontWeight='bold' color='info.main'>
                                    Litros Calculados: {pedidoSeleccionado.calculoPipas.litrosPorDinero?.toFixed(2) || '0.00'} L
                                  </Typography>
                                  <Typography variant='body1' fontWeight='bold' color='success.main' sx={{ mt: 1 }}>
                                    Total: ${pedidoSeleccionado.calculoPipas.cantidadDinero?.toFixed(2) || '0.00'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        </Paper>
                      ) : (
                        <Alert severity='info'>
                          <Typography variant='body2'>
                            No se especificó un método de cálculo para este pedido.
                          </Typography>
                        </Alert>
                      )
                    ) : (
                      <Alert severity='warning'>
                        <Typography variant='body2'>
                          No hay información de cálculo disponible para este pedido.
                        </Typography>
                      </Alert>
                    )}
                  </Grid>
                </>
              )}

              {/* Observaciones */}
              {pedidoSeleccionado.observaciones && (
                <>
                  <Grid item xs={12}>
                    <Typography variant='subtitle1' fontWeight='bold' sx={{ mt: 2, mb: 1 }}>
                      Observaciones
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Paper variant='outlined' sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant='body2'>{pedidoSeleccionado.observaciones}</Typography>
                    </Paper>
                  </Grid>
                </>
              )}

              {/* Información de Métodos de Pago */}
              {pedidoSeleccionado.pagos && pedidoSeleccionado.pagos.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Typography variant='subtitle1' fontWeight='bold' sx={{ mt: 2, mb: 1 }}>
                      Métodos de Pago
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Método de Pago</TableCell>
                            <TableCell align='right'>Monto</TableCell>
                            <TableCell>Referencia/Folio</TableCell>
                            <TableCell>Tipo</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pedidoSeleccionado.pagos.map((pagoPedido: any, index: number) => (
                            <TableRow key={pagoPedido.id || index}>
                              <TableCell>
                                {pagoPedido.metodo ? (
                                  <Typography variant='body2' fontWeight='bold'>
                                    {pagoPedido.metodo.nombre || pagoPedido.metodo.tipo}
                                  </Typography>
                                ) : (
                                  <Typography variant='body2' fontWeight='bold'>
                                    {pagoPedido.tipo === 'credito' ? 'Crédito' : 'Método de Pago'}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align='right'>
                                <Typography variant='body2' fontWeight='bold' color='primary'>
                                  ${pagoPedido.monto.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant='body2'>
                                  {pagoPedido.folio || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={pagoPedido.tipo === 'credito' ? 'Crédito' : 'Pago'}
                                  color={pagoPedido.tipo === 'credito' ? 'warning' : 'success'}
                                  size='small'
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} align='right'>
                              <Typography variant='body1' fontWeight='bold'>
                                Total Pagado:
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body1' fontWeight='bold' color='primary'>
                                ${pedidoSeleccionado.pagos.reduce((sum: number, p: any) => sum + p.monto, 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  {/* Mostrar Firma si existe (solo para pagos a crédito) */}
                  {pedidoSeleccionado.pagos.some((p: any) => p.tipo === 'credito' && p.firmaCliente) && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant='subtitle1' fontWeight='bold' sx={{ mt: 2, mb: 1 }}>
                          Firma del Cliente (Pago a Crédito)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                      </Grid>
                      <Grid item xs={12}>
                        {pedidoSeleccionado.pagos
                          .filter((p: any) => p.tipo === 'credito' && p.firmaCliente)
                          .map((pago: any, index: number) => (
                            <Box key={index} sx={{ mb: 2 }}>
                              <Paper variant='outlined' sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block' }}>
                                  Firma del cliente para pago a crédito de ${pago.monto.toFixed(2)}
                                </Typography>
                                <Box
                                  component='img'
                                  src={pago.firmaCliente}
                                  alt='Firma del cliente'
                                  sx={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    border: '1px solid #ccc',
                                    borderRadius: 1,
                                    bgcolor: 'white',
                                    p: 1
                                  }}
                                />
                              </Paper>
                            </Box>
                          ))}
                      </Grid>
                    </>
                  )}
                </>
              )}

              {/* Información de Sede */}
              {pedidoSeleccionado.sede && (
                <>
                  <Grid item xs={12}>
                    <Typography variant='subtitle1' fontWeight='bold' sx={{ mt: 2, mb: 1 }}>
                      Sede
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='body1'>{pedidoSeleccionado.sede.nombre}</Typography>
                  </Grid>
                </>
              )}

              {/* Fechas de Creación y Modificación */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' fontWeight='bold' sx={{ mt: 2, mb: 1 }}>
                  Fechas del Sistema
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {pedidoSeleccionado.fechaCreacion && (
                <Grid item xs={12} sm={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Fecha de Creación
                  </Typography>
                  <Typography variant='body2'>
                    {new Date(pedidoSeleccionado.fechaCreacion).toLocaleString('es-MX')}
                  </Typography>
                </Grid>
              )}

              {pedidoSeleccionado.fechaModificacion && (
                <Grid item xs={12} sm={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Última Modificación
                  </Typography>
                  <Typography variant='body2'>
                    {new Date(pedidoSeleccionado.fechaModificacion).toLocaleString('es-MX')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {pedidoSeleccionado && pedidoSeleccionado.estado !== 'entregado' && (
            <Button
              variant='contained'
              color='primary'
              startIcon={<EditIcon />}
              onClick={() => pedidoSeleccionado && abrirDialogoEditarPedido(pedidoSeleccionado)}
            >
              Editar pedido
            </Button>
          )}
          <Button onClick={cerrarDialogo}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogoAbierto && tipoDialogo === 'pedido'} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {pedidoEditando ? <EditIcon /> : <AddIcon />}
            {pedidoEditando ? 'Editar Pedido' : 'Crear Nuevo Pedido'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Cómo cargar el cliente: buscar en BD o por sede y ruta */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                Cargar cliente
              </Typography>
              <FormControl component='fieldset'>
                <RadioGroup
                  row
                  value={modoCargaCliente}
                  onChange={(e) => {
                    setModoCargaCliente(e.target.value as 'buscar' | 'por-ruta')
                    setClienteBuscado(null)
                    manejarCambioFormulario('clienteId', '')
                    if (e.target.value === 'por-ruta' && sedeIdModal && !rutasModal.length) {
                      loadRutasModal(sedeIdModal).then(rutasSede => {
                        const primeraRutaId = rutasSede[0]?.id ?? null
                        setRutaIdModal(primeraRutaId)
                        if (primeraRutaId) loadClientesPorRuta(primeraRutaId)
                      })
                    }
                  }}
                >
                  <FormControlLabel value='buscar' control={<Radio />} label='Buscar por nombre (en BD)' />
                  <FormControlLabel value='por-ruta' control={<Radio />} label='Por sede y ruta' />
                </RadioGroup>
              </FormControl>
            </Grid>

            {modoCargaCliente === 'buscar' && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Autocomplete
                    fullWidth
                    options={clientesBusqueda}
                    value={clienteBuscado}
                    inputValue={busquedaClienteTerm}
                    onInputChange={(_, value) => setBusquedaClienteTerm(value)}
                    onChange={(event, newValue) => {
                      setClienteBuscado(newValue)
                      manejarCambioFormulario('clienteId', newValue?.id || '')
                    }}
                    getOptionLabel={(option) => {
                      const nombreCompleto = `${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno || ''}`.trim()
                      const direccion = `${option.calle} ${option.numeroExterior}, ${option.colonia}`.trim()
                      return `${nombreCompleto} - ${direccion}`
                    }}
                    loading={loadingClientesBusqueda}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Cliente *'
                        placeholder='Buscar por nombre...'
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position='start'>
                                <SearchIcon />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component='li' {...props}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Typography variant='body2' fontWeight='bold'>
                            {option.nombre} {option.apellidoPaterno} {option.apellidoMaterno || ''}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            <LocationOnIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                            {option.calle} {option.numeroExterior}, {option.colonia}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    noOptionsText={busquedaClienteTerm.trim() ? (loadingClientesBusqueda ? 'Buscando...' : 'No se encontraron clientes') : 'Escriba para buscar en la BD'}
                  />
                  <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={() => setMostrarCrearCliente(true)}
                    sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                  >
                    Nuevo
                  </Button>
                </Box>
              </Grid>
            )}

            {modoCargaCliente === 'por-ruta' && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Sede</InputLabel>
                    <Select
                      value={sedeIdModal || ''}
                      label='Sede'
                      onChange={async (e) => {
                        const id = e.target.value as string
                        setSedeIdModal(id || null)
                        setRutaIdModal(null)
                        setClientesPorRuta([])
                        const rutasSede = await loadRutasModal(id || null)
                        const primeraRutaId = rutasSede[0]?.id ?? null
                        setRutaIdModal(primeraRutaId)
                        if (primeraRutaId) loadClientesPorRuta(primeraRutaId)
                      }}
                    >
                      {sedes.map(s => (
                        <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Ruta</InputLabel>
                    <Select
                      value={rutaIdModal || ''}
                      label='Ruta'
                      onChange={(e) => {
                        const id = e.target.value as string
                        setRutaIdModal(id || null)
                        if (id) loadClientesPorRuta(id)
                        else setClientesPorRuta([])
                        setClienteBuscado(null)
                        manejarCambioFormulario('clienteId', '')
                      }}
                    >
                      {rutasModal.map(r => (
                        <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Autocomplete
                      fullWidth
                      size='small'
                      options={clientesPorRuta}
                      value={clienteBuscado && clientesPorRuta.some(c => c.id === clienteBuscado.id) ? clienteBuscado : null}
                      onChange={(event, newValue) => {
                        setClienteBuscado(newValue)
                        manejarCambioFormulario('clienteId', newValue?.id || '')
                      }}
                      getOptionLabel={(option) => {
                        const nombreCompleto = `${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno || ''}`.trim()
                        const direccion = `${option.calle} ${option.numeroExterior}, ${option.colonia}`.trim()
                        return `${nombreCompleto} - ${direccion}`
                      }}
                      filterOptions={(options, { inputValue }) => {
                        const searchTerm = inputValue.toLowerCase()
                        return options.filter(option => {
                          const nombreCompleto = `${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno || ''}`.toLowerCase()
                          const direccion = `${option.calle} ${option.numeroExterior} ${option.colonia}`.toLowerCase()
                          return nombreCompleto.includes(searchTerm) || direccion.includes(searchTerm)
                        })
                      }}
                      loading={loadingClientesPorRuta}
                      disabled={!rutaIdModal}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Cliente *'
                          placeholder='Buscar por nombre o dirección...'
                          required
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position='start'>
                                  <SearchIcon />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component='li' {...props}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <Typography variant='body2' fontWeight='bold'>
                              {option.nombre} {option.apellidoPaterno} {option.apellidoMaterno || ''}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              <LocationOnIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                              {option.calle} {option.numeroExterior}, {option.colonia}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      noOptionsText={loadingClientesPorRuta ? 'Cargando...' : 'No hay clientes en esta ruta'}
                    />
                    <Button
                      variant='outlined'
                      startIcon={<AddIcon />}
                      onClick={() => setMostrarCrearCliente(true)}
                      sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                    >
                      Nuevo
                    </Button>
                  </Box>
                </Grid>
              </>
            )}

            {/* Si estamos editando, mostrar cliente seleccionado cuando no coincide con el modo actual (por si se cambió de modo) */}
            {pedidoEditando && clienteBuscado && modoCargaCliente === 'por-ruta' && !clientesPorRuta.some(c => c.id === clienteBuscado.id) && (
              <Grid item xs={12}>
                <Typography variant='caption' color='text.secondary'>
                  Cliente actual: {clienteBuscado.nombre} {clienteBuscado.apellidoPaterno} {clienteBuscado.apellidoMaterno || ''}
                </Typography>
              </Grid>
            )}

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

            {/* Sección de cálculo para pipas */}
            {formularioPedido.tipoServicio === 'pipas' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                    Método de Cálculo (Opcional)
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={calculoPipas.tipoCalculo}
                      onChange={e => {
                        setCalculoPipas(prev => ({ ...prev, tipoCalculo: e.target.value as any }))
                      }}
                    >
                      <FormControlLabel value="ninguno" control={<Radio />} label="Sin especificar" />
                      <FormControlLabel value="litros" control={<Radio />} label="Por Cantidad de Litros" />
                      <FormControlLabel value="porcentajes" control={<Radio />} label="Por Porcentajes de Llenado" />
                      <FormControlLabel value="dinero" control={<Radio />} label="Por Cantidad de Dinero" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {/* Opción 1: Por Cantidad de Litros */}
                {calculoPipas.tipoCalculo === 'litros' && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Cantidad de Litros'
                        type='number'
                        value={calculoPipas.cantidadLitros || ''}
                        onChange={e => {
                          const cantidadLitros = parseFloat(e.target.value) || 0
                          setCalculoPipas(prev => {
                            const total = cantidadLitros * prev.precioPorLitro
                            return {
                              ...prev,
                              cantidadLitros,
                              totalPorLitros: total
                            }
                          })
                        }}
                        inputProps={{ min: 0, step: 0.1 }}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Precio por Litro ($)'
                        type='number'
                        value={calculoPipas.precioPorLitro || ''}
                        onChange={e => {
                          const precioPorLitro = parseFloat(e.target.value) || 0
                          setCalculoPipas(prev => {
                            const total = prev.cantidadLitros * precioPorLitro
                            return {
                              ...prev,
                              precioPorLitro,
                              totalPorLitros: total
                            }
                          })
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Total Calculado ($)'
                        type='number'
                        value={calculoPipas.totalPorLitros.toFixed(2)}
                        disabled
                        helperText='Total en dinero'
                        sx={{
                          '& .MuiInputBase-input': {
                            fontWeight: 'bold',
                            color: 'success.main'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant='outlined'
                        onClick={() => {
                          const productoGasLP = productos.find(
                            p => {
                              const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                              return (categoriaCodigo === 'gas_lp' || categoriaCodigo === 'gas-lp') && p.id === 'b9d63c0e-22b5-4022-a359-72657bc127a4'
                            }
                          )

                          if (productoGasLP && calculoPipas.cantidadLitros > 0) {
                            const litrosExactos = calculoPipas.cantidadLitros
                            const subtotal = litrosExactos * calculoPipas.precioPorLitro
                            const descripcion = `${litrosExactos.toFixed(2)} litros - Por Cantidad de Litros`
                            
                            // Preparar datos del cálculo
                            const calculoPipasData = {
                              tipoCalculo: calculoPipas.tipoCalculo,
                              cantidadLitros: calculoPipas.cantidadLitros,
                              precioPorLitro: calculoPipas.precioPorLitro,
                              totalPorLitros: calculoPipas.totalPorLitros
                            }
                            
                            // Agregar como nueva carga con ID único
                            const nuevaCargaId = `carga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                            setFormularioPedido(prev => ({
                              ...prev,
                              productos: [
                                ...prev.productos,
                                {
                                  id: nuevaCargaId, // ID único para esta carga
                                  productoId: productoGasLP.id,
                                  cantidad: litrosExactos, // Usar valor exacto, no redondeado
                                  precio: calculoPipas.precioPorLitro,
                                  nombre: productoGasLP.nombre,
                                  litros: litrosExactos,
                                  subtotal: subtotal,
                                  descripcion: descripcion,
                                  calculoPipas: calculoPipasData
                                }
                              ]
                            }))
                            
                            // Resetear el formulario de cálculo para permitir agregar otra carga
                            setCalculoPipas({
                              tipoCalculo: 'ninguno',
                              cantidadLitros: 0,
                              totalPorLitros: 0,
                              capacidadTanque: 0,
                              porcentajeInicial: 0,
                              porcentajeFinal: 100,
                              litrosALlenar: 0,
                              totalPorPorcentajes: 0,
                              cantidadDinero: 0,
                              litrosPorDinero: 0,
                              precioPorLitro: calculoPipas.precioPorLitro // Mantener el precio por litro
                            })
                            alert(`Carga agregada: ${litrosExactos.toFixed(2)} litros a $${calculoPipas.precioPorLitro.toFixed(2)} por litro`)
                          } else {
                            alert('No se encontró el producto de Gas LP o la cantidad de litros es 0')
                          }
                        }}
                        disabled={calculoPipas.cantidadLitros <= 0}
                      >
                        Agregar al Pedido ({calculoPipas.cantidadLitros.toFixed(2)} litros)
                      </Button>
                    </Grid>
                  </>
                )}

                {/* Opción 2: Por Porcentajes de Llenado */}
                {calculoPipas.tipoCalculo === 'porcentajes' && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Capacidad del Tanque (Litros)'
                        type='number'
                        value={calculoPipas.capacidadTanque || ''}
                        onChange={e => {
                          const capacidad = parseFloat(e.target.value) || 0
                          setCalculoPipas(prev => {
                            const litrosALlenar = capacidad * ((prev.porcentajeFinal - prev.porcentajeInicial) / 100)
                            const total = litrosALlenar * prev.precioPorLitro
                            return {
                              ...prev,
                              capacidadTanque: capacidad,
                              litrosALlenar,
                              totalPorPorcentajes: total
                            }
                          })
                        }}
                        inputProps={{ min: 0, step: 0.1 }}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Porcentaje Inicial (%)'
                        type='number'
                        value={calculoPipas.porcentajeInicial || ''}
                        onChange={e => {
                          const porcentajeInicial = parseFloat(e.target.value) || 0
                          setCalculoPipas(prev => {
                            const litrosALlenar = prev.capacidadTanque * ((prev.porcentajeFinal - porcentajeInicial) / 100)
                            const total = litrosALlenar * prev.precioPorLitro
                            return {
                              ...prev,
                              porcentajeInicial,
                              litrosALlenar,
                              totalPorPorcentajes: total
                            }
                          })
                        }}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Porcentaje Final (%)'
                        type='number'
                        value={calculoPipas.porcentajeFinal || ''}
                        onChange={e => {
                          const porcentajeFinal = parseFloat(e.target.value) || 100
                          setCalculoPipas(prev => {
                            const litrosALlenar = prev.capacidadTanque * ((porcentajeFinal - prev.porcentajeInicial) / 100)
                            const total = litrosALlenar * prev.precioPorLitro
                            return {
                              ...prev,
                              porcentajeFinal,
                              litrosALlenar,
                              totalPorPorcentajes: total
                            }
                          })
                        }}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Precio por Litro ($)'
                        type='number'
                        value={calculoPipas.precioPorLitro || ''}
                        onChange={e => {
                          const precioPorLitro = parseFloat(e.target.value) || 0
                          setCalculoPipas(prev => {
                            const total = prev.litrosALlenar * precioPorLitro
                            return {
                              ...prev,
                              precioPorLitro,
                              totalPorPorcentajes: total
                            }
                          })
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Litros a Llenar'
                        type='number'
                        value={calculoPipas.litrosALlenar.toFixed(2)}
                        disabled
                        helperText='Calculado automáticamente'
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Total Calculado ($)'
                        type='number'
                        value={calculoPipas.totalPorPorcentajes.toFixed(2)}
                        disabled
                        helperText='Total en dinero'
                        sx={{
                          '& .MuiInputBase-input': {
                            fontWeight: 'bold',
                            color: 'success.main'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant='outlined'
                        onClick={() => {
                          const productoGasLP = productos.find(
                            p => {
                              const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                              return (categoriaCodigo === 'gas_lp' || categoriaCodigo === 'gas-lp') && p.id === 'b9d63c0e-22b5-4022-a359-72657bc127a4'
                            }
                          )

                          if (productoGasLP && calculoPipas.litrosALlenar > 0) {
                            const litrosExactos = calculoPipas.litrosALlenar
                            const subtotal = litrosExactos * calculoPipas.precioPorLitro
                            const descripcion = `${litrosExactos.toFixed(2)} litros - Por Porcentajes (${calculoPipas.porcentajeInicial}% → ${calculoPipas.porcentajeFinal}%)`
                            
                            // Preparar datos del cálculo
                            const calculoPipasData = {
                              tipoCalculo: calculoPipas.tipoCalculo,
                              capacidadTanque: calculoPipas.capacidadTanque,
                              porcentajeInicial: calculoPipas.porcentajeInicial,
                              porcentajeFinal: calculoPipas.porcentajeFinal,
                              litrosALlenar: calculoPipas.litrosALlenar,
                              precioPorLitro: calculoPipas.precioPorLitro,
                              totalPorPorcentajes: calculoPipas.totalPorPorcentajes
                            }
                            
                            // Agregar como nueva carga con ID único
                            const nuevaCargaId = `carga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                            setFormularioPedido(prev => ({
                              ...prev,
                              productos: [
                                ...prev.productos,
                                {
                                  id: nuevaCargaId, // ID único para esta carga
                                  productoId: productoGasLP.id,
                                  cantidad: litrosExactos, // Usar valor exacto, no redondeado
                                  precio: calculoPipas.precioPorLitro,
                                  nombre: productoGasLP.nombre,
                                  litros: litrosExactos,
                                  subtotal: subtotal,
                                  descripcion: descripcion,
                                  calculoPipas: calculoPipasData
                                }
                              ]
                            }))
                            
                            // Resetear el formulario de cálculo para permitir agregar otra carga
                            setCalculoPipas({
                              tipoCalculo: 'ninguno',
                              cantidadLitros: 0,
                              totalPorLitros: 0,
                              capacidadTanque: 0,
                              porcentajeInicial: 0,
                              porcentajeFinal: 100,
                              litrosALlenar: 0,
                              totalPorPorcentajes: 0,
                              cantidadDinero: 0,
                              litrosPorDinero: 0,
                              precioPorLitro: calculoPipas.precioPorLitro // Mantener el precio por litro
                            })
                            alert(`Carga agregada: ${litrosExactos.toFixed(2)} litros a $${calculoPipas.precioPorLitro.toFixed(2)} por litro`)
                          } else {
                            alert('No se encontró el producto de Gas LP o los litros a llenar son 0')
                          }
                        }}
                        disabled={calculoPipas.litrosALlenar <= 0}
                      >
                        Agregar al Pedido ({calculoPipas.litrosALlenar.toFixed(2)} litros)
                      </Button>
                    </Grid>
                  </>
                )}

                {/* Opción 3: Por Cantidad de Dinero */}
                {calculoPipas.tipoCalculo === 'dinero' && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Cantidad de Dinero ($)'
                        type='number'
                        value={calculoPipas.cantidadDinero || ''}
                        onChange={e => {
                          const cantidadDinero = parseFloat(e.target.value) || 0
                          setCalculoPipas(prev => {
                            const litros = cantidadDinero / prev.precioPorLitro
                            return {
                              ...prev,
                              cantidadDinero,
                              litrosPorDinero: litros
                            }
                          })
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Precio por Litro ($)'
                        type='number'
                        value={calculoPipas.precioPorLitro || ''}
                        onChange={e => {
                          const precioPorLitro = parseFloat(e.target.value) || 0
                          setCalculoPipas(prev => {
                            const litros = prev.cantidadDinero / precioPorLitro
                            return {
                              ...prev,
                              precioPorLitro,
                              litrosPorDinero: litros
                            }
                          })
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label='Litros Calculados'
                        type='number'
                        value={calculoPipas.litrosPorDinero.toFixed(2)}
                        disabled
                        helperText='Calculado automáticamente'
                        sx={{
                          '& .MuiInputBase-input': {
                            fontWeight: 'bold',
                            color: 'info.main'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant='outlined'
                        onClick={() => {
                          const productoGasLP = productos.find(
                            p => {
                              const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                              return (categoriaCodigo === 'gas_lp' || categoriaCodigo === 'gas-lp') && p.id === 'b9d63c0e-22b5-4022-a359-72657bc127a4'
                            }
                          )

                          if (productoGasLP && calculoPipas.litrosPorDinero > 0) {
                            const litrosExactos = calculoPipas.litrosPorDinero
                            const subtotal = calculoPipas.cantidadDinero
                            const descripcion = `${litrosExactos.toFixed(2)} litros - Por Cantidad de Dinero ($${calculoPipas.cantidadDinero.toFixed(2)})`
                            
                            // Preparar datos del cálculo
                            const calculoPipasData = {
                              tipoCalculo: calculoPipas.tipoCalculo,
                              cantidadDinero: calculoPipas.cantidadDinero,
                              precioPorLitro: calculoPipas.precioPorLitro,
                              litrosPorDinero: calculoPipas.litrosPorDinero
                            }
                            
                            // Agregar como nueva carga con ID único
                            const nuevaCargaId = `carga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                            setFormularioPedido(prev => ({
                              ...prev,
                              productos: [
                                ...prev.productos,
                                {
                                  id: nuevaCargaId, // ID único para esta carga
                                  productoId: productoGasLP.id,
                                  cantidad: litrosExactos, // Usar valor exacto, no redondeado
                                  precio: calculoPipas.precioPorLitro,
                                  nombre: productoGasLP.nombre,
                                  litros: litrosExactos,
                                  subtotal: subtotal,
                                  descripcion: descripcion,
                                  calculoPipas: calculoPipasData
                                }
                              ]
                            }))
                            
                            // Resetear el formulario de cálculo para permitir agregar otra carga
                            setCalculoPipas({
                              tipoCalculo: 'ninguno',
                              cantidadLitros: 0,
                              totalPorLitros: 0,
                              capacidadTanque: 0,
                              porcentajeInicial: 0,
                              porcentajeFinal: 100,
                              litrosALlenar: 0,
                              totalPorPorcentajes: 0,
                              cantidadDinero: 0,
                              litrosPorDinero: 0,
                              precioPorLitro: calculoPipas.precioPorLitro // Mantener el precio por litro
                            })
                            alert(`Carga agregada: ${litrosExactos.toFixed(2)} litros a $${calculoPipas.precioPorLitro.toFixed(2)} por litro (Total: $${calculoPipas.cantidadDinero.toFixed(2)})`)
                          } else {
                            alert('No se encontró el producto de Gas LP o la cantidad de dinero es 0')
                          }
                        }}
                        disabled={calculoPipas.litrosPorDinero <= 0}
                      >
                        Agregar al Pedido ({calculoPipas.litrosPorDinero.toFixed(2)} litros)
                      </Button>
                    </Grid>
                  </>
                )}
              </>
            )}

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

            {/* Sección para agregar productos */}
            <Grid item xs={12}>
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                Agregar Productos al Pedido
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Categoría del Catálogo</InputLabel>
                <Select
                  value={productoAgregar.categoriaFiltro}
                  onChange={e => {
                    setProductoAgregar(prev => ({ ...prev, categoriaFiltro: e.target.value, productoId: '' }))
                  }}
                  label='Categoría del Catálogo'
                >
                  <MenuItem value=''>Todas las categorías</MenuItem>
                  {categoriasProducto
                    .filter(c => c.activa)
                    .map(categoria => (
                      <MenuItem key={categoria.id} value={categoria.codigo}>
                        {categoria.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Producto</InputLabel>
                <Select
                  value={productoAgregar.productoId}
                  onChange={e => setProductoAgregar(prev => ({ ...prev, productoId: e.target.value }))}
                  label='Producto'
                  disabled={!productoAgregar.categoriaFiltro}
                >
                  {productos.length === 0 ? (
                    <MenuItem disabled>No hay productos disponibles. Cargando...</MenuItem>
                  ) : (
                    productos
                      .filter(p => {
                        // Filtrar por categoría del catálogo si está seleccionada
                        if (productoAgregar.categoriaFiltro) {
                          const categoriaCodigo = p.categoria?.codigo || categoriasProducto.find(c => c.id === p.categoriaId)?.codigo
                          if (categoriaCodigo !== productoAgregar.categoriaFiltro) return false
                        }
                        return p.activo
                      })
                      .sort((a, b) => {
                        // Ordenar por nombre
                        return a.nombre.localeCompare(b.nombre)
                      })
                      .map(producto => {
                        // Obtener el nombre de la categoría para mostrar
                        let nombreCategoria = ''
                        const categoriaCodigo = producto.categoria?.codigo || categoriasProducto.find(c => c.id === producto.categoriaId)?.codigo
                        if (categoriaCodigo === 'gas_lp' || categoriaCodigo === 'gas-lp') {
                          nombreCategoria = 'GAS LP'
                        } else if (categoriaCodigo === 'cilindros') {
                          nombreCategoria = 'CILINDROS'
                        } else if (categoriaCodigo === 'tanques_nuevos' || categoriaCodigo === 'tanques-nuevos') {
                          nombreCategoria = 'TANQUES NUEVOS'
                        } else {
                          nombreCategoria = producto.categoria?.nombre || 'OTROS'
                        }

                        return (
                          <MenuItem key={producto.id} value={producto.id}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                              <Typography variant='body2' fontWeight='bold'>
                                {producto.nombre}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {nombreCategoria} - ${producto.precio.toLocaleString()} / {producto.unidad}
                              </Typography>
                            </Box>
                          </MenuItem>
                        )
                      })
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label='Cantidad'
                type='number'
                value={productoAgregar.cantidad}
                onChange={e => setProductoAgregar(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant='contained'
                startIcon={<AddIcon />}
                onClick={() => {
                  if (!productoAgregar.productoId) {
                    alert('Debe seleccionar un producto')
                    return
                  }

                  const producto = productos.find(p => p.id === productoAgregar.productoId)
                  if (!producto) {
                    alert('Producto no encontrado')
                    return
                  }

                  // Verificar si el producto ya está en la lista
                  const existe = formularioPedido.productos.find(p => p.productoId === productoAgregar.productoId)
                  if (existe) {
                    alert(
                      'Este producto ya está en el pedido. Puede modificar la cantidad eliminándolo y agregándolo nuevamente.'
                    )
                    return
                  }

                  // Agregar producto a la lista
                  setFormularioPedido(prev => ({
                    ...prev,
                    productos: [
                      ...prev.productos,
                      {
                        productoId: productoAgregar.productoId,
                        cantidad: productoAgregar.cantidad,
                        precio: producto.precio, // Precio del catálogo
                        nombre: producto.nombre
                      }
                    ]
                  }))

                  // Resetear el formulario de agregar producto
                  setProductoAgregar({
                    productoId: '',
                    cantidad: 1,
                    categoriaFiltro: productoAgregar.categoriaFiltro // Mantener el filtro de categoría
                  })
                }}
                sx={{ height: '100%' }}
              >
                Agregar
              </Button>
            </Grid>

            {/* Lista de productos agregados */}
            {formularioPedido.productos.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold' }}>
                    Productos en el Pedido ({formularioPedido.productos.length})
                  </Typography>
                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Producto</TableCell>
                          <TableCell align='right'>Cantidad</TableCell>
                          <TableCell align='right'>Precio Unitario</TableCell>
                          <TableCell align='right'>Subtotal</TableCell>
                          <TableCell align='center'>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formularioPedido.productos.map((item, index) => {
                          const producto = productos.find(p => p.id === item.productoId)
                          const subtotal = item.subtotal || (item.precio * item.cantidad)
                          const cantidad = item.litros || item.cantidad
                          const metodoCalculo = item.calculoPipas?.tipoCalculo
                            ? (item.calculoPipas.tipoCalculo === 'litros' ? 'Por Litros' :
                               item.calculoPipas.tipoCalculo === 'porcentajes' ? 'Por Porcentajes' :
                               item.calculoPipas.tipoCalculo === 'dinero' ? 'Por Dinero' : '')
                            : ''
                          return (
                            <TableRow key={item.id || index}>
                              <TableCell>
                                <Typography variant='body2' fontWeight='bold'>
                                  {item.nombre || producto?.nombre || 'N/A'}
                                </Typography>
                                {item.descripcion && (
                                  <Typography variant='caption' color='text.secondary' display='block'>
                                    {item.descripcion}
                                  </Typography>
                                )}
                                {metodoCalculo && (
                                  <Typography variant='caption' color='primary' display='block' sx={{ mt: 0.5 }}>
                                    Método: {metodoCalculo}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align='right'>
                                {typeof cantidad === 'number' ? cantidad.toFixed(2) : cantidad} {formularioPedido.tipoServicio === 'pipas' ? 'L' : producto?.unidad || ''}
                              </TableCell>
                              <TableCell align='right'>
                                ${item.precio ? (typeof item.precio === 'number' ? item.precio.toFixed(2) : String(item.precio)) : '0.00'}
                              </TableCell>
                              <TableCell align='right'>
                                <Typography variant='body2' fontWeight='bold' color='primary'>
                                  ${subtotal ? (typeof subtotal === 'number' ? subtotal.toFixed(2) : String(subtotal)) : '0.00'}
                                </Typography>
                              </TableCell>
                              <TableCell align='center'>
                                <IconButton
                                  size='small'
                                  color='error'
                                  onClick={() => {
                                    setFormularioPedido(prev => ({
                                      ...prev,
                                      productos: prev.productos.filter(p => (p.id || '') !== (item.id || ''))
                                    }))
                                  }}
                                >
                                  <DeleteIcon fontSize='small' />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow>
                          <TableCell colSpan={3} align='right'>
                            <Typography variant='h6' fontWeight='bold'>
                              Total:
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='h6' fontWeight='bold' color='primary'>
                              $
                              {formularioPedido.productos
                                .reduce((sum, item) => sum + (item.subtotal || (item.precio * item.cantidad)), 0)
                                .toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Asignar a Repartidor</InputLabel>
                <Select
                  value={formularioPedido.repartidorId}
                  onChange={e => manejarCambioFormulario('repartidorId', e.target.value)}
                  label='Asignar a Repartidor'
                >
                  <MenuItem value=''>Sin asignar</MenuItem>
                  {repartidores
                    .filter(r => r.estado === 'activo' && r.tipoRepartidor === formularioPedido.tipoServicio)
                    .map(repartidor => (
                      <MenuItem key={repartidor.id} value={repartidor.id}>
                        {repartidor.nombres} {repartidor.apellidoPaterno} - {repartidor.tipoRepartidor}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Observaciones'
                multiline
                rows={2}
                value={formularioPedido.observaciones}
                onChange={e => manejarCambioFormulario('observaciones', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button
            onClick={crearPedido}
            variant='contained'
            startIcon={pedidoEditando ? <EditIcon /> : <AddIcon />}
          >
            {pedidoEditando ? 'Guardar cambios' : 'Crear Pedido'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Crear Cliente Rápido */}
      <Dialog open={mostrarCrearCliente} onClose={() => setMostrarCrearCliente(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            <Typography variant='h6'>Crear Cliente Rápido</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Nombre *'
                value={formularioClienteRapido.nombre}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Apellido Paterno *'
                value={formularioClienteRapido.apellidoPaterno}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, apellidoPaterno: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Apellido Materno'
                value={formularioClienteRapido.apellidoMaterno}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, apellidoMaterno: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ruta</InputLabel>
                <Select
                  value={formularioClienteRapido.rutaId}
                  onChange={e => {
                    const id = e.target.value as string
                    const ruta = rutas.find(r => r.id === id)
                    const zonaId = ruta?.zonaId || (ruta as any)?.zonaRelacion?.id || ''
                    setFormularioClienteRapido(prev => ({ ...prev, rutaId: id, zonaId }))
                  }}
                  label='Ruta'
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 'min(400px, 60vh)',
                        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
                      },
                    },
                  }}
                >
                  <MenuItem value=''>Sin ruta</MenuItem>
                  {rutas
                    .filter(r => r.activa)
                    .map(ruta => (
                      <MenuItem key={ruta.id} value={ruta.id}>
                        {ruta.nombre} ({ruta.codigo})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant='caption' color='text.secondary'>
                  Dirección
                </Typography>
              </Divider>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label='Calle *'
                value={formularioClienteRapido.calle}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, calle: e.target.value }))}
                required
                placeholder='Nombre de la calle'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Número Exterior'
                value={formularioClienteRapido.numeroExterior}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, numeroExterior: e.target.value }))}
                placeholder='S/N'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Colonia'
                value={formularioClienteRapido.colonia}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, colonia: e.target.value }))}
                placeholder='Colonia o zona'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMostrarCrearCliente(false)}>Cancelar</Button>
          <Button onClick={crearClienteRapido} variant='contained' startIcon={<AddIcon />}>
            Crear Cliente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Crear Cliente Rápido */}
      <Dialog open={mostrarCrearCliente} onClose={() => setMostrarCrearCliente(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            <Typography variant='h6'>Crear Cliente Rápido</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Nombre *'
                value={formularioClienteRapido.nombre}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Apellido Paterno *'
                value={formularioClienteRapido.apellidoPaterno}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, apellidoPaterno: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Apellido Materno'
                value={formularioClienteRapido.apellidoMaterno}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, apellidoMaterno: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ruta</InputLabel>
                <Select
                  value={formularioClienteRapido.rutaId}
                  onChange={e => {
                    const id = e.target.value as string
                    const ruta = rutas.find(r => r.id === id)
                    const zonaId = ruta?.zonaId || (ruta as any)?.zonaRelacion?.id || ''
                    setFormularioClienteRapido(prev => ({ ...prev, rutaId: id, zonaId }))
                  }}
                  label='Ruta'
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 'min(400px, 60vh)',
                        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
                      },
                    },
                  }}
                >
                  <MenuItem value=''>Sin ruta</MenuItem>
                  {rutas
                    .filter(r => r.activa)
                    .map(ruta => (
                      <MenuItem key={ruta.id} value={ruta.id}>
                        {ruta.nombre} ({ruta.codigo})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant='caption' color='text.secondary'>
                  Dirección
                </Typography>
              </Divider>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label='Calle *'
                value={formularioClienteRapido.calle}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, calle: e.target.value }))}
                required
                placeholder='Nombre de la calle'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Número Exterior'
                value={formularioClienteRapido.numeroExterior}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, numeroExterior: e.target.value }))}
                placeholder='S/N'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Colonia'
                value={formularioClienteRapido.colonia}
                onChange={e => setFormularioClienteRapido(prev => ({ ...prev, colonia: e.target.value }))}
                placeholder='Colonia o zona'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMostrarCrearCliente(false)}>Cancelar</Button>
          <Button onClick={crearClienteRapido} variant='contained' startIcon={<AddIcon />}>
            Crear Cliente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación para Eliminar Pedido */}
      <Dialog open={dialogoEliminar} onClose={cerrarDialogoEliminar}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el pedido{' '}
            <strong>
              {pedidoAEliminar ? pedidoAEliminar.numeroPedido : ''}
            </strong>
            ? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoEliminar} disabled={eliminando}>
            Cancelar
          </Button>
          <Button 
            onClick={eliminarPedido} 
            color="error" 
            variant="contained" 
            disabled={eliminando}
          >
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vista de Categorías de Productos */}
      {vistaActual === 'categorias' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Gestión de Categorías de Productos
          </Typography>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h6' gutterBottom>
                  Categorías
                </Typography>
                <Button
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => abrirDialogo('categoria')}
                >
                  Nueva Categoría
                </Button>
              </Box>

              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Código</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align='center'>Productos</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoriasProducto.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
                            No hay categorías disponibles
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      categoriasProducto.map(categoria => (
                        <TableRow key={categoria.id}>
                          <TableCell>
                            <Typography variant='subtitle2'>{categoria.nombre}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={categoria.codigo} size='small' variant='outlined' />
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' color='text.secondary'>
                              {categoria.descripcion || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align='center'>
                            <Typography variant='body2'>
                              {categoria._count?.productos || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align='center'>
                            <Chip
                              label={categoria.activa ? 'Activa' : 'Inactiva'}
                              color={categoria.activa ? 'success' : 'default'}
                              size='small'
                            />
                          </TableCell>
                          <TableCell align='center'>
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title='Editar categoría'>
                                <IconButton size='small' onClick={() => abrirDialogo('categoria', categoria)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Eliminar categoría'>
                                <IconButton
                                  size='small'
                                  color='error'
                                  onClick={() => {
                                    setCategoriaSeleccionada(categoria)
                                    setDialogoEliminar(true)
                                  }}
                                  disabled={(categoria._count?.productos || 0) > 0}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Modal Crear/Editar Categoría */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'categoria'} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon />
            {categoriaSeleccionada ? 'Editar Categoría' : 'Nueva Categoría'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Nombre de la Categoría'
                value={formularioCategoria.nombre}
                onChange={e => setFormularioCategoria(prev => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Código'
                value={formularioCategoria.codigo}
                onChange={e => setFormularioCategoria(prev => ({ ...prev, codigo: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                required
                helperText='Código único para identificar la categoría (se convertirá a minúsculas y guiones bajos)'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Descripción'
                multiline
                rows={2}
                value={formularioCategoria.descripcion}
                onChange={e => setFormularioCategoria(prev => ({ ...prev, descripcion: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formularioCategoria.activa}
                    onChange={e => setFormularioCategoria(prev => ({ ...prev, activa: e.target.checked }))}
                  />
                }
                label='Categoría Activa'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button onClick={guardarCategoria} variant='contained' startIcon={<AddIcon />}>
            {categoriaSeleccionada ? 'Actualizar' : 'Crear'} Categoría
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación para Eliminar Categoría */}
      <Dialog open={dialogoEliminar && !!categoriaSeleccionada && tipoDialogo !== 'descuentos'} onClose={() => {
        setDialogoEliminar(false)
        setCategoriaSeleccionada(null)
      }}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar la categoría{' '}
            <strong>{categoriaSeleccionada?.nombre}</strong>?
            {categoriaSeleccionada && (categoriaSeleccionada._count?.productos || 0) > 0 && (
              <Typography variant='body2' color='error' sx={{ mt: 1 }}>
                Esta categoría tiene productos asociados y no se puede eliminar.
              </Typography>
            )}
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogoEliminar(false)
            setCategoriaSeleccionada(null)
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={eliminarCategoria} 
            color="error" 
            variant="contained" 
            disabled={eliminando || (categoriaSeleccionada?._count?.productos || 0) > 0}
          >
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Ver / Descargar ticket de venta */}
      <Dialog
        open={dialogoTicketAbierto}
        onClose={() => {
          setDialogoTicketAbierto(false)
          setPedidoParaTicket(null)
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          Ticket de venta {pedidoParaTicket?.numeroPedido ?? ''}
        </DialogTitle>
        <DialogContent>
          {loadingTicket ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <LinearProgress sx={{ width: '100%' }} />
            </Box>
          ) : htmlTicket ? (
            <Box sx={{ maxHeight: '70vh', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
              <iframe
                title='Vista previa del ticket (80 mm)'
                srcDoc={htmlTicket}
                style={{
                  width: '80mm',
                  maxWidth: '100%',
                  minHeight: '500px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 4
                }}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogoTicketAbierto(false)
              setPedidoParaTicket(null)
            }}
          >
            Cerrar
          </Button>
          <Button
            variant='contained'
            startIcon={<DownloadIcon />}
            onClick={descargarTicketPdf}
            disabled={!htmlTicket}
          >
            Descargar PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
