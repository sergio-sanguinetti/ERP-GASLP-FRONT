'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid
} from '@mui/material'

// Type Imports
import type { CreateSedeData } from '../types'

interface CreateSedeModalProps {
  open: boolean
  onClose: () => void
  onCreateSede: (sede: CreateSedeData) => void
}

const CreateSedeModal = ({ open, onClose, onCreateSede }: CreateSedeModalProps) => {
  const [formData, setFormData] = useState<CreateSedeData>({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    estado: 'Activa'
  })

  const [errors, setErrors] = useState<Partial<CreateSedeData>>({})

  const handleChange = (field: keyof CreateSedeData) => (event: any) => {
    const value = event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateSedeData> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo no es válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onCreateSede(formData)
      setFormData({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        estado: 'Activa'
      })
      setErrors({})
    }
  }

  const handleClose = () => {
    setFormData({
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      estado: 'Activa'
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Crear Nueva Sede</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Sede"
                value={formData.nombre}
                onChange={handleChange('nombre')}
                error={!!errors.nombre}
                helperText={errors.nombre}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.direccion}
                onChange={handleChange('direccion')}
                error={!!errors.direccion}
                helperText={errors.direccion}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.telefono}
                onChange={handleChange('telefono')}
                error={!!errors.telefono}
                helperText={errors.telefono}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  onChange={handleChange('estado')}
                  label="Estado"
                >
                  <MenuItem value="Activa">Activa</MenuItem>
                  <MenuItem value="Inactiva">Inactiva</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">
          Crear Sede
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateSedeModal

