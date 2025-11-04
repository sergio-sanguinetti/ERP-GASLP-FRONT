'use client'

// React Imports
import { useState, useRef } from 'react'

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
  Paper
} from '@mui/material'

// Icon Imports
import ImageIcon from '@mui/icons-material/Image'
import UploadIcon from '@mui/icons-material/Upload'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import NotificationsIcon from '@mui/icons-material/Notifications'

// Type Definitions
interface NewsletterItem {
  id: number
  type: 'image' | 'notification'
  title?: string
  content?: string
  description?: string
  imageUrl?: string
  fechaCreacion: string
  size?: 'small' | 'medium' | 'large' // Para el formato collage
}

// Imágenes por defecto con descripciones
const defaultImages: Omit<NewsletterItem, 'id' | 'fechaCreacion'>[] = [
  {
    type: 'image',
    imageUrl: '/images/camion_2.jpg',
    description: 'Flota de camiones de distribución lista para servicio',
    size: 'large'
  },
  {
    type: 'image',
    imageUrl: '/images/camion_gas.jpg',
    description: 'Camión de gas licuado en operación',
    size: 'medium'
  },
  {
    type: 'image',
    imageUrl: '/images/depositos.jpg',
    description: 'Almacenamiento seguro de combustibles',
    size: 'medium'
  },
  {
    type: 'image',
    imageUrl: '/images/estacion_gas.jpg',
    description: 'Estación de servicio moderna y eficiente',
    size: 'large'
  }
]

const NewsletterPage = () => {
  const [items, setItems] = useState<NewsletterItem[]>(() => {
    // Inicializar con las imágenes por defecto
    return defaultImages.map((item, index) => ({
      ...item,
      id: index + 1,
      fechaCreacion: new Date().toISOString().split('T')[0]
    }))
  })
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [newNotification, setNewNotification] = useState({ title: '', content: '' })
  const [newImage, setNewImage] = useState({ description: '', size: 'medium' as 'small' | 'medium' | 'large' })
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleUploadImage = () => {
    imageInputRef.current?.click()
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newItem: NewsletterItem = {
          id: Math.max(...items.map(i => i.id), 0) + 1,
          type: 'image',
          imageUrl: reader.result as string,
          description: newImage.description,
          size: newImage.size,
          fechaCreacion: new Date().toISOString().split('T')[0]
        }
        setItems([...items, newItem])
        setNewImage({ description: '', size: 'medium' })
        setIsUploadDialogOpen(false)
      }
      reader.readAsDataURL(file)
    }
    // Reset input
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleAddNotification = () => {
    if (newNotification.title && newNotification.content) {
      const newItem: NewsletterItem = {
        id: Math.max(...items.map(i => i.id), 0) + 1,
        type: 'notification',
        title: newNotification.title,
        content: newNotification.content,
        fechaCreacion: new Date().toISOString().split('T')[0]
      }
      setItems([...items, newItem])
      setNewNotification({ title: '', content: '' })
      setIsNotificationDialogOpen(false)
    }
  }

  const handleDeleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id))
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
            {items.map((item) => {
              // Determinar la altura de la imagen según el tamaño para el formato collage
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

                  {item.type === 'image' && item.imageUrl ? (
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
                        {item.fechaCreacion}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Box
                        sx={{
                          width: '100%',
                          height: imageHeight,
                          mb: 2,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'action.hover',
                          flexDirection: 'column',
                          gap: 1,
                          p: 2
                        }}
                      >
                        <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                        <Typography variant="h6" fontWeight="medium" textAlign="center">
                          {item.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, flexGrow: 1 }}>
                        {item.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.fechaCreacion}
                      </Typography>
                    </>
                  )}
                </Paper>
              )
            })}
          </Box>

          {items.length === 0 && (
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
          <Button onClick={() => {
            setIsUploadDialogOpen(false)
            setNewImage({ description: '', size: 'medium' })
          }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleUploadImage}>
            Seleccionar Imagen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar notificación */}
      <Dialog open={isNotificationDialogOpen} onClose={() => setIsNotificationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Notificación</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            fullWidth
            variant="outlined"
            value={newNotification.title}
            onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
            sx={{ mb: 2 }}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNotificationDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleAddNotification}
            disabled={!newNotification.title || !newNotification.content}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default NewsletterPage

