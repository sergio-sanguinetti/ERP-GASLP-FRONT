'use client'

import React, { useState, useEffect } from 'react'
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
  Tabs,
  Tab,
  CircularProgress,
  Breadcrumbs,
  Link
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Map as MapIcon
} from '@mui/icons-material'
import { zonasAPI, type Ciudad, type Municipio, type Zona } from '@/lib/api'

// Estados de México
const estadosMexico = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
]

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`zona-tabpanel-${index}`}
      aria-labelledby={`zona-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ZonasPage() {
  const [tabValue, setTabValue] = useState(0)
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para diálogos
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'ciudad' | 'municipio' | 'zona'>('ciudad')
  const [accionDialogo, setAccionDialogo] = useState<'crear' | 'editar'>('crear')
  const [itemSeleccionado, setItemSeleccionado] = useState<Ciudad | Municipio | Zona | null>(null)
  
  // Estados para formularios
  const [formCiudad, setFormCiudad] = useState<Partial<Ciudad>>({})
  const [formMunicipio, setFormMunicipio] = useState<Partial<Municipio>>({})
  const [formZona, setFormZona] = useState<Partial<Zona>>({})
  
  // Filtros
  const [ciudadFiltro, setCiudadFiltro] = useState<string>('')
  const [municipioFiltro, setMunicipioFiltro] = useState<string>('')

  // Cargar datos
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ciudadesData, municipiosData, zonasData] = await Promise.all([
        zonasAPI.ciudades.getAll(),
        zonasAPI.municipios.getAll(),
        zonasAPI.getAll()
      ])
      setCiudades(ciudadesData)
      setMunicipios(municipiosData)
      setZonas(zonasData)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const cargarMunicipios = async (ciudadId?: string) => {
    try {
      const data = await zonasAPI.municipios.getAll(ciudadId)
      setMunicipios(data)
    } catch (err: any) {
      console.error('Error cargando municipios:', err)
    }
  }

  const cargarZonas = async (municipioId?: string, ciudadId?: string) => {
    try {
      const data = await zonasAPI.getAll(municipioId, ciudadId)
      setZonas(data)
    } catch (err: any) {
      console.error('Error cargando zonas:', err)
    }
  }

  const abrirDialogo = (tipo: 'ciudad' | 'municipio' | 'zona', accion: 'crear' | 'editar', item?: Ciudad | Municipio | Zona) => {
    setTipoDialogo(tipo)
    setAccionDialogo(accion)
    setItemSeleccionado(item || null)
    
    if (accion === 'crear') {
      if (tipo === 'ciudad') {
        setFormCiudad({ activa: true, estado: '' })
      } else if (tipo === 'municipio') {
        setFormMunicipio({ activo: true, ciudadId: ciudadFiltro || '' })
      } else if (tipo === 'zona') {
        setFormZona({ activa: true, municipioId: municipioFiltro || '' })
      }
    } else if (item) {
      if (tipo === 'ciudad') {
        setFormCiudad(item as Ciudad)
      } else if (tipo === 'municipio') {
        setFormMunicipio(item as Municipio)
      } else if (tipo === 'zona') {
        setFormZona(item as Zona)
      }
    }
    
    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setItemSeleccionado(null)
    setFormCiudad({})
    setFormMunicipio({})
    setFormZona({})
  }

  const guardarCiudad = async () => {
    try {
      setLoading(true)
      if (accionDialogo === 'crear') {
        await zonasAPI.ciudades.create(formCiudad as any)
      } else if (itemSeleccionado) {
        await zonasAPI.ciudades.update(itemSeleccionado.id, formCiudad as any)
      }
      await cargarDatos()
      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al guardar ciudad')
    } finally {
      setLoading(false)
    }
  }

  const guardarMunicipio = async () => {
    try {
      setLoading(true)
      if (accionDialogo === 'crear') {
        await zonasAPI.municipios.create(formMunicipio as any)
      } else if (itemSeleccionado) {
        await zonasAPI.municipios.update(itemSeleccionado.id, formMunicipio as any)
      }
      await cargarDatos()
      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al guardar municipio')
    } finally {
      setLoading(false)
    }
  }

  const guardarZona = async () => {
    try {
      setLoading(true)
      if (accionDialogo === 'crear') {
        await zonasAPI.create(formZona as any)
      } else if (itemSeleccionado) {
        await zonasAPI.update(itemSeleccionado.id, formZona as any)
      }
      await cargarDatos()
      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al guardar zona')
    } finally {
      setLoading(false)
    }
  }

  const eliminarCiudad = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta ciudad? Esto eliminará también todos los municipios y zonas asociados.')) {
      return
    }
    try {
      setLoading(true)
      await zonasAPI.ciudades.delete(id)
      await cargarDatos()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar ciudad')
    } finally {
      setLoading(false)
    }
  }

  const eliminarMunicipio = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este municipio? Esto eliminará también todas las zonas asociadas.')) {
      return
    }
    try {
      setLoading(true)
      await zonasAPI.municipios.delete(id)
      await cargarDatos()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar municipio')
    } finally {
      setLoading(false)
    }
  }

  const eliminarZona = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta zona?')) {
      return
    }
    try {
      setLoading(true)
      await zonasAPI.delete(id)
      await cargarDatos()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar zona')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Filtrar datos
  const municipiosFiltrados = municipios.filter(m => 
    !ciudadFiltro || m.ciudadId === ciudadFiltro
  )

  const zonasFiltradas = zonas.filter(z => {
    if (municipioFiltro) {
      return z.municipioId === municipioFiltro
    }
    if (ciudadFiltro) {
      const municipio = municipios.find(m => m.id === z.municipioId)
      return municipio?.ciudadId === ciudadFiltro
    }
    return true
  })

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Zonas
      </Typography>
      
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/home">
          Home
        </Link>
        <Typography color="text.primary">Zonas</Typography>
      </Breadcrumbs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tabs de zonas">
            <Tab icon={<HomeIcon />} iconPosition="start" label="Ciudades" />
            <Tab icon={<BusinessIcon />} iconPosition="start" label="Municipios" />
            <Tab icon={<MapIcon />} iconPosition="start" label="Zonas" />
          </Tabs>
        </Box>

        {/* Tab Ciudades */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Lista de Ciudades</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => abrirDialogo('ciudad', 'crear')}
            >
              Agregar Ciudad
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Estado</TableCell>
                    <TableCell>Ciudad Activa</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ciudades.map((ciudad) => (
                    <TableRow key={ciudad.id}>
                      <TableCell>{ciudad.estado}</TableCell>
                      <TableCell>
                        <Chip
                          label={ciudad.activa ? 'Activa' : 'Inactiva'}
                          color={ciudad.activa ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => abrirDialogo('ciudad', 'editar', ciudad)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => eliminarCiudad(ciudad.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Tab Municipios */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Lista de Municipios</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => abrirDialogo('municipio', 'crear')}
            >
              Agregar Municipio
            </Button>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Filtrar por Ciudad</InputLabel>
            <Select
              value={ciudadFiltro}
              onChange={(e) => {
                setCiudadFiltro(e.target.value)
                cargarMunicipios(e.target.value || undefined)
              }}
              label="Filtrar por Ciudad"
            >
              <MenuItem value="">Todas las ciudades</MenuItem>
              {ciudades.map((ciudad) => (
                <MenuItem key={ciudad.id} value={ciudad.id}>
                  {ciudad.estado}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Ciudad</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {municipiosFiltrados.map((municipio) => (
                    <TableRow key={municipio.id}>
                      <TableCell>{municipio.nombre}</TableCell>
                      <TableCell>{municipio.codigo || '-'}</TableCell>
                      <TableCell>
                        {municipio.ciudad?.estado || ciudades.find(c => c.id === municipio.ciudadId)?.estado || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={municipio.activo ? 'Activo' : 'Inactivo'}
                          color={municipio.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => abrirDialogo('municipio', 'editar', municipio)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => eliminarMunicipio(municipio.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Tab Zonas */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Lista de Zonas</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => abrirDialogo('zona', 'crear')}
            >
              Agregar Zona
            </Button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Ciudad</InputLabel>
                <Select
                  value={ciudadFiltro}
                  onChange={(e) => {
                    setCiudadFiltro(e.target.value)
                    setMunicipioFiltro('')
                    cargarZonas(undefined, e.target.value || undefined)
                  }}
                  label="Filtrar por Ciudad"
                >
                  <MenuItem value="">Todas las ciudades</MenuItem>
                  {ciudades.map((ciudad) => (
                    <MenuItem key={ciudad.id} value={ciudad.id}>
                      {ciudad.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Municipio</InputLabel>
                <Select
                  value={municipioFiltro}
                  onChange={(e) => {
                    setMunicipioFiltro(e.target.value)
                    cargarZonas(e.target.value || undefined, undefined)
                  }}
                  label="Filtrar por Municipio"
                >
                  <MenuItem value="">Todos los municipios</MenuItem>
                  {municipiosFiltrados.map((municipio) => (
                    <MenuItem key={municipio.id} value={municipio.id}>
                      {municipio.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Municipio</TableCell>
                    <TableCell>Ciudad</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zonasFiltradas.map((zona) => {
                    const municipio = municipios.find(m => m.id === zona.municipioId)
                    const ciudad = municipio ? ciudades.find(c => c.id === municipio.ciudadId) : null
                    
                    return (
                      <TableRow key={zona.id}>
                        <TableCell>{zona.nombre}</TableCell>
                        <TableCell>{zona.codigo || '-'}</TableCell>
                        <TableCell>{zona.descripcion || '-'}</TableCell>
                        <TableCell>{municipio?.nombre || '-'}</TableCell>
                        <TableCell>{ciudad?.estado || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={zona.activa ? 'Activa' : 'Inactiva'}
                            color={zona.activa ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => abrirDialogo('zona', 'editar', zona)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => eliminarZona(zona.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Card>

      {/* Diálogo para Ciudad */}
      <Dialog 
        open={dialogoAbierto && tipoDialogo === 'ciudad'} 
        onClose={cerrarDialogo} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {accionDialogo === 'crear' ? 'Agregar Nueva Ciudad' : 'Editar Ciudad'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formCiudad.estado || ''}
                  onChange={(e) => setFormCiudad({ ...formCiudad, estado: e.target.value })}
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
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formCiudad.activa !== undefined ? formCiudad.activa : true}
                    onChange={(e) => setFormCiudad({ ...formCiudad, activa: e.target.checked })}
                  />
                }
                label="Ciudad Activa"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button onClick={guardarCiudad} variant="contained" disabled={loading}>
            {accionDialogo === 'crear' ? 'Crear' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Municipio */}
      <Dialog 
        open={dialogoAbierto && tipoDialogo === 'municipio'} 
        onClose={cerrarDialogo} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {accionDialogo === 'crear' ? 'Agregar Nuevo Municipio' : 'Editar Municipio'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={formMunicipio.nombre || ''}
                onChange={(e) => setFormMunicipio({ ...formMunicipio, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código"
                value={formMunicipio.codigo || ''}
                onChange={(e) => setFormMunicipio({ ...formMunicipio, codigo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Ciudad</InputLabel>
                <Select
                  value={formMunicipio.ciudadId || ''}
                  onChange={(e) => setFormMunicipio({ ...formMunicipio, ciudadId: e.target.value })}
                  label="Ciudad"
                >
                  {ciudades.map((ciudad) => (
                    <MenuItem key={ciudad.id} value={ciudad.id}>
                      {ciudad.estado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formMunicipio.activo !== undefined ? formMunicipio.activo : true}
                    onChange={(e) => setFormMunicipio({ ...formMunicipio, activo: e.target.checked })}
                  />
                }
                label="Municipio Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button onClick={guardarMunicipio} variant="contained" disabled={loading}>
            {accionDialogo === 'crear' ? 'Crear' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Zona */}
      <Dialog 
        open={dialogoAbierto && tipoDialogo === 'zona'} 
        onClose={cerrarDialogo} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {accionDialogo === 'crear' ? 'Agregar Nueva Zona' : 'Editar Zona'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={formZona.nombre || ''}
                onChange={(e) => setFormZona({ ...formZona, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código"
                value={formZona.codigo || ''}
                onChange={(e) => setFormZona({ ...formZona, codigo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Municipio</InputLabel>
                <Select
                  value={formZona.municipioId || ''}
                  onChange={(e) => setFormZona({ ...formZona, municipioId: e.target.value })}
                  label="Municipio"
                >
                  {municipiosFiltrados.map((municipio) => (
                    <MenuItem key={municipio.id} value={municipio.id}>
                      {municipio.nombre} - {municipio.ciudad?.estado || ciudades.find(c => c.id === municipio.ciudadId)?.estado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formZona.descripcion || ''}
                onChange={(e) => setFormZona({ ...formZona, descripcion: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formZona.activa !== undefined ? formZona.activa : true}
                    onChange={(e) => setFormZona({ ...formZona, activa: e.target.checked })}
                  />
                }
                label="Zona Activa"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button onClick={guardarZona} variant="contained" disabled={loading}>
            {accionDialogo === 'crear' ? 'Crear' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

