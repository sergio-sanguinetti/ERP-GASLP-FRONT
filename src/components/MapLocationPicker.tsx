'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { LatLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, Typography, Button } from '@mui/material'
import { LocationOn as LocationIcon } from '@mui/icons-material'
import L from 'leaflet'

// Fix para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapLocationPickerProps {
  latitud?: number | null
  longitud?: number | null
  onLocationSelect: (lat: number, lng: number) => void
  height?: string
  editable?: boolean
  center?: [number, number] | null
  zoom?: number
}

function LocationMarker({ position, onPositionChange }: { position: LatLng | null; onPositionChange: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      onPositionChange(lat, lng)
      map.setView([lat, lng], map.getZoom())
    },
  })

  return position ? <Marker position={position} /> : null
}

// Componente para actualizar el centro del mapa
function MapCenterUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  
  return null
}

export default function MapLocationPicker({
  latitud,
  longitud,
  onLocationSelect,
  height = '400px',
  editable = true,
  center: externalCenter,
  zoom: externalZoom,
}: MapLocationPickerProps) {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Coordenadas por defecto (México)
  const defaultCenter: [number, number] = [19.4326, -99.1332] // Ciudad de México
  const defaultZoom = 13

  useEffect(() => {
    setMapReady(true)
  }, [])

  useEffect(() => {
    if (latitud && longitud) {
      setPosition(new LatLng(latitud, longitud))
    } else {
      setPosition(null)
    }
  }, [latitud, longitud])

  const handlePositionChange = (lat: number, lng: number) => {
    if (editable) {
      setPosition(new LatLng(lat, lng))
      onLocationSelect(lat, lng)
    }
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation && editable) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords
          handlePositionChange(latitude, longitude)
        },
        error => {
          console.error('Error obteniendo ubicación:', error)
          alert('No se pudo obtener tu ubicación actual. Por favor, haz clic en el mapa para seleccionar una ubicación.')
        }
      )
    }
  }

  // Determinar el centro del mapa: usar externalCenter si está disponible, sino position, sino defaultCenter
  const mapCenter: [number, number] = externalCenter || (position ? [position.lat, position.lng] : defaultCenter)
  const mapZoom = externalZoom || (externalCenter ? 8 : defaultZoom)

  if (!mapReady) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
        <Typography>Cargando mapa...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='body2' color='text.secondary'>
          {editable
            ? 'Haz clic en el mapa para seleccionar la ubicación'
            : 'Ubicación del domicilio'}
        </Typography>
        {editable && (
          <Button size='small' startIcon={<LocationIcon />} onClick={handleUseCurrentLocation}>
            Usar mi ubicación
          </Button>
        )}
      </Box>
      <Box sx={{ height, width: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
          {editable && <LocationMarker position={position} onPositionChange={handlePositionChange} />}
          {!editable && position && <Marker position={position} />}
        </MapContainer>
      </Box>
      {position && (
        <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
          Latitud: {position.lat.toFixed(6)}, Longitud: {position.lng.toFixed(6)}
        </Typography>
      )}
    </Box>
  )
}




