'use client'

// React Imports
import { useState } from 'react'

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
  Typography
} from '@mui/material'

// Component Imports
import CreateUserModal from './components/CreateUserModal'
import EditUserModal from './components/EditUserModal'

// Type Imports
import type { User, UserRole } from './types'

// Mock data para sedes
const mockSedes = [
  { id: 1, nombre: 'Sede Central' },
  { id: 2, nombre: 'Sede Norte' },
  { id: 3, nombre: 'Sede Sur' }
]

// Mock data para usuarios
const mockUsers: User[] = [
  {
    id: 1,
    nombres: 'Juan Carlos',
    apellidoPaterno: 'García',
    apellidoMaterno: 'López',
    rol: 'Administrador',
    correo: 'juan.garcia@empresa.com',
    estado: 'Activo',
    sedeId: 1,
    sedeNombre: 'Sede Central',
    fechaCreacion: '2024-01-15'
  },
  {
    id: 2,
    nombres: 'María Elena',
    apellidoPaterno: 'Rodríguez',
    apellidoMaterno: 'Sánchez',
    rol: 'Gestor',
    correo: 'maria.rodriguez@empresa.com',
    estado: 'Activo',
    sedeId: 2,
    sedeNombre: 'Sede Norte',
    fechaCreacion: '2024-02-20'
  },
  {
    id: 3,
    nombres: 'Carlos',
    apellidoPaterno: 'Martínez',
    apellidoMaterno: 'González',
    rol: 'Repartidor',
    correo: 'carlos.martinez@empresa.com',
    estado: 'Inactivo',
    sedeId: 3,
    sedeNombre: 'Sede Sur',
    fechaCreacion: '2024-03-10'
  }
]

const UsuariosPage = () => {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleCreateUser = (newUser: Omit<User, 'id' | 'fechaCreacion' | 'sedeNombre'>) => {
    const sedeNombre = newUser.sedeId 
      ? mockSedes.find(s => s.id === newUser.sedeId)?.nombre 
      : undefined
    
    const user: User = {
      ...newUser,
      sedeNombre,
      id: Math.max(...users.map(u => u.id), 0) + 1,
      fechaCreacion: new Date().toISOString().split('T')[0]
    }
    setUsers([...users, user])
    setIsCreateModalOpen(false)
  }

  const handleEditUser = (updatedUser: User) => {
    // Asegurar que el nombre de la sede esté actualizado
    const sedeNombre = updatedUser.sedeId 
      ? mockSedes.find(s => s.id === updatedUser.sedeId)?.nombre 
      : undefined
    
    const userWithSede: User = {
      ...updatedUser,
      sedeNombre
    }
    
    setUsers(users.map(user => user.id === updatedUser.id ? userWithSede : user))
    setIsEditModalOpen(false)
    setSelectedUser(null)
  }

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId))
  }

  const getRoleColor = (rol: UserRole) => {
    switch (rol) {
      case 'Administrador':
        return 'error'
      case 'Gestor':
        return 'warning'
      case 'Repartidor':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusColor = (estado: string) => {
    return estado === 'Activo' ? 'success' : 'error'
  }

  return (
    <Box sx={{ p: 3 }}>
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
                  <TableCell>Fecha Creación</TableCell>
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
                    <TableCell>{user.correo}</TableCell>
                    <TableCell>
                      {user.sedeNombre || (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Sin sede
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
                    <TableCell>{user.fechaCreacion}</TableCell>
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
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <i className="tabler-trash" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modales */}
      <CreateUserModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateUser={handleCreateUser}
        sedes={mockSedes}
      />

      <EditUserModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null)
        }}
        onEditUser={handleEditUser}
        user={selectedUser}
        sedes={mockSedes}
      />
    </Box>
  )
}

export default UsuariosPage








