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
  type Cliente,
  type Usuario,
  type Producto,
  type Pedido,
  type ResumenVentas,
  type CorteRepartidor,
  type DescuentoRepartidor,
  type CreateProductoRequest,
  type CreatePedidoRequest,
  type Sede
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
  DialogContentText,
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
  LocationOn as LocationOnIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'

// Tipos locales
interface FiltrosPedidos {
  fechaDesde: string
  fechaHasta: string
  cliente: string
  tipoCliente: string
  zona: string
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
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'catalogo' | 'listado-pedidos' | 'analisis-clientes'>(
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
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [clientesAnalisis, setClientesAnalisis] = useState<ClienteAnalisis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de UI
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'precios' | 'descuentos' | 'pedido' | 'producto' | 'pedido-detalles'>(
    'precios'
  )
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<Usuario | null>(null)
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null)
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
    clienteId: '',
    tipoServicio: 'pipas' as 'pipas' | 'cilindros',
    horario: '',
    prioridad: 'normal' as 'normal' | 'urgente',
    repartidorId: '',
    observaciones: '',
    productos: [] as Array<{ productoId: string; cantidad: number; precio: number; nombre?: string }>
  })

  const [productoAgregar, setProductoAgregar] = useState({
    productoId: '',
    cantidad: 1,
    categoriaFiltro: '' // Filtro por categoría del catálogo
  })

  const [formularioProducto, setFormularioProducto] = useState<CreateProductoRequest>({
    nombre: '',
    categoria: 'gas_lp',
    precio: 0,
    unidad: '',
    descripcion: '',
    activo: true
    // No incluir sedeId - los productos son para todas las sedes
  })

  const [formularioDescuento, setFormularioDescuento] = useState({
    repartidorId: '',
    descuentoAutorizado: 0
  })

  // Estados para el modal de eliminación
  const [eliminando, setEliminando] = useState(false)
  const [dialogoEliminar, setDialogoEliminar] = useState(false)
  const [pedidoAEliminar, setPedidoAEliminar] = useState<Pedido | null>(null)

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
      loadDescuentos()
    } else if (vistaActual === 'listado-pedidos') {
      loadClientes()
      loadRepartidores()
      loadPedidos()
    } else if (vistaActual === 'analisis-clientes') {
      loadClientesAnalisis()
    }
  }, [vistaActual, sedeId])

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
      setProductos(data)
      console.log('Productos cargados:', data.length, data)
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

  const loadRepartidores = async () => {
    try {
      if (!sedeId) {
        console.warn('No hay sedeId, no se pueden cargar repartidores')
        setRepartidores([])
        return
      }

      // Asegurarse de que las sedes estén cargadas
      if (sedes.length === 0) {
        console.warn('Las sedes no están cargadas aún, esperando...')
        const sedesData = await sedesAPI.getAll()
        setSedes(sedesData)

        // Buscar el nombre de la sede
        const sedeEncontrada = sedesData.find(s => s.id === sedeId)
        const sedeNombre = sedeEncontrada?.nombre

        if (!sedeNombre) {
          console.error('No se encontró el nombre de la sede para el ID:', sedeId, 'Sedes disponibles:', sedesData)
          setRepartidores([])
          return
        }

        // Filtrar repartidores por sede y rol desde el backend
        const data = await usuariosAPI.getAll({
          rol: 'repartidor',
          estado: 'activo',
          sede: sedeNombre
        })

        console.log('Repartidores cargados (con sedes recargadas):', data.length, data)
        setRepartidores(data)
        return
      }

      // Debug: verificar sedeId antes de cargar repartidores
      console.log('Cargando repartidores para sedeId:', sedeId)
      console.log(
        'Sedes disponibles:',
        sedes.map(s => ({ id: s.id, nombre: s.nombre }))
      )

      // Obtener el nombre de la sede para el filtro
      // El campo 'sede' en Usuario es un string que almacena el nombre de la sede (ej: "SEDE 2")
      const sedeEncontrada = sedes.find(s => s.id === sedeId)
      const sedeNombre = sedeEncontrada?.nombre

      if (!sedeNombre) {
        console.error('No se encontró el nombre de la sede para el ID:', sedeId)
        console.error('SedeId buscado:', sedeId)
        console.error('Sedes disponibles:', sedes)
        setRepartidores([])
        return
      }

      console.log('Buscando repartidores con sede:', sedeNombre)

      // Filtrar repartidores por sede y rol desde el backend
      // El backend busca por el campo 'sede' que es un string (nombre de sede como "SEDE 2")
      const data = await usuariosAPI.getAll({
        rol: 'repartidor',
        estado: 'activo',
        sede: sedeNombre // Usar el nombre de la sede, no el ID
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

  const loadPedidos = async () => {
    try {
      console.log('Cargando pedidos con sedeId:', sedeId)

      const filtros: any = {
        sedeId: sedeId || undefined
      }
      if (filtrosPedidos.fechaDesde) filtros.fechaDesde = filtrosPedidos.fechaDesde
      if (filtrosPedidos.fechaHasta) filtros.fechaHasta = filtrosPedidos.fechaHasta
      if (filtrosPedidos.estado) filtros.estado = filtrosPedidos.estado

      console.log('Filtros enviados:', filtros)

      const data = await pedidosAPI.getAll(filtros)

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

  const abrirDialogo = async (tipo: 'precios' | 'descuentos' | 'pedido' | 'producto', item?: any) => {
    setTipoDialogo(tipo)
    if (tipo === 'producto' && item) {
      setProductoSeleccionado(item)
      setFormularioProducto({
        nombre: item.nombre,
        categoria: item.categoria,
        precio: item.precio,
        unidad: item.unidad,
        descripcion: item.descripcion,
        activo: item.activo
        // No incluir sedeId - los productos del catálogo son para todas las sedes
      })
    } else if (tipo === 'descuentos' && item) {
      setRepartidorSeleccionado(item)
      const descuento = descuentosRepartidor.find(d => d.repartidorId === item.id)
      setFormularioDescuento({
        repartidorId: item.id,
        descuentoAutorizado: descuento?.descuentoAutorizado || 0
      })
    } else if (tipo === 'pedido') {
      // Cargar productos, clientes y repartidores cuando se abre el diálogo de pedido
      console.log('Abriendo diálogo de pedido, cargando datos...')
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
      console.log('Productos disponibles:', productos.length)
    }
    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setProductoSeleccionado(null)
    setRepartidorSeleccionado(null)
    setPedidoSeleccionado(null)
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
    setFormularioProducto({
      nombre: '',
      categoria: 'gas_lp',
      precio: 0,
      unidad: '',
      descripcion: '',
      activo: true
      // No incluir sedeId - los productos del catálogo son para todas las sedes
    })
  }

  const abrirDialogoEliminar = (pedido: Pedido) => {
    setPedidoAEliminar(pedido)
    setDialogoEliminar(true)
  }

  const cerrarDialogoEliminar = () => {
    setDialogoEliminar(false)
    setPedidoAEliminar(null)
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

  const crearPedido = async () => {
    try {
      if (!formularioPedido.clienteId) {
        alert('Debe seleccionar un cliente')
        return
      }

      if (formularioPedido.productos.length === 0) {
        alert('Debe agregar al menos un producto al pedido')
        return
      }

      const ahora = new Date()
      const data: CreatePedidoRequest = {
        clienteId: formularioPedido.clienteId,
        tipoServicio: formularioPedido.tipoServicio,
        horaPedido: formularioPedido.horario || ahora.toTimeString().slice(0, 5),
        fechaPedido: ahora.toISOString().split('T')[0],
        repartidorId: formularioPedido.repartidorId || undefined,
        observaciones: formularioPedido.observaciones || undefined,
        sedeId: sedeId || undefined, // Incluir la sede del usuario
        productos: formularioPedido.productos.map(p => ({
          productoId: p.productoId,
          cantidad: p.cantidad,
          precio: p.precio // Precio del catálogo (ya viene del catálogo)
        }))
      }

      await pedidosAPI.create(data)
      alert('Pedido creado exitosamente')
      cerrarDialogo()
      if (vistaActual === 'listado-pedidos') {
        loadPedidos()
      }
    } catch (err: any) {
      alert('Error al crear pedido: ' + (err.message || 'Error desconocido'))
      console.error('Error creating pedido:', err)
    }
  }

  const guardarProducto = async () => {
    try {
      // Normalizar categoría: convertir guiones a guiones bajos para el backend
      // Asegurar que el precio sea un número
      // Los productos del catálogo NO tienen sede asignada (son para todas las sedes)
      const datosProducto: CreateProductoRequest = {
        nombre: formularioProducto.nombre,
        categoria: formularioProducto.categoria.replace(/-/g, '_') as any,
        precio:
          typeof formularioProducto.precio === 'string'
            ? parseFloat(formularioProducto.precio.replace(/[^0-9.]/g, '')) || 0
            : formularioProducto.precio,
        unidad: formularioProducto.unidad,
        descripcion: formularioProducto.descripcion || undefined,
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
      const descuentoExistente = descuentosRepartidor.find(d => d.repartidorId === formularioDescuento.repartidorId)
      if (descuentoExistente) {
        await descuentosRepartidorAPI.update(descuentoExistente.id, {
          descuentoAutorizado: formularioDescuento.descuentoAutorizado
        })
        alert('Descuento actualizado exitosamente')
      } else {
        await descuentosRepartidorAPI.create({
          repartidorId: formularioDescuento.repartidorId,
          descuentoAutorizado: formularioDescuento.descuentoAutorizado,
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
    const cumpleFechaDesde = !filtrosPedidos.fechaDesde || pedido.fechaPedido >= filtrosPedidos.fechaDesde
    const cumpleFechaHasta = !filtrosPedidos.fechaHasta || pedido.fechaPedido <= filtrosPedidos.fechaHasta
    const nombreCliente = pedido.cliente?.nombre || pedido.cliente?.apellidoPaterno || ''
    const cumpleCliente =
      !filtrosPedidos.cliente || nombreCliente.toLowerCase().includes(filtrosPedidos.cliente.toLowerCase())
    const cumpleZona = !filtrosPedidos.zona || pedido.zona === filtrosPedidos.zona
    const cumpleEstado = !filtrosPedidos.estado || pedido.estado === filtrosPedidos.estado
    const cumpleMostrarTodos = filtrosPedidos.mostrarTodos || pedido.estado !== 'cancelado'

    return cumpleFechaDesde && cumpleFechaHasta && cumpleCliente && cumpleZona && cumpleEstado && cumpleMostrarTodos
  })

  const zonasUnicas = [...new Set(pedidos.map(p => p.zona).filter(Boolean))]
  const rutasUnicas = [...new Set(pedidos.map(p => p.ruta?.nombre).filter(Boolean))]

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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h4' component='h1'>
          Sistema de Ventas
        </Typography>
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
        {!esSuperAdministrador && sedeId && vistaActual !== 'catalogo' && (
          <Chip
            label={`Sede: ${sedes.find(s => s.id === sedeId)?.nombre || 'N/A'}`}
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
                          categoria: 'gas_lp',
                          precio: 0,
                          unidad: '',
                          descripcion: '',
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
                            .filter(p => p.categoria === 'gas_lp' || p.categoria === 'gas-lp')
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
                                  <Tooltip title='Editar producto'>
                                    <IconButton size='small' onClick={() => abrirDialogo('producto', producto)}>
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
                                  <Tooltip title='Editar producto'>
                                    <IconButton size='small' onClick={() => abrirDialogo('producto', producto)}>
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
                            .filter(p => p.categoria === 'tanques_nuevos' || p.categoria === 'tanques-nuevos')
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
                                  <Tooltip title='Editar producto'>
                                    <IconButton size='small' onClick={() => abrirDialogo('producto', producto)}>
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
                        {repartidores.map(repartidor => {
                          const descuento = descuentosRepartidor.find(d => d.repartidorId === repartidor.id)
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
                              <TableCell align='right'>
                                <Typography variant='h6' color='success.main'>
                                  ${descuento?.descuentoAutorizado || 0}
                                </Typography>
                              </TableCell>
                              <TableCell align='center'>
                                <Tooltip title='Gestionar descuentos'>
                                  <IconButton size='small' onClick={() => abrirDialogo('descuentos', repartidor)}>
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          )
                        })}
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
                      value={filtrosPedidos.zona}
                      onChange={e => manejarCambioFiltros('zona', e.target.value)}
                      label='Ruta'
                    >
                      <MenuItem value=''>Todas las rutas</MenuItem>
                      {zonasUnicas.map(zona => (
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
                    <Button variant='contained' startIcon={<SearchIcon />} onClick={loadPedidos}>
                      Buscar
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        setFiltrosPedidos({
                          fechaDesde: '',
                          fechaHasta: '',
                          cliente: '',
                          tipoCliente: '',
                          zona: '',
                          estado: '',
                          mostrarTodos: false
                        })
                        loadPedidos()
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
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fecha y Hora</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                      <TableCell align='right'>Costo</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pedidosFiltrados.map(pedido => (
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
                  value={formularioProducto.categoria}
                  onChange={e => setFormularioProducto(prev => ({ ...prev, categoria: e.target.value as any }))}
                  label='Categoría'
                >
                  <MenuItem value='gas_lp'>Gas LP</MenuItem>
                  <MenuItem value='cilindros'>Cilindros</MenuItem>
                  <MenuItem value='tanques_nuevos'>Tanques Nuevos</MenuItem>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Precio'
                type='number'
                value={formularioProducto.precio}
                onChange={e => setFormularioProducto(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
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
            <EditIcon />
            Gestionar Descuento por Repartidor
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Repartidor'
                value={
                  repartidorSeleccionado
                    ? `${repartidorSeleccionado.nombres} ${repartidorSeleccionado.apellidoPaterno}`
                    : ''
                }
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Descuento Autorizado ($)'
                type='number'
                value={formularioDescuento.descuentoAutorizado}
                onChange={e =>
                  setFormularioDescuento(prev => ({ ...prev, descuentoAutorizado: parseFloat(e.target.value) || 0 }))
                }
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
                helperText='Monto máximo de descuento que puede aplicar este repartidor'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button onClick={guardarDescuento} variant='contained' startIcon={<EditIcon />}>
            Guardar Descuento
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
                            <TableCell align='right'>Subtotal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pedidoSeleccionado.productosPedido.map((item, index) => {
                            const producto = item.producto
                            let nombreCategoria = ''
                            if (producto) {
                              if (producto.categoria === 'gas_lp' || producto.categoria === 'gas-lp') {
                                nombreCategoria = 'GAS LP'
                              } else if (producto.categoria === 'cilindros') {
                                nombreCategoria = 'CILINDROS'
                              } else if (
                                producto.categoria === 'tanques_nuevos' ||
                                producto.categoria === 'tanques-nuevos'
                              ) {
                                nombreCategoria = 'TANQUES NUEVOS'
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
                                <TableCell align='right'>{item.cantidad}</TableCell>
                                <TableCell align='right'>${item.precio.toLocaleString()}</TableCell>
                                <TableCell align='right'>
                                  <Typography variant='body2' fontWeight='bold' color='primary'>
                                    ${item.subtotal.toLocaleString()}
                                  </Typography>
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
                                ${pedidoSeleccionado.ventaTotal.toLocaleString()}
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
          <Button onClick={cerrarDialogo}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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
              <FormControl fullWidth required>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={formularioPedido.clienteId}
                  onChange={e => manejarCambioFormulario('clienteId', e.target.value)}
                  label='Cliente'
                >
                  {clientes.map(cliente => (
                    <MenuItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  <MenuItem value='gas_lp'>GAS LP</MenuItem>
                  <MenuItem value='cilindros'>CILINDROS</MenuItem>
                  <MenuItem value='tanques_nuevos'>TANQUES NUEVOS</MenuItem>
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
                          if (productoAgregar.categoriaFiltro === 'gas_lp') {
                            if (p.categoria !== 'gas_lp' && p.categoria !== 'gas-lp') return false
                          } else if (productoAgregar.categoriaFiltro === 'cilindros') {
                            if (p.categoria !== 'cilindros') return false
                          } else if (productoAgregar.categoriaFiltro === 'tanques_nuevos') {
                            if (p.categoria !== 'tanques_nuevos' && p.categoria !== 'tanques-nuevos') return false
                          }
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
                        if (producto.categoria === 'gas_lp' || producto.categoria === 'gas-lp') {
                          nombreCategoria = 'GAS LP'
                        } else if (producto.categoria === 'cilindros') {
                          nombreCategoria = 'CILINDROS'
                        } else if (producto.categoria === 'tanques_nuevos' || producto.categoria === 'tanques-nuevos') {
                          nombreCategoria = 'TANQUES NUEVOS'
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
                          const subtotal = item.precio * item.cantidad
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant='body2' fontWeight='bold'>
                                  {item.nombre || producto?.nombre || 'N/A'}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {producto?.unidad || ''}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>{item.cantidad}</TableCell>
                              <TableCell align='right'>${item.precio.toLocaleString()}</TableCell>
                              <TableCell align='right'>
                                <Typography variant='body2' fontWeight='bold' color='primary'>
                                  ${subtotal.toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell align='center'>
                                <IconButton
                                  size='small'
                                  color='error'
                                  onClick={() => {
                                    setFormularioPedido(prev => ({
                                      ...prev,
                                      productos: prev.productos.filter((_, i) => i !== index)
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
                                .reduce((sum, item) => sum + item.precio * item.cantidad, 0)
                                .toLocaleString()}
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
          <Button onClick={crearPedido} variant='contained' startIcon={<AddIcon />}>
            Crear Pedido
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
    </Box>
  )
}
