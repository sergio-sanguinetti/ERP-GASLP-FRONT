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
import CreateSedeModal from './components/CreateSedeModal'
import EditSedeModal from './components/EditSedeModal'

// Type Imports
import type { Sede } from './types'
import { sedesAPI } from '@lib/api'

const SedesPage = () => {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sedeToDelete, setSedeToDelete] = useState<Sede | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Cargar sedes al montar el componente
  useEffect(() => {
    loadSedes()
  }, [])

  const loadSedes = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await sedesAPI.getAll()
      setSedes(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar sedes')
      console.error('Error loading sedes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSede = async (newSede: Omit<Sede, 'id' | 'fechaCreacion'>) => {
    try {
      setError('')
      await sedesAPI.create({
        nombre: newSede.nombre,
        direccion: newSede.direccion,
        telefono: newSede.telefono,
        email: newSede.email,
        estado: newSede.estado
      })
      setIsCreateModalOpen(false)
      await loadSedes() // Recargar la lista
    } catch (err: any) {
      setError(err.message || 'Error al crear sede')
      throw err // Re-lanzar para que el modal pueda manejarlo
    }
  }

  const handleEditSede = async (updatedSede: Sede) => {
    try {
      setError('')
      await sedesAPI.update(updatedSede.id, {
        nombre: updatedSede.nombre,
        direccion: updatedSede.direccion,
        telefono: updatedSede.telefono,
        email: updatedSede.email,
        estado: updatedSede.estado
      })
      setIsEditModalOpen(false)
      setSelectedSede(null)
      await loadSedes() // Recargar la lista
    } catch (err: any) {
      setError(err.message || 'Error al actualizar sede')
      throw err // Re-lanzar para que el modal pueda manejarlo
    }
  }

  const handleDeleteClick = (sede: Sede) => {
    setSedeToDelete(sede)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!sedeToDelete) return

    try {
      setDeleting(true)
      setError('')
      await sedesAPI.delete(sedeToDelete.id)
      setDeleteDialogOpen(false)
      setSedeToDelete(null)
      await loadSedes() // Recargar la lista
    } catch (err: any) {
      setError(err.message || 'Error al eliminar sede')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (estado: string) => {
    return estado === 'activa' ? 'success' : 'error'
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

  if (loading && sedes.length === 0) {
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
          title="Gestión de Sedes"
          action={
            <Button
              variant="contained"
              startIcon={<i className="tabler-plus" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Crear Sede
            </Button>
          }
        />
        <CardContent>
          {sedes.length === 0 && !loading ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No hay sedes registradas
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Dirección</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sedes.map((sede) => (
                    <TableRow key={sede.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {sede.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>{sede.direccion}</TableCell>
                      <TableCell>{sede.telefono}</TableCell>
                      <TableCell>{sede.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={sede.estado}
                          color={getStatusColor(sede.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(sede.fechaCreacion)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedSede(sede)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <i className="tabler-edit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(sede)}
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
      <CreateSedeModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateSede={handleCreateSede}
      />

      <EditSedeModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedSede(null)
        }}
        onEditSede={handleEditSede}
        sede={selectedSede}
      />

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la sede <strong>{sedeToDelete?.nombre}</strong>? 
            Esta acción no se puede deshacer.
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

export default SedesPage
