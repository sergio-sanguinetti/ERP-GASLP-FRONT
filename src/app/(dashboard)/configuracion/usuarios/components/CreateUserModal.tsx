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
  Grid,
  Alert
} from '@mui/material'

// Type Imports
import type { CreateUserData, UserRole, UserStatus } from '../types'
import { sedesAPI, type Sede } from '@lib/api'

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
  onCreateUser: (user: CreateUserData & { password: string }) => Promise<void>
}

const CreateUserModal = ({ open, onClose, onCreateUser }: CreateUserModalProps) => {
  const [formData, setFormData] = useState<CreateUserData & { password: string }>({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    password: '',
    telefono: '',
    rol: 'repartidor',
    tipoRepartidor: undefined,
    estado: 'activo',
    sede: undefined
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserData | 'password', string>>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loadingSedes, setLoadingSedes] = useState(true)

  useEffect(() => {
    const loadSedes = async () => {
      try {
        const data = await sedesAPI.getAll()
        setSedes(data)
      } catch (err) {
        console.error('Error loading sedes:', err)
      } finally {
        setLoadingSedes(false)
      }
    }
    loadSedes()
  }, [])

  const handleChange = (field: keyof typeof formData) => (event: any) => {
    const value = event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    setSubmitError('')
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateUserData | 'password', string>> = {}

    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos'
    }

    if (!formData.apellidoPaterno.trim()) {
      newErrors.apellidoPaterno = 'El apellido paterno es requerido'
    }

    if (!formData.apellidoMaterno.trim()) {
      newErrors.apellidoMaterno = 'El apellido materno es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo no es válido'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (formData.rol === 'repartidor' && !formData.tipoRepartidor) {
      newErrors.tipoRepartidor = 'El tipo de repartidor es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSubmitError('')

    try {
      await onCreateUser({
        ...formData,
        telefono: formData.telefono || undefined,
        tipoRepartidor: formData.rol === 'repartidor' ? formData.tipoRepartidor : undefined,
        sede: formData.sede || undefined
      })
      
      // Limpiar formulario
      setFormData({
        nombres: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        email: '',
        password: '',
        telefono: '',
        rol: 'repartidor',
        tipoRepartidor: undefined,
        estado: 'activo',
        sede: ''
      })
      setErrors({})
    } catch (err: any) {
      setSubmitError(err.message || 'Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      email: '',
      password: '',
      telefono: '',
      rol: 'repartidor',
      tipoRepartidor: undefined,
      estado: 'activo',
      sede: ''
    })
    setErrors({})
    setSubmitError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Crear Nuevo Usuario</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
              {submitError}
            </Alert>
          )}
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
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                required
                inputProps={{ minLength: 6 }}
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.rol}
                  onChange={(e) => {
                    const newRol = e.target.value as any
                    setFormData(prev => ({ 
                      ...prev, 
                      rol: newRol,
                      tipoRepartidor: newRol !== 'repartidor' ? undefined : prev.tipoRepartidor
                    }))
                  }}
                  label="Rol"
                >
                  <MenuItem value="superAdministrador">Super Administrador</MenuItem>
                  <MenuItem value="administrador">Administrador</MenuItem>
                  <MenuItem value="oficina">Oficina</MenuItem>
                  <MenuItem value="planta">Planta</MenuItem>
                  <MenuItem value="credito_cobranza">Crédito y Cobranza</MenuItem>
                  <MenuItem value="repartidor">Repartidor</MenuItem>
                  <MenuItem value="gestor">Gestor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.rol === 'repartidor' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Repartidor</InputLabel>
                  <Select
                    value={formData.tipoRepartidor || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : e.target.value
                      setFormData(prev => ({ ...prev, tipoRepartidor: value as any }))
                    }}
                    label="Tipo de Repartidor"
                  >
                    <MenuItem value="cilindros">Cilindros</MenuItem>
                    <MenuItem value="pipas">Pipas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  onChange={handleChange('estado')}
                  label="Estado"
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sede</InputLabel>
                <Select
                  value={formData.sede || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : e.target.value
                    setFormData(prev => ({ ...prev, sede: value }))
                  }}
                  label="Sede"
                  disabled={loadingSedes}
                >
                  <MenuItem value="">
                    <em>Sin sede asignada</em>
                  </MenuItem>
                  {sedes.map((sede) => (
                    <MenuItem key={sede.id} value={sede.nombre}>
                      {sede.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateUserModal
