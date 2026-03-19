'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import {
  clientesAPI,
  rutasAPI,
  authAPI,
  sedesAPI,
  zonasAPI,
  type Cliente as ClienteAPI,
  type Domicilio as DomicilioAPI,
  type Ruta,
  type Usuario,
  type Sede,
  type Zona,
  type Municipio,
  type Ciudad
} from '@/lib/api'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
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
  Grid,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  CircularProgress,
  Pagination,
  Stack
} from '@mui/material'
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CreditCard as CreditCardIcon,
  History as HistoryIcon,
  Phone as PhoneIcon,
  AttachFile as AttachFileIcon,
  Save as SaveIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import MapLocationPicker from '@/components/MapLocationPicker'
import { getClientesCache, setClientesCache, getClientesLastUpdate, formatRelativeTime } from '@/lib/clientesCache'
import { normalizarParaBusqueda, coincideBusqueda } from '@/lib/searchUtils'

// Tipos de datos
interface Domicilio {
  id: string
  tipo: 'principal' | 'facturacion' | 'entrega' | 'otro'
  calle: string
  numeroExterior: string
  numeroInterior?: string
  colonia: string
  municipio: string
  estado: string
  codigoPostal: string
  referencia?: string
  latitud?: number | null
  longitud?: number | null
  activo: boolean
  codigoQR: string
  fechaCreacionQR: string
}

interface Cliente {
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  telefono: string
  telefonoSecundario?: string
  calle: string
  numeroExterior: string
  numeroInterior?: string
  colonia: string
  municipio: string
  estado: string
  codigoPostal: string
  rfc?: string
  curp?: string
  ruta: string
  zona?: string | Zona
  limiteCredito: number
  saldoActual: number
  pagosEspecialesAutorizados: boolean
  fechaRegistro: string
  ultimaModificacion: string
  estadoCliente: 'activo' | 'suspendido' | 'inactivo'
  domicilios?: Domicilio[]
}

// Datos específicos de México
const estadosMexico = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'México',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas'
]

// Coordenadas de los estados de México (centro aproximado de cada estado)
const coordenadasEstados: Record<string, [number, number]> = {
  'Aguascalientes': [21.8853, -102.2916],
  'Baja California': [30.8406, -115.2838],
  'Baja California Sur': [24.1426, -110.3128],
  'Campeche': [19.8301, -90.5349],
  'Chiapas': [16.7569, -93.1292],
  'Chihuahua': [28.6353, -106.0889],
  'Ciudad de México': [19.4326, -99.1332],
  'Coahuila': [27.0586, -101.7068],
  'Colima': [19.2452, -103.7241],
  'Durango': [24.0277, -104.6538],
  'Guanajuato': [21.0160, -101.2574],
  'Guerrero': [17.4392, -99.5451],
  'Hidalgo': [20.0911, -98.7624],
  'Jalisco': [20.6597, -103.3496],
  'México': [19.4969, -99.7233],
  'Michoacán': [19.4326, -101.7068],
  'Morelos': [18.6813, -99.1013],
  'Nayarit': [21.7514, -104.8455],
  'Nuevo León': [25.6866, -100.3161],
  'Oaxaca': [17.0732, -96.7266],
  'Puebla': [19.0414, -98.2063],
  'Querétaro': [20.5888, -100.3899],
  'Quintana Roo': [19.1817, -88.4791],
  'San Luis Potosí': [22.1565, -100.9855],
  'Sinaloa': [24.8047, -107.3949],
  'Sonora': [29.0892, -110.9613],
  'Tabasco': [18.0000, -92.9000],
  'Tamaulipas': [23.7364, -99.1418],
  'Tlaxcala': [19.3186, -98.2378],
  'Veracruz': [19.1738, -96.1342],
  'Yucatán': [20.6843, -89.0943],
  'Zacatecas': [22.7709, -102.5832]
}

const rutasMexico = [
  'Ruta Centro',
  'Ruta Norte',
  'Ruta Sur',
  'Ruta Occidente',
  'Ruta Oriente',
  'Ruta Sureste',
  'Ruta Noreste',
  'Ruta Noroeste',
  'Ruta Suroeste'
]

// Función para generar códigos QR únicos
const generarCodigoQR = (clienteId: string, domicilioId: string): string => {
  const prefijo = clienteId.padStart(3, '0')
  const sufijo = domicilioId.split('-')[1] || 'A'
  return `QR${prefijo}${sufijo}`
}

// Función para generar fecha de creación de QR
const generarFechaQR = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Contenido del QR domicilio = id del domicilio (para que la app reconozca el domicilio al escanear)
const generarContenidoQRDomicilio = (domicilio: Domicilio): string => domicilio.id

// Contenido del QR general del cliente = id del cliente
const generarContenidoQRCliente = (cliente: Cliente): string => cliente.id

// Datos de ejemplo (ya no se usan, se cargan del servidor)
const clientesEjemplo: Cliente[] = [
  {
    id: '1',
    nombre: 'María',
    apellidoPaterno: 'González',
    apellidoMaterno: 'Pérez',
    email: 'maria.gonzalez@email.com',
    telefono: '55-1234-5678',
    telefonoSecundario: '55-9876-5432',
    calle: 'Av. Insurgentes Sur',
    numeroExterior: '123',
    numeroInterior: 'A',
    colonia: 'Roma Norte',
    municipio: 'Cuauhtémoc',
    estado: 'Ciudad de México',
    codigoPostal: '06700',
    rfc: 'GOPM850315ABC',
    curp: 'GOPM850315MDFNXR01',
    ruta: 'Ruta Centro',
    limiteCredito: 50000,
    saldoActual: 15000,
    pagosEspecialesAutorizados: true,
    fechaRegistro: '2024-01-15',
    ultimaModificacion: '2024-01-20',
    estadoCliente: 'activo',
    domicilios: [
      {
        id: '1-1',
        tipo: 'principal',
        calle: 'Av. Insurgentes Sur',
        numeroExterior: '123',
        numeroInterior: 'A',
        colonia: 'Roma Norte',
        municipio: 'Cuauhtémoc',
        estado: 'Ciudad de México',
        codigoPostal: '06700',
        referencia: 'Entre calles Álvaro Obregón y Orizaba',
        activo: true,
        codigoQR: 'QR0011',
        fechaCreacionQR: '2024-01-15'
      },
      {
        id: '1-2',
        tipo: 'facturacion',
        calle: 'Calle Orizaba',
        numeroExterior: '45',
        colonia: 'Roma Norte',
        municipio: 'Cuauhtémoc',
        estado: 'Ciudad de México',
        codigoPostal: '06700',
        referencia: 'Oficina contable',
        activo: true,
        codigoQR: 'QR0012',
        fechaCreacionQR: '2024-01-15'
      },
      {
        id: '1-3',
        tipo: 'entrega',
        calle: 'Av. Chapultepec',
        numeroExterior: '789',
        numeroInterior: 'B',
        colonia: 'Condesa',
        municipio: 'Cuauhtémoc',
        estado: 'Ciudad de México',
        codigoPostal: '06140',
        referencia: 'Bodega de almacén',
        activo: true,
        codigoQR: 'QR0013',
        fechaCreacionQR: '2024-01-15'
      },
      {
        id: '1-4',
        tipo: 'otro',
        calle: 'Calle Álvaro Obregón',
        numeroExterior: '567',
        colonia: 'Roma Norte',
        municipio: 'Cuauhtémoc',
        estado: 'Ciudad de México',
        codigoPostal: '06700',
        referencia: 'Oficina de ventas',
        activo: true,
        codigoQR: 'QR0014',
        fechaCreacionQR: '2024-01-20'
      }
    ]
  },
  {
    id: '2',
    nombre: 'Carlos',
    apellidoPaterno: 'Rodríguez',
    apellidoMaterno: 'López',
    email: 'carlos.rodriguez@email.com',
    telefono: '33-9876-5432',
    calle: 'Calle Morelos',
    numeroExterior: '456',
    colonia: 'Centro',
    municipio: 'Guadalajara',
    estado: 'Jalisco',
    codigoPostal: '44100',
    rfc: 'ROLC780512XYZ',
    ruta: 'Ruta Occidente',
    limiteCredito: 30000,
    saldoActual: 25000,
    pagosEspecialesAutorizados: false,
    fechaRegistro: '2024-01-10',
    ultimaModificacion: '2024-01-18',
    estadoCliente: 'activo',
    domicilios: [
      {
        id: '2-1',
        tipo: 'principal',
        calle: 'Calle Morelos',
        numeroExterior: '456',
        colonia: 'Centro',
        municipio: 'Guadalajara',
        estado: 'Jalisco',
        codigoPostal: '44100',
        referencia: 'Cerca del mercado',
        activo: true,
        codigoQR: 'QR0021',
        fechaCreacionQR: '2024-01-10'
      },
      {
        id: '2-2',
        tipo: 'entrega',
        calle: 'Av. López Mateos',
        numeroExterior: '1234',
        colonia: 'Americana',
        municipio: 'Guadalajara',
        estado: 'Jalisco',
        codigoPostal: '44160',
        referencia: 'Negocio familiar',
        activo: true,
        codigoQR: 'QR0022',
        fechaCreacionQR: '2024-01-10'
      },
      {
        id: '2-3',
        tipo: 'facturacion',
        calle: 'Calle Libertad',
        numeroExterior: '789',
        colonia: 'Centro',
        municipio: 'Guadalajara',
        estado: 'Jalisco',
        codigoPostal: '44100',
        referencia: 'Contador público',
        activo: true,
        codigoQR: 'QR0023',
        fechaCreacionQR: '2024-01-12'
      },
      {
        id: '2-4',
        tipo: 'otro',
        calle: 'Av. Vallarta',
        numeroExterior: '2345',
        colonia: 'Americana',
        municipio: 'Guadalajara',
        estado: 'Jalisco',
        codigoPostal: '44160',
        referencia: 'Bodega secundaria',
        activo: false,
        codigoQR: 'QR0024',
        fechaCreacionQR: '2024-01-15'
      }
    ]
  },
  {
    id: '3',
    nombre: 'Ana',
    apellidoPaterno: 'Martínez',
    apellidoMaterno: 'Silva',
    email: 'ana.martinez@email.com',
    telefono: '81-5555-1234',
    calle: 'Blvd. López Mateos',
    numeroExterior: '789',
    colonia: 'Del Valle',
    municipio: 'Monterrey',
    estado: 'Nuevo León',
    codigoPostal: '66220',
    rfc: 'MASL920825DEF',
    ruta: 'Ruta Norte',
    limiteCredito: 75000,
    saldoActual: 0,
    pagosEspecialesAutorizados: true,
    fechaRegistro: '2024-01-05',
    ultimaModificacion: '2024-01-22',
    estadoCliente: 'activo',
    domicilios: [
      {
        id: '3-1',
        tipo: 'principal',
        calle: 'Blvd. López Mateos',
        numeroExterior: '789',
        colonia: 'Del Valle',
        municipio: 'Monterrey',
        estado: 'Nuevo León',
        codigoPostal: '66220',
        referencia: 'Casa principal',
        activo: true,
        codigoQR: 'QR0031',
        fechaCreacionQR: '2024-01-05'
      },
      {
        id: '3-2',
        tipo: 'entrega',
        calle: 'Av. Constitución',
        numeroExterior: '1234',
        colonia: 'Centro',
        municipio: 'Monterrey',
        estado: 'Nuevo León',
        codigoPostal: '64000',
        referencia: 'Oficina comercial',
        activo: true,
        codigoQR: 'QR0032',
        fechaCreacionQR: '2024-01-08'
      },
      {
        id: '3-3',
        tipo: 'facturacion',
        calle: 'Calle Hidalgo',
        numeroExterior: '567',
        colonia: 'Centro',
        municipio: 'Monterrey',
        estado: 'Nuevo León',
        codigoPostal: '64000',
        referencia: 'Servicios contables',
        activo: true,
        codigoQR: 'QR0033',
        fechaCreacionQR: '2024-01-10'
      }
    ]
  },
  {
    id: '4',
    nombre: 'Roberto',
    apellidoPaterno: 'Hernández',
    apellidoMaterno: 'García',
    email: 'roberto.hernandez@email.com',
    telefono: '222-4567-8901',
    calle: 'Av. Reforma',
    numeroExterior: '321',
    colonia: 'Centro',
    municipio: 'Puebla',
    estado: 'Puebla',
    codigoPostal: '72000',
    rfc: 'HERG670310GHI',
    ruta: 'Ruta Sur',
    limiteCredito: 40000,
    saldoActual: 35000,
    pagosEspecialesAutorizados: true,
    fechaRegistro: '2024-01-12',
    ultimaModificacion: '2024-01-25',
    estadoCliente: 'suspendido',
    domicilios: [
      {
        id: '4-1',
        tipo: 'principal',
        calle: 'Av. Reforma',
        numeroExterior: '321',
        colonia: 'Centro',
        municipio: 'Puebla',
        estado: 'Puebla',
        codigoPostal: '72000',
        referencia: 'Oficina principal',
        activo: true,
        codigoQR: 'QR0041',
        fechaCreacionQR: '2024-01-12'
      },
      {
        id: '4-2',
        tipo: 'facturacion',
        calle: 'Calle 5 de Mayo',
        numeroExterior: '123',
        colonia: 'Centro',
        municipio: 'Puebla',
        estado: 'Puebla',
        codigoPostal: '72000',
        referencia: 'Contador',
        activo: true,
        codigoQR: 'QR0042',
        fechaCreacionQR: '2024-01-12'
      },
      {
        id: '4-3',
        tipo: 'entrega',
        calle: 'Av. Juárez',
        numeroExterior: '456',
        colonia: 'La Paz',
        municipio: 'Puebla',
        estado: 'Puebla',
        codigoPostal: '72160',
        referencia: 'Bodega',
        activo: false,
        codigoQR: 'QR0043',
        fechaCreacionQR: '2024-01-15'
      },
      {
        id: '4-4',
        tipo: 'otro',
        calle: 'Calle 16 de Septiembre',
        numeroExterior: '789',
        colonia: 'Centro',
        municipio: 'Puebla',
        estado: 'Puebla',
        codigoPostal: '72000',
        referencia: 'Sucursal comercial',
        activo: true,
        codigoQR: 'QR0044',
        fechaCreacionQR: '2024-01-18'
      },
      {
        id: '4-5',
        tipo: 'entrega',
        calle: 'Blvd. Atlixco',
        numeroExterior: '2345',
        colonia: 'San Manuel',
        municipio: 'Puebla',
        estado: 'Puebla',
        codigoPostal: '72520',
        referencia: 'Almacén principal',
        activo: true,
        codigoQR: 'QR0045',
        fechaCreacionQR: '2024-01-20'
      }
    ]
  },
  {
    id: '5',
    nombre: 'Patricia',
    apellidoPaterno: 'López',
    apellidoMaterno: 'Morales',
    email: 'patricia.lopez@email.com',
    telefono: '999-2345-6789',
    calle: 'Calle 60',
    numeroExterior: '654',
    colonia: 'Centro',
    municipio: 'Mérida',
    estado: 'Yucatán',
    codigoPostal: '97000',
    rfc: 'LOMR880715JKL',
    ruta: 'Ruta Sureste',
    limiteCredito: 60000,
    saldoActual: 12000,
    pagosEspecialesAutorizados: false,
    fechaRegistro: '2024-01-08',
    ultimaModificacion: '2024-01-19',
    estadoCliente: 'activo',
    domicilios: [
      {
        id: '5-1',
        tipo: 'principal',
        calle: 'Calle 60',
        numeroExterior: '654',
        colonia: 'Centro',
        municipio: 'Mérida',
        estado: 'Yucatán',
        codigoPostal: '97000',
        referencia: 'Casa familiar',
        activo: true,
        codigoQR: 'QR0051',
        fechaCreacionQR: '2024-01-08'
      },
      {
        id: '5-2',
        tipo: 'entrega',
        calle: 'Calle 47',
        numeroExterior: '321',
        colonia: 'Centro',
        municipio: 'Mérida',
        estado: 'Yucatán',
        codigoPostal: '97000',
        referencia: 'Tienda',
        activo: true,
        codigoQR: 'QR0052',
        fechaCreacionQR: '2024-01-08'
      },
      {
        id: '5-3',
        tipo: 'facturacion',
        calle: 'Calle 65',
        numeroExterior: '987',
        colonia: 'Centro',
        municipio: 'Mérida',
        estado: 'Yucatán',
        codigoPostal: '97000',
        referencia: 'Oficina administrativa',
        activo: true,
        codigoQR: 'QR0053',
        fechaCreacionQR: '2024-01-10'
      },
      {
        id: '5-4',
        tipo: 'otro',
        calle: 'Av. Itzáes',
        numeroExterior: '456',
        colonia: 'Centro',
        municipio: 'Mérida',
        estado: 'Yucatán',
        codigoPostal: '97000',
        referencia: 'Bodega de productos',
        activo: true,
        codigoQR: 'QR0054',
        fechaCreacionQR: '2024-01-12'
      }
    ]
  }
]

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [rutasFiltradas, setRutasFiltradas] = useState<Ruta[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [sedeSeleccionada, setSedeSeleccionada] = useState<string | null>(null)
  const [sedeId, setSedeId] = useState<string | null>(null)
  const [zonas, setZonas] = useState<Zona[]>([])
  const [zonasFiltradas, setZonasFiltradas] = useState<Zona[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSede, setLoadingSede] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<
    'importar' | 'agregar' | 'editar' | 'credito' | 'historial' | 'detalles'
  >('agregar')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [formularioCliente, setFormularioCliente] = useState<Partial<Cliente>>({})
  const [domiciliosAdicionales, setDomiciliosAdicionales] = useState<Partial<Domicilio>[]>([])
  const [latitudPrincipal, setLatitudPrincipal] = useState<number | null>(null)
  const [longitudPrincipal, setLongitudPrincipal] = useState<number | null>(null)
  const [centroMapa, setCentroMapa] = useState<[number, number] | null>(null)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [progresoImportacion, setProgresoImportacion] = useState(0)
  const [importando, setImportando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [dialogoEliminar, setDialogoEliminar] = useState(false)
  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null)
  const [modalQR, setModalQR] = useState(false)
  const [qrDataURL, setQrDataURL] = useState<string>('')
  const [domicilioQR, setDomicilioQR] = useState<Domicilio | null>(null)
  const [modalQRCliente, setModalQRCliente] = useState(false)
  const [qrDataURLCliente, setQrDataURLCliente] = useState<string>('')
  
  // Estados de paginación
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [rutaFiltroId, setRutaFiltroId] = useState<string>('')
  const [lastClientesUpdate, setLastClientesUpdate] = useState<string | null>(null)
  const [refreshingClientes, setRefreshingClientes] = useState(false)

  // Modal de selección de ruta
  const [modalSeleccionRuta, setModalSeleccionRuta] = useState(false)
  const [rutaSeleccionadaModal, setRutaSeleccionadaModal] = useState<string>('')
  const [rutasModal, setRutasModal] = useState<Ruta[]>([])
  const [loadingRutasModal, setLoadingRutasModal] = useState(false)
  const [sedeNombreModal, setSedeNombreModal] = useState<string>('')
  const [busquedaRuta, setBusquedaRuta] = useState<string>('')

  const esSuperAdministrador = usuario?.rol === 'superAdministrador'

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Ajustar la página si está fuera de rango
  useEffect(() => {
    const totalPages = Math.ceil(clientes.length / rowsPerPage)
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages)
    }
  }, [clientes.length, rowsPerPage, page])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      // Obtener usuario autenticado
      const user = await authAPI.getProfile()
      setUsuario(user)

      // Cargar sedes
      const sedesData = await sedesAPI.getAll()
      setSedes(sedesData)

      // Resolver sede: puede venir como ID (UUID) o como nombre
      let sedeUsuarioId: string | null = null
      if (user.sede) {
        const sedeEncontrada = sedesData.find(
          s => s.id === user.sede || s.nombre === user.sede || (typeof user.sede === 'string' && s.nombre.toUpperCase() === user.sede.toUpperCase())
        )
        sedeUsuarioId = sedeEncontrada?.id ?? null
      }

      // Solo superAdministrador puede elegir sede; Administrador y Gestor solo ven su sede asignada
      const nuevaSedeId = user.rol === 'superAdministrador'
        ? (sedeUsuarioId || sedesData[0]?.id || null)
        : sedeUsuarioId
      setSedeId(nuevaSedeId)
      setSedeSeleccionada(nuevaSedeId)

      if (!nuevaSedeId) {
        setLoading(false)
        return
      }

      // Cargar rutas de la sede para mostrar en el modal
      setLoadingRutasModal(true)
      const sedeNombre = sedesData.find(s => s.id === nuevaSedeId)?.nombre ?? ''
      setSedeNombreModal(sedeNombre)
      const rutasData = await rutasAPI.getAll({ sedeId: nuevaSedeId })
      const rutasActivas = rutasData.filter(r => r.activa)
      setRutasModal(rutasActivas)
      setRutas(rutasData)
      setRutasFiltradas(rutasData)
      setLoadingRutasModal(false)
      setLoading(false)

      // Mostrar modal de selección de ruta
      setModalSeleccionRuta(true)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos iniciales')
      console.error('Error loading initial data:', err)
      setLoading(false)
    }
  }

  const cargarDatos = async (background = false, rutaIdForzada?: string) => {
    try {
      if (!background) setLoading(true)
      else setRefreshingClientes(true)
      setError(null)
      const filtros: any = {}
      if (sedeId) {
        filtros.sedeId = sedeId
      }
      // Filtrar clientes por la ruta seleccionada en el modal si corresponde
      const rutaParaFiltrar = rutaIdForzada ?? rutaFiltroId
      if (rutaParaFiltrar && rutaParaFiltrar !== 'todas') {
        filtros.rutaId = rutaParaFiltrar
      }
      const [clientesData, rutasData, zonasData, ciudadesData] = await Promise.all([
        clientesAPI.getAll(filtros),
        rutasAPI.getAll({ sedeId: sedeId ?? undefined }),
        zonasAPI.getAll(),
        zonasAPI.ciudades.getAll()
      ])
      setClientes(clientesData.map(adaptarCliente))
      setRutas(rutasData)
      setRutasFiltradas(rutasData)
      setZonas(zonasData)
      setZonasFiltradas(zonasData)
      setCiudades(ciudadesData)
      setClientesCache(sedeId, clientesData)
      setLastClientesUpdate(getClientesLastUpdate(sedeId))
      setPage(1)

      // Establecer el filtro de ruta al seleccionado en el modal
      if (rutaParaFiltrar) {
        setRutaFiltroId(rutaParaFiltrar)
      } else {
        setRutaFiltroId(prev => {
          if (!prev) {
            const rutasActivas = rutasData.filter(r => r.activa)
            if (rutasActivas.length > 0) return rutasActivas[0].id
            if (rutasData.length > 0) return rutasData[0].id
            return 'todas'
          }
          if (prev !== 'todas' && !rutasData.some(r => r.id === prev)) {
            const rutasActivas = rutasData.filter(r => r.activa)
            if (rutasActivas.length > 0) return rutasActivas[0].id
            if (rutasData.length > 0) return rutasData[0].id
            return 'todas'
          }
          return prev
        })
      }
    } catch (err: any) {
      if (!background) setError(err.message || 'Error al cargar datos')
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
      setLoadingSede(false)
      setRefreshingClientes(false)
    }
  }

  // Confirmar selección de ruta desde el modal
  const confirmarSeleccionRuta = async () => {
    setModalSeleccionRuta(false)
    setBusquedaRuta('')
    const rutaId = rutaSeleccionadaModal || 'todas'
    setRutaFiltroId(rutaId)
    await cargarDatos(false, rutaId)
  }
  
  // Cargar zonas cuando cambia el estado seleccionado
  const cargarMunicipiosPorEstado = async (estado: string) => {
    if (!estado) {
      setMunicipios([])
      setZonasFiltradas([])
      return
    }
    
    try {
      // Buscar las ciudades por estado
      const ciudadesDelEstado = ciudades.filter(c => c.estado === estado && c.activa)
      
      if (ciudadesDelEstado.length > 0) {
        // Cargar municipios de todas las ciudades del estado
        const municipiosPromises = ciudadesDelEstado.map(ciudad => zonasAPI.municipios.getAll(ciudad.id))
        const municipiosArrays = await Promise.all(municipiosPromises)
        const todosLosMunicipios = municipiosArrays.flat().filter(m => m.activo)
        setMunicipios(todosLosMunicipios)
        
        // Cargar zonas de todos los municipios
        const zonasPromises = todosLosMunicipios.map(municipio => zonasAPI.getAll(municipio.id))
        const zonasArrays = await Promise.all(zonasPromises)
        const todasLasZonas = zonasArrays.flat()
        setZonasFiltradas(todasLasZonas.filter(z => z.activa))
      } else {
        setMunicipios([])
        setZonasFiltradas([])
      }
    } catch (err: any) {
      console.error('Error cargando municipios y zonas:', err)
      setMunicipios([])
      setZonasFiltradas([])
    }
  }
  
  // Filtrar rutas cuando cambia la zona seleccionada
  const filtrarRutasPorZona = (zonaId: string | null) => {
    if (!zonaId) {
      setRutasFiltradas(rutas.filter(r => r.activa))
      return
    }
    
    const rutasFiltradas = rutas.filter(r => r.zonaId === zonaId && r.activa)
    setRutasFiltradas(rutasFiltradas)
  }

  const handleSedeChange = async (nuevaSedeId: string) => {
    setSedeSeleccionada(nuevaSedeId)
    setSedeId(nuevaSedeId)
    setRutaFiltroId('')
    setClientes([])
    // Cargar rutas de la nueva sede y mostrar modal
    try {
      setLoadingRutasModal(true)
      const sedeNombre = sedes.find(s => s.id === nuevaSedeId)?.nombre ?? ''
      setSedeNombreModal(sedeNombre)
      const rutasData = await rutasAPI.getAll({ sedeId: nuevaSedeId })
      const rutasActivas = rutasData.filter(r => r.activa)
      setRutasModal(rutasActivas)
      setRutas(rutasData)
      setRutasFiltradas(rutasData)
      setRutaSeleccionadaModal('')
      setLoadingRutasModal(false)
      setModalSeleccionRuta(true)
    } catch (err: any) {
      setLoadingRutasModal(false)
      setError(err.message || 'Error al cargar rutas de la sede')
    }
  }

  // Función para adaptar el cliente de la API al formato del componente
  const adaptarCliente = (cliente: ClienteAPI): Cliente => {
    return {
      ...cliente,
      // Mantener el objeto completo de la ruta si existe, o el nombre como string para compatibilidad
      ruta: cliente.ruta && typeof cliente.ruta === 'object' ? cliente.ruta : (cliente.ruta?.nombre || cliente.ruta || ''),
      // Mantener el objeto completo de la zona si existe, o el nombre como string para compatibilidad
      zona: cliente.zona && typeof cliente.zona === 'object' ? cliente.zona : (cliente.zona?.nombre || cliente.zona || ''),
      domicilios: cliente.domicilios?.map(d => ({
        ...d,
        fechaCreacionQR: d.fechaCreacionQR || new Date().toISOString()
      }))
    }
  }

  const abrirDialogo = async (
    tipo: 'importar' | 'agregar' | 'editar' | 'credito' | 'historial' | 'detalles',
    cliente?: Cliente
  ) => {
    setTipoDialogo(tipo)
    setClienteSeleccionado(cliente || null)

    if (tipo === 'agregar') {
      setFormularioCliente({
        estadoCliente: 'activo',
        pagosEspecialesAutorizados: false,
        limiteCredito: 0,
        saldoActual: 0,
        fechaRegistro: new Date().toISOString().split('T')[0],
        ultimaModificacion: new Date().toISOString().split('T')[0]
      })
      setDomiciliosAdicionales([])
      setLatitudPrincipal(null)
      setLongitudPrincipal(null)
      setCentroMapa(null)
      setRutasFiltradas(rutas.filter(r => r.activa))
      setZonasFiltradas(zonas.filter(z => z.activa))
    } else if (tipo === 'editar' && cliente) {
      // Si la ruta viene como string, buscar el objeto completo en la lista de rutas
      let rutaCompleta = cliente.ruta
      if (typeof cliente.ruta === 'string' && cliente.ruta) {
        // Buscar la ruta por nombre en la lista de rutas
        rutaCompleta = rutas.find(r => r.nombre === cliente.ruta) || cliente.ruta
      } else if (cliente.ruta && typeof cliente.ruta === 'object' && !(cliente.ruta as any).id) {
        // Si es un objeto pero no tiene ID, buscar por nombre
        const rutaEncontrada = rutas.find(r => r.nombre === (cliente.ruta as any).nombre)
        rutaCompleta = rutaEncontrada || cliente.ruta
      }
      
      // Si la zona viene como string, buscar el objeto completo
      let zonaCompleta = cliente.zona
      if (typeof cliente.zona === 'string' && cliente.zona) {
        zonaCompleta = zonas.find(z => z.id === cliente.zona || z.nombre === cliente.zona) || cliente.zona
      }
      
      setFormularioCliente({ ...cliente, ruta: rutaCompleta, zona: zonaCompleta })
      
      // Centrar el mapa en el estado del cliente
      if (cliente.estado) {
        const coordenadas = coordenadasEstados[cliente.estado]
        if (coordenadas) {
          setCentroMapa(coordenadas)
        }
        // Cargar municipios y zonas si hay estado
        await cargarMunicipiosPorEstado(cliente.estado)
      }
      
      // Filtrar rutas si hay zona
      if (zonaCompleta && typeof zonaCompleta === 'object' && (zonaCompleta as any).id) {
        filtrarRutasPorZona((zonaCompleta as any).id)
      }
      // Separar el domicilio principal de los adicionales
      const domiciliosAdicionalesList = cliente.domicilios?.filter(d => d.tipo !== 'principal') || []
      setDomiciliosAdicionales(domiciliosAdicionalesList)
      // Cargar latitud y longitud del domicilio principal
      const domicilioPrincipal = cliente.domicilios?.find(d => d.tipo === 'principal')
      setLatitudPrincipal(domicilioPrincipal?.latitud || null)
      setLongitudPrincipal(domicilioPrincipal?.longitud || null)
    }

    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setClienteSeleccionado(null)
    setFormularioCliente({})
    setDomiciliosAdicionales([])
    setArchivoSeleccionado(null)
    setProgresoImportacion(0)
    setImportando(false)
    setRutasFiltradas(rutas.filter(r => r.activa))
    setZonasFiltradas(zonas.filter(z => z.activa))
    setMunicipios([])
    setCentroMapa(null)
  }

  const manejarCambioFormulario = (campo: keyof Cliente, valor: any) => {
    setFormularioCliente(prev => ({ ...prev, [campo]: valor }))
  }

  const agregarDomicilioAdicional = () => {
    setDomiciliosAdicionales(prev => [
      ...prev,
      {
        tipo: 'otro',
        calle: '',
        numeroExterior: '',
        numeroInterior: '',
        colonia: '',
        municipio: '',
        estado: '',
        codigoPostal: '',
        referencia: '',
        latitud: null,
        longitud: null,
        activo: true
      }
    ])
  }

  const eliminarDomicilioAdicional = (index: number) => {
    setDomiciliosAdicionales(prev => prev.filter((_, i) => i !== index))
  }

  const actualizarDomicilioAdicional = (index: number, campo: keyof Domicilio, valor: any) => {
    setDomiciliosAdicionales(prev => prev.map((dom, i) => (i === index ? { ...dom, [campo]: valor } : dom)))
  }

  const guardarCliente = async () => {
    try {
      setSaving(true)
      setError(null)

      // Crear el primer domicilio automáticamente con los datos de la dirección principal
      const domicilioPrincipal: Omit<Domicilio, 'id' | 'clienteId' | 'codigoQR' | 'fechaCreacionQR'> = {
        tipo: 'principal',
        calle: formularioCliente.calle!,
        numeroExterior: formularioCliente.numeroExterior!,
        numeroInterior: formularioCliente.numeroInterior,
        colonia: formularioCliente.colonia!,
        municipio: formularioCliente.municipio!,
        estado: formularioCliente.estado!,
        codigoPostal: formularioCliente.codigoPostal!,
        referencia: 'Dirección principal del cliente',
        latitud: latitudPrincipal,
        longitud: longitudPrincipal,
        activo: true
      }

      // Combinar el domicilio principal con los adicionales
      const todosLosDomicilios = [
        domicilioPrincipal,
        ...domiciliosAdicionales
          .filter(d => d.calle && d.numeroExterior && d.colonia && d.municipio && d.estado && d.codigoPostal)
          .map(d => ({
            tipo: d.tipo || 'otro',
            calle: d.calle!,
            numeroExterior: d.numeroExterior!,
            numeroInterior: d.numeroInterior,
            colonia: d.colonia!,
            municipio: d.municipio!,
            estado: d.estado!,
            codigoPostal: d.codigoPostal!,
            referencia: d.referencia || '',
            latitud: d.latitud || null,
            longitud: d.longitud || null,
            activo: d.activo ?? true
          }))
      ]

      if (tipoDialogo === 'agregar') {
        const nuevoCliente = await clientesAPI.create({
          nombre: formularioCliente.nombre || '',
          apellidoPaterno: formularioCliente.apellidoPaterno || '',
          apellidoMaterno: formularioCliente.apellidoMaterno || '',
          email: formularioCliente.email || '',
          telefono: formularioCliente.telefono || '',
          telefonoSecundario: formularioCliente.telefonoSecundario,
          calle: formularioCliente.calle!,
          numeroExterior: formularioCliente.numeroExterior!,
          numeroInterior: formularioCliente.numeroInterior,
          colonia: formularioCliente.colonia!,
          municipio: formularioCliente.municipio!,
          estado: formularioCliente.estado!,
          codigoPostal: formularioCliente.codigoPostal!,
          rfc: formularioCliente.rfc || '',
          curp: formularioCliente.curp || '',
          rutaId:
            (formularioCliente.ruta as any)?.id ||
            (typeof formularioCliente.ruta === 'object' && formularioCliente.ruta
              ? (formularioCliente.ruta as any).id
              : null),
          zonaId:
            (formularioCliente.zona as any)?.id ||
            (typeof formularioCliente.zona === 'object' && formularioCliente.zona
              ? (formularioCliente.zona as any).id
              : null),
          limiteCredito: formularioCliente.limiteCredito || 0,
          saldoActual: formularioCliente.saldoActual || 0,
          pagosEspecialesAutorizados: formularioCliente.pagosEspecialesAutorizados || false,
          estadoCliente: formularioCliente.estadoCliente || 'activo',
          domicilios: todosLosDomicilios
        })
        await cargarDatos()
      } else if (tipoDialogo === 'editar' && clienteSeleccionado) {
        await clientesAPI.update(clienteSeleccionado.id, {
          nombre: formularioCliente.nombre || '',
          apellidoPaterno: formularioCliente.apellidoPaterno || '',
          apellidoMaterno: formularioCliente.apellidoMaterno || '',
          email: formularioCliente.email || '',
          telefono: formularioCliente.telefono || '',
          telefonoSecundario: formularioCliente.telefonoSecundario,
          calle: formularioCliente.calle,
          numeroExterior: formularioCliente.numeroExterior,
          numeroInterior: formularioCliente.numeroInterior,
          colonia: formularioCliente.colonia,
          municipio: formularioCliente.municipio,
          estado: formularioCliente.estado,
          codigoPostal: formularioCliente.codigoPostal,
          rfc: formularioCliente.rfc || '',
          curp: formularioCliente.curp || '',
          rutaId:
            (formularioCliente.ruta as any)?.id ||
            (typeof formularioCliente.ruta === 'object' && formularioCliente.ruta
              ? (formularioCliente.ruta as any).id
              : null),
          zonaId:
            (formularioCliente.zona as any)?.id ||
            (typeof formularioCliente.zona === 'object' && formularioCliente.zona
              ? (formularioCliente.zona as any).id
              : null),
          limiteCredito: formularioCliente.limiteCredito,
          saldoActual: formularioCliente.saldoActual,
          pagosEspecialesAutorizados: formularioCliente.pagosEspecialesAutorizados,
          estadoCliente: formularioCliente.estadoCliente
        })

        // Actualizar domicilio principal si cambió la dirección
        const domicilioPrincipalExistente = clienteSeleccionado.domicilios?.find(d => d.tipo === 'principal')
        if (domicilioPrincipalExistente) {
          await clientesAPI.updateDomicilio(domicilioPrincipalExistente.id, {
            calle: formularioCliente.calle!,
            numeroExterior: formularioCliente.numeroExterior!,
            numeroInterior: formularioCliente.numeroInterior,
            colonia: formularioCliente.colonia!,
            municipio: formularioCliente.municipio!,
            estado: formularioCliente.estado!,
            codigoPostal: formularioCliente.codigoPostal!,
            latitud: latitudPrincipal,
            longitud: longitudPrincipal
          })
        } else {
          // Crear domicilio principal si no existe
          await clientesAPI.createDomicilio(clienteSeleccionado.id, domicilioPrincipal)
        }

        // Crear domicilios adicionales nuevos
        for (const domicilio of domiciliosAdicionales) {
          if (domicilio.id) {
            // Actualizar domicilio existente
            await clientesAPI.updateDomicilio(domicilio.id, {
              tipo: domicilio.tipo,
              calle: domicilio.calle!,
              numeroExterior: domicilio.numeroExterior!,
              numeroInterior: domicilio.numeroInterior,
              colonia: domicilio.colonia!,
              municipio: domicilio.municipio!,
              estado: domicilio.estado!,
              codigoPostal: domicilio.codigoPostal!,
              referencia: domicilio.referencia,
              latitud: domicilio.latitud || null,
              longitud: domicilio.longitud || null,
              activo: domicilio.activo
            })
          } else if (
            domicilio.calle &&
            domicilio.numeroExterior &&
            domicilio.colonia &&
            domicilio.municipio &&
            domicilio.estado &&
            domicilio.codigoPostal
          ) {
            // Crear nuevo domicilio
            await clientesAPI.createDomicilio(clienteSeleccionado.id, {
              tipo: domicilio.tipo || 'otro',
              calle: domicilio.calle,
              numeroExterior: domicilio.numeroExterior,
              numeroInterior: domicilio.numeroInterior,
              colonia: domicilio.colonia,
              municipio: domicilio.municipio,
              estado: domicilio.estado,
              codigoPostal: domicilio.codigoPostal,
              referencia: domicilio.referencia,
              latitud: domicilio.latitud || null,
              longitud: domicilio.longitud || null,
              activo: domicilio.activo !== undefined ? domicilio.activo : true
            })
          }
        }

        await cargarDatos()
      }

      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al guardar cliente')
    } finally {
      setSaving(false)
    }
  }

  const manejarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    if (archivo) {
      setArchivoSeleccionado(archivo)
    }
  }

  const importarCSV = async () => {
    if (!archivoSeleccionado) return

    setImportando(true)
    setProgresoImportacion(0)
    setError(null)

    let resultados: any = null

    try {
      // Subir archivo al backend
      resultados = await clientesAPI.importarMasivo(archivoSeleccionado)
      
      // Simular progreso mientras se procesa
      for (let i = 0; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setProgresoImportacion(i)
      }

      setProgresoImportacion(100)

      // Mostrar resultados
      if (resultados.exitosos > 0) {
        alert(`Importación completada:\n- Exitosos: ${resultados.exitosos}\n- Errores: ${resultados.errores}\n- Total procesados: ${resultados.total}`)
      }

      if (resultados.errores > 0 && resultados.exitosos === 0) {
        setError(`No se pudieron importar clientes. Errores: ${resultados.errores}`)
      } else if (resultados.exitosos > 0) {
        // Recargar la lista de clientes
        await cargarDatos()
        cerrarDialogo()
      }

      // Si hay errores, mostrar detalles
      if (resultados.errores > 0 && resultados.detalles.errores.length > 0) {
        const erroresDetalle = resultados.detalles.errores
          .slice(0, 5)
          .map(e => `Fila ${e.fila}: ${e.error}`)
          .join('\n')
        const mensajeErrores = erroresDetalle + (resultados.errores > 5 ? `\n... y ${resultados.errores - 5} errores más` : '')
        console.error('Errores de importación:', resultados.detalles.errores)
        if (resultados.exitosos === 0) {
          setError(`Errores encontrados:\n${mensajeErrores}`)
        } else {
          alert(`Se importaron ${resultados.exitosos} clientes, pero hubo ${resultados.errores} errores:\n${mensajeErrores}`)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al importar el archivo')
      console.error('Error importando:', err)
    } finally {
      setImportando(false)
      if (resultados && resultados.exitosos > 0) {
        setProgresoImportacion(0)
      }
    }
  }

  const abrirDialogoEliminar = (cliente: Cliente) => {
    setClienteAEliminar(cliente)
    setDialogoEliminar(true)
  }

  const cerrarDialogoEliminar = () => {
    setDialogoEliminar(false)
    setClienteAEliminar(null)
  }

  const eliminarCliente = async () => {
    if (!clienteAEliminar) return

    try {
      setEliminando(true)
      setError(null)
      await clientesAPI.delete(clienteAEliminar.id)
      cerrarDialogoEliminar()
      await cargarDatos()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar cliente')
    } finally {
      setEliminando(false)
    }
  }

  const abrirModalQR = async (domicilio: Domicilio) => {
    if (!clienteSeleccionado) return

    try {
      setDomicilioQR(domicilio)
      const contenidoQR = generarContenidoQRDomicilio(domicilio)

      // Crear un canvas para el QR
      const canvas = document.createElement('canvas')
      const qrSize = 500
      canvas.width = qrSize
      canvas.height = qrSize

      // Generar el QR en el canvas
      await QRCode.toCanvas(canvas, contenidoQR, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // Cargar el logo
      const logo = new Image()
      logo.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        logo.onload = () => {
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'))
            return
          }

          // Tamaño del logo (20% del tamaño del QR)
          const logoSize = qrSize * 0.2
          const logoX = (qrSize - logoSize) / 2
          const logoY = (qrSize - logoSize) / 2

          // Dibujar un fondo blanco para el logo
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10)

          // Dibujar el logo en el centro
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)

          resolve()
        }
        logo.onerror = () => reject(new Error('Error al cargar el logo'))
        logo.src = '/images/flama.png'
      })

      // Convertir el canvas a data URL
      const qrDataURL = canvas.toDataURL('image/png')
      setQrDataURL(qrDataURL)
      setModalQR(true)
    } catch (err) {
      console.error('Error generando QR:', err)
      setError('Error al generar el código QR')
    }
  }

  const cerrarModalQR = () => {
    setModalQR(false)
    setQrDataURL('')
    setDomicilioQR(null)
  }

  const descargarQR = () => {
    if (!qrDataURL || !domicilioQR) return

    const link = document.createElement('a')
    link.href = qrDataURL
    link.download = `QR_domicilio_${domicilioQR.id}_${obtenerNombreCompleto(clienteSeleccionado!).replace(/\s+/g, '_')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const abrirModalQRCliente = async () => {
    if (!clienteSeleccionado) return
    try {
      const contenidoQR = generarContenidoQRCliente(clienteSeleccionado)
      const canvas = document.createElement('canvas')
      const qrSize = 500
      canvas.width = qrSize
      canvas.height = qrSize
      await QRCode.toCanvas(canvas, contenidoQR, {
        width: qrSize,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => {
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'))
            return
          }
          const logoSize = qrSize * 0.2
          const logoX = (qrSize - logoSize) / 2
          const logoY = (qrSize - logoSize) / 2
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10)
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
          resolve()
        }
        logo.onerror = () => reject(new Error('Error al cargar el logo'))
        logo.src = '/images/flama.png'
      }).catch(() => {})
      setQrDataURLCliente(canvas.toDataURL('image/png'))
      setModalQRCliente(true)
    } catch (err) {
      console.error('Error generando QR cliente:', err)
      setError('Error al generar el código QR del cliente')
    }
  }

  const cerrarModalQRCliente = () => {
    setModalQRCliente(false)
    setQrDataURLCliente('')
  }

  const descargarQRCliente = () => {
    if (!qrDataURLCliente || !clienteSeleccionado) return
    const link = document.createElement('a')
    link.href = qrDataURLCliente
    link.download = `QR_cliente_${clienteSeleccionado.id}_${obtenerNombreCompleto(clienteSeleccionado).replace(/\s+/g, '_')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'success'
      case 'suspendido':
        return 'warning'
      case 'inactivo':
        return 'error'
      default:
        return 'default'
    }
  }

  const obtenerDireccionCompleta = (cliente: Cliente) => {
    return `${cliente.calle} ${cliente.numeroExterior}${cliente.numeroInterior ? ` Int. ${cliente.numeroInterior}` : ''}, ${cliente.colonia}, ${cliente.municipio}, ${cliente.estado}`
  }

  const obtenerNombreCompleto = (cliente: Cliente) => {
    return `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`
  }

  // Calcular clientes paginados (filtro por ruta + buscador global con coincidencia parcial sin acentos)
  const normalizedSearch = normalizarParaBusqueda(searchTerm)

  const clientesPorRuta = rutaFiltroId === 'todas'
    ? clientes
    : clientes.filter(cliente => {
        const ruta = cliente.ruta as any
        const rutaIdCliente =
          ruta && typeof ruta === 'object' && ruta.id
            ? ruta.id
            : null
        return rutaIdCliente === rutaFiltroId
      })

  const filteredClientes = normalizedSearch
    ? clientesPorRuta.filter(cliente => {
        const nombreCompleto = obtenerNombreCompleto(cliente)
        const email = cliente.email || ''
        const telefono = cliente.telefono || ''
        const rutaNombre = (
          (cliente.ruta as any)?.nombre ||
          (cliente.ruta as any) ||
          ''
        ).toString()
        const estado = cliente.estadoCliente || ''
        const direccion = obtenerDireccionCompleta(cliente)
        return (
          coincideBusqueda(nombreCompleto, normalizedSearch) ||
          coincideBusqueda(email, normalizedSearch) ||
          coincideBusqueda(telefono, normalizedSearch) ||
          coincideBusqueda(rutaNombre, normalizedSearch) ||
          coincideBusqueda(estado, normalizedSearch) ||
          coincideBusqueda(direccion, normalizedSearch)
        )
      })
    : clientesPorRuta

  const totalPages = Math.ceil(filteredClientes.length / rowsPerPage)
  const startIndex = (page - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedClientes = filteredClientes.slice(startIndex, endIndex)

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  return (
    <Box sx={{ p: 3 }}>

      {/* ===== MODAL DE SELECCIÓN DE RUTA ===== */}
      <Dialog
        open={modalSeleccionRuta}
        maxWidth='sm'
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(107,78,47,0.18)'
          }
        }}
      >
        {/* Header del modal — color primario de la plantilla */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #6B4E2F 0%, #8C6643 100%)',
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(245,166,35,0.25)', width: 44, height: 44 }}>
            <ShippingIcon sx={{ fontSize: 24, color: '#F5A623' }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant='h6' sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
              Seleccionar Ruta
            </Typography>
            <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.75)' }}>
              {sedeNombreModal ? `Sede: ${sedeNombreModal}` : 'Elige una ruta para comenzar'}
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 2.5, pb: 1, px: 3, bgcolor: '#F5F3F0' }}>
          {loadingRutasModal ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 2 }}>
              <CircularProgress sx={{ color: '#6B4E2F' }} />
              <Typography color='text.secondary' variant='body2'>Cargando rutas...</Typography>
            </Box>
          ) : (
            <>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Selecciona la ruta que deseas gestionar. Solo se cargarán los clientes de esa ruta.
              </Typography>

              {/* Buscador de rutas */}
              <TextField
                size='small'
                fullWidth
                placeholder='Buscar ruta por nombre o código...'
                value={busquedaRuta}
                onChange={e => setBusquedaRuta(e.target.value)}
                sx={{ mb: 2, bgcolor: '#fff', borderRadius: 1 }}
                InputProps={{
                  startAdornment: (
                    <Box component='span' sx={{ mr: 1, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                      <ShippingIcon fontSize='small' />
                    </Box>
                  )
                }}
              />

              <Grid container spacing={1.5}
                sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5,
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#6B4E2F', borderRadius: 2 },
                  '&::-webkit-scrollbar-track': { bgcolor: '#e5ddd5', borderRadius: 2 }
                }}
              >
                {/* Opción: Todas las rutas — solo visible si no hay búsqueda activa */}
                {!busquedaRuta && (
                  <Grid item xs={12}>
                    <Box
                      onClick={() => setRutaSeleccionadaModal('todas')}
                      sx={{
                        border: rutaSeleccionadaModal === 'todas'
                          ? '2px solid #6B4E2F'
                          : '2px solid #ddd5c8',
                        borderRadius: 2,
                        p: 1.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        bgcolor: rutaSeleccionadaModal === 'todas' ? 'rgba(107,78,47,0.08)' : '#fff',
                        transition: 'all 0.18s ease',
                        '&:hover': {
                          bgcolor: 'rgba(107,78,47,0.06)',
                          borderColor: '#8C6643'
                        }
                      }}
                    >
                      <Avatar sx={{ bgcolor: rutaSeleccionadaModal === 'todas' ? '#6B4E2F' : '#ede8e3', width: 38, height: 38 }}>
                        <BusinessIcon sx={{ fontSize: 18, color: rutaSeleccionadaModal === 'todas' ? '#fff' : '#6B4E2F' }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'text.primary' }}>
                          Todas las rutas
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Ver clientes de todas las rutas de la sede
                        </Typography>
                      </Box>
                      {rutaSeleccionadaModal === 'todas' && (
                        <Chip size='small' label='✓' sx={{ bgcolor: '#6B4E2F', color: '#fff', fontWeight: 700, minWidth: 28 }} />
                      )}
                    </Box>
                  </Grid>
                )}

                {/* Rutas activas filtradas por búsqueda */}
                {rutasModal
                  .filter(r => {
                    const q = busquedaRuta.toLowerCase().trim()
                    if (!q) return true
                    return r.nombre.toLowerCase().includes(q) || (r.codigo || '').toLowerCase().includes(q)
                  })
                  .length === 0 && (
                  <Grid item xs={12}>
                    <Typography color='text.secondary' sx={{ textAlign: 'center', py: 2, fontSize: '0.85rem' }}>
                      {busquedaRuta ? `Sin resultados para "${busquedaRuta}"` : 'No hay rutas activas para esta sede'}
                    </Typography>
                  </Grid>
                )}
                {rutasModal
                  .filter(r => {
                    const q = busquedaRuta.toLowerCase().trim()
                    if (!q) return true
                    return r.nombre.toLowerCase().includes(q) || (r.codigo || '').toLowerCase().includes(q)
                  })
                  .map(ruta => (
                    <Grid item xs={12} sm={6} key={ruta.id}>
                      <Box
                        onClick={() => setRutaSeleccionadaModal(ruta.id)}
                        sx={{
                          border: rutaSeleccionadaModal === ruta.id
                            ? '2px solid #6B4E2F'
                            : '2px solid #ddd5c8',
                          borderRadius: 2,
                          p: 1.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          bgcolor: rutaSeleccionadaModal === ruta.id ? 'rgba(107,78,47,0.08)' : '#fff',
                          transition: 'all 0.18s ease',
                          height: '100%',
                          '&:hover': {
                            bgcolor: 'rgba(107,78,47,0.06)',
                            borderColor: '#8C6643'
                          }
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: rutaSeleccionadaModal === ruta.id ? '#6B4E2F' : '#ede8e3',
                            width: 38, height: 38, flexShrink: 0
                          }}
                        >
                          <ShippingIcon sx={{ fontSize: 18, color: rutaSeleccionadaModal === ruta.id ? '#fff' : '#6B4E2F' }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.3, color: 'text.primary' }} noWrap>
                            {ruta.nombre}
                          </Typography>
                          {ruta.codigo && (
                            <Chip
                              label={ruta.codigo}
                              size='small'
                              sx={{ bgcolor: 'rgba(245,166,35,0.15)', color: '#8C6643', height: 18, fontSize: '0.7rem', mt: 0.4, fontWeight: 600 }}
                            />
                          )}
                          {(ruta.horarioInicio || ruta.horarioFin) && (
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.3, fontSize: '0.7rem' }}>
                              {ruta.horarioInicio} – {ruta.horarioFin}
                            </Typography>
                          )}
                        </Box>
                        {rutaSeleccionadaModal === ruta.id && (
                          <Chip size='small' label='✓' sx={{ bgcolor: '#6B4E2F', color: '#fff', fontWeight: 700, minWidth: 28, flexShrink: 0 }} />
                        )}
                      </Box>
                    </Grid>
                  ))
                }
              </Grid>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2, bgcolor: '#F5F3F0', borderTop: '1px solid #ddd5c8' }}>
          <Button
            variant='contained'
            disabled={!rutaSeleccionadaModal || loadingRutasModal}
            onClick={confirmarSeleccionRuta}
            sx={{
              bgcolor: '#6B4E2F',
              color: '#fff',
              fontWeight: 700,
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 2px 8px rgba(107,78,47,0.25)',
              '&:hover': { bgcolor: '#5A4128', boxShadow: '0 4px 14px rgba(107,78,47,0.35)' },
              '&:disabled': { bgcolor: '#c9bfb3', color: '#fff' }
            }}
          >
            Cargar clientes
          </Button>
        </DialogActions>
      </Dialog>
      {/* ===== FIN MODAL SELECCIÓN DE RUTA ===== */}


      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h4' component='h1'>
          Gestión de Clientes
        </Typography>
        {esSuperAdministrador && (
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
        {!esSuperAdministrador && sedeId && (
          <Chip
            label={sedes.find(s => s.id === sedeId)?.nombre ?? 'N/A'}
            color='primary'
            variant='outlined'
          />
        )}
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 320,
            py: 6,
            gap: 2
          }}
        >
          <CircularProgress size={48} />
          <Typography color='text.secondary'>Cargando clientes...</Typography>
        </Box>
      ) : null}

      {!loading && (
      <Card sx={{ mb: 3, position: 'relative' }}>
        {loadingSede && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              borderRadius: '4px'
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography variant='body2' sx={{ mt: 2, color: 'text.secondary' }}>
                Cargando clientes de la sede...
              </Typography>
            </Box>
          </Box>
        )}
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant='h6'>Lista de Clientes</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              {lastClientesUpdate && (
                <Typography variant='caption' color='text.secondary' sx={{ mr: 1 }}>
                  Última actualización: {formatRelativeTime(lastClientesUpdate)}
                </Typography>
              )}
              <Button
                variant='outlined'
                size='small'
                startIcon={<ShippingIcon />}
                disabled={!sedeId || loadingRutasModal}
                onClick={() => {
                  setRutaSeleccionadaModal(rutaFiltroId || '')
                  setBusquedaRuta('')
                  setModalSeleccionRuta(true)
                }}
                color='secondary'
              >
                Cambiar Ruta
              </Button>
              <Button
                variant='outlined'
                size='small'
                startIcon={refreshingClientes ? <CircularProgress size={16} /> : <RefreshIcon />}
                disabled={refreshingClientes || !sedeId}
                onClick={() => cargarDatos()}
              >
                Actualizar
              </Button>
              <FormControl size='small' sx={{ minWidth: 200 }}>
                <InputLabel>Ruta</InputLabel>
                <Select
                  label='Ruta'
                  value={rutaFiltroId}
                  onChange={e => {
                    setRutaFiltroId(e.target.value as string)
                    setPage(1)
                  }}
                >
                  <MenuItem value='todas'>Todas las rutas</MenuItem>
                  {rutas
                    .filter(r => r.activa)
                    .map(ruta => (
                      <MenuItem key={ruta.id} value={ruta.id}>
                        {ruta.nombre} {ruta.codigo ? `- ${ruta.codigo}` : ''}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <TextField
                size='small'
                label='Buscar en la tabla'
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
              />
              <Button
                variant='outlined'
                startIcon={<AccountBalanceIcon />}
                onClick={() => router.push('/creditos-abonos')}
              >
                Créditos y Abonos
              </Button>
              <Button variant='outlined' startIcon={<UploadIcon />} onClick={() => abrirDialogo('importar')}>
                Importar CSV/Excel
              </Button>
              <Button variant='contained' startIcon={<AddIcon />} onClick={() => abrirDialogo('agregar')}>
                Agregar Cliente
              </Button>
            </Box>
          </Box>

          {/* Tabla de clientes */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Ruta</TableCell>
                  <TableCell align='right'>Límite Crédito</TableCell>
                  <TableCell align='right'>Saldo Actual</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Pagos Especiales</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align='center' sx={{ py: 4 }}>
                      <Typography variant='body2' color='text.secondary'>
                        No hay clientes disponibles
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClientes.map(cliente => (
                  <TableRow
                    key={cliente.id}
                    hover
                    onClick={() => abrirDialogo('detalles', cliente)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant='subtitle2' fontWeight='bold'>
                          {obtenerNombreCompleto(cliente)}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {obtenerDireccionCompleta(cliente)}
                        </Typography>
                        {cliente.email && (
                          <Typography variant='body2' color='text.secondary'>
                            {cliente.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize='small' color='action' />
                        <Typography variant='body2'>{cliente.telefono}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={(cliente.ruta as any)?.nombre || cliente.ruta || 'Sin ruta'}
                        size='small'
                        variant='outlined'
                      />
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
                        color={cliente.saldoActual > cliente.limiteCredito * 0.8 ? 'error' : 'text.primary'}
                      >
                        ${cliente.saldoActual.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cliente.estadoCliente.charAt(0).toUpperCase() + cliente.estadoCliente.slice(1)}
                        color={getEstadoColor(cliente.estadoCliente) as any}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cliente.pagosEspecialesAutorizados ? 'Autorizado' : 'No Autorizado'}
                        color={cliente.pagosEspecialesAutorizados ? 'success' : 'default'}
                        size='small'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title='Editar'>
                          <IconButton
                            size='small'
                            onClick={e => {
                              e.stopPropagation()
                              abrirDialogo('editar', cliente)
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Control de Crédito'>
                          <IconButton
                            size='small'
                            onClick={e => {
                              e.stopPropagation()
                              abrirDialogo('credito', cliente)
                            }}
                          >
                            <CreditCardIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Historial'>
                          <IconButton
                            size='small'
                            onClick={e => {
                              e.stopPropagation()
                              abrirDialogo('historial', cliente)
                            }}
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Eliminar'>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={e => {
                              e.stopPropagation()
                              abrirDialogoEliminar(cliente)
                            }}
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
          
          {/* Paginación */}
          {filteredClientes.length > 0 && (
            <Stack spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color='primary'
                size='large'
                showFirstButton
                showLastButton
              />
              <Typography variant='body2' color='text.secondary'>
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredClientes.length)} de {filteredClientes.length} clientes
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
      )}

      {/* Modal Importar CSV */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'importar'} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon />
            Importar Clientes desde CSV/Excel
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            <Typography variant='subtitle2' gutterBottom>
              Formato de archivo para subida masiva:
            </Typography>
            <Typography variant='body2' component='div'>
              El archivo debe ser Excel (.xlsx, .xls) o CSV y debe contener las siguientes columnas:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '20px' }}>
                <li><strong>CLIENTE</strong> (requerido): Nombre completo del cliente</li>
                <li><strong>RUTA_PRINCIPAL</strong> (requerido): Ruta principal del cliente (ej: "RUTA P 1DH", "RUTA P 1SMA", "R C 1DH")</li>
              </ul>
              El sistema mapeará automáticamente la ruta al código correspondiente y creará los clientes con los datos mínimos necesarios.
              Los campos de dirección se completarán con valores por defecto que podrás editar después.
            </Typography>
          </Alert>

          <Box sx={{ mb: 2 }}>
            <input
              accept='.csv,.xlsx,.xls'
              style={{ display: 'none' }}
              id='archivo-csv'
              type='file'
              onChange={manejarArchivo}
            />
            <label htmlFor='archivo-csv'>
              <Button variant='outlined' component='span' startIcon={<AttachFileIcon />} fullWidth>
                {archivoSeleccionado ? archivoSeleccionado.name : 'Seleccionar archivo'}
              </Button>
            </label>
          </Box>

          {importando && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' gutterBottom>
                Importando clientes... {progresoImportacion}%
              </Typography>
              <LinearProgress variant='determinate' value={progresoImportacion} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} disabled={importando}>
            Cancelar
          </Button>
          <Button onClick={importarCSV} variant='contained' disabled={!archivoSeleccionado || importando}>
            Importar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Agregar/Editar Cliente */}
      <Dialog
        open={dialogoAbierto && (tipoDialogo === 'agregar' || tipoDialogo === 'editar')}
        onClose={cerrarDialogo}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {tipoDialogo === 'agregar' ? <AddIcon /> : <EditIcon />}
            {tipoDialogo === 'agregar' ? 'Agregar Nuevo Cliente' : 'Editar Cliente'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Información Personal */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                Información Personal
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Nombre'
                value={formularioCliente.nombre || ''}
                onChange={e => manejarCambioFormulario('nombre', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Apellido Paterno'
                value={formularioCliente.apellidoPaterno || ''}
                onChange={e => manejarCambioFormulario('apellidoPaterno', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Apellido Materno'
                value={formularioCliente.apellidoMaterno || ''}
                onChange={e => manejarCambioFormulario('apellidoMaterno', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={formularioCliente.email || ''}
                onChange={e => manejarCambioFormulario('email', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='Teléfono'
                value={formularioCliente.telefono || ''}
                onChange={e => manejarCambioFormulario('telefono', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='Teléfono Secundario'
                value={formularioCliente.telefonoSecundario || ''}
                onChange={e => manejarCambioFormulario('telefonoSecundario', e.target.value)}
              />
            </Grid>

            {/* Información Fiscal */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='h6' gutterBottom>
                Información Fiscal
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='RFC'
                value={formularioCliente.rfc || ''}
                onChange={e => manejarCambioFormulario('rfc', e.target.value)}
                placeholder='Ej: ABC123456789'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='CURP'
                value={formularioCliente.curp || ''}
                onChange={e => manejarCambioFormulario('curp', e.target.value)}
                placeholder='Ej: ABC123456HDFXXX01'
              />
            </Grid>

            {/* Dirección */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='h6' gutterBottom>
                Dirección
              </Typography>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label='Calle'
                value={formularioCliente.calle || ''}
                onChange={e => manejarCambioFormulario('calle', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label='No. Ext.'
                value={formularioCliente.numeroExterior || ''}
                onChange={e => manejarCambioFormulario('numeroExterior', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label='No. Int.'
                value={formularioCliente.numeroInterior || ''}
                onChange={e => manejarCambioFormulario('numeroInterior', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Colonia'
                value={formularioCliente.colonia || ''}
                onChange={e => manejarCambioFormulario('colonia', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='Municipio'
                value={formularioCliente.municipio || ''}
                onChange={e => manejarCambioFormulario('municipio', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formularioCliente.estado || ''}
                  onChange={e => {
                    manejarCambioFormulario('estado', e.target.value)
                    // Limpiar zona y ruta cuando cambia el estado
                    manejarCambioFormulario('zona', null)
                    manejarCambioFormulario('ruta', null)
                    // Centrar el mapa en el estado seleccionado
                    const coordenadas = coordenadasEstados[e.target.value]
                    if (coordenadas) {
                      setCentroMapa(coordenadas)
                    }
                    // Cargar municipios y zonas del nuevo estado
                    cargarMunicipiosPorEstado(e.target.value)
                  }}
                  label='Estado'
                >
                  {estadosMexico.map(estado => (
                    <MenuItem key={estado} value={estado}>
                      {estado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Código Postal'
                value={formularioCliente.codigoPostal || ''}
                onChange={e => manejarCambioFormulario('codigoPostal', e.target.value)}
                required
                inputProps={{ maxLength: 5 }}
              />
            </Grid>

            {/* Mapa para seleccionar ubicación */}
            <Grid item xs={12}>
              <MapLocationPicker
                latitud={latitudPrincipal}
                longitud={longitudPrincipal}
                onLocationSelect={(lat, lng) => {
                  setLatitudPrincipal(lat)
                  setLongitudPrincipal(lng)
                }}
                height='350px'
                editable={true}
                center={centroMapa}
                zoom={centroMapa ? 8 : undefined}
              />
            </Grid>

            {/* Información Comercial */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='h6' gutterBottom>
                Información Comercial
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Zona</InputLabel>
                <Select
                  value={
                    (() => {
                      if (formularioCliente.zona && typeof formularioCliente.zona === 'object' && (formularioCliente.zona as any).id) {
                        return (formularioCliente.zona as any).id
                      }
                      if (typeof formularioCliente.zona === 'string' && formularioCliente.zona) {
                        const zonaEncontrada = zonasFiltradas.find(z => z.id === formularioCliente.zona || z.nombre === formularioCliente.zona)
                        return zonaEncontrada?.id || ''
                      }
                      return ''
                    })()
                  }
                  onChange={e => {
                    const zonaSeleccionada = zonasFiltradas.find(z => z.id === e.target.value)
                    if (zonaSeleccionada) {
                      manejarCambioFormulario('zona', zonaSeleccionada)
                      // Filtrar rutas por la zona seleccionada
                      filtrarRutasPorZona(zonaSeleccionada.id)
                      // Limpiar ruta cuando cambia la zona
                      manejarCambioFormulario('ruta', null)
                    } else {
                      manejarCambioFormulario('zona', null)
                      setRutasFiltradas(rutas.filter(r => r.activa))
                    }
                  }}
                  label='Zona'
                  disabled={!formularioCliente.estado || zonasFiltradas.length === 0}
                >
                  {zonasFiltradas.length === 0 ? (
                    <MenuItem disabled>
                      {!formularioCliente.estado ? 'Selecciona un estado primero' : 'No hay zonas disponibles para este estado'}
                    </MenuItem>
                  ) : (
                    zonasFiltradas.map(zona => (
                      <MenuItem key={zona.id} value={zona.id}>
                        {zona.nombre} {zona.codigo ? `- ${zona.codigo}` : ''}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Ruta</InputLabel>
                <Select
                  value={
                    (() => {
                      // Si la ruta es un objeto con ID, usar el ID
                      if (formularioCliente.ruta && typeof formularioCliente.ruta === 'object' && (formularioCliente.ruta as any).id) {
                        return (formularioCliente.ruta as any).id
                      }
                      // Si la ruta es un string (nombre), buscar el ID correspondiente
                      if (typeof formularioCliente.ruta === 'string' && formularioCliente.ruta) {
                        const rutaEncontrada = rutasFiltradas.find(r => r.nombre === formularioCliente.ruta)
                        return rutaEncontrada?.id || ''
                      }
                      return ''
                    })()
                  }
                  onChange={e => {
                    const rutaSeleccionada = rutasFiltradas.find(r => r.id === e.target.value)
                    if (rutaSeleccionada) {
                      // Guardar el objeto completo de la ruta para mantener el ID
                      manejarCambioFormulario('ruta', rutaSeleccionada)
                    } else {
                      manejarCambioFormulario('ruta', null)
                    }
                  }}
                  label='Ruta'
                  disabled={rutasFiltradas.length === 0}
                >
                  {rutasFiltradas.length === 0 ? (
                    <MenuItem disabled>
                      {!formularioCliente.zona ? 'Selecciona una zona primero' : 'No hay rutas disponibles para esta zona'}
                    </MenuItem>
                  ) : (
                    rutasFiltradas.map(ruta => (
                      <MenuItem key={ruta.id} value={ruta.id}>
                        {ruta.nombre} - {ruta.codigo}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='Límite de Crédito'
                type='number'
                value={formularioCliente.limiteCredito || 0}
                onChange={e => manejarCambioFormulario('limiteCredito', Number(e.target.value))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='Saldo Actual'
                type='number'
                value={formularioCliente.saldoActual || 0}
                onChange={e => manejarCambioFormulario('saldoActual', Number(e.target.value))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formularioCliente.pagosEspecialesAutorizados || false}
                    onChange={e => manejarCambioFormulario('pagosEspecialesAutorizados', e.target.checked)}
                  />
                }
                label='Crédito autorizado'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado del Cliente</InputLabel>
                <Select
                  value={formularioCliente.estadoCliente || 'activo'}
                  onChange={e => manejarCambioFormulario('estadoCliente', e.target.value)}
                  label='Estado del Cliente'
                >
                  <MenuItem value='activo'>Activo</MenuItem>
                  <MenuItem value='suspendido'>Suspendido</MenuItem>
                  <MenuItem value='inactivo'>Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Domicilios Adicionales */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h6' gutterBottom>
                  Domicilios Adicionales
                </Typography>
                <Button variant='outlined' size='small' startIcon={<AddIcon />} onClick={agregarDomicilioAdicional}>
                  Agregar Domicilio
                </Button>
              </Box>
              <Alert severity='info' sx={{ mb: 2 }}>
                El primer domicilio (principal) se crea automáticamente con los datos de la dirección principal del
                cliente.
              </Alert>

              {domiciliosAdicionales.map((domicilio, index) => (
                <Card key={index} variant='outlined' sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant='subtitle1' fontWeight='bold'>
                        Domicilio {index + 1}
                      </Typography>
                      <IconButton size='small' color='error' onClick={() => eliminarDomicilioAdicional(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo de Domicilio</InputLabel>
                          <Select
                            value={domicilio.tipo || 'otro'}
                            onChange={e => actualizarDomicilioAdicional(index, 'tipo', e.target.value)}
                            label='Tipo de Domicilio'
                          >
                            <MenuItem value='facturacion'>Facturación</MenuItem>
                            <MenuItem value='entrega'>Entrega</MenuItem>
                            <MenuItem value='otro'>Otro</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label='Calle'
                          value={domicilio.calle || ''}
                          onChange={e => actualizarDomicilioAdicional(index, 'calle', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label='No. Ext.'
                          value={domicilio.numeroExterior || ''}
                          onChange={e => actualizarDomicilioAdicional(index, 'numeroExterior', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label='No. Int.'
                          value={domicilio.numeroInterior || ''}
                          onChange={e => actualizarDomicilioAdicional(index, 'numeroInterior', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label='Colonia'
                          value={domicilio.colonia || ''}
                          onChange={e => actualizarDomicilioAdicional(index, 'colonia', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label='Municipio'
                          value={domicilio.municipio || ''}
                          onChange={e => actualizarDomicilioAdicional(index, 'municipio', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth required>
                          <InputLabel>Estado</InputLabel>
                          <Select
                            value={domicilio.estado || ''}
                            onChange={e => actualizarDomicilioAdicional(index, 'estado', e.target.value)}
                            label='Estado'
                          >
                            {estadosMexico.map(estado => (
                              <MenuItem key={estado} value={estado}>
                                {estado}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label='Código Postal'
                          value={domicilio.codigoPostal || ''}
                          onChange={e => actualizarDomicilioAdicional(index, 'codigoPostal', e.target.value)}
                          required
                          inputProps={{ maxLength: 5 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label='Referencia'
                          value={domicilio.referencia || ''}
                          onChange={e => actualizarDomicilioAdicional(index, 'referencia', e.target.value)}
                          multiline
                          rows={2}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <MapLocationPicker
                          latitud={domicilio.latitud || null}
                          longitud={domicilio.longitud || null}
                          onLocationSelect={(lat, lng) => {
                            actualizarDomicilioAdicional(index, 'latitud', lat)
                            actualizarDomicilioAdicional(index, 'longitud', lng)
                          }}
                          height='300px'
                          editable={true}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={domicilio.activo !== undefined ? domicilio.activo : true}
                              onChange={e => actualizarDomicilioAdicional(index, 'activo', e.target.checked)}
                            />
                          }
                          label='Domicilio Activo'
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button onClick={guardarCliente} variant='contained' startIcon={<SaveIcon />} disabled={saving}>
            {saving ? 'Guardando...' : tipoDialogo === 'agregar' ? 'Agregar' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Control de Crédito */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'credito'} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCardIcon />
            Control de Crédito - {clienteSeleccionado ? obtenerNombreCompleto(clienteSeleccionado) : ''}
          </Box>
        </DialogTitle>
        <DialogContent>
          {clienteSeleccionado && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6' gutterBottom>
                        Información de Crédito
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
                          <Typography
                            variant='h6'
                            color={
                              clienteSeleccionado.saldoActual > clienteSeleccionado.limiteCredito * 0.8
                                ? 'error'
                                : 'success'
                            }
                          >
                            ${clienteSeleccionado.saldoActual.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant='body2' color='text.secondary'>
                            Crédito Disponible
                          </Typography>
                          <Typography variant='h6' color='success.main'>
                            ${(clienteSeleccionado.limiteCredito - clienteSeleccionado.saldoActual).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant='h6' gutterBottom>
                    Historial de Movimientos Recientes
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUpIcon color='success' />
                      </ListItemIcon>
                      <ListItemText primary='Pago recibido' secondary='15/01/2024 - $5,000.00' />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingDownIcon color='error' />
                      </ListItemIcon>
                      <ListItemText primary='Venta a crédito' secondary='10/01/2024 - $8,500.00' />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PaymentIcon color='info' />
                      </ListItemIcon>
                      <ListItemText primary='Pago especial autorizado' secondary='05/01/2024 - $2,000.00' />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Alert
                    severity={
                      clienteSeleccionado.saldoActual > clienteSeleccionado.limiteCredito * 0.8 ? 'warning' : 'success'
                    }
                  >
                    {clienteSeleccionado.saldoActual > clienteSeleccionado.limiteCredito * 0.8
                      ? 'El cliente ha alcanzado el 80% de su límite de crédito'
                      : 'El cliente tiene crédito disponible'}
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Historial */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'historial'} onClose={cerrarDialogo} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Historial - {clienteSeleccionado ? obtenerNombreCompleto(clienteSeleccionado) : ''}
          </Box>
        </DialogTitle>
        <DialogContent>
          {clienteSeleccionado && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Información del Cliente
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Fecha de Registro
                  </Typography>
                  <Typography variant='body1'>
                    {new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString('es-MX')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Última Modificación
                  </Typography>
                  <Typography variant='body1'>
                    {new Date(clienteSeleccionado.ultimaModificacion).toLocaleDateString('es-MX')}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant='h6' gutterBottom>
                Historial Completo
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EditIcon color='primary' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Cliente modificado'
                    secondary='25/01/2024 - Información de contacto actualizada'
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUpIcon color='success' />
                  </ListItemIcon>
                  <ListItemText primary='Pago recibido' secondary='20/01/2024 - $5,000.00 - Referencia: PAG-001234' />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingDownIcon color='error' />
                  </ListItemIcon>
                  <ListItemText primary='Venta a crédito' secondary='15/01/2024 - $8,500.00 - Factura: FAC-005678' />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CreditCardIcon color='info' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Límite de crédito modificado'
                    secondary='10/01/2024 - Nuevo límite: $50,000.00'
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PaymentIcon color='warning' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Pago especial autorizado'
                    secondary='05/01/2024 - $2,000.00 - Autorizado por: Gerencia'
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Detalles del Cliente */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'detalles'} onClose={cerrarDialogo} maxWidth='lg' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon />
              Detalles del Cliente - {clienteSeleccionado ? obtenerNombreCompleto(clienteSeleccionado) : ''}
            </Box>
            <IconButton onClick={cerrarDialogo} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {clienteSeleccionado && (
            <Box>
              {/* Información Personal */}
              <Card variant='outlined' sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    Información Personal
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Nombre Completo
                      </Typography>
                      <Typography variant='body1' fontWeight='bold'>
                        {obtenerNombreCompleto(clienteSeleccionado)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Estado del Cliente
                      </Typography>
                      <Chip
                        label={
                          clienteSeleccionado.estadoCliente.charAt(0).toUpperCase() +
                          clienteSeleccionado.estadoCliente.slice(1)
                        }
                        color={getEstadoColor(clienteSeleccionado.estadoCliente) as any}
                        size='small'
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize='small' />
                          Email
                        </Box>
                      </Typography>
                      <Typography variant='body1'>{clienteSeleccionado.email || 'No especificado'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize='small' />
                          Teléfono Principal
                        </Box>
                      </Typography>
                      <Typography variant='body1'>{clienteSeleccionado.telefono}</Typography>
                    </Grid>
                    {clienteSeleccionado.telefonoSecundario && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant='body2' color='text.secondary'>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize='small' />
                            Teléfono Secundario
                          </Box>
                        </Typography>
                        <Typography variant='body1'>{clienteSeleccionado.telefonoSecundario}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        RFC
                      </Typography>
                      <Typography variant='body1'>{clienteSeleccionado.rfc || 'No especificado'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        CURP
                      </Typography>
                      <Typography variant='body1'>{clienteSeleccionado.curp || 'No especificado'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Fecha de Registro
                      </Typography>
                      <Typography variant='body1'>
                        {new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString('es-MX')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Última Modificación
                      </Typography>
                      <Typography variant='body1'>
                        {new Date(clienteSeleccionado.ultimaModificacion).toLocaleDateString('es-MX')}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Información de Crédito */}
              <Card variant='outlined' sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCardIcon />
                    Información de Crédito
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Límite de Crédito
                      </Typography>
                      <Typography variant='h6' color='primary'>
                        ${clienteSeleccionado.limiteCredito.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Saldo Actual
                      </Typography>
                      <Typography
                        variant='h6'
                        color={
                          clienteSeleccionado.saldoActual > clienteSeleccionado.limiteCredito * 0.8
                            ? 'error'
                            : 'success'
                        }
                      >
                        ${clienteSeleccionado.saldoActual.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Crédito Disponible
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        ${(clienteSeleccionado.limiteCredito - clienteSeleccionado.saldoActual).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Pagos Especiales
                      </Typography>
                      <Chip
                        label={clienteSeleccionado.pagosEspecialesAutorizados ? 'Autorizado' : 'No Autorizado'}
                        color={clienteSeleccionado.pagosEspecialesAutorizados ? 'success' : 'default'}
                        size='small'
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Ruta Asignada
                      </Typography>
                      <Chip
                        label={(clienteSeleccionado.ruta as any)?.nombre || clienteSeleccionado.ruta || 'Sin ruta'}
                        size='small'
                        variant='outlined'
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* QR general del cliente */}
              <Card variant='outlined' sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QrCodeIcon /> QR general (cliente)
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Este QR identifica al cliente. Al escanearlo en Ventas, Abonos o Clientes se cargan los domicilios si los hay.
                  </Typography>
                  <Button
                    variant='outlined'
                    startIcon={<QrCodeIcon />}
                    onClick={abrirModalQRCliente}
                  >
                    Ver e imprimir QR del cliente
                  </Button>
                </CardContent>
              </Card>

              {/* Domicilios */}
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon />
                    Domicilios Registrados ({clienteSeleccionado.domicilios?.length || 0})
                  </Typography>
                  {clienteSeleccionado.domicilios && clienteSeleccionado.domicilios.length > 0 ? (
                    <Grid container spacing={2}>
                      {clienteSeleccionado.domicilios.map(domicilio => (
                        <Grid item xs={12} md={6} key={domicilio.id}>
                          <Card variant='outlined' sx={{ height: '100%' }}>
                            <CardContent>
                              <Box
                                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {domicilio.tipo === 'principal' && <HomeIcon color='primary' />}
                                  {domicilio.tipo === 'facturacion' && <ReceiptIcon color='secondary' />}
                                  {domicilio.tipo === 'entrega' && <ShippingIcon color='success' />}
                                  {domicilio.tipo === 'otro' && <BusinessIcon color='action' />}
                                  <Typography variant='subtitle2' fontWeight='bold'>
                                    {domicilio.tipo.charAt(0).toUpperCase() + domicilio.tipo.slice(1)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={domicilio.activo ? 'Activo' : 'Inactivo'}
                                    color={domicilio.activo ? 'success' : 'default'}
                                    size='small'
                                  />
                                  <Chip
                                    icon={<QrCodeIcon />}
                                    label='Ver QR domicilio'
                                    color='primary'
                                    variant='outlined'
                                    size='small'
                                    onClick={e => {
                                      e.stopPropagation()
                                      abrirModalQR(domicilio)
                                    }}
                                    sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                  />
                                </Box>
                              </Box>
                              <Typography variant='body2' color='text.secondary' gutterBottom>
                                Dirección Completa
                              </Typography>
                              <Typography variant='body1' sx={{ mb: 1 }}>
                                {domicilio.calle} {domicilio.numeroExterior}
                                {domicilio.numeroInterior && ` Int. ${domicilio.numeroInterior}`}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                {domicilio.colonia}, {domicilio.municipio}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                {domicilio.estado}, C.P. {domicilio.codigoPostal}
                              </Typography>
                              {domicilio.referencia && (
                                <>
                                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                    Referencia:
                                  </Typography>
                                  <Typography variant='body2'>{domicilio.referencia}</Typography>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity='info'>No hay domicilios registrados para este cliente.</Alert>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación para Eliminar Cliente */}
      <Dialog open={dialogoEliminar} onClose={cerrarDialogoEliminar}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar al cliente{' '}
            <strong>{clienteAEliminar ? obtenerNombreCompleto(clienteAEliminar) : ''}</strong>? Esta acción no se puede
            deshacer y también se eliminarán todos los domicilios asociados.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoEliminar} disabled={eliminando}>
            Cancelar
          </Button>
          <Button onClick={eliminarCliente} color='error' variant='contained' disabled={eliminando}>
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Código QR (domicilio) */}
      <Dialog open={modalQR} onClose={cerrarModalQR} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCodeIcon />
              <Typography variant='h6'>QR domicilio</Typography>
            </Box>
            <IconButton onClick={cerrarModalQR} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {domicilioQR && clienteSeleccionado && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                {domicilioQR.tipo.charAt(0).toUpperCase() + domicilioQR.tipo.slice(1)} -{' '}
                {obtenerNombreCompleto(clienteSeleccionado)}
              </Typography>

              {qrDataURL && (
                <Box sx={{ my: 3 }}>
                  <img
                    src={qrDataURL}
                    alt={`QR Code ${domicilioQR.codigoQR}`}
                    style={{
                      width: '80%',
                      maxWidth: '400px',
                      height: 'auto',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </Box>
              )}

              <Typography variant='body2' color='text.secondary' sx={{ mt: 2, mb: 1 }}>
                <strong>Dirección:</strong> {domicilioQR.calle} {domicilioQR.numeroExterior}
                {domicilioQR.numeroInterior && ` Int. ${domicilioQR.numeroInterior}`}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {domicilioQR.colonia}, {domicilioQR.municipio}, {domicilioQR.estado}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                C.P. {domicilioQR.codigoPostal}
              </Typography>

              {domicilioQR.referencia && (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  <strong>Referencia:</strong> {domicilioQR.referencia}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModalQR}>Cerrar</Button>
          <Button onClick={descargarQR} variant='contained' startIcon={<DownloadIcon />} disabled={!qrDataURL}>
            Descargar como Imagen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal QR general del cliente */}
      <Dialog open={modalQRCliente} onClose={cerrarModalQRCliente} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCodeIcon />
              <Typography variant='h6'>QR general (cliente)</Typography>
            </Box>
            <IconButton onClick={cerrarModalQRCliente} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {clienteSeleccionado && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                {obtenerNombreCompleto(clienteSeleccionado)}
              </Typography>
              {qrDataURLCliente && (
                <Box sx={{ my: 3 }}>
                  <img
                    src={qrDataURLCliente}
                    alt='QR Code Cliente'
                    style={{
                      width: '80%',
                      maxWidth: '400px',
                      height: 'auto',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </Box>
              )}
              <Typography variant='caption' color='text.secondary'>
                Al escanear en Ventas, Abonos o Clientes se identifica al cliente y se listan sus domicilios.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModalQRCliente}>Cerrar</Button>
          <Button onClick={descargarQRCliente} variant='contained' startIcon={<DownloadIcon />} disabled={!qrDataURLCliente}>
            Descargar como Imagen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
