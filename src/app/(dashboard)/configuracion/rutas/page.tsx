'use client'

import React, { useState, useEffect } from 'react'

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

// Type Imports
import { rutasAPI, usuariosAPI, zonasAPI, sedesAPI, type Ruta, type User, type Ciudad, type Municipio, type Zona, type Sede } from '@lib/api'
import { useAuth } from '@contexts/AuthContext'

export default function ConfiguracionRutasPage() {
  const { user } = useAuth()
  const [rutasList, setRutasList] = useState<Ruta[]>([])
  const [repartidores, setRepartidores] = useState<User[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'crear' | 'editar' | 'eliminar' | 'ver'>('crear')
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null)
  const [formulario, setFormulario] = useState<Partial<Ruta & { repartidoresIds: string[] }>>({})
  const [snackbar, setSnackbar] = useState({ abierto: false, mensaje: '', tipo: 'success' as 'success' | 'error' })
  
  // Estados para los selectores en cascada
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>('')
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState<string>('')
  const [zonaSeleccionada, setZonaSeleccionada] = useState<string>('')

  const [filtros, setFiltros] = useState({
    nombre: '',
    zona: '',
    activa: '',
    repartidor: ''
  })

  // Cargar repartidores, sedes y zonas al montar
  useEffect(() => {
    loadRepartidores()
    loadSedes()
    loadCiudades()
  }, [])

  // Cargar municipios cuando se selecciona una ciudad
  useEffect(() => {
    if (ciudadSeleccionada) {
      loadMunicipios(ciudadSeleccionada)
    } else {
      setMunicipios([])
      setMunicipioSeleccionado('')
    }
  }, [ciudadSeleccionada])

  // Cargar zonas cuando se selecciona un municipio
  useEffect(() => {
    if (municipioSeleccionado) {
      loadZonas(municipioSeleccionado)
    } else {
      setZonas([])
      setZonaSeleccionada('')
    }
  }, [municipioSeleccionado])

  // Cargar rutas al montar y cuando cambian los filtros
  useEffect(() => {
    loadRutas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.nombre, filtros.zona, filtros.activa, filtros.repartidor])

  const loadRepartidores = async () => {
    try {
      const usuarios = await usuariosAPI.getAll()
      const repartidoresList = usuarios.filter(u => u.rol === 'repartidor' && u.estado === 'activo')
      setRepartidores(repartidoresList)
    } catch (err: any) {
      console.error('Error loading repartidores:', err)
    }
  }

  const loadSedes = async () => {
    try {
      const data = await sedesAPI.getAll()
      setSedes(data.filter(s => s.estado === 'activa'))
    } catch (err: any) {
      console.error('Error loading sedes:', err)
    }
  }

  const loadCiudades = async () => {
    try {
      const data = await zonasAPI.ciudades.getAll()
      setCiudades(data)
    } catch (err: any) {
      console.error('Error loading ciudades:', err)
    }
  }

  const loadMunicipios = async (ciudadId: string) => {
    try {
      const data = await zonasAPI.municipios.getAll(ciudadId)
      setMunicipios(data)
      setMunicipioSeleccionado('')
      setZonaSeleccionada('')
    } catch (err: any) {
      console.error('Error loading municipios:', err)
    }
  }

  const loadZonas = async (municipioId: string) => {
    try {
      const data = await zonasAPI.getAll(municipioId)
      setZonas(data)
      setZonaSeleccionada('')
    } catch (err: any) {
      console.error('Error loading zonas:', err)
    }
  }

  const loadRutas = async () => {
    try {
      setLoading(true)
      const data = await rutasAPI.getAll({
        nombre: filtros.nombre || undefined,
        zona: filtros.zona || undefined,
        activa: filtros.activa || undefined,
        repartidor: filtros.repartidor || undefined
      })
      setRutasList(data)
    } catch (err: any) {
      setSnackbar({ abierto: true, mensaje: err.message || 'Error al cargar rutas', tipo: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const abrirDialogo = (tipo: 'crear' | 'editar' | 'eliminar' | 'ver', ruta?: Ruta) => {
    setTipoDialogo(tipo)
    setRutaSeleccionada(ruta || null)

    if (tipo === 'crear') {
      setFormulario({
        activa: true,
        horarioInicio: '08:00',
        horarioFin: '17:00',
        repartidoresIds: [],
        sedeId: ''
      })
      setCiudadSeleccionada('')
      setMunicipioSeleccionado('')
      setZonaSeleccionada('')
    } else if (tipo === 'editar' && ruta) {
      setFormulario({
        ...ruta,
        repartidoresIds: ruta.repartidores?.map(r => r.id) || [],
        sedeId: ruta.sedeId || ''
      })
      // Si la ruta tiene zonaRelacion, establecer los selectores
      if (ruta.zonaRelacion) {
        const zona = ruta.zonaRelacion
        const municipio = zona.municipio
        const ciudad = municipio?.ciudad
        
        if (ciudad) {
          setCiudadSeleccionada(ciudad.id)
          loadMunicipios(ciudad.id).then(() => {
            if (municipio) {
              setMunicipioSeleccionado(municipio.id)
              loadZonas(municipio.id).then(() => {
                setZonaSeleccionada(zona.id)
              })
            }
          })
        }
      } else if (ruta.zonaId) {
        // Si solo tiene zonaId, cargar la zona completa
        zonasAPI.getById(ruta.zonaId).then(zona => {
          if (zona.municipio) {
            const municipio = zona.municipio
            const ciudad = municipio.ciudad
            if (ciudad) {
              setCiudadSeleccionada(ciudad.id)
              loadMunicipios(ciudad.id).then(() => {
                setMunicipioSeleccionado(municipio.id)
                loadZonas(municipio.id).then(() => {
                  setZonaSeleccionada(zona.id)
                })
              })
            }
          }
        }).catch(err => console.error('Error loading zona:', err))
      }
    }

    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setRutaSeleccionada(null)
    setFormulario({})
    setCiudadSeleccionada('')
    setMunicipioSeleccionado('')
    setZonaSeleccionada('')
  }

  const manejarCambioFormulario = (campo: string, valor: any) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }))
  }

  const guardarRuta = async () => {
    if (!formulario.nombre || !formulario.codigo || !zonaSeleccionada) {
      setSnackbar({ abierto: true, mensaje: 'Por favor complete todos los campos obligatorios y seleccione una zona', tipo: 'error' })
      return
    }

    setSaving(true)
    try {
      if (tipoDialogo === 'crear') {
        await rutasAPI.create({
          nombre: formulario.nombre!,
          codigo: formulario.codigo!,
          descripcion: formulario.descripcion,
          zonaId: zonaSeleccionada,
          sedeId: formulario.sedeId || undefined,
          activa: formulario.activa !== undefined ? formulario.activa : true,
          horarioInicio: formulario.horarioInicio,
          horarioFin: formulario.horarioFin,
          repartidoresIds: formulario.repartidoresIds || [],
          usuarioCreacion: user?.nombres || user?.email || 'Sistema',
          usuarioModificacion: user?.nombres || user?.email || 'Sistema'
        })
        setSnackbar({ abierto: true, mensaje: 'Ruta creada exitosamente', tipo: 'success' })
      } else if (tipoDialogo === 'editar' && rutaSeleccionada) {
        await rutasAPI.update(rutaSeleccionada.id, {
          nombre: formulario.nombre,
          codigo: formulario.codigo,
          descripcion: formulario.descripcion,
          zonaId: zonaSeleccionada,
          sedeId: formulario.sedeId || undefined,
          activa: formulario.activa,
          horarioInicio: formulario.horarioInicio,
          horarioFin: formulario.horarioFin,
          repartidoresIds: formulario.repartidoresIds || [],
          usuarioModificacion: user?.nombres || user?.email || 'Sistema'
        })
        setSnackbar({ abierto: true, mensaje: 'Ruta actualizada exitosamente', tipo: 'success' })
      }
      cerrarDialogo()
      await loadRutas()
    } catch (err: any) {
      setSnackbar({ abierto: true, mensaje: err.message || 'Error al guardar ruta', tipo: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const eliminarRuta = async () => {
    if (!rutaSeleccionada) return

    setDeleting(true)
    try {
      await rutasAPI.delete(rutaSeleccionada.id)
      setSnackbar({ abierto: true, mensaje: 'Ruta eliminada exitosamente', tipo: 'success' })
      cerrarDialogo()
      await loadRutas()
    } catch (err: any) {
      setSnackbar({ abierto: true, mensaje: err.message || 'Error al eliminar ruta', tipo: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  // Los filtros ya se aplican en el backend
  const rutasFiltradas = rutasList

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
        {loading && rutasList.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Cargando rutas...</Typography>
          </Box>
        ) : rutasFiltradas.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography color="text.secondary">No hay rutas registradas</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ruta</TableCell>
                <TableCell>Zona</TableCell>
                <TableCell>Sede</TableCell>
                <TableCell>Repartidores</TableCell>
                <TableCell>Horario</TableCell>
                <TableCell>Descripción</TableCell>
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
                      <Box>
                        {ruta.zonaRelacion ? (
                          <>
                            <Typography variant="body2" fontWeight="bold">
                              {ruta.zonaRelacion.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ruta.zonaRelacion.municipio?.nombre} - {ruta.zonaRelacion.municipio?.ciudad?.estado}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2">{ruta.zona}</Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {ruta.sede ? (
                      <Typography variant="body2" fontWeight="medium">
                        {ruta.sede.nombre}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin sede asignada
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {ruta.repartidores && ruta.repartidores.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {ruta.repartidores.map(repartidor => (
                          <Chip
                            key={repartidor.id}
                            label={`${repartidor.nombres} ${repartidor.apellidoPaterno}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin asignar
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      {ruta.horarioInicio && ruta.horarioFin ? (
                        <Typography variant="caption" color="text.secondary">
                          Horario: {ruta.horarioInicio} - {ruta.horarioFin}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin horario definido
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {ruta.descripcion || 'Sin descripción'}
                    </Typography>
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
        )}
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
                      <Typography variant="body2">
                        <strong>Zona:</strong>{' '}
                        {rutaSeleccionada.zonaRelacion ? (
                          <>
                            {rutaSeleccionada.zonaRelacion.nombre} 
                            {' - '}
                            {rutaSeleccionada.zonaRelacion.municipio?.nombre} 
                            {' - '}
                            {rutaSeleccionada.zonaRelacion.municipio?.ciudad?.estado}
                          </>
                        ) : (
                          rutaSeleccionada.zona
                        )}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Sede:</strong>{' '}
                        {rutaSeleccionada.sede ? rutaSeleccionada.sede.nombre : 'Sin sede asignada'}
                      </Typography>
                      <Typography variant="body2"><strong>Descripción:</strong> {rutaSeleccionada.descripcion}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Asignaciones</Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Repartidores:</strong>{' '}
                        {rutaSeleccionada.repartidores && rutaSeleccionada.repartidores.length > 0
                          ? rutaSeleccionada.repartidores.map(r => `${r.nombres} ${r.apellidoPaterno}`).join(', ')
                          : 'Sin asignar'}
                      </Typography>
                      {rutaSeleccionada.horarioInicio && rutaSeleccionada.horarioFin && (
                        <Typography variant="body2"><strong>Horario:</strong> {rutaSeleccionada.horarioInicio} - {rutaSeleccionada.horarioFin}</Typography>
                      )}
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
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Ciudad</InputLabel>
                    <Select
                      value={ciudadSeleccionada}
                      onChange={(e) => {
                        setCiudadSeleccionada(e.target.value)
                        setMunicipioSeleccionado('')
                        setZonaSeleccionada('')
                      }}
                      label="Ciudad"
                    >
                      <MenuItem value="">Seleccione una ciudad</MenuItem>
                      {ciudades.filter(c => c.activa).map((ciudad) => (
                        <MenuItem key={ciudad.id} value={ciudad.id}>
                          {ciudad.estado}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required disabled={!ciudadSeleccionada}>
                    <InputLabel>Municipio</InputLabel>
                    <Select
                      value={municipioSeleccionado}
                      onChange={(e) => {
                        setMunicipioSeleccionado(e.target.value)
                        setZonaSeleccionada('')
                      }}
                      label="Municipio"
                    >
                      <MenuItem value="">Seleccione un municipio</MenuItem>
                      {municipios.filter(m => m.activo).map((municipio) => (
                        <MenuItem key={municipio.id} value={municipio.id}>
                          {municipio.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required disabled={!municipioSeleccionado}>
                    <InputLabel>Zona</InputLabel>
                    <Select
                      value={zonaSeleccionada}
                      onChange={(e) => setZonaSeleccionada(e.target.value)}
                      label="Zona"
                    >
                      <MenuItem value="">Seleccione una zona</MenuItem>
                      {zonas.filter(z => z.activa).map((zona) => (
                        <MenuItem key={zona.id} value={zona.id}>
                          {zona.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sede</InputLabel>
                    <Select
                      value={formulario.sedeId || ''}
                      onChange={(e) => manejarCambioFormulario('sedeId', e.target.value)}
                      label="Sede"
                    >
                      <MenuItem value="">Sin sede asignada</MenuItem>
                      {sedes.map((sede) => (
                        <MenuItem key={sede.id} value={sede.id}>
                          {sede.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Repartidores Asignados</InputLabel>
                    <Select
                      multiple
                      value={formulario.repartidoresIds || []}
                      onChange={(e) => manejarCambioFormulario('repartidoresIds', e.target.value)}
                      label="Repartidores Asignados"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((id) => {
                            const repartidor = repartidores.find(r => r.id === id)
                            return repartidor ? (
                              <Chip key={id} label={`${repartidor.nombres} ${repartidor.apellidoPaterno}`} size="small" />
                            ) : null
                          })}
                        </Box>
                      )}
                    >
                      {repartidores.map((repartidor) => (
                        <MenuItem key={repartidor.id} value={repartidor.id}>
                          <Checkbox checked={(formulario.repartidoresIds || []).indexOf(repartidor.id) > -1} />
                          {repartidor.nombres} {repartidor.apellidoPaterno} {repartidor.apellidoMaterno}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Horario de Inicio"
                    type="time"
                    value={formulario.horarioInicio || ''}
                    onChange={(e) => manejarCambioFormulario('horarioInicio', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Horario de Fin"
                    type="time"
                    value={formulario.horarioFin || ''}
                    onChange={(e) => manejarCambioFormulario('horarioFin', e.target.value)}
                    InputLabelProps={{ shrink: true }}
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
            <Button onClick={eliminarRuta} color="error" variant="contained" disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          )}
          {(tipoDialogo === 'crear' || tipoDialogo === 'editar') && (
            <Button onClick={guardarRuta} variant="contained" startIcon={<SaveIcon />} disabled={saving}>
              {saving ? 'Guardando...' : tipoDialogo === 'crear' ? 'Crear' : 'Guardar'}
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




