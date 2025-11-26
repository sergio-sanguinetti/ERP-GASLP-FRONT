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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material'

// Component Imports
import CreateUserModal from './components/CreateUserModal'
import EditUserModal from './components/EditUserModal'

// Type Imports
import type { User, UserRole } from './types'
import { usuariosAPI } from '@lib/api'

const UsuariosPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await usuariosAPI.getAll()
      setUsers(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios')
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (newUser: Omit<User, 'id' | 'fechaRegistro' | 'isTwoFactorEnabled'> & { password: string }) => {
    try {
      setError('')
      await usuariosAPI.create({
        nombres: newUser.nombres,
        apellidoPaterno: newUser.apellidoPaterno,
        apellidoMaterno: newUser.apellidoMaterno,
        email: newUser.email,
        password: newUser.password,
        telefono: newUser.telefono,
        rol: newUser.rol,
        tipoRepartidor: newUser.tipoRepartidor,
        estado: newUser.estado,
        sede: newUser.sede
      })
      setIsCreateModalOpen(false)
      await loadUsers() // Recargar la lista
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario')
      throw err // Re-lanzar para que el modal pueda manejarlo
    }
  }

  const handleEditUser = async (updatedUser: User) => {
    try {
      setError('')
      await usuariosAPI.update(updatedUser.id, {
        nombres: updatedUser.nombres,
        apellidoPaterno: updatedUser.apellidoPaterno,
        apellidoMaterno: updatedUser.apellidoMaterno,
        email: updatedUser.email,
        telefono: updatedUser.telefono,
        rol: updatedUser.rol,
        tipoRepartidor: updatedUser.tipoRepartidor,
        estado: updatedUser.estado,
        sede: updatedUser.sede
      })
      setIsEditModalOpen(false)
      setSelectedUser(null)
      await loadUsers() // Recargar la lista
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario')
      throw err // Re-lanzar para que el modal pueda manejarlo
    }
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setDeleting(true)
      setError('')
      await usuariosAPI.delete(userToDelete.id)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      await loadUsers() // Recargar la lista
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario')
    } finally {
      setDeleting(false)
    }
  }

  const getRoleColor = (rol: UserRole) => {
    switch (rol) {
      case 'superAdministrador':
        return 'error'
      case 'administrador':
        return 'warning'
      case 'gestor':
        return 'info'
      case 'repartidor':
        return 'success'
      default:
        return 'default'
    }
  }

  const getStatusColor = (estado: string) => {
    return estado === 'activo' ? 'success' : 'error'
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (loading && users.length === 0) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Gestión de Usuarios"
          action={
            <Button
              variant="contained"
              startIcon={<i className="tabler-plus" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Crear Usuario
            </Button>
          }
        />
        <CardContent>
          {users.length === 0 && !loading ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No hay usuarios registrados
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombres</TableCell>
                    <TableCell>Apellido Paterno</TableCell>
                    <TableCell>Apellido Materno</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Sede</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Registro</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.nombres}</TableCell>
                      <TableCell>{user.apellidoPaterno}</TableCell>
                      <TableCell>{user.apellidoMaterno}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.rol}
                          color={getRoleColor(user.rol)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.sede || (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Sin sede asignada
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.estado}
                          color={getStatusColor(user.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.fechaRegistro)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <i className="tabler-edit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <i className="tabler-trash" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <CreateUserModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateUser={handleCreateUser}
      />

      <EditUserModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null)
        }}
        onEditUser={handleEditUser}
        user={selectedUser}
      />

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar al usuario{' '}
            <strong>
              {userToDelete?.nombres} {userToDelete?.apellidoPaterno} {userToDelete?.apellidoMaterno}
            </strong>
            ? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UsuariosPage
