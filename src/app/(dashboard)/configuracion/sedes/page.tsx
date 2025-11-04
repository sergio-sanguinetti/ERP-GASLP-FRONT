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
import CreateSedeModal from './components/CreateSedeModal'
import EditSedeModal from './components/EditSedeModal'

// Type Imports
import type { Sede } from './types'

// Mock data para sedes
const mockSedes: Sede[] = [
  {
    id: 1,
    nombre: 'Sede Central',
    direccion: 'Av. Principal 123, Ciudad',
    telefono: '555-0101',
    email: 'sede.central@empresa.com',
    estado: 'Activa',
    fechaCreacion: '2024-01-15'
  },
  {
    id: 2,
    nombre: 'Sede Norte',
    direccion: 'Calle Norte 456, Ciudad',
    telefono: '555-0202',
    email: 'sede.norte@empresa.com',
    estado: 'Activa',
    fechaCreacion: '2024-02-20'
  },
  {
    id: 3,
    nombre: 'Sede Sur',
    direccion: 'Boulevard Sur 789, Ciudad',
    telefono: '555-0303',
    email: 'sede.sur@empresa.com',
    estado: 'Inactiva',
    fechaCreacion: '2024-03-10'
  }
]

const SedesPage = () => {
  const [sedes, setSedes] = useState<Sede[]>(mockSedes)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null)

  const handleCreateSede = (newSede: Omit<Sede, 'id' | 'fechaCreacion'>) => {
    const sede: Sede = {
      ...newSede,
      id: Math.max(...sedes.map(s => s.id), 0) + 1,
      fechaCreacion: new Date().toISOString().split('T')[0]
    }
    setSedes([...sedes, sede])
    setIsCreateModalOpen(false)
  }

  const handleEditSede = (updatedSede: Sede) => {
    setSedes(sedes.map(sede => sede.id === updatedSede.id ? updatedSede : sede))
    setIsEditModalOpen(false)
    setSelectedSede(null)
  }

  const handleDeleteSede = (sedeId: number) => {
    setSedes(sedes.filter(sede => sede.id !== sedeId))
  }

  const getStatusColor = (estado: string) => {
    return estado === 'Activa' ? 'success' : 'error'
  }

  return (
    <Box sx={{ p: 3 }}>
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
                    <TableCell>{sede.fechaCreacion}</TableCell>
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
                        onClick={() => handleDeleteSede(sede.id)}
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
    </Box>
  )
}

export default SedesPage

