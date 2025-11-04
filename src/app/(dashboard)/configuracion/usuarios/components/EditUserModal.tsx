'use client'

// React Imports
import { useState, useEffect } from 'react'

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
import type { User, UserRole, UserStatus } from '../types'

interface EditUserModalProps {
  open: boolean
  onClose: () => void
  onEditUser: (user: User) => void
  user: User | null
  sedes?: Array<{ id: number; nombre: string }>
}

// Mock de sedes para el selector
const mockSedes = [
  { id: 1, nombre: 'Sede Central' },
  { id: 2, nombre: 'Sede Norte' },
  { id: 3, nombre: 'Sede Sur' }
]

const EditUserModal = ({ open, onClose, onEditUser, user, sedes = mockSedes }: EditUserModalProps) => {
  const [formData, setFormData] = useState<User>({
    id: 0,
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    rol: 'Repartidor',
    correo: '',
    estado: 'Activo',
    sedeId: undefined,
    sedeNombre: undefined,
    fechaCreacion: ''
  })

  const [errors, setErrors] = useState<Partial<User>>({})

  useEffect(() => {
    if (user) {
      setFormData(user)
    }
  }, [user])

  const handleChange = (field: keyof User) => (event: any) => {
    const value = event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<User> = {}

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
      onEditUser(formData)
      setErrors({})
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar Usuario</DialogTitle>
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sede</InputLabel>
                <Select
                  value={formData.sedeId || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : Number(e.target.value)
                    const selectedSede = sedes.find(s => s.id === value)
                    setFormData(prev => ({ 
                      ...prev, 
                      sedeId: value,
                      sedeNombre: selectedSede?.nombre
                    }))
                  }}
                  label="Sede"
                >
                  <MenuItem value="">
                    <em>Sin sede asignada</em>
                  </MenuItem>
                  {sedes.map((sede) => (
                    <MenuItem key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fecha de Creación"
                value={formData.fechaCreacion}
                disabled
                helperText="Este campo no se puede modificar"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditUserModal








