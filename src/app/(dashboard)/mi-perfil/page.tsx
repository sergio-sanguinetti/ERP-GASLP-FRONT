'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material'

// Icon Imports
import SaveIcon from '@mui/icons-material/Save'
import SecurityIcon from '@mui/icons-material/Security'
import QrCodeIcon from '@mui/icons-material/QrCode'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

// Hook Imports
import { useAuth } from '@contexts/AuthContext'
import { authAPI } from '@lib/api'
import { useRouter } from 'next/navigation'

const MiPerfilPage = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Estados para datos del usuario
  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    telefono: ''
  })

  // Estados para 2FA
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [token2FA, setToken2FA] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Cargar datos del usuario al montar
  useEffect(() => {
    if (user) {
      setFormData({
        nombres: user.nombres || '',
        apellidoPaterno: user.apellidoPaterno || '',
        apellidoMaterno: user.apellidoMaterno || '',
        email: user.email || '',
        telefono: user.telefono || ''
      })
      setIs2FAEnabled(user.isTwoFactorEnabled || false)
      setLoading(false)
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')

      const updatedUser = await authAPI.updateProfile({
        nombres: formData.nombres,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno,
        telefono: formData.telefono
      })

      // Actualizar el formulario con los datos actualizados
      setFormData({
        nombres: updatedUser.nombres || '',
        apellidoPaterno: updatedUser.apellidoPaterno || '',
        apellidoMaterno: updatedUser.apellidoMaterno || '',
        email: updatedUser.email || '',
        telefono: updatedUser.telefono || ''
      })

      // Actualizar localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      setSuccessMessage('Perfil actualizado exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar los datos')
    } finally {
      setSaving(false)
    }
  }

  const handleSetup2FA = async () => {
    try {
      setError('')
      setSaving(true)
      
      const response = await authAPI.setup2FA()
      setQrCodeUrl(response.qrCodeUrl)
      setSecret(response.secret)
      setShow2FASetup(true)
      setToken2FA('')
    } catch (err: any) {
      setError(err.message || 'Error al configurar 2FA')
    } finally {
      setSaving(false)
    }
  }

  const handleEnable2FA = async () => {
    if (!token2FA || token2FA.length !== 6) {
      setError('Por favor ingrese un código de 6 dígitos')
      return
    }

    try {
      setError('')
      setSaving(true)
      
      await authAPI.enable2FA(token2FA)
      setShow2FASetup(false)
      setQrCodeUrl('')
      setSecret('')
      setToken2FA('')
      
      // Recargar perfil del usuario para obtener el estado actualizado
      const profile = await authAPI.getProfile()
      setIs2FAEnabled(profile.isTwoFactorEnabled || false)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(profile))
      }
      
      setSuccessMessage('2FA activado exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al activar 2FA. Verifique el código.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!confirm('¿Está seguro de que desea desactivar la autenticación de dos factores?')) {
      return
    }

    try {
      setError('')
      setSaving(true)
      
      await authAPI.disable2FA()
      
      // Recargar perfil del usuario para obtener el estado actualizado
      const profile = await authAPI.getProfile()
      setIs2FAEnabled(profile.isTwoFactorEnabled || false)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(profile))
      }
      
      setSuccessMessage('2FA desactivado exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al desactivar 2FA')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Mi Perfil
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Información Personal */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Información Personal"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombres"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Apellido Paterno"
                    name="apellidoPaterno"
                    value={formData.apellidoPaterno}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Apellido Materno"
                    name="apellidoMaterno"
                    value={formData.apellidoMaterno}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    variant="outlined"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Seguridad */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Seguridad"
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<SecurityIcon />}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={is2FAEnabled}
                      onChange={(e) => {
                        if (e.target.checked && !is2FAEnabled) {
                          // Solo generar nuevo secreto si no está activado
                          handleSetup2FA()
                        } else if (!e.target.checked && is2FAEnabled) {
                          // Desactivar solo si está activado
                          handleDisable2FA()
                        }
                      }}
                      disabled={saving}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Autenticación de Dos Factores (2FA)</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {is2FAEnabled ? 'Activado' : 'Desactivado'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {is2FAEnabled && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  La autenticación de dos factores está activada. Su cuenta está más segura.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para configurar 2FA */}
      <Dialog open={show2FASetup} onClose={() => setShow2FASetup(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCodeIcon />
            Configurar Autenticación de Dos Factores
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Escanee este código QR con su aplicación de autenticación (Google Authenticator, Authy, etc.)
          </DialogContentText>
          
          {qrCodeUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
            </Box>
          )}

          {secret && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Clave secreta (si no puede escanear el QR):</strong>
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {secret}
              </Typography>
            </Alert>
          )}

          <TextField
            fullWidth
            label="Código de Verificación"
            value={token2FA}
            onChange={(e) => setToken2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            variant="outlined"
            inputProps={{
              maxLength: 6,
              style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
            }}
            helperText="Ingrese el código de 6 dígitos de su aplicación de autenticación"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShow2FASetup(false)
            setQrCodeUrl('')
            setSecret('')
            setToken2FA('')
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEnable2FA}
            disabled={!token2FA || token2FA.length !== 6 || saving}
          >
            {saving ? 'Activando...' : 'Activar 2FA'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MiPerfilPage

