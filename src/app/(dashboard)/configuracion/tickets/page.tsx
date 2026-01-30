'use client'

import React, { useState, useRef, useEffect } from 'react'
import { configuracionTicketsAPI, type ConfiguracionTicket } from '@lib/api'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material'
import {
  Store as StoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  WhatsApp as WhatsAppIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  RestartAlt as RestartIcon,
  Upload as UploadIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'

// Tipos de datos
interface ConfigTicket {
  id?: string
  tipoTicket: string
  // Información de la empresa
  nombreEmpresa: string
  razonSocial: string
  direccion: string
  telefono: string
  email: string
  sitioWeb: string
  rfc: string
  
  // Logo
  logo: string // URL o base64
  mostrarLogo: boolean
  tamañoLogo: 'pequeño' | 'mediano' | 'grande'
  
  // Redes sociales
  redesSociales: {
    facebook: string
    instagram: string
    twitter: string
    linkedin: string
    whatsapp: string
  }
  mostrarRedesSociales: boolean
  
  // Textos personalizados
  textos: {
    encabezado: string
    piePagina: string
    mensajeEspecial: string
    mostrarMensaje: boolean
  }
  
  // Configuración del ticket
  diseño: {
    mostrarFecha: boolean
    mostrarHora: boolean
    mostrarCajero: boolean
    mostrarCliente: boolean
    colorPrincipal: string
    alineacion: 'izquierda' | 'centro' | 'derecha'
  }
  
  // QR del ticket (URL o texto que se codifica en el QR)
  urlQR: string
  // Estado
  activo: boolean
  fechaCreacion: string
  fechaModificacion: string
}

// Tipos de tickets disponibles
const tiposTickets = [
  { value: 'venta', label: 'Ticket de Venta' },
  { value: 'corte-venta-dia', label: 'Ticket de Corte Venta Día' },
  { value: 'corte-abono', label: 'Ticket de Corte Abono' },
]

// Datos iniciales
const configInicial: ConfigTicket = {
  tipoTicket: 'venta',
  nombreEmpresa: 'Mi Empresa S.A. de C.V.',
  razonSocial: 'Mi Empresa Sociedad Anónima de Capital Variable',
  direccion: 'Av. Principal #123, Col. Centro, CDMX, CP 06000',
  telefono: '(55) 1234-5678',
  email: 'contacto@miempresa.com',
  sitioWeb: 'www.miempresa.com',
  rfc: 'MEMP950101ABC',
  logo: '',
  mostrarLogo: true,
  tamañoLogo: 'mediano',
  redesSociales: {
    facebook: 'https://facebook.com/miempresa',
    instagram: 'https://instagram.com/miempresa',
    twitter: 'https://twitter.com/miempresa',
    linkedin: 'https://linkedin.com/company/miempresa',
    whatsapp: 'https://wa.me/5215512345678'
  },
  mostrarRedesSociales: true,
  textos: {
    encabezado: '¡Gracias por su compra!',
    piePagina: 'Visite nuestro sitio web para más información',
    mensajeEspecial: '',
    mostrarMensaje: false
  },
  diseño: {
    mostrarFecha: true,
    mostrarHora: true,
    mostrarCajero: true,
    mostrarCliente: true,
    colorPrincipal: '#1976d2',
    alineacion: 'centro'
  },
  urlQR: '',
  activo: true,
  fechaCreacion: '2024-01-01',
  fechaModificacion: '2024-01-01'
}

export default function ConfiguracionTicketsPage() {
  const [config, setConfig] = useState<ConfigTicket>(configInicial)
  const [tipoTicketSeleccionado, setTipoTicketSeleccionado] = useState<string>('venta')
  const [configuraciones, setConfiguraciones] = useState<ConfigTicket[]>([])
  const [snackbar, setSnackbar] = useState({ abierto: false, mensaje: '', tipo: 'success' as 'success' | 'error' })
  const [dialogoImagen, setDialogoImagen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    loadConfiguraciones()
  }, [])

  // Cargar configuración cuando cambia el tipo de ticket seleccionado
  useEffect(() => {
    if (tipoTicketSeleccionado) {
      loadConfiguracion(tipoTicketSeleccionado)
    }
  }, [tipoTicketSeleccionado])

  const loadConfiguraciones = async () => {
    try {
      setLoadingData(true)
      const data = await configuracionTicketsAPI.getAll()
      
      // Si no hay configuraciones, crear una por defecto para el tipo seleccionado
      if (!data || data.length === 0) {
        // Cargar la configuración del tipo seleccionado (se creará automáticamente si no existe)
        await loadConfiguracion(tipoTicketSeleccionado)
        return
      }
      
      // Transformar los datos del backend al formato del frontend
      const configsFormateadas = data.map(item => ({
        id: item.id,
        tipoTicket: item.tipoTicket,
        nombreEmpresa: item.nombreEmpresa,
        razonSocial: item.razonSocial || '',
        direccion: item.direccion || '',
        telefono: item.telefono || '',
        email: item.email || '',
        sitioWeb: item.sitioWeb || '',
        rfc: item.rfc || '',
        logo: item.logo || '',
        mostrarLogo: item.mostrarLogo,
        tamañoLogo: item.tamañoLogo as 'pequeño' | 'mediano' | 'grande',
        redesSociales: {
          facebook: item.redesSociales?.facebook || '',
          instagram: item.redesSociales?.instagram || '',
          twitter: item.redesSociales?.twitter || '',
          linkedin: item.redesSociales?.linkedin || '',
          whatsapp: item.redesSociales?.whatsapp || ''
        },
        mostrarRedesSociales: item.mostrarRedesSociales,
        textos: {
          encabezado: item.textos?.encabezado || '',
          piePagina: item.textos?.piePagina || '',
          mensajeEspecial: item.textos?.mensajeEspecial || '',
          mostrarMensaje: item.textos?.mostrarMensaje || false
        },
        diseño: {
          mostrarFecha: item.diseño?.mostrarFecha ?? true,
          mostrarHora: item.diseño?.mostrarHora ?? true,
          mostrarCajero: item.diseño?.mostrarCajero ?? true,
          mostrarCliente: item.diseño?.mostrarCliente ?? true,
          colorPrincipal: item.diseño?.colorPrincipal || '#1976d2',
          alineacion: item.diseño?.alineacion as 'izquierda' | 'centro' | 'derecha' || 'centro'
        },
        urlQR: item.urlQR || '',
        activo: item.activo,
        fechaCreacion: item.fechaCreacion,
        fechaModificacion: item.fechaModificacion
      }))
      
      setConfiguraciones(configsFormateadas)
      
      // Si hay configuraciones, cargar la primera o la seleccionada
      if (configsFormateadas.length > 0) {
        const configExistente = configsFormateadas.find(c => c.tipoTicket === tipoTicketSeleccionado)
        if (configExistente) {
          setConfig(configExistente)
        } else {
          // Cargar la configuración del tipo seleccionado (puede que no exista aún)
          await loadConfiguracion(tipoTicketSeleccionado)
        }
      } else {
        // Si no hay configuraciones, cargar la del tipo seleccionado
        await loadConfiguracion(tipoTicketSeleccionado)
      }
    } catch (error: any) {
      console.error('Error al cargar configuraciones:', error)
      setSnackbar({ abierto: true, mensaje: 'Error al cargar las configuraciones: ' + (error.message || 'Error desconocido'), tipo: 'error' })
    } finally {
      setLoadingData(false)
    }
  }

  const loadConfiguracion = async (tipoTicket: string) => {
    try {
      setLoadingData(true)
      const data = await configuracionTicketsAPI.get(tipoTicket)
      
      // Transformar los datos del backend al formato del frontend
      setConfig({
        id: data.id,
        tipoTicket: data.tipoTicket,
        nombreEmpresa: data.nombreEmpresa,
        razonSocial: data.razonSocial || '',
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        email: data.email || '',
        sitioWeb: data.sitioWeb || '',
        rfc: data.rfc || '',
        logo: data.logo || '',
        mostrarLogo: data.mostrarLogo,
        tamañoLogo: data.tamañoLogo as 'pequeño' | 'mediano' | 'grande',
        redesSociales: {
          facebook: data.redesSociales?.facebook || '',
          instagram: data.redesSociales?.instagram || '',
          twitter: data.redesSociales?.twitter || '',
          linkedin: data.redesSociales?.linkedin || '',
          whatsapp: data.redesSociales?.whatsapp || ''
        },
        mostrarRedesSociales: data.mostrarRedesSociales,
        textos: {
          encabezado: data.textos?.encabezado || '',
          piePagina: data.textos?.piePagina || '',
          mensajeEspecial: data.textos?.mensajeEspecial || '',
          mostrarMensaje: data.textos?.mostrarMensaje || false
        },
        diseño: {
          mostrarFecha: data.diseño?.mostrarFecha ?? true,
          mostrarHora: data.diseño?.mostrarHora ?? true,
          mostrarCajero: data.diseño?.mostrarCajero ?? true,
          mostrarCliente: data.diseño?.mostrarCliente ?? true,
          colorPrincipal: data.diseño?.colorPrincipal || '#1976d2',
          alineacion: data.diseño?.alineacion as 'izquierda' | 'centro' | 'derecha' || 'centro'
        },
        urlQR: data.urlQR || '',
        activo: data.activo,
        fechaCreacion: data.fechaCreacion,
        fechaModificacion: data.fechaModificacion
      })
    } catch (error: any) {
      console.error('Error al cargar configuración:', error)
      setSnackbar({ abierto: true, mensaje: 'Error al cargar la configuración: ' + (error.message || 'Error desconocido'), tipo: 'error' })
    } finally {
      setLoadingData(false)
    }
  }

  const manejarCambio = (campo: string, valor: any) => {
    setConfig(prev => ({
      ...prev,
      [campo]: valor,
      fechaModificacion: new Date().toISOString().split('T')[0]
    }))
  }

  const manejarCambioRedes = (red: string, valor: string) => {
    setConfig(prev => ({
      ...prev,
      redesSociales: {
        ...prev.redesSociales,
        [red]: valor
      },
      fechaModificacion: new Date().toISOString().split('T')[0]
    }))
  }

  const manejarCambioTextos = (campo: string, valor: any) => {
    setConfig(prev => ({
      ...prev,
      textos: {
        ...prev.textos,
        [campo]: valor
      },
      fechaModificacion: new Date().toISOString().split('T')[0]
    }))
  }

  const manejarCambioDiseño = (campo: string, valor: any) => {
    setConfig(prev => ({
      ...prev,
      diseño: {
        ...prev.diseño,
        [campo]: valor
      },
      fechaModificacion: new Date().toISOString().split('T')[0]
    }))
  }

  const seleccionarImagen = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        manejarCambio('logo', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const guardarConfiguracion = async () => {
    setLoading(true)
    try {
      await configuracionTicketsAPI.update({
        tipoTicket: config.tipoTicket,
        nombreEmpresa: config.nombreEmpresa,
        razonSocial: config.razonSocial,
        direccion: config.direccion,
        telefono: config.telefono,
        email: config.email,
        sitioWeb: config.sitioWeb,
        rfc: config.rfc,
        logo: config.logo,
        mostrarLogo: config.mostrarLogo,
        tamañoLogo: config.tamañoLogo,
        redesSociales: config.redesSociales,
        mostrarRedesSociales: config.mostrarRedesSociales,
        textos: config.textos,
        diseño: config.diseño,
        urlQR: config.urlQR || undefined,
        activo: config.activo
      })
      
      // Actualizar fecha de modificación
      setConfig(prev => ({ ...prev, fechaModificacion: new Date().toISOString().split('T')[0] }))
      
      // Recargar configuraciones para actualizar la lista
      await loadConfiguraciones()
      
      setSnackbar({ abierto: true, mensaje: 'Configuración guardada exitosamente', tipo: 'success' })
    } catch (error: any) {
      console.error('Error al guardar configuración:', error)
      setSnackbar({ abierto: true, mensaje: 'Error al guardar la configuración: ' + (error.message || 'Error desconocido'), tipo: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const manejarCambioTipoTicket = (tipo: string) => {
    setTipoTicketSeleccionado(tipo)
    // La configuración se cargará automáticamente con el useEffect
  }

  const restablecerConfiguracion = () => {
    setConfig(configInicial)
    setSnackbar({ abierto: true, mensaje: 'Configuración restablecida', tipo: 'success' })
  }

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          Configuración de Tickets
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Personaliza la apariencia y contenido de tus tickets en tiempo real
        </Typography>
      </Box>

      {/* Selector de Tipo de Ticket */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Seleccionar Tipo de Ticket
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Tipo de Ticket</InputLabel>
            <Select
              value={tipoTicketSeleccionado}
              onChange={(e) => manejarCambioTipoTicket(e.target.value)}
              label="Tipo de Ticket"
            >
              {tiposTickets.map(tipo => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Cada tipo de ticket puede tener su propia configuración personalizada
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Formulario de Configuración */}
        <Grid item xs={12} md={7}>
          {/* Información de la Empresa */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información de la Empresa
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre de la Empresa"
                    value={config.nombreEmpresa}
                    onChange={(e) => manejarCambio('nombreEmpresa', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Razón Social"
                    value={config.razonSocial}
                    onChange={(e) => manejarCambio('razonSocial', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={config.direccion}
                    onChange={(e) => manejarCambio('direccion', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={config.telefono}
                    onChange={(e) => manejarCambio('telefono', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={config.email}
                    onChange={(e) => manejarCambio('email', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sitio Web"
                    value={config.sitioWeb}
                    onChange={(e) => manejarCambio('sitioWeb', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LanguageIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="RFC"
                    value={config.rfc}
                    onChange={(e) => manejarCambio('rfc', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Configuración de Logo */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Logo de la Empresa
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.mostrarLogo}
                    onChange={(e) => manejarCambio('mostrarLogo', e.target.checked)}
                  />
                }
                label="Mostrar logo en el ticket"
              />
              <Box sx={{ mt: 2 }}>
                {config.logo ? (
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <img src={config.logo} alt="Logo" style={{ maxWidth: '200px', maxHeight: '100px' }} />
                  </Box>
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }}>
                    <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No hay logo cargado
                    </Typography>
                  </Paper>
                )}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={seleccionarImagen}
                >
                  {config.logo ? 'Cambiar Logo' : 'Subir Logo'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </Box>
            </CardContent>
          </Card>

          {/* QR del ticket */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                QR del ticket de venta
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                URL o texto que se codificará en el código QR del ticket. Al escanear el QR en el ticket de venta (app móvil) se abrirá o mostrará este contenido. Si está vacío, se usa el QR por defecto (datos del ticket).
              </Typography>
              <TextField
                fullWidth
                label="URL o texto para el QR"
                placeholder="https://ejemplo.com o texto libre"
                value={config.urlQR}
                onChange={(e) => manejarCambio('urlQR', e.target.value)}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LanguageIcon />
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
          </Card>

          {/* Textos Personalizados */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Textos Personalizados
              </Typography>
              <TextField
                fullWidth
                label="Encabezado"
                value={config.textos.encabezado}
                onChange={(e) => manejarCambioTextos('encabezado', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Pie de Página"
                value={config.textos.piePagina}
                onChange={(e) => manejarCambioTextos('piePagina', e.target.value)}
                margin="normal"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.textos.mostrarMensaje}
                    onChange={(e) => manejarCambioTextos('mostrarMensaje', e.target.checked)}
                  />
                }
                label="Mostrar mensaje especial"
              />
              {config.textos.mostrarMensaje && (
                <TextField
                  fullWidth
                  label="Mensaje Especial"
                  value={config.textos.mensajeEspecial}
                  onChange={(e) => manejarCambioTextos('mensajeEspecial', e.target.value)}
                  multiline
                  rows={2}
                  margin="normal"
                />
              )}
            </CardContent>
          </Card>

          {/* Redes Sociales */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Redes Sociales
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.mostrarRedesSociales}
                    onChange={(e) => manejarCambio('mostrarRedesSociales', e.target.checked)}
                  />
                }
                label="Mostrar redes sociales en el ticket"
              />
              {config.mostrarRedesSociales && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Facebook"
                        value={config.redesSociales.facebook}
                        onChange={(e) => manejarCambioRedes('facebook', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FacebookIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Instagram"
                        value={config.redesSociales.instagram}
                        onChange={(e) => manejarCambioRedes('instagram', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <InstagramIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="WhatsApp"
                        value={config.redesSociales.whatsapp}
                        onChange={(e) => manejarCambioRedes('whatsapp', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <WhatsAppIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Twitter"
                        value={config.redesSociales.twitter}
                        onChange={(e) => manejarCambioRedes('twitter', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <TwitterIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={guardarConfiguracion}
                  disabled={loading}
                >
                  Guardar Configuración
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RestartIcon />}
                  onClick={restablecerConfiguracion}
                >
                  Restablecer
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Vista Previa del Ticket */}
        <Grid item xs={12} md={5}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vista Previa del Ticket
              </Typography>
              
              <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                {/* Encabezado */}
                <Box sx={{ textAlign: config.diseño.alineacion, mb: 2 }}>
                  {config.mostrarLogo && config.logo && (
                    <Box sx={{ mb: 1 }}>
                      <img 
                        src={config.logo} 
                        alt="Logo" 
                        style={{ 
                          maxWidth: config.tamañoLogo === 'pequeño' ? '80px' : config.tamañoLogo === 'mediano' ? '120px' : '160px',
                          maxHeight: '80px'
                        }} 
                      />
                    </Box>
                  )}
                  <Typography variant="h6" fontWeight="bold" color={config.diseño.colorPrincipal}>
                    {config.nombreEmpresa}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {config.razonSocial}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Mensaje de Encabezado */}
                {config.textos.encabezado && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {config.textos.encabezado}
                  </Typography>
                )}

                {/* Información de la Empresa */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" display="block" color="text.secondary">
                    📍 {config.direccion}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    📞 {config.telefono}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    ✉️ {config.email}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    🌐 {config.sitioWeb}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Redes Sociales */}
                {config.mostrarRedesSociales && (
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Síguenos en:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                      {config.redesSociales.facebook && (
                        <Tooltip title="Facebook">
                          <Chip size="small" icon={<FacebookIcon />} label="Facebook" />
                        </Tooltip>
                      )}
                      {config.redesSociales.instagram && (
                        <Tooltip title="Instagram">
                          <Chip size="small" icon={<InstagramIcon />} label="Instagram" />
                        </Tooltip>
                      )}
                      {config.redesSociales.whatsapp && (
                        <Tooltip title="WhatsApp">
                          <Chip size="small" icon={<WhatsAppIcon />} label="WhatsApp" />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Pie de Página */}
                {config.textos.piePagina && (
                  <Typography variant="caption" color="text.secondary" align="center" display="block">
                    {config.textos.piePagina}
                  </Typography>
                )}

                {/* Mensaje Especial */}
                {config.textos.mostrarMensaje && config.textos.mensajeEspecial && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {config.textos.mensajeEspecial}
                  </Alert>
                )}
              </Paper>

              {/* Información adicional */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  RFC: {config.rfc}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Última modificación: {config.fechaModificacion}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

