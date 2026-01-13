'use client'

import React, { useState, useEffect } from 'react'
import {
  reportesAPI,
  sedesAPI,
  type Sede
} from '@/lib/api'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function ReportesPage() {
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null)
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null)
  const [sedeId, setSedeId] = useState<string>('')
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(false)

  // Datos de reportes
  const [ventasPorMes, setVentasPorMes] = useState<any[]>([])
  const [cortesPorMes, setCortesPorMes] = useState<any[]>([])
  const [dineroEntregadoPorCortes, setDineroEntregadoPorCortes] = useState<any[]>([])
  const [clientesPorZona, setClientesPorZona] = useState<any[]>([])
  const [estadisticasCreditos, setEstadisticasCreditos] = useState<any>({})
  const [creditosPorMes, setCreditosPorMes] = useState<any[]>([])
  const [ventasPorTipoServicio, setVentasPorTipoServicio] = useState<any[]>([])
  const [ventasPorFormaPago, setVentasPorFormaPago] = useState<any[]>([])
  const [resumenGeneral, setResumenGeneral] = useState<any>({})

  useEffect(() => {
    loadSedes()
  }, [])

  useEffect(() => {
    loadReportes()
  }, [fechaDesde, fechaHasta, sedeId])

  const loadSedes = async () => {
    try {
      const data = await sedesAPI.getAll()
      setSedes(data)
    } catch (error) {
      console.error('Error al cargar sedes:', error)
    }
  }

  const loadReportes = async () => {
    setLoading(true)
    try {
      const fechaDesdeStr = fechaDesde ? fechaDesde.toISOString().split('T')[0] : undefined
      const fechaHastaStr = fechaHasta ? fechaHasta.toISOString().split('T')[0] : undefined
      const sedeIdStr = sedeId || undefined

      // Cargar cada reporte de forma independiente para que un error no detenga los demás
      const loadReporte = async (fn: () => Promise<any>, defaultValue: any = []) => {
        try {
          return await fn()
        } catch (error) {
          console.error('Error al cargar reporte:', error)
          return defaultValue
        }
      }

      const [
        ventas,
        cortes,
        dinero,
        clientes,
        estadisticas,
        creditos,
        ventasTipo,
        ventasForma,
        resumen
      ] = await Promise.all([
        loadReporte(() => reportesAPI.getVentasPorMes(fechaDesdeStr, fechaHastaStr, sedeIdStr)),
        loadReporte(() => reportesAPI.getCortesPorMes(fechaDesdeStr, fechaHastaStr, sedeIdStr)),
        loadReporte(() => reportesAPI.getDineroEntregadoPorCortes(fechaDesdeStr, fechaHastaStr, sedeIdStr)),
        loadReporte(() => reportesAPI.getClientesPorZona(sedeIdStr)),
        loadReporte(() => reportesAPI.getEstadisticasCreditos(sedeIdStr), {}),
        loadReporte(() => reportesAPI.getCreditosPorMes(fechaDesdeStr, fechaHastaStr, sedeIdStr)),
        loadReporte(() => reportesAPI.getVentasPorTipoServicio(fechaDesdeStr, fechaHastaStr, sedeIdStr)),
        loadReporte(() => reportesAPI.getVentasPorFormaPago(fechaDesdeStr, fechaHastaStr, sedeIdStr)),
        loadReporte(() => reportesAPI.getResumenGeneral(fechaDesdeStr, fechaHastaStr, sedeIdStr), {})
      ])

      setVentasPorMes(ventas)
      setCortesPorMes(cortes)
      setDineroEntregadoPorCortes(dinero)
      setClientesPorZona(clientes)
      setEstadisticasCreditos(estadisticas)
      setCreditosPorMes(creditos)
      setVentasPorTipoServicio(ventasTipo)
      setVentasPorFormaPago(ventasForma)
      setResumenGeneral(resumen)
    } catch (error) {
      console.error('Error general al cargar reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadReportes()
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h4' component='h1' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon />
            Reportes
          </Typography>
          <Button
            variant='outlined'
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>

        {/* Filtros Globales */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Filtros Globales
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label='Fecha Desde'
                  value={fechaDesde}
                  onChange={(newValue) => setFechaDesde(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label='Fecha Hasta'
                  value={fechaHasta}
                  onChange={(newValue) => setFechaHasta(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Sede</InputLabel>
                  <Select
                    value={sedeId}
                    label='Sede'
                    onChange={(e) => setSedeId(e.target.value)}
                  >
                    <MenuItem value=''>Todas las sedes</MenuItem>
                    {sedes.map((sede) => (
                      <MenuItem key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Resumen General */}
        {resumenGeneral && Object.keys(resumenGeneral).length > 0 && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color='textSecondary' gutterBottom>
                    Total Ventas
                  </Typography>
                  <Typography variant='h5'>
                    ${resumenGeneral.totalVentas?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color='textSecondary' gutterBottom>
                    Cantidad Pedidos
                  </Typography>
                  <Typography variant='h5'>
                    {resumenGeneral.cantidadPedidos || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color='textSecondary' gutterBottom>
                    Total Clientes
                  </Typography>
                  <Typography variant='h5'>
                    {resumenGeneral.totalClientes || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color='textSecondary' gutterBottom>
                    Créditos Activos
                  </Typography>
                  <Typography variant='h5'>
                    {resumenGeneral.creditos?.activos || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Gráficas */}
        <Grid container spacing={3}>
          {/* Ventas por Mes */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Ventas por Mes
                </Typography>
                {ventasPorMes.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={ventasPorMes}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='mes' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey='total' fill='#0088FE' />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity='info'>No hay datos disponibles</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Cortes por Mes */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Cortes por Mes
                </Typography>
                {cortesPorMes.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={cortesPorMes}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='mes' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type='monotone' dataKey='cantidad' stroke='#8884d8' />
                      <Line type='monotone' dataKey='totalVentas' stroke='#82ca9d' />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity='info'>No hay datos disponibles</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Dinero Entregado por Cortes */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Dinero Entregado por Cortes
                </Typography>
                {dineroEntregadoPorCortes.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={dineroEntregadoPorCortes}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='mes' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey='totalEntregado' fill='#00C49F' />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity='info'>No hay datos disponibles</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Clientes por Zona */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Clientes por Zona
                </Typography>
                {clientesPorZona.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <PieChart>
                      <Pie
                        data={clientesPorZona}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={(entry: any) => `${entry.zona}: ${entry.cantidad}`}
                        outerRadius={80}
                        fill='#8884d8'
                        dataKey='cantidad'
                      >
                        {clientesPorZona.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity='info'>No hay datos disponibles</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Estadísticas de Créditos */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Estadísticas de Créditos
                </Typography>
                {estadisticasCreditos && Object.keys(estadisticasCreditos).length > 0 ? (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography color='textSecondary'>Activos</Typography>
                          <Typography variant='h5'>{estadisticasCreditos.activos || 0}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography color='textSecondary'>Pagados</Typography>
                          <Typography variant='h5'>{estadisticasCreditos.pagados || 0}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography color='textSecondary'>Deuda Total</Typography>
                          <Typography variant='h5'>
                            ${(estadisticasCreditos.deuda || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography color='textSecondary'>Total Notas</Typography>
                          <Typography variant='h5'>{estadisticasCreditos.totalNotas || 0}</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Alert severity='info'>No hay datos disponibles</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Créditos por Mes */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Créditos por Mes
                </Typography>
                {creditosPorMes.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={creditosPorMes}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='mes' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey='totalImporte' fill='#FF8042' name='Importe Total' />
                      <Bar dataKey='totalSaldo' fill='#FFBB28' name='Saldo Pendiente' />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity='info'>No hay datos disponibles</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Ventas por Tipo de Servicio */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Ventas por Tipo de Servicio
                </Typography>
                {ventasPorTipoServicio.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <PieChart>
                      <Pie
                        data={ventasPorTipoServicio}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={(entry: any) => `${entry.tipo}: $${entry.total.toLocaleString('es-MX')}`}
                        outerRadius={80}
                        fill='#8884d8'
                        dataKey='total'
                      >
                        {ventasPorTipoServicio.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity='info'>No hay datos disponibles</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Ventas por Forma de Pago */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Ventas por Forma de Pago
                </Typography>
                {ventasPorFormaPago.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={ventasPorFormaPago}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='formaPago' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey='total' fill='#8884d8' />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity='info'>No hay datos disponibles</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  )
}

