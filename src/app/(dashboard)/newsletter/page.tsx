'use client'

// React Imports
import { useState, useRef, useEffect } from 'react'
import { newsletterAPI, authAPI, type NewsletterItem, type Usuario } from '@/lib/api'

// MUI Imports
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Grid,
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'

// Icon Imports
import ImageIcon from '@mui/icons-material/Image'
import UploadIcon from '@mui/icons-material/Upload'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import NotificationsIcon from '@mui/icons-material/Notifications'
import HistoryIcon from '@mui/icons-material/History'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import EventIcon from '@mui/icons-material/Event'

const NewsletterPage = () => {
  const [items, setItems] = useState<NewsletterItem[]>([])
  const [historialNotificaciones, setHistorialNotificaciones] = useState<NewsletterItem[]>([])
  const [tabValue, setTabValue] = useState(0)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [newNotification, setNewNotification] = useState({ 
    title: '', 
    content: '',
    fechaVencimiento: ''
  })
  const [newImage, setNewImage] = useState({ 
    description: '', 
    size: 'medium' as 'small' | 'medium' | 'large',
    preview: null as string | null,
    file: null as File | null
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Cargar datos del servidor
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Cargar solo imágenes para contenido activo
      const itemsData = await newsletterAPI.getAll({ 
        activo: true, 
        type: 'image' 
      }).catch(() => [])
      
      // Cargar solo notificaciones para historial
      const historialData = await newsletterAPI.getAll({ 
        type: 'notification' 
      }).catch(() => [])
      
      setItems(itemsData)
      setHistorialNotificaciones(historialData)
    } catch (err: any) {
      // Solo mostrar error si no es un 404 (ruta no encontrada)
      if (err.message && !err.message.includes('404') && !err.message.includes('Ruta no encontrada')) {
        setError(err.message || 'Error al cargar datos del newsletter')
      }
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadImage = () => {
    imageInputRef.current?.click()
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tamaño del archivo (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo es demasiado grande. El tamaño máximo es 10MB')
        return
      }
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor seleccione un archivo de imagen válido')
        return
      }
      
      setError(null)
      
      // Convertir imagen a base64 para preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewImage({
          ...newImage,
          preview: reader.result as string,
          file: file
        })
      }
      reader.readAsDataURL(file)
    }
    // Reset input
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleSaveImage = async () => {
    if (!newImage.file || !newImage.preview) {
      setError('Por favor seleccione una imagen')
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const newItem = await newsletterAPI.create({
        type: 'image',
        imageUrl: newImage.preview,
        description: newImage.description,
        size: newImage.size,
        activo: true
      })
      
      setItems([...items, newItem])
      setNewImage({ description: '', size: 'medium', preview: null, file: null })
      setIsUploadDialogOpen(false)
      setSuccessMessage('Imagen agregada exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar la imagen')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNotification = async () => {
    if (!newNotification.title || !newNotification.content) {
      setError('Por favor complete todos los campos requeridos')
      return
    }

    if (!newNotification.fechaVencimiento) {
      setError('Por favor seleccione una fecha de vencimiento')
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const newItem = await newsletterAPI.create({
        type: 'notification',
        title: newNotification.title,
        content: newNotification.content,
        fechaVencimiento: newNotification.fechaVencimiento,
        activo: true
      })
      
      // Agregar a historial de notificaciones
      setHistorialNotificaciones([newItem, ...historialNotificaciones])
      setNewNotification({ title: '', content: '', fechaVencimiento: '' })
      setIsNotificationDialogOpen(false)
      setSuccessMessage('Notificación creada exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al crear la notificación')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este elemento?')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      // Encontrar el item para saber su tipo
      const itemToDelete = items.find(item => item.id === id) || 
                          historialNotificaciones.find(item => item.id === id)
      
      await newsletterAPI.delete(id)
      
      // Eliminar del estado correcto según el tipo
      if (itemToDelete?.type === 'image') {
        setItems(items.filter(item => item.id !== id))
      } else if (itemToDelete?.type === 'notification') {
        setHistorialNotificaciones(historialNotificaciones.filter(item => item.id !== id))
      }
      
      setSuccessMessage('Elemento eliminado exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el elemento')
    } finally {
      setSaving(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return fecha
    }
  }

  const esNotificacionVencida = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    return new Date(fechaVencimiento) < new Date()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title="Newsletter"
          subheader="Gestiona las imágenes y notificaciones del newsletter"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={() => setIsNotificationDialogOpen(true)}
              >
                Nueva Notificación
              </Button>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setIsUploadDialogOpen(true)}
              >
                Subir Imagen
              </Button>
            </Box>
          }
        />
        <CardContent>
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

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageIcon />
                    Contenido Activo (Imágenes)
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon />
                    Historial de Notificaciones
                  </Box>
                } 
              />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                },
                gap: 3,
                gridAutoRows: 'minmax(200px, auto)'
              }}
            >
              {items.filter(item => item.type === 'image').map((item) => {
                const imageHeight = item.size === 'large' ? 400 : item.size === 'small' ? 200 : 300

                return (
                  <Paper
                    key={item.id}
                    sx={{
                      gridColumn: {
                        xs: 'span 1',
                        sm: item.size === 'large' ? 'span 2' : 'span 1',
                        md: item.size === 'large' ? 'span 2' : 'span 1'
                      },
                      gridRow: {
                        xs: 'span 1',
                        sm: item.size === 'large' ? 'span 2' : 'span 1'
                      },
                      p: 2,
                      position: 'relative',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                        '& .delete-button': {
                          opacity: 1
                        }
                      }
                    }}
                  >
                    <IconButton
                      className="delete-button"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteItem(item.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        zIndex: 1,
                        backgroundColor: 'background.paper',
                        '&:hover': {
                          backgroundColor: 'error.lighter'
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>

                    {item.imageUrl ? (
                      <>
                        <Box
                          sx={{
                            width: '100%',
                            height: imageHeight,
                            mb: 2,
                            borderRadius: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'action.hover',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.description || 'Newsletter'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                        {item.description && (
                          <Typography 
                            variant="body1" 
                            fontWeight="medium" 
                            sx={{ mb: 1, flexGrow: 1 }}
                            color="text.primary"
                          >
                            {item.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatearFecha(item.fechaCreacion)}
                        </Typography>
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Imagen no disponible
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )
              })}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Título</TableCell>
                      <TableCell>Contenido</TableCell>
                      <TableCell>Fecha Creación</TableCell>
                      <TableCell>Fecha Vencimiento</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historialNotificaciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No hay notificaciones en el historial
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      historialNotificaciones.map((notificacion) => {
                        const esVencida = esNotificacionVencida(notificacion.fechaVencimiento)
                        return (
                          <TableRow key={notificacion.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {notificacion.title}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 400 }}>
                                {notificacion.content}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatearFecha(notificacion.fechaCreacion)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2"
                                color={esVencida ? 'error.main' : 'text.primary'}
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                              >
                                <EventIcon fontSize="small" />
                                {notificacion.fechaVencimiento 
                                  ? formatearFecha(notificacion.fechaVencimiento)
                                  : 'Sin fecha'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={esVencida ? 'Vencida' : notificacion.activo ? 'Activa' : 'Inactiva'}
                                color={esVencida ? 'error' : notificacion.activo ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tabValue === 0 && items.length === 0 && !loading && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay elementos en el newsletter
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comienza agregando una imagen o notificación
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsUploadDialogOpen(true)}
              >
                Agregar Contenido
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog para subir imagen */}
      <Dialog open={isUploadDialogOpen} onClose={() => setIsUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir Imagen</DialogTitle>
        <DialogContent>
          {newImage.preview ? (
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxHeight: 300,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <img
                  src={newImage.preview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    objectFit: 'contain'
                  }}
                />
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleUploadImage}
                startIcon={<UploadIcon />}
                fullWidth
              >
                Cambiar Imagen
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 3,
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={handleUploadImage}
            >
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                Haz clic para seleccionar una imagen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PNG, JPG, GIF hasta 10MB
              </Typography>
            </Box>
          )}
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newImage.description}
            onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
            placeholder="Describe la imagen..."
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>
              Tamaño:
            </Typography>
            <Button
              variant={newImage.size === 'small' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setNewImage({ ...newImage, size: 'small' })}
            >
              Pequeño
            </Button>
            <Button
              variant={newImage.size === 'medium' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setNewImage({ ...newImage, size: 'medium' })}
            >
              Mediano
            </Button>
            <Button
              variant={newImage.size === 'large' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setNewImage({ ...newImage, size: 'large' })}
            >
              Grande
            </Button>
          </Box>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setIsUploadDialogOpen(false)
              setNewImage({ description: '', size: 'medium', preview: null, file: null })
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveImage}
            disabled={saving || !newImage.preview}
            startIcon={<SaveIcon />}
          >
            {saving ? 'Guardando...' : 'Guardar Imagen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar notificación */}
      <Dialog open={isNotificationDialogOpen} onClose={() => setIsNotificationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon />
              Nueva Notificación
            </Box>
            <IconButton onClick={() => setIsNotificationDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            fullWidth
            variant="outlined"
            value={newNotification.title}
            onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
            sx={{ mb: 2, mt: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Contenido"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newNotification.content}
            onChange={(e) => setNewNotification({ ...newNotification, content: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Fecha de Vencimiento"
            type="date"
            fullWidth
            variant="outlined"
            value={newNotification.fechaVencimiento}
            onChange={(e) => setNewNotification({ ...newNotification, fechaVencimiento: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
            required
            helperText="La notificación se marcará como vencida después de esta fecha"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setIsNotificationDialogOpen(false)
              setNewNotification({ title: '', content: '', fechaVencimiento: '' })
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAddNotification}
            disabled={!newNotification.title || !newNotification.content || !newNotification.fechaVencimiento || saving}
            startIcon={<SaveIcon />}
          >
            {saving ? 'Guardando...' : 'Guardar Notificación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default NewsletterPage
