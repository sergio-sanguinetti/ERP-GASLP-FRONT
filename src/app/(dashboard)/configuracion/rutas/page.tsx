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
  InputAdornment,
  Checkbox,
  DialogContentText,
  Alert,
  Snackbar
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Route as RouteIcon,
  LocationOn as LocationOnIcon,
  DirectionsCar as DirectionsCarIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Map as MapIcon
} from '@mui/icons-material'

// Tipos de datos
interface Ruta {
  id: string
  nombre: string
  codigo: string
  descripcion: string
  zona: string
  activa: boolean
  repartidorAsignado?: string
  vehiculoAsignado?: string
  configuracion: {
    capacidadMaxima: number
    tiempoEstimado: number // en minutos
    distanciaTotal: number // en km
    requiereValidacion: boolean
    permiteCambios: boolean
    horarioInicio: string
    horarioFin: string
  }
  puntosEntrega: PuntoEntrega[]
  estadisticas: {
    entregasCompletadas: number
    tiempoPromedio: number
    eficiencia: number
  }
  fechaCreacion: string
  fechaModificacion: string
  usuarioCreacion: string
  usuarioModificacion: string
}

interface PuntoEntrega {
  id: string
  nombre: string
  direccion: string
  coordenadas: {
    latitud: number
    longitud: number
  }
  ordenVisita: number
  tiempoEstimado: number
  activo: boolean
}

// Datos de ejemplo
const rutas: Ruta[] = [
  {
    id: '1',
    nombre: 'Ruta Centro',
    codigo: 'RTC-001',
    descripcion: 'Ruta principal del centro de la ciudad',
    zona: 'Centro',
    activa: true,
    repartidorAsignado: 'Juan Pérez',
    vehiculoAsignado: 'Vehículo A',
    configuracion: {
      capacidadMaxima: 50,
      tiempoEstimado: 180,
      distanciaTotal: 25.5,
      requiereValidacion: true,
      permiteCambios: true,
      horarioInicio: '08:00',
      horarioFin: '17:00'
    },
    puntosEntrega: [
      {
        id: '1',
        nombre: 'Cliente Centro 1',
        direccion: 'Av. Principal 123',
        coordenadas: { latitud: 19.4326, longitud: -99.1332 },
        ordenVisita: 1,
        tiempoEstimado: 15,
        activo: true
      },
      {
        id: '2',
        nombre: 'Cliente Centro 2',
        direccion: 'Calle Secundaria 456',
        coordenadas: { latitud: 19.4330, longitud: -99.1335 },
        ordenVisita: 2,
        tiempoEstimado: 20,
        activo: true
      }
    ],
    estadisticas: {
      entregasCompletadas: 245,
      tiempoPromedio: 165,
      eficiencia: 92
    },
    fechaCreacion: '2024-01-01',
    fechaModificacion: '2024-01-15',
    usuarioCreacion: 'Admin Sistema',
    usuarioModificacion: 'Gerente Logística'
  },
  {
    id: '2',
    nombre: 'Ruta Norte',
    codigo: 'RTN-002',
    descripcion: 'Ruta de la zona norte de la ciudad',
    zona: 'Norte',
    activa: true,
    repartidorAsignado: 'María García',
    vehiculoAsignado: 'Vehículo B',
    configuracion: {
      capacidadMaxima: 40,
      tiempoEstimado: 200,
      distanciaTotal: 32.0,
      requiereValidacion: true,
      permiteCambios: false,
      horarioInicio: '09:00',
      horarioFin: '18:00'
    },
    puntosEntrega: [
      {
        id: '3',
        nombre: 'Cliente Norte 1',
        direccion: 'Av. Norte 789',
        coordenadas: { latitud: 19.4500, longitud: -99.1200 },
        ordenVisita: 1,
        tiempoEstimado: 25,
        activo: true
      }
    ],
    estadisticas: {
      entregasCompletadas: 180,
      tiempoPromedio: 195,
      eficiencia: 88
    },
    fechaCreacion: '2024-01-01',
    fechaModificacion: '2024-01-20',
    usuarioCreacion: 'Admin Sistema',
    usuarioModificacion: 'Admin Sistema'
  },
  {
    id: '3',
    nombre: 'Ruta Sur',
    codigo: 'RTS-003',
    descripcion: 'Ruta de la zona sur de la ciudad',
    zona: 'Sur',
    activa: false,
    repartidorAsignado: 'Carlos López',
    vehiculoAsignado: 'Vehículo C',
    configuracion: {
      capacidadMaxima: 35,
      tiempoEstimado: 150,
      distanciaTotal: 28.5,
      requiereValidacion: false,
      permiteCambios: true,
      horarioInicio: '08:30',
      horarioFin: '16:30'
    },
    puntosEntrega: [],
    estadisticas: {
      entregasCompletadas: 120,
      tiempoPromedio: 140,
      eficiencia: 85
    },
    fechaCreacion: '2024-01-01',
    fechaModificacion: '2024-01-10',
    usuarioCreacion: 'Admin Sistema',
    usuarioModificacion: 'Admin Sistema'
  }
]

