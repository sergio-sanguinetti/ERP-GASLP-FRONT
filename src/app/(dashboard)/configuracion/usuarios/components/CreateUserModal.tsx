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
import type { CreateUserData, UserRole, UserStatus } from '../types'

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
  onCreateUser: (user: CreateUserData) => void
}

const CreateUserModal = ({ open, onClose, onCreateUser }: CreateUserModalProps) => {
  const [formData, setFormData] = useState<CreateUserData>({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    rol: 'Repartidor',
    correo: '',
    estado: 'Activo'
  })

  const [errors, setErrors] = useState<Partial<CreateUserData>>({})

  const handleChange = (field: keyof CreateUserData) => (event: any) => {
    const value = event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserData> = {}

    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos'
    }

    if (!formData.apellidoPaterno.trim()) {
      newErrors.apellidoPaterno = 'El apellido paterno es requerido'
    }

    if (!formData.apellidoMaterno.trim()) {
      newErrors.apellidoMaterno = 'El apellido materno es requerido'
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onCreateUser(formData)
      setFormData({
        nombres: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        rol: 'Repartidor',
        correo: '',
        estado: 'Activo'
      })
      setErrors({})
    }
  }

  const handleClose = () => {
    setFormData({
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      rol: 'Repartidor',
      correo: '',
      estado: 'Activo'
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Crear Nuevo Usuario</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombres"
                value={formData.nombres}
                onChange={handleChange('nombres')}
                error={!!errors.nombres}
                helperText={errors.nombres}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido Paterno"
                value={formData.apellidoPaterno}
                onChange={handleChange('apellidoPaterno')}
                error={!!errors.apellidoPaterno}
                helperText={errors.apellidoPaterno}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido Materno"
                value={formData.apellidoMaterno}
                onChange={handleChange('apellidoMaterno')}
                error={!!errors.apellidoMaterno}
                helperText={errors.apellidoMaterno}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                type="email"
                value={formData.correo}
                onChange={handleChange('correo')}
                error={!!errors.correo}
                helperText={errors.correo}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.rol}
                  onChange={handleChange('rol')}
                  label="Rol"
                >
                  <MenuItem value="Administrador">Administrador</MenuItem>
                  <MenuItem value="Gestor">Gestor</MenuItem>
                  <MenuItem value="Repartidor">Repartidor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  onChange={handleChange('estado')}
                  label="Estado"
                >
                  <MenuItem value="Activo">Activo</MenuItem>
                  <MenuItem value="Inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">
          Crear Usuario
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateUserModal

