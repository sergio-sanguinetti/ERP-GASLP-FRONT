'use client'

import React, { useState } from 'react'

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
  ListItemIcon
} from '@mui/material'
import { 
  Add as AddIcon, 
  Upload as UploadIcon, 
  Edit as EditIcon,
  CreditCard as CreditCardIcon,
  History as HistoryIcon,
  Phone as PhoneIcon,
  AttachFile as AttachFileIcon,
  Save as SaveIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Payment as PaymentIcon
} from '@mui/icons-material'

// Tipos de datos
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
  limiteCredito: number
  saldoActual: number
  pagosEspecialesAutorizados: boolean
  fechaRegistro: string
  ultimaModificacion: string
  estadoCliente: 'activo' | 'suspendido' | 'inactivo'
}

// Datos específicos de México
const estadosMexico = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
]

const rutasMexico = [
  'Ruta Centro', 'Ruta Norte', 'Ruta Sur', 'Ruta Occidente', 'Ruta Oriente',
  'Ruta Sureste', 'Ruta Noreste', 'Ruta Noroeste', 'Ruta Suroeste'
]

// Datos de ejemplo con información completa de México
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
    estadoCliente: 'activo'
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
    estadoCliente: 'activo'
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
    estadoCliente: 'activo'
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
    estadoCliente: 'suspendido'
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
    estadoCliente: 'activo'
  }
]

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(clientesEjemplo)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'importar' | 'agregar' | 'editar' | 'credito' | 'historial'>('agregar')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [formularioCliente, setFormularioCliente] = useState<Partial<Cliente>>({})
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [progresoImportacion, setProgresoImportacion] = useState(0)
  const [importando, setImportando] = useState(false)

  const abrirDialogo = (tipo: 'importar' | 'agregar' | 'editar' | 'credito' | 'historial', cliente?: Cliente) => {
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
    } else if (tipo === 'editar' && cliente) {
      setFormularioCliente({ ...cliente })
    }
    
    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setClienteSeleccionado(null)
    setFormularioCliente({})
    setArchivoSeleccionado(null)
    setProgresoImportacion(0)
    setImportando(false)
  }

  const manejarCambioFormulario = (campo: keyof Cliente, valor: any) => {
    setFormularioCliente(prev => ({ ...prev, [campo]: valor }))
  }

  const guardarCliente = () => {
    if (tipoDialogo === 'agregar') {
      const nuevoCliente: Cliente = {
        id: Date.now().toString(),
        ...formularioCliente as Cliente
      }

      setClientes(prev => [...prev, nuevoCliente])
    } else if (tipoDialogo === 'editar' && clienteSeleccionado) {
      setClientes(prev => prev.map(cliente => 
        cliente.id === clienteSeleccionado.id 
          ? { ...cliente, ...formularioCliente, ultimaModificacion: new Date().toISOString().split('T')[0] }
          : cliente
      ))
    }

    cerrarDialogo()
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
    
    // Simular proceso de importación
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setProgresoImportacion(i)
    }
    
    setImportando(false)
    cerrarDialogo()
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'success'
      case 'suspendido': return 'warning'
      case 'inactivo': return 'error'
      default: return 'default'
    }
  }

  const obtenerDireccionCompleta = (cliente: Cliente) => {
    return `${cliente.calle} ${cliente.numeroExterior}${cliente.numeroInterior ? ` Int. ${cliente.numeroInterior}` : ''}, ${cliente.colonia}, ${cliente.municipio}, ${cliente.estado}`
  }

  const obtenerNombreCompleto = (cliente: Cliente) => {
    return `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Clientes
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Lista de Clientes</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => abrirDialogo('importar')}
              >
                Importar CSV/Excel
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => abrirDialogo('agregar')}
              >
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
                  <TableCell align="right">Límite Crédito</TableCell>
                  <TableCell align="right">Saldo Actual</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Pagos Especiales</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {obtenerNombreCompleto(cliente)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {obtenerDireccionCompleta(cliente)}
                        </Typography>
                        {cliente.email && (
                          <Typography variant="body2" color="text.secondary">
                            {cliente.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{cliente.telefono}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={cliente.ruta} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        ${cliente.limiteCredito.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={cliente.saldoActual > cliente.limiteCredito * 0.8 ? 'error' : 'text.primary'}
                      >
                        ${cliente.saldoActual.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cliente.estadoCliente.charAt(0).toUpperCase() + cliente.estadoCliente.slice(1)}
                        color={getEstadoColor(cliente.estadoCliente) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cliente.pagosEspecialesAutorizados ? 'Autorizado' : 'No Autorizado'}
                        color={cliente.pagosEspecialesAutorizados ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => abrirDialogo('editar', cliente)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Control de Crédito">
                          <IconButton size="small" onClick={() => abrirDialogo('credito', cliente)}>
                            <CreditCardIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Historial">
                          <IconButton size="small" onClick={() => abrirDialogo('historial', cliente)}>
                            <HistoryIcon />
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

      {/* Modal Importar CSV */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'importar'} onClose={cerrarDialogo} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon />
            Importar Clientes desde CSV/Excel
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Selecciona un archivo CSV o Excel con los datos de los clientes. El archivo debe contener las columnas: nombre, apellidoPaterno, apellidoMaterno, email, telefono, calle, numeroExterior, colonia, municipio, estado, codigoPostal, rfc, ruta, limiteCredito.
          </Alert>
          
          <Box sx={{ mb: 2 }}>
            <input
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              id="archivo-csv"
              type="file"
              onChange={manejarArchivo}
            />
            <label htmlFor="archivo-csv">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AttachFileIcon />}
                fullWidth
              >
                {archivoSeleccionado ? archivoSeleccionado.name : 'Seleccionar archivo'}
              </Button>
            </label>
          </Box>

          {importando && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Importando clientes... {progresoImportacion}%
              </Typography>
              <LinearProgress variant="determinate" value={progresoImportacion} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} disabled={importando}>
            Cancelar
          </Button>
          <Button 
            onClick={importarCSV} 
            variant="contained" 
            disabled={!archivoSeleccionado || importando}
          >
            Importar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Agregar/Editar Cliente */}
      <Dialog open={dialogoAbierto && (tipoDialogo === 'agregar' || tipoDialogo === 'editar')} onClose={cerrarDialogo} maxWidth="md" fullWidth>
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
              <Typography variant="h6" gutterBottom>
                Información Personal
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nombre"
                value={formularioCliente.nombre || ''}
                onChange={(e) => manejarCambioFormulario('nombre', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Apellido Paterno"
                value={formularioCliente.apellidoPaterno || ''}
                onChange={(e) => manejarCambioFormulario('apellidoPaterno', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Apellido Materno"
                value={formularioCliente.apellidoMaterno || ''}
                onChange={(e) => manejarCambioFormulario('apellidoMaterno', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formularioCliente.email || ''}
                onChange={(e) => manejarCambioFormulario('email', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formularioCliente.telefono || ''}
                onChange={(e) => manejarCambioFormulario('telefono', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Teléfono Secundario"
                value={formularioCliente.telefonoSecundario || ''}
                onChange={(e) => manejarCambioFormulario('telefonoSecundario', e.target.value)}
              />
            </Grid>

            {/* Información Fiscal */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Información Fiscal
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="RFC"
                value={formularioCliente.rfc || ''}
                onChange={(e) => manejarCambioFormulario('rfc', e.target.value)}
                placeholder="Ej: ABC123456789"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CURP"
                value={formularioCliente.curp || ''}
                onChange={(e) => manejarCambioFormulario('curp', e.target.value)}
                placeholder="Ej: ABC123456HDFXXX01"
              />
            </Grid>

            {/* Dirección */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Dirección
              </Typography>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Calle"
                value={formularioCliente.calle || ''}
                onChange={(e) => manejarCambioFormulario('calle', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="No. Ext."
                value={formularioCliente.numeroExterior || ''}
                onChange={(e) => manejarCambioFormulario('numeroExterior', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="No. Int."
                value={formularioCliente.numeroInterior || ''}
                onChange={(e) => manejarCambioFormulario('numeroInterior', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Colonia"
                value={formularioCliente.colonia || ''}
                onChange={(e) => manejarCambioFormulario('colonia', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Municipio"
                value={formularioCliente.municipio || ''}
                onChange={(e) => manejarCambioFormulario('municipio', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formularioCliente.estado || ''}
                  onChange={(e) => manejarCambioFormulario('estado', e.target.value)}
                  label="Estado"
                >
                  {estadosMexico.map((estado) => (
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
                label="Código Postal"
                value={formularioCliente.codigoPostal || ''}
                onChange={(e) => manejarCambioFormulario('codigoPostal', e.target.value)}
                required
                inputProps={{ maxLength: 5 }}
              />
            </Grid>

            {/* Información Comercial */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Información Comercial
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Ruta</InputLabel>
                <Select
                  value={formularioCliente.ruta || ''}
                  onChange={(e) => manejarCambioFormulario('ruta', e.target.value)}
                  label="Ruta"
                >
                  {rutasMexico.map((ruta) => (
                    <MenuItem key={ruta} value={ruta}>
                      {ruta}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Límite de Crédito"
                type="number"
                value={formularioCliente.limiteCredito || 0}
                onChange={(e) => manejarCambioFormulario('limiteCredito', Number(e.target.value))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Saldo Actual"
                type="number"
                value={formularioCliente.saldoActual || 0}
                onChange={(e) => manejarCambioFormulario('saldoActual', Number(e.target.value))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formularioCliente.pagosEspecialesAutorizados || false}
                    onChange={(e) => manejarCambioFormulario('pagosEspecialesAutorizados', e.target.checked)}
                  />
                }
                label="Pagos Especiales Autorizados"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado del Cliente</InputLabel>
                <Select
                  value={formularioCliente.estadoCliente || 'activo'}
                  onChange={(e) => manejarCambioFormulario('estadoCliente', e.target.value)}
                  label="Estado del Cliente"
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="suspendido">Suspendido</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            Cancelar
          </Button>
          <Button onClick={guardarCliente} variant="contained" startIcon={<SaveIcon />}>
            {tipoDialogo === 'agregar' ? 'Agregar' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Control de Crédito */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'credito'} onClose={cerrarDialogo} maxWidth="sm" fullWidth>
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
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Información de Crédito
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Límite de Crédito
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ${clienteSeleccionado.limiteCredito.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Saldo Actual
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={clienteSeleccionado.saldoActual > clienteSeleccionado.limiteCredito * 0.8 ? 'error' : 'success'}
                          >
                            ${clienteSeleccionado.saldoActual.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Crédito Disponible
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            ${(clienteSeleccionado.limiteCredito - clienteSeleccionado.saldoActual).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Historial de Movimientos Recientes
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUpIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Pago recibido"
                        secondary="15/01/2024 - $5,000.00"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingDownIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Venta a crédito"
                        secondary="10/01/2024 - $8,500.00"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PaymentIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Pago especial autorizado"
                        secondary="05/01/2024 - $2,000.00"
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity={clienteSeleccionado.saldoActual > clienteSeleccionado.limiteCredito * 0.8 ? 'warning' : 'success'}>
                    {clienteSeleccionado.saldoActual > clienteSeleccionado.limiteCredito * 0.8 
                      ? 'El cliente ha alcanzado el 80% de su límite de crédito'
                      : 'El cliente tiene crédito disponible'
                    }
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Historial */}
      <Dialog open={dialogoAbierto && tipoDialogo === 'historial'} onClose={cerrarDialogo} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Historial - {clienteSeleccionado ? obtenerNombreCompleto(clienteSeleccionado) : ''}
          </Box>
        </DialogTitle>
        <DialogContent>
          {clienteSeleccionado && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Información del Cliente
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Registro
                  </Typography>
                  <Typography variant="body1">
                    {new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString('es-MX')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Última Modificación
                  </Typography>
                  <Typography variant="body1">
                    {new Date(clienteSeleccionado.ultimaModificacion).toLocaleDateString('es-MX')}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Historial Completo
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EditIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cliente modificado"
                    secondary="25/01/2024 - Información de contacto actualizada"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUpIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pago recibido"
                    secondary="20/01/2024 - $5,000.00 - Referencia: PAG-001234"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingDownIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Venta a crédito"
                    secondary="15/01/2024 - $8,500.00 - Factura: FAC-005678"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CreditCardIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Límite de crédito modificado"
                    secondary="10/01/2024 - Nuevo límite: $50,000.00"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PaymentIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pago especial autorizado"
                    secondary="05/01/2024 - $2,000.00 - Autorizado por: Gerencia"
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
