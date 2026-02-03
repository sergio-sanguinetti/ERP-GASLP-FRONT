'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  CircularProgress
} from '@mui/material'

// Icon Imports
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

// Context & API
import { useAuth } from '@/contexts/AuthContext'
import { newsletterAPI, type NewsletterItem } from '@/lib/api'

// Imágenes de respaldo cuando no hay newsletter o falla la carga
const defaultGalleryImages = [
  { id: '1', src: '/images/camion_2.jpg', alt: 'Flota de camiones de distribución', title: 'Flota de Camiones' },
  { id: '2', src: '/images/camion_gas.jpg', alt: 'Camión de gas licuado', title: 'Camión de Gas' },
  { id: '3', src: '/images/depositos.jpg', alt: 'Almacenamiento de combustibles', title: 'Depósitos' },
  { id: '4', src: '/images/estacion_gas.jpg', alt: 'Estación de servicio', title: 'Estación de Gas' }
]

function newsletterToGalleryItem(item: NewsletterItem): { id: string; src: string; alt: string; title: string } {
  return {
    id: item.id,
    src: item.imageUrl || '/images/portada.webp',
    alt: item.description || item.title || 'Newsletter',
    title: item.title || item.description || 'Imagen'
  }
}

export default function Page() {
  const { user } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [newsletterItems, setNewsletterItems] = useState<NewsletterItem[]>([])
  const [newsletterLoading, setNewsletterLoading] = useState(true)

  const displayName = useMemo(() => {
    if (!user) return 'Usuario'
    const parts = [user.nombres, user.apellidoPaterno, user.apellidoMaterno].filter(Boolean)
    return parts.join(' ').trim() || user.email || 'Usuario'
  }, [user])

  const galleryImages = useMemo(() => {
    const fromNewsletter = newsletterItems
      .filter((item) => item.type === 'image' && item.activo && item.imageUrl)
      .map(newsletterToGalleryItem)
    return fromNewsletter.length > 0 ? fromNewsletter : defaultGalleryImages
  }, [newsletterItems])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setNewsletterLoading(true)
      try {
        const data = await newsletterAPI.getAll({ type: 'image', activo: true })
        if (!cancelled) setNewsletterItems(data || [])
      } catch {
        if (!cancelled) setNewsletterItems([])
      } finally {
        if (!cancelled) setNewsletterLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Auto-play del carousel
  useEffect(() => {
    if (galleryImages.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % galleryImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [galleryImages.length])

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    )
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % galleryImages.length)
  }

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Mensaje de Bienvenida */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Bienvenido, {displayName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sistema de gestión PROMETEO.LP
          </Typography>
        </CardContent>
      </Card>

      {/* Carousel de Imágenes (conectado al Newsletter) */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            {newsletterLoading ? 'Cargando galería…' : 'Galería'}
          </Typography>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              overflow: 'hidden',
              borderRadius: 2,
              backgroundColor: 'action.hover'
            }}
          >
            {/* Contenedor del carousel con altura fija */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: 300, sm: 400, md: 500 },
                overflow: 'hidden'
              }}
            >
              {/* Contenedor de imágenes */}
              <Box
                sx={{
                  display: 'flex',
                  height: '100%',
                  width: `${galleryImages.length * 100}%`,
                  transition: 'transform 0.5s ease-in-out',
                  transform: `translateX(-${(currentIndex * 100) / galleryImages.length}%)`
                }}
              >
                {galleryImages.map((image) => (
                  <Box
                    key={image.id}
                    sx={{
                      width: `${100 / galleryImages.length}%`,
                      flexShrink: 0,
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        console.error('Error loading image:', image.src)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    {/* Overlay con título */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                        p: 3,
                        color: 'white'
                      }}
                    >
                      <Typography variant="h5" fontWeight="bold">
                        {image.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                        {image.alt}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Botones de navegación */}
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                  },
                  zIndex: 10
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                  },
                  zIndex: 10
                }}
              >
                <ChevronRightIcon />
              </IconButton>

              {/* Indicadores de puntos */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 1,
                  zIndex: 10
                }}
              >
                {galleryImages.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => handleDotClick(index)}
                    sx={{
                      width: currentIndex === index ? 32 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: currentIndex === index
                        ? 'rgba(255, 255, 255, 0.9)'
                        : 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
          {newsletterLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
