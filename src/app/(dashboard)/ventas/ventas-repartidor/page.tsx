'use client'

import React, { useState } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  Button,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  LinearProgress,
  Alert
} from '@mui/material'
import { 
  LocalShipping as LocalShippingIcon,
  GasMeter as GasMeterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon
} from '@mui/icons-material'

// Tipos de datos
interface VentaRepartidor {
  id: string
  cliente: string
  direccion: string
  tipoServicio: 'pipas' | 'cilindros'
  cantidad: number
  unidad: string
  precioUnitario: number
  subtotal: number
  descuento: number
  total: number
  formaPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'credito'
  horaEntrega: string
  estado: 'entregado' | 'pendiente' | 'problema'
}

interface RepartidorResumen {
  id: string
  nombre: string
  tipo: 'pipas' | 'cilindros'
  foto: string
  totalVentas: number
  totalServicios: number
  promedioPorServicio: number
  eficiencia: number
  ventas: VentaRepartidor[]
}

// Datos de ejemplo
const repartidoresResumen: RepartidorResumen[] = [
  {
    id: '1',
    nombre: 'Carlos Mendoza',
    tipo: 'pipas',
    foto: '/images/avatars/1.png',
    totalVentas: 25000,
    totalServicios: 8,
    promedioPorServicio: 3125,
    eficiencia: 95,
    ventas: [
      {
        id: '1',
        cliente: 'María González',
        direccion: 'Av. Insurgentes Sur 123, Roma Norte',
        tipoServicio: 'pipas',
        cantidad: 100,
        unidad: 'litros',
        precioUnitario: 18.50,
        subtotal: 1850,
        descuento: 50,
        total: 1800,
        formaPago: 'efectivo',
        horaEntrega: '09:30',
        estado: 'entregado'
      },
      {
        id: '2',
        cliente: 'Roberto Silva',
        direccion: 'Calle Morelos 456, Centro',
        tipoServicio: 'pipas',
        cantidad: 150,
        unidad: 'litros',
        precioUnitario: 18.50,
        subtotal: 2775,
        descuento: 0,
        total: 2775,
        formaPago: 'transferencia',
        horaEntrega: '11:15',
        estado: 'entregado'
      }
    ]
  },
  {
    id: '2',
    nombre: 'Ana García',
    tipo: 'cilindros',
    foto: '/images/avatars/1.png',
    totalVentas: 18000,
    totalServicios: 12,
    promedioPorServicio: 1500,
    eficiencia: 88,
    ventas: [
      {
        id: '3',
        cliente: 'Patricia López',
        direccion: 'Blvd. López Mateos 789, Del Valle',
        tipoServicio: 'cilindros',
        cantidad: 2,
        unidad: 'cilindros',
        precioUnitario: 185,
        subtotal: 370,
        descuento: 10,
        total: 360,
        formaPago: 'efectivo',
        horaEntrega: '10:45',
        estado: 'entregado'
      }
    ]
  },
  {
    id: '3',
    nombre: 'Miguel López',
    tipo: 'cilindros',
    foto: '/images/avatars/1.png',
    totalVentas: 15000,
    totalServicios: 10,
    promedioPorServicio: 1500,
    eficiencia: 92,
    ventas: []
  }
]