export default function ConfiguracionRutasPage() {
  const [rutasList, setRutasList] = useState<Ruta[]>(rutas)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'crear' | 'editar' | 'eliminar' | 'ver'>('crear')
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null)
  const [formulario, setFormulario] = useState<Partial<Ruta>>({})
  const [snackbar, setSnackbar] = useState({ abierto: false, mensaje: '', tipo: 'success' as 'success' | 'error' })

  const [filtros, setFiltros] = useState({
    nombre: '',
    zona: '',
    activa: '',
    repartidor: ''
  })

  const abrirDialogo = (tipo: 'crear' | 'editar' | 'eliminar' | 'ver', ruta?: Ruta) => {
    setTipoDialogo(tipo)
    setRutaSeleccionada(ruta || null)

    if (tipo === 'crear') {
      setFormulario({
        activa: true,
        configuracion: {
          capacidadMaxima: 50,
          tiempoEstimado: 180,
          distanciaTotal: 0,
          requiereValidacion: true,
          permiteCambios: true,
          horarioInicio: '08:00',
          horarioFin: '17:00'
        },
        puntosEntrega: [],
        estadisticas: {
          entregasCompletadas: 0,
          tiempoPromedio: 0,
          eficiencia: 0
        },
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaModificacion: new Date().toISOString().split('T')[0],
        usuarioCreacion: 'Usuario Actual',
        usuarioModificacion: 'Usuario Actual'
      })
    } else if (tipo === 'editar' && ruta) {
      setFormulario({ ...ruta })
    }

    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setRutaSeleccionada(null)
    setFormulario({})
  }

  const manejarCambioFormulario = (campo: string, valor: any) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }))
  }

  const manejarCambioConfiguracion = (campo: string, valor: any) => {
    setFormulario(prev => ({
      ...prev,
      configuracion: {
        ...prev.configuracion,
        [campo]: valor
      }
    }))
  }

  const guardarRuta = () => {
    if (!formulario.nombre || !formulario.codigo || !formulario.zona) {
      setSnackbar({ abierto: true, mensaje: 'Por favor complete todos los campos obligatorios', tipo: 'error' })
      return
    }

    if (tipoDialogo === 'crear') {
      const nuevaRuta: Ruta = {
        id: Date.now().toString(),
        ...formulario as Ruta
      }
      setRutasList(prev => [...prev, nuevaRuta])
      setSnackbar({ abierto: true, mensaje: 'Ruta creada exitosamente', tipo: 'success' })
    } else if (tipoDialogo === 'editar') {
      setRutasList(prev => prev.map(ruta => 
        ruta.id === rutaSeleccionada?.id 
          ? { ...ruta, ...formulario, fechaModificacion: new Date().toISOString().split('T')[0] }
          : ruta
      ))
      setSnackbar({ abierto: true, mensaje: 'Ruta actualizada exitosamente', tipo: 'success' })
    }

    cerrarDialogo()
  }

  const eliminarRuta = () => {
    if (rutaSeleccionada) {
      setRutasList(prev => prev.filter(ruta => ruta.id !== rutaSeleccionada.id))
      setSnackbar({ abierto: true, mensaje: 'Ruta eliminada exitosamente', tipo: 'success' })
      cerrarDialogo()
    }
  }

  const filtrarRutas = () => {
    return rutasList.filter(ruta => {
      const cumpleNombre = !filtros.nombre || ruta.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
      const cumpleZona = !filtros.zona || ruta.zona.toLowerCase().includes(filtros.zona.toLowerCase())
      const cumpleEstado = !filtros.activa || (filtros.activa === 'activa' && ruta.activa) || (filtros.activa === 'inactiva' && !ruta.activa)
      const cumpleRepartidor = !filtros.repartidor || (ruta.repartidorAsignado && ruta.repartidorAsignado.toLowerCase().includes(filtros.repartidor.toLowerCase()))

      return cumpleNombre && cumpleZona && cumpleEstado && cumpleRepartidor
    })
  }

  const rutasFiltradas = filtrarRutas()

  const obtenerIconoTipo = (zona: string) => {
    switch (zona.toLowerCase()) {
      case 'centro': return <LocationOnIcon />
      case 'norte': return <DirectionsCarIcon />
      case 'sur': return <MapIcon />
      default: return <RouteIcon />
    }
  }

  const obtenerColorEstado = (activa: boolean) => {
    return activa ? 'success' : 'error'
  }

  const obtenerColorEficiencia = (eficiencia: number) => {
    if (eficiencia >= 90) return 'success'
    if (eficiencia >= 70) return 'warning'
    return 'error'
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <RouteIcon />
          Configuración de Rutas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra las rutas de entrega, asignaciones de repartidores y configuración de zonas
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar por nombre"
                value={filtros.nombre}
                onChange={(e) => setFiltros(prev => ({ ...prev, nombre: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Zona</InputLabel>
                <Select
                  value={filtros.zona}
                  onChange={(e) => setFiltros(prev => ({ ...prev, zona: e.target.value }))}
                  label="Zona"
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="centro">Centro</MenuItem>
                  <MenuItem value="norte">Norte</MenuItem>
                  <MenuItem value="sur">Sur</MenuItem>
                  <MenuItem value="este">Este</MenuItem>
                  <MenuItem value="oeste">Oeste</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtros.activa}
                  onChange={(e) => setFiltros(prev => ({ ...prev, activa: e.target.value }))}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="activa">Activa</MenuItem>
                  <MenuItem value="inactiva">Inactiva</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Repartidor"
                value={filtros.repartidor}
                onChange={(e) => setFiltros(prev => ({ ...prev, repartidor: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setFiltros({ nombre: '', zona: '', activa: '', repartidor: '' })}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Acciones */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => abrirDialogo('crear')}
          >
            Nueva Ruta
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Exportar
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {rutasFiltradas.length} de {rutasList.length} rutas
        </Typography>
      </Box>

      {/* Tabla de Rutas */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ruta</TableCell>
                <TableCell>Zona</TableCell>
                <TableCell>Repartidor</TableCell>
                <TableCell>Vehículo</TableCell>
                <TableCell>Configuración</TableCell>
                <TableCell>Estadísticas</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rutasFiltradas.map((ruta) => (
                <TableRow key={ruta.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {ruta.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ruta.codigo}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {obtenerIconoTipo(ruta.zona)}
                      <Typography variant="body2">{ruta.zona}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {ruta.repartidorAsignado || 'Sin asignar'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {ruta.vehiculoAsignado || 'Sin asignar'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Capacidad: {ruta.configuracion.capacidadMaxima}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tiempo: {ruta.configuracion.tiempoEstimado} min
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Distancia: {ruta.configuracion.distanciaTotal} km
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Entregas: {ruta.estadisticas.entregasCompletadas}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tiempo prom: {ruta.estadisticas.tiempoPromedio} min
                      </Typography>
                      <Chip
                        size="small"
                        label={`${ruta.estadisticas.eficiencia}%`}
                        color={obtenerColorEficiencia(ruta.estadisticas.eficiencia)}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ruta.activa ? 'Activa' : 'Inactiva'}
                      color={obtenerColorEstado(ruta.activa)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => abrirDialogo('ver', ruta)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => abrirDialogo('editar', ruta)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => abrirDialogo('eliminar', ruta)}
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
      </Card>

      {/* Dialog para Crear/Editar/Ver/Eliminar */}
      <Dialog
        open={dialogoAbierto}
        onClose={cerrarDialogo}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {tipoDialogo === 'crear' && 'Nueva Ruta'}
          {tipoDialogo === 'editar' && 'Editar Ruta'}
          {tipoDialogo === 'ver' && 'Detalles de la Ruta'}
          {tipoDialogo === 'eliminar' && 'Eliminar Ruta'}
        </DialogTitle>
        <DialogContent>
          {tipoDialogo === 'eliminar' ? (
            <DialogContentText>
              ¿Está seguro de que desea eliminar la ruta "{rutaSeleccionada?.nombre}"?
              Esta acción no se puede deshacer.
            </DialogContentText>
          ) : tipoDialogo === 'ver' ? (
            <Box>
              {rutaSeleccionada && (
                <>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Información General</Typography>
                      <Typography variant="body2"><strong>Nombre:</strong> {rutaSeleccionada.nombre}</Typography>
                      <Typography variant="body2"><strong>Código:</strong> {rutaSeleccionada.codigo}</Typography>
                      <Typography variant="body2"><strong>Zona:</strong> {rutaSeleccionada.zona}</Typography>
                      <Typography variant="body2"><strong>Descripción:</strong> {rutaSeleccionada.descripcion}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Asignaciones</Typography>
                      <Typography variant="body2"><strong>Repartidor:</strong> {rutaSeleccionada.repartidorAsignado || 'Sin asignar'}</Typography>
                      <Typography variant="body2"><strong>Vehículo:</strong> {rutaSeleccionada.vehiculoAsignado || 'Sin asignar'}</Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Configuración</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2"><strong>Capacidad:</strong> {rutaSeleccionada.configuracion.capacidadMaxima}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2"><strong>Tiempo:</strong> {rutaSeleccionada.configuracion.tiempoEstimado} min</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2"><strong>Distancia:</strong> {rutaSeleccionada.configuracion.distanciaTotal} km</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2"><strong>Horario:</strong> {rutaSeleccionada.configuracion.horarioInicio} - {rutaSeleccionada.configuracion.horarioFin}</Typography>
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre de la Ruta"
                    value={formulario.nombre || ''}
                    onChange={(e) => manejarCambioFormulario('nombre', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Código"
                    value={formulario.codigo || ''}
                    onChange={(e) => manejarCambioFormulario('codigo', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Zona</InputLabel>
                    <Select
                      value={formulario.zona || ''}
                      onChange={(e) => manejarCambioFormulario('zona', e.target.value)}
                      label="Zona"
                    >
                      <MenuItem value="centro">Centro</MenuItem>
                      <MenuItem value="norte">Norte</MenuItem>
                      <MenuItem value="sur">Sur</MenuItem>
                      <MenuItem value="este">Este</MenuItem>
                      <MenuItem value="oeste">Oeste</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Repartidor Asignado"
                    value={formulario.repartidorAsignado || ''}
                    onChange={(e) => manejarCambioFormulario('repartidorAsignado', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formulario.descripcion || ''}
                    onChange={(e) => manejarCambioFormulario('descripcion', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Vehículo Asignado"
                    value={formulario.vehiculoAsignado || ''}
                    onChange={(e) => manejarCambioFormulario('vehiculoAsignado', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formulario.activa || false}
                        onChange={(e) => manejarCambioFormulario('activa', e.target.checked)}
                      />
                    }
                    label="Ruta Activa"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="subtitle2">Configuración de la Ruta</Typography>
                  </Divider>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Capacidad Máxima"
                    type="number"
                    value={formulario.configuracion?.capacidadMaxima || ''}
                    onChange={(e) => manejarCambioConfiguracion('capacidadMaxima', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Tiempo Estimado (min)"
                    type="number"
                    value={formulario.configuracion?.tiempoEstimado || ''}
                    onChange={(e) => manejarCambioConfiguracion('tiempoEstimado', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Distancia Total (km)"
                    type="number"
                    step="0.1"
                    value={formulario.configuracion?.distanciaTotal || ''}
                    onChange={(e) => manejarCambioConfiguracion('distanciaTotal', parseFloat(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Horario de Inicio"
                    type="time"
                    value={formulario.configuracion?.horarioInicio || ''}
                    onChange={(e) => manejarCambioConfiguracion('horarioInicio', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Horario de Fin"
                    type="time"
                    value={formulario.configuracion?.horarioFin || ''}
                    onChange={(e) => manejarCambioConfiguracion('horarioFin', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formulario.configuracion?.requiereValidacion || false}
                        onChange={(e) => manejarCambioConfiguracion('requiereValidacion', e.target.checked)}
                      />
                    }
                    label="Requiere Validación"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formulario.configuracion?.permiteCambios || false}
                        onChange={(e) => manejarCambioConfiguracion('permiteCambios', e.target.checked)}
                      />
                    }
                    label="Permite Cambios"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            {tipoDialogo === 'eliminar' ? 'Cancelar' : 'Cerrar'}
          </Button>
          {tipoDialogo === 'eliminar' && (
            <Button onClick={eliminarRuta} color="error" variant="contained">
              Eliminar
            </Button>
          )}
          {(tipoDialogo === 'crear' || tipoDialogo === 'editar') && (
            <Button onClick={guardarRuta} variant="contained" startIcon={<SaveIcon />}>
              {tipoDialogo === 'crear' ? 'Crear' : 'Guardar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.abierto}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, abierto: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, abierto: false }))}
          severity={snackbar.tipo}
          sx={{ width: '100%' }}
        >
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  )
}



