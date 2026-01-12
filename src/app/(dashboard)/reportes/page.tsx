'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'

// Recharts Imports
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// API Imports
import { reportesAPI, type ResumenGeneral } from '@/lib/api'

// Icon Imports
import FilterListIcon from '@mui/icons-material/FilterList'
import RefreshIcon from '@mui/icons-material/Refresh'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function ReportesPage() {
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null)
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ResumenGeneral | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      const filtros: any = {}
      if (fechaDesde) {
        filtros.fechaDesde = fechaDesde.toISOString().split('T')[0]
      }
      if (fechaHasta) {
        filtros.fechaHasta = fechaHasta.toISOString().split('T')[0]
      }

      const resumen = await reportesAPI.getResumenGeneral(filtros)
      setData(resumen)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los reportes')
      console.error('Error cargando reportes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAplicarFiltros = () => {
    cargarDatos()
  }

  const handleLimpiarFiltros = () => {
    setFechaDesde(null)
    setFechaHasta(null)
    setTimeout(() => {
      cargarDatos()
    }, 100)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        {/* Encabezado */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Reportes y Análisis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualización de datos de ventas, cortes, créditos y clientes
            </Typography>
          </CardContent>
        </Card>

        {/* Filtros de Fecha */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <DatePicker
                label="Fecha Desde"
                value={fechaDesde}
                onChange={(newValue) => setFechaDesde(newValue)}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
              />
              <DatePicker
                label="Fecha Hasta"
                value={fechaHasta}
                onChange={(newValue) => setFechaHasta(newValue)}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
              />
              <Button
                variant="contained"
                startIcon={<FilterListIcon />}
                onClick={handleAplicarFiltros}
                disabled={loading}
              >
                Aplicar Filtros
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleLimpiarFiltros}
                disabled={loading}
              >
                Limpiar
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Gráficas */}
        {!loading && data && (
          <Grid container spacing={3}>
            {/* Ventas por Mes */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ventas por Mes
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.ventasPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mesNombre" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="total" fill="#0088FE" name="Total Ventas" />
                      <Bar dataKey="cantidad" fill="#00C49F" name="Cantidad Pedidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Cortes por Mes */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cortes por Mes
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.cortesPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mesNombre" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#8884d8" name="Total Cortes" />
                      <Bar dataKey="validados" fill="#82ca9d" name="Validados" />
                      <Bar dataKey="pendientes" fill="#FF8042" name="Pendientes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Dinero Entregado por Cortes */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Dinero Entregado por Cortes
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.dineroEntregado}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mesNombre" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#0088FE" name="Total" />
                      <Line type="monotone" dataKey="totalVentas" stroke="#00C49F" name="Ventas" />
                      <Line type="monotone" dataKey="totalAbonos" stroke="#FFBB28" name="Abonos" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Clientes por Zona */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Clientes por Zona
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.clientesPorZona}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ zonaNombre, cantidad }) => `${zonaNombre}: ${cantidad}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {data.clientesPorZona.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Estadísticas de Créditos */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estadísticas de Créditos
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <Typography variant="h4">{data.estadisticasCreditos.activos}</Typography>
                        <Typography variant="body2">Créditos Activos</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="h4">{data.estadisticasCreditos.pagados}</Typography>
                        <Typography variant="body2">Créditos Pagados</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                        <Typography variant="h4">
                          ${data.estadisticasCreditos.deuda.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">Deuda Total</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Créditos por Mes */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Créditos por Mes
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.creditosPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mesNombre" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="activos" fill="#0088FE" name="Activos" />
                      <Bar dataKey="pagados" fill="#00C49F" name="Pagados" />
                      <Bar dataKey="vencidos" fill="#FF8042" name="Vencidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Ventas por Tipo de Servicio */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ventas por Tipo de Servicio
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pipas', value: data.ventasPorTipoServicio.pipas.total },
                          { name: 'Cilindros', value: data.ventasPorTipoServicio.cilindros.total }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#0088FE" />
                        <Cell fill="#00C49F" />
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pipas
                      </Typography>
                      <Typography variant="h6">
                        {data.ventasPorTipoServicio.pipas.cantidad} pedidos
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Cilindros
                      </Typography>
                      <Typography variant="h6">
                        {data.ventasPorTipoServicio.cilindros.cantidad} pedidos
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Ventas por Forma de Pago */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ventas por Forma de Pago
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.ventasPorFormaPago} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="nombre" type="category" width={100} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="total" fill="#8884d8" name="Total" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Mensaje cuando no hay datos */}
        {!loading && !data && !error && (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                No hay datos disponibles para mostrar
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  )
}