export default function VentasPorRepartidorPage() {
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<RepartidorResumen | null>(null)
  const [mostrarDetalles, setMostrarDetalles] = useState(false)

  const verDetalles = (repartidor: RepartidorResumen) => {
    setRepartidorSeleccionado(repartidor)
    setMostrarDetalles(true)
  }

  const cerrarDetalles = () => {
    setMostrarDetalles(false)
    setRepartidorSeleccionado(null)
  }

  const exportarReporte = () => {
    console.log('Exportando reporte de ventas por repartidor...')
  }

  const imprimirReporte = () => {
    window.print()
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'entregado': return 'success'
      case 'pendiente': return 'warning'
      case 'problema': return 'error'
      default: return 'default'
    }
  }

  const getFormaPagoColor = (formaPago: string) => {
    switch (formaPago) {
      case 'efectivo': return 'success'
      case 'transferencia': return 'info'
      case 'tarjeta': return 'primary'
      case 'credito': return 'warning'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Ventas por Repartidor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Reporte detallado de ventas por repartidor - {new Date().toLocaleDateString('es-MX')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Exportar">
            <IconButton onClick={exportarReporte}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Imprimir">
            <IconButton onClick={imprimirReporte}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Compartir">
            <IconButton onClick={() => console.log('Compartir reporte')}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Resumen General */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    TOTAL VENTAS
                  </Typography>
                  <Typography variant="h4" component="div" color="primary">
                    ${repartidoresResumen.reduce((sum, r) => sum + r.totalVentas, 0).toLocaleString()}
                  </Typography>
                </Box>
                <AttachMoneyIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    TOTAL SERVICIOS
                  </Typography>
                  <Typography variant="h4" component="div" color="secondary">
                    {repartidoresResumen.reduce((sum, r) => sum + r.totalServicios, 0)}
                  </Typography>
                </Box>
                <AssessmentIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    PROMEDIO EFICIENCIA
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    {Math.round(repartidoresResumen.reduce((sum, r) => sum + r.eficiencia, 0) / repartidoresResumen.length)}%
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    REPARTIDORES ACTIVOS
                  </Typography>
                  <Typography variant="h4" component="div" color="info.main">
                    {repartidoresResumen.length}
                  </Typography>
                </Box>
                <LocalShippingIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Repartidores */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resumen por Repartidor
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Repartidor</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Total Ventas</TableCell>
                  <TableCell align="right">Servicios</TableCell>
                  <TableCell align="right">Promedio/Servicio</TableCell>
                  <TableCell align="center">Eficiencia</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {repartidoresResumen.map((repartidor) => (
                  <TableRow key={repartidor.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={repartidor.foto} sx={{ width: 40, height: 40 }}>
                          {repartidor.nombre.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {repartidor.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {repartidor.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={repartidor.tipo.toUpperCase()} 
                        color={repartidor.tipo === 'pipas' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        ${repartidor.totalVentas.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6">
                        {repartidor.totalServicios}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" color="text.secondary">
                        ${repartidor.promedioPorServicio.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={repartidor.eficiencia} 
                          sx={{ width: 60, height: 8, borderRadius: 4 }}
                          color={repartidor.eficiencia >= 90 ? 'success' : repartidor.eficiencia >= 80 ? 'warning' : 'error'}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {repartidor.eficiencia}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton 
                          size="small" 
                          onClick={() => verDetalles(repartidor)}
                        >
                          <AssessmentIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      {mostrarDetalles && repartidorSeleccionado && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={repartidorSeleccionado.foto} sx={{ width: 50, height: 50 }}>
                  {repartidorSeleccionado.nombre.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    Detalles de Ventas - {repartidorSeleccionado.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {repartidorSeleccionado.tipo.toUpperCase()} • {repartidorSeleccionado.totalServicios} servicios
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={cerrarDetalles}>
                ×
              </IconButton>
            </Box>

            {repartidorSeleccionado.ventas.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Dirección</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Descuento</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Pago</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {repartidorSeleccionado.ventas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {venta.cliente}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {venta.direccion}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {venta.cantidad} {venta.unidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${venta.precioUnitario}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${venta.subtotal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            ${venta.descuento.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">
                            ${venta.total.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={venta.formaPago.toUpperCase()} 
                            color={getFormaPagoColor(venta.formaPago) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={venta.estado.toUpperCase()} 
                            color={getEstadoColor(venta.estado) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No hay ventas registradas para este repartidor en la fecha seleccionada.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alertas y Notas */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Nota:</strong> Los datos mostrados corresponden al día actual. 
            Para consultar períodos anteriores, utilice el filtro de fechas.
          </Typography>
        </Alert>
      </Box>
    </Box>
  )
}
