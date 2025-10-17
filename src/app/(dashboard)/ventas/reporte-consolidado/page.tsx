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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip
} from '@mui/material'
import { 
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
  GasMeter as GasMeterIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material'

// Tipos de datos
interface ReporteConsolidado {
  fecha: string
  validador: string
  operacionPipas: {
    totalRutas: number
    totalServicios: number
    litrosVendidos: number
    subtotalVentas: number
    subtotalAbonos: number
  }
  operacionCilindros: {
    totalRutas: number
    totalServicios: number
    kgVendidos: number
    envasesNuevos: number
    subtotalVentas: number
    subtotalAbonos: number
  }
  granTotalOperacion: number
  formasPago: {
    pipas: {
      efectivo: number
      transferencia: number
      tarjeta: number
      credito: number
    }
    cilindros: {
      efectivo: number
      transferencia: number
      tarjeta: number
      credito: number
    }
  }
  efectivoConsolidado: number
}

// Datos de ejemplo
const reporteConsolidado: ReporteConsolidado = {
  fecha: '2024-01-25',
  validador: 'María González Pérez',
  operacionPipas: {
    totalRutas: 8,
    totalServicios: 32,
    litrosVendidos: 1850,
    subtotalVentas: 85000,
    subtotalAbonos: 12000
  },
  operacionCilindros: {
    totalRutas: 12,
    totalServicios: 28,
    kgVendidos: 560,
    envasesNuevos: 3,
    subtotalVentas: 40000,
    subtotalAbonos: 8000
  },
  granTotalOperacion: 125000,
  formasPago: {
    pipas: {
      efectivo: 45000,
      transferencia: 25000,
      tarjeta: 10000,
      credito: 5000
    },
    cilindros: {
      efectivo: 20000,
      transferencia: 12000,
      tarjeta: 5000,
      credito: 3000
    }
  },
  efectivoConsolidado: 65000
}

export default function ReporteConsolidadoPage() {
  const [mostrarDetalles, setMostrarDetalles] = useState(false)
  const [dialogoImprimir, setDialogoImprimir] = useState(false)

  const imprimirReporte = () => {
    window.print()
    setDialogoImprimir(false)
  }

  const exportarPDF = () => {
    // Lógica para exportar a PDF
    console.log('Exportando a PDF...')
  }

  const compartirReporte = () => {
    // Lógica para compartir reporte
    console.log('Compartiendo reporte...')
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado del Reporte */}
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                REPORTE CONSOLIDADO PARA OFICINA
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon />
                  <Typography variant="h6">
                    {new Date(reporteConsolidado.fecha).toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  <Typography variant="h6">
                    Validador: {reporteConsolidado.validador}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Imprimir">
                <IconButton color="inherit" onClick={() => setDialogoImprimir(true)}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Exportar PDF">
                <IconButton color="inherit" onClick={exportarPDF}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Compartir">
                <IconButton color="inherit" onClick={compartirReporte}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* OPERACIÓN PIPAS */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LocalShippingIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
                <Typography variant="h5" color="primary">
                  OPERACIÓN PIPAS
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Rutas
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {reporteConsolidado.operacionPipas.totalRutas}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Servicios
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {reporteConsolidado.operacionPipas.totalServicios}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Litros Vendidos
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {reporteConsolidado.operacionPipas.litrosVendidos.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal Ventas
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ${reporteConsolidado.operacionPipas.subtotalVentas.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 1 }}>
                <Typography variant="h6" color="success.dark" gutterBottom>
                  Subtotal de Abonos - Pipas
                </Typography>
                <Typography variant="h3" color="success.dark">
                  ${reporteConsolidado.operacionPipas.subtotalAbonos.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* OPERACIÓN CILINDROS */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <GasMeterIcon color="secondary" sx={{ mr: 1, fontSize: 30 }} />
                <Typography variant="h5" color="secondary">
                  OPERACIÓN CILINDROS
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Rutas
                  </Typography>
                  <Typography variant="h4" color="secondary">
                    {reporteConsolidado.operacionCilindros.totalRutas}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Servicios
                  </Typography>
                  <Typography variant="h4" color="secondary">
                    {reporteConsolidado.operacionCilindros.totalServicios}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    KG Vendidos
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {reporteConsolidado.operacionCilindros.kgVendidos.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Envases Nuevos
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {reporteConsolidado.operacionCilindros.envasesNuevos}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal Ventas
                  </Typography>
                  <Typography variant="h4" color="secondary">
                    ${reporteConsolidado.operacionCilindros.subtotalVentas.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 1 }}>
                <Typography variant="h6" color="success.dark" gutterBottom>
                  Subtotal de Abonos - Cilindros
                </Typography>
                <Typography variant="h3" color="success.dark">
                  ${reporteConsolidado.operacionCilindros.subtotalAbonos.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* GRAN TOTAL OPERACIÓN */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  GRAN TOTAL OPERACIÓN
                </Typography>
                <Typography variant="h1" sx={{ fontWeight: 'bold' }}>
                  ${reporteConsolidado.granTotalOperacion.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* DESGLOSE DE FORMAS DE PAGO */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                DESGLOSE DE FORMAS DE PAGO
              </Typography>
              
              <Grid container spacing={3}>
                {/* Pipas */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="h6" color="primary.dark" gutterBottom>
                      PIPAS
                    </Typography>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Forma de Pago</TableCell>
                          <TableCell align="right">Monto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Efectivo</TableCell>
                          <TableCell align="right">
                            ${reporteConsolidado.formasPago.pipas.efectivo.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Transferencia</TableCell>
                          <TableCell align="right">
                            ${reporteConsolidado.formasPago.pipas.transferencia.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Tarjeta</TableCell>
                          <TableCell align="right">
                            ${reporteConsolidado.formasPago.pipas.tarjeta.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Crédito</TableCell>
                          <TableCell align="right">
                            ${reporteConsolidado.formasPago.pipas.credito.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Cilindros */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: 'secondary.light', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="h6" color="secondary.dark" gutterBottom>
                      CILINDROS
                    </Typography>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Forma de Pago</TableCell>
                          <TableCell align="right">Monto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Efectivo</TableCell>
                          <TableCell align="right">
                            ${reporteConsolidado.formasPago.cilindros.efectivo.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Transferencia</TableCell>
                          <TableCell align="right">
                            ${reporteConsolidado.formasPago.cilindros.transferencia.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Tarjeta</TableCell>
                          <TableCell align="right">
                            ${reporteConsolidado.formasPago.cilindros.tarjeta.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Crédito</TableCell>
                          <TableCell align="right">
                            ${reporteConsolidado.formasPago.cilindros.credito.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* RESUMEN DEL EFECTIVO CONSOLIDADO */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  RESUMEN DEL EFECTIVO CONSOLIDADO
                </Typography>
                <Typography variant="h1" sx={{ fontWeight: 'bold' }}>
                  ${reporteConsolidado.efectivoConsolidado.toLocaleString()}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Chip 
                    label={`Pipas: $${reporteConsolidado.formasPago.pipas.efectivo.toLocaleString()}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip 
                    label={`Cilindros: $${reporteConsolidado.formasPago.cilindros.efectivo.toLocaleString()}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Botones de Acción */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => setDialogoImprimir(true)}
          size="large"
        >
          Imprimir Reporte
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportarPDF}
          size="large"
        >
          Exportar PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={compartirReporte}
          size="large"
        >
          Compartir
        </Button>
      </Box>

      {/* Modal de Confirmación de Impresión */}
      <Dialog open={dialogoImprimir} onClose={() => setDialogoImprimir(false)}>
        <DialogTitle>Confirmar Impresión</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas imprimir el reporte consolidado?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoImprimir(false)}>
            Cancelar
          </Button>
          <Button onClick={imprimirReporte} variant="contained" startIcon={<PrintIcon />}>
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  )
}

