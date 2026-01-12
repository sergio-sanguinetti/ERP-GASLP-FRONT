// API Client para conectar con el backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  token?: string
  requires2FA?: boolean
  usuario?: any
}

export interface Verify2FARequest {
  token2FA: string
}

export interface Usuario {
  id: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  telefono?: string
  rol: string
  tipoRepartidor?: 'cilindros' | 'pipas'
  estado: 'activo' | 'inactivo'
  sede?: string
  isTwoFactorEnabled: boolean
  fechaRegistro: string
}

export interface CreateUsuarioRequest {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  password: string
  telefono?: string
  rol: string
  tipoRepartidor?: 'cilindros' | 'pipas'
  estado: 'activo' | 'inactivo'
  sede?: string
}

export interface UpdateUsuarioRequest {
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  email?: string
  password?: string
  telefono?: string
  rol?: string
  tipoRepartidor?: 'cilindros' | 'pipas'
  estado?: 'activo' | 'inactivo'
  sede?: string
}

// Helper para obtener el token del localStorage
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

// Helper para hacer peticiones con autenticación
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers as HeadersInit,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Token expirado o inválido
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  }

  return response
}

// API de Autenticación
export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al iniciar sesión')
    }

    return response.json()
  },

  verify2FA: async (data: Verify2FARequest): Promise<LoginResponse> => {
    const response = await fetchWithAuth('/usuarios/login/verify-2fa', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al verificar código 2FA')
    }

    return response.json()
  },

  getProfile: async (): Promise<Usuario> => {
    const response = await fetchWithAuth('/usuarios/profile')

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener perfil')
    }

    return response.json()
  },

  updateProfile: async (data: UpdateUsuarioRequest): Promise<Usuario> => {
    const response = await fetchWithAuth('/usuarios/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar perfil')
    }

    const result = await response.json()
    return result.usuario || result
  },

  setup2FA: async (): Promise<{ message: string; secret: string; qrCodeUrl: string }> => {
    const response = await fetchWithAuth('/usuarios/2fa/setup', {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al configurar 2FA')
    }

    return response.json()
  },

  enable2FA: async (token2FA: string): Promise<{ message: string }> => {
    const response = await fetchWithAuth('/usuarios/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ token2FA }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al habilitar 2FA')
    }

    return response.json()
  },

  disable2FA: async (): Promise<{ message: string }> => {
    const response = await fetchWithAuth('/usuarios/2fa/disable', {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al deshabilitar 2FA')
    }

    return response.json()
  },
}

// API de Usuarios (Administración)
export interface UsuariosFilters {
  rol?: string
  estado?: string
  sede?: string
}

export const usuariosAPI = {
  getAll: async (filtros?: UsuariosFilters): Promise<Usuario[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.rol) queryParams.append('rol', filtros.rol)
    if (filtros?.estado) queryParams.append('estado', filtros.estado)
    if (filtros?.sede) queryParams.append('sede', filtros.sede)

    const queryString = queryParams.toString()
    const url = `/usuarios/admin/all${queryString ? `?${queryString}` : ''}`
    
    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener usuarios')
    }

    return response.json()
  },

  getById: async (id: string): Promise<Usuario> => {
    const response = await fetchWithAuth(`/usuarios/admin/${id}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener usuario')
    }

    return response.json()
  },

  create: async (data: CreateUsuarioRequest): Promise<Usuario> => {
    // Usar el endpoint de registro con el token de admin
    const response = await fetchWithAuth('/usuarios/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear usuario')
    }

    const result = await response.json()
    return result.usuario
  },

  update: async (id: string, data: UpdateUsuarioRequest): Promise<Usuario> => {
    const response = await fetchWithAuth(`/usuarios/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar usuario')
    }

    const result = await response.json()
    return result.usuario
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/usuarios/admin/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar usuario')
    }
  },
}

// API de Sedes
export interface Sede {
  id: string
  nombre: string
  direccion: string
  telefono: string
  email: string
  estado: 'activa' | 'inactiva'
  fechaCreacion: string
}

export interface CreateSedeRequest {
  nombre: string
  direccion: string
  telefono: string
  email: string
  estado: 'activa' | 'inactiva'
}

export interface UpdateSedeRequest {
  nombre?: string
  direccion?: string
  telefono?: string
  email?: string
  estado?: 'activa' | 'inactiva'
}

export const sedesAPI = {
  getAll: async (): Promise<Sede[]> => {
    const response = await fetch(`${API_URL}/sedes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener sedes')
    }

    return response.json()
  },

  getById: async (id: string): Promise<Sede> => {
    const response = await fetch(`${API_URL}/sedes/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener sede')
    }

    return response.json()
  },

  create: async (data: CreateSedeRequest): Promise<Sede> => {
    const response = await fetchWithAuth('/sedes', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear sede')
    }

    const result = await response.json()
    return result.sede
  },

  update: async (id: string, data: UpdateSedeRequest): Promise<Sede> => {
    const response = await fetchWithAuth(`/sedes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar sede')
    }

    const result = await response.json()
    return result.sede
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/sedes/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar sede')
    }
  },
}

// API de Formas de Pago
export interface FormaPago {
  id: string
  nombre: string
  tipo: 'efectivo' | 'terminal' | 'transferencia' | 'cheque' | 'deposito' | 'credito'
  descripcion: string
  activa: boolean
  requiereValidacion: boolean
  requiereFolio: boolean
  comisionPorcentaje: number
  diasLiquidacion: number
  bancoAsociado?: string
  requiereComprobante: boolean
  permiteCambio: boolean
  limiteMaximo?: number
  limiteMinimo?: number
  sedeId?: string
  sede?: Sede
  sedes?: Sede[]
  usuarioCreacion: string
  usuarioModificacion: string
  fechaCreacion: string
  fechaModificacion: string
}

export interface CreateFormaPagoRequest {
  nombre: string
  tipo: 'efectivo' | 'terminal' | 'transferencia' | 'cheque' | 'deposito' | 'credito'
  descripcion: string
  activa?: boolean
  requiereValidacion?: boolean
  requiereFolio?: boolean
  comisionPorcentaje?: number
  diasLiquidacion?: number
  bancoAsociado?: string
  requiereComprobante?: boolean
  permiteCambio?: boolean
  limiteMaximo?: number
  limiteMinimo?: number
  sedeId?: string
  sedesIds?: string[]
  usuarioCreacion?: string
  usuarioModificacion?: string
}

export interface UpdateFormaPagoRequest {
  nombre?: string
  tipo?: 'efectivo' | 'terminal' | 'transferencia' | 'cheque' | 'deposito' | 'credito'
  descripcion?: string
  activa?: boolean
  requiereValidacion?: boolean
  requiereFolio?: boolean
  comisionPorcentaje?: number
  diasLiquidacion?: number
  bancoAsociado?: string
  requiereComprobante?: boolean
  permiteCambio?: boolean
  limiteMaximo?: number
  limiteMinimo?: number
  sedeId?: string
  sedesIds?: string[]
  usuarioModificacion?: string
}

export interface FormasPagoFilters {
  nombre?: string
  tipo?: string
  activa?: string
}

export const formasPagoAPI = {
  getAll: async (filtros?: FormasPagoFilters): Promise<FormaPago[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.nombre) queryParams.append('nombre', filtros.nombre)
    if (filtros?.tipo) queryParams.append('tipo', filtros.tipo)
    if (filtros?.activa) queryParams.append('activa', filtros.activa)

    const queryString = queryParams.toString()
    const url = `${API_URL}/formas-pago${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener formas de pago')
    }

    return response.json()
  },

  getById: async (id: string): Promise<FormaPago> => {
    const response = await fetch(`${API_URL}/formas-pago/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener forma de pago')
    }

    return response.json()
  },

  create: async (data: CreateFormaPagoRequest): Promise<FormaPago> => {
    const response = await fetchWithAuth('/formas-pago', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear forma de pago')
    }

    const result = await response.json()
    return result.formaPago
  },

  update: async (id: string, data: UpdateFormaPagoRequest): Promise<FormaPago> => {
    const response = await fetchWithAuth(`/formas-pago/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar forma de pago')
    }

    const result = await response.json()
    return result.formaPago
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/formas-pago/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar forma de pago')
    }
  },
}

// API de Tipos de Formas de Pago
export interface TipoFormaPago {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
  icono?: string
  color?: string
  orden: number
  fechaCreacion: string
  fechaModificacion: string
}

export interface CreateTipoFormaPagoRequest {
  codigo: string
  nombre: string
  descripcion?: string
  activo?: boolean
  icono?: string
  color?: string
  orden?: number
}

export interface UpdateTipoFormaPagoRequest {
  codigo?: string
  nombre?: string
  descripcion?: string
  activo?: boolean
  icono?: string
  color?: string
  orden?: number
}

export interface TiposFormaPagoFilters {
  activo?: string
  codigo?: string
  nombre?: string
}

export const tiposFormaPagoAPI = {
  getAll: async (filtros?: TiposFormaPagoFilters): Promise<TipoFormaPago[]> => {
    try {
      const queryParams = new URLSearchParams()
      if (filtros?.activo) queryParams.append('activo', filtros.activo)
      if (filtros?.codigo) queryParams.append('codigo', filtros.codigo)
      if (filtros?.nombre) queryParams.append('nombre', filtros.nombre)

      const queryString = queryParams.toString()
      const url = `/tipos-forma-pago${queryString ? `?${queryString}` : ''}`

      const response = await fetchWithAuth(url, {
        method: 'GET',
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Si la ruta no existe, retornar array vacío en lugar de lanzar error
          console.warn('Endpoint de tipos-forma-pago no encontrado. Retornando array vacío.')
          return []
        }
        let errorMessage = 'Error al obtener tipos de formas de pago'
        try {
          const error = await response.json()
          errorMessage = error.message || errorMessage
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error: any) {
      // Si es un error de red o conexión, retornar array vacío
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.warn('Error de conexión al obtener tipos de formas de pago. Retornando array vacío.')
        return []
      }
      throw error
    }
  },

  getById: async (id: string): Promise<TipoFormaPago> => {
    const response = await fetchWithAuth(`/tipos-forma-pago/${id}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener tipo de forma de pago')
    }

    return response.json()
  },

  create: async (data: CreateTipoFormaPagoRequest): Promise<TipoFormaPago> => {
    const response = await fetchWithAuth('/tipos-forma-pago', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear tipo de forma de pago')
    }

    const result = await response.json()
    return result.tipo
  },

  update: async (id: string, data: UpdateTipoFormaPagoRequest): Promise<TipoFormaPago> => {
    const response = await fetchWithAuth(`/tipos-forma-pago/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar tipo de forma de pago')
    }

    const result = await response.json()
    return result.tipo
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/tipos-forma-pago/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar tipo de forma de pago')
    }
  },
}

// API de Rutas
export interface Ruta {
  id: string
  nombre: string
  codigo: string
  descripcion?: string
  zona: string
  zonaId?: string
  zonaRelacion?: Zona
  sedeId?: string
  sede?: Sede
  activa: boolean
  horarioInicio?: string
  horarioFin?: string
  repartidores: User[]
  usuarioCreacion: string
  usuarioModificacion: string
  fechaCreacion: string
  fechaModificacion: string
}

export interface CreateRutaRequest {
  nombre: string
  codigo: string
  descripcion?: string
  zona?: string
  zonaId?: string
  sedeId?: string
  activa?: boolean
  horarioInicio?: string
  horarioFin?: string
  repartidoresIds?: string[]
  usuarioCreacion?: string
  usuarioModificacion?: string
}

export interface UpdateRutaRequest {
  nombre?: string
  codigo?: string
  descripcion?: string
  zona?: string
  zonaId?: string
  sedeId?: string
  activa?: boolean
  horarioInicio?: string
  horarioFin?: string
  repartidoresIds?: string[]
  usuarioModificacion?: string
}

export interface RutasFilters {
  nombre?: string
  zona?: string
  activa?: string
  repartidor?: string
  sedeId?: string
}

export const rutasAPI = {
  getAll: async (filtros?: RutasFilters): Promise<Ruta[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.nombre) queryParams.append('nombre', filtros.nombre)
    if (filtros?.zona) queryParams.append('zona', filtros.zona)
    if (filtros?.activa) queryParams.append('activa', filtros.activa)
    if (filtros?.repartidor) queryParams.append('repartidor', filtros.repartidor)
    if (filtros?.sedeId) queryParams.append('sedeId', filtros.sedeId)

    const queryString = queryParams.toString()
    const url = `${API_URL}/rutas${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener rutas')
    }

    return response.json()
  },

  getById: async (id: string): Promise<Ruta> => {
    const response = await fetch(`${API_URL}/rutas/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener ruta')
    }

    return response.json()
  },

  create: async (data: CreateRutaRequest): Promise<Ruta> => {
    const response = await fetchWithAuth('/rutas', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear ruta')
    }

    const result = await response.json()
    return result.ruta
  },

  update: async (id: string, data: UpdateRutaRequest): Promise<Ruta> => {
    const response = await fetchWithAuth(`/rutas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar ruta')
    }

    const result = await response.json()
    return result.ruta
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/rutas/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar ruta')
    }
  },
}

// API de Zonas
export interface Ciudad {
  id: string
  nombre: string
  codigo?: string
  estado: string
  activa: boolean
  fechaCreacion: string
  municipios?: Municipio[]
}

export interface Municipio {
  id: string
  nombre: string
  codigo?: string
  ciudadId: string
  ciudad?: Ciudad
  activo: boolean
  fechaCreacion: string
  zonas?: Zona[]
}

export interface Zona {
  id: string
  nombre: string
  codigo?: string
  descripcion?: string
  municipioId: string
  municipio?: Municipio
  activa: boolean
  fechaCreacion: string
}

export interface CreateCiudadRequest {
  nombre: string
  codigo?: string
  estado: string
  activa?: boolean
}

export interface UpdateCiudadRequest {
  nombre?: string
  codigo?: string
  estado?: string
  activa?: boolean
}

export interface CreateMunicipioRequest {
  nombre: string
  codigo?: string
  ciudadId: string
  activo?: boolean
}

export interface UpdateMunicipioRequest {
  nombre?: string
  codigo?: string
  ciudadId?: string
  activo?: boolean
}

export interface CreateZonaRequest {
  nombre: string
  codigo?: string
  descripcion?: string
  municipioId: string
  activa?: boolean
}

export interface UpdateZonaRequest {
  nombre?: string
  codigo?: string
  descripcion?: string
  municipioId?: string
  activa?: boolean
}

export const zonasAPI = {
  // ========== CIUDADES ==========
  ciudades: {
    getAll: async (): Promise<Ciudad[]> => {
      const response = await fetch(`${API_URL}/zonas/ciudades`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener ciudades')
      }

      return response.json()
    },

    getById: async (id: string): Promise<Ciudad> => {
      const response = await fetch(`${API_URL}/zonas/ciudades/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener ciudad')
      }

      return response.json()
    },

    create: async (data: CreateCiudadRequest): Promise<Ciudad> => {
      const response = await fetchWithAuth('/zonas/ciudades', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear ciudad')
      }

      const result = await response.json()
      return result.ciudad
    },

    update: async (id: string, data: UpdateCiudadRequest): Promise<Ciudad> => {
      const response = await fetchWithAuth(`/zonas/ciudades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al actualizar ciudad')
      }

      const result = await response.json()
      return result.ciudad
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetchWithAuth(`/zonas/ciudades/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al eliminar ciudad')
      }
    },
  },

  // ========== MUNICIPIOS ==========
  municipios: {
    getAll: async (ciudadId?: string): Promise<Municipio[]> => {
      const url = ciudadId 
        ? `${API_URL}/zonas/municipios?ciudadId=${ciudadId}`
        : `${API_URL}/zonas/municipios`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener municipios')
      }

      return response.json()
    },

    getById: async (id: string): Promise<Municipio> => {
      const response = await fetch(`${API_URL}/zonas/municipios/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener municipio')
      }

      return response.json()
    },

    create: async (data: CreateMunicipioRequest): Promise<Municipio> => {
      const response = await fetchWithAuth('/zonas/municipios', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear municipio')
      }

      const result = await response.json()
      return result.municipio
    },

    update: async (id: string, data: UpdateMunicipioRequest): Promise<Municipio> => {
      const response = await fetchWithAuth(`/zonas/municipios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al actualizar municipio')
      }

      const result = await response.json()
      return result.municipio
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetchWithAuth(`/zonas/municipios/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al eliminar municipio')
      }
    },
  },

  // ========== ZONAS ==========
  getAll: async (municipioId?: string, ciudadId?: string): Promise<Zona[]> => {
    const queryParams = new URLSearchParams()
    if (municipioId) queryParams.append('municipioId', municipioId)
    if (ciudadId) queryParams.append('ciudadId', ciudadId)

    const queryString = queryParams.toString()
    const url = `${API_URL}/zonas${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener zonas')
    }

    return response.json()
  },

  getById: async (id: string): Promise<Zona> => {
    const response = await fetch(`${API_URL}/zonas/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener zona')
    }

    return response.json()
  },

  create: async (data: CreateZonaRequest): Promise<Zona> => {
    const response = await fetchWithAuth('/zonas', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear zona')
    }

    const result = await response.json()
    return result.zona
  },

  update: async (id: string, data: UpdateZonaRequest): Promise<Zona> => {
    const response = await fetchWithAuth(`/zonas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar zona')
    }

    const result = await response.json()
    return result.zona
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/zonas/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar zona')
    }
  },
}

// API de Clientes
export interface Domicilio {
  id: string
  tipo: 'principal' | 'facturacion' | 'entrega' | 'otro'
  calle: string
  numeroExterior: string
  numeroInterior?: string
  colonia: string
  municipio: string
  estado: string
  codigoPostal: string
  referencia?: string
  activo: boolean
  codigoQR: string
  fechaCreacionQR: string
}

export interface Cliente {
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  telefono: string
  telefonoSecundario?: string
  calle: string
  numeroExterior: string
  numeroInterior?: string
  colonia: string
  municipio: string
  estado: string
  codigoPostal: string
  rfc?: string
  curp?: string
  rutaId?: string
  ruta?: Ruta
  zonaId?: string
  zona?: Zona
  limiteCredito: number
  saldoActual: number
  pagosEspecialesAutorizados: boolean
  fechaRegistro: string
  ultimaModificacion: string
  estadoCliente: 'activo' | 'suspendido' | 'inactivo'
  domicilios?: Domicilio[]
}

export interface CreateClienteRequest {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  telefono: string
  telefonoSecundario?: string
  calle: string
  numeroExterior: string
  numeroInterior?: string
  colonia: string
  municipio: string
  estado: string
  codigoPostal: string
  rfc?: string
  curp?: string
  rutaId?: string
  zonaId?: string
  limiteCredito?: number
  saldoActual?: number
  pagosEspecialesAutorizados?: boolean
  estadoCliente?: 'activo' | 'suspendido' | 'inactivo'
  domicilios?: Omit<Domicilio, 'id' | 'clienteId' | 'codigoQR' | 'fechaCreacionQR'>[]
}

export interface UpdateClienteRequest {
  nombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  email?: string
  telefono?: string
  telefonoSecundario?: string
  calle?: string
  numeroExterior?: string
  numeroInterior?: string
  colonia?: string
  municipio?: string
  estado?: string
  codigoPostal?: string
  rfc?: string
  curp?: string
  rutaId?: string
  zonaId?: string
  limiteCredito?: number
  saldoActual?: number
  pagosEspecialesAutorizados?: boolean
  estadoCliente?: 'activo' | 'suspendido' | 'inactivo'
}

export interface ClientesFilters {
  nombre?: string
  email?: string
  estadoCliente?: string
  rutaId?: string
  sedeId?: string
}

export const clientesAPI = {
  getAll: async (filtros?: ClientesFilters): Promise<Cliente[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.nombre) queryParams.append('nombre', filtros.nombre)
    if (filtros?.email) queryParams.append('email', filtros.email)
    if (filtros?.estadoCliente) queryParams.append('estadoCliente', filtros.estadoCliente)
    if (filtros?.rutaId) queryParams.append('rutaId', filtros.rutaId)
    if (filtros?.sedeId) queryParams.append('sedeId', filtros.sedeId)

    const queryString = queryParams.toString()
    const url = `${API_URL}/clientes${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener clientes')
    }

    return response.json()
  },

  getById: async (id: string): Promise<Cliente> => {
    const response = await fetch(`${API_URL}/clientes/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener cliente')
    }

    return response.json()
  },

  create: async (data: CreateClienteRequest): Promise<Cliente> => {
    const response = await fetchWithAuth('/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear cliente')
    }

    const result = await response.json()
    return result.cliente
  },

  update: async (id: string, data: UpdateClienteRequest): Promise<Cliente> => {
    const response = await fetchWithAuth(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar cliente')
    }

    const result = await response.json()
    return result.cliente
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/clientes/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar cliente')
    }
  },

  // Domicilios
  getDomicilios: async (clienteId: string): Promise<Domicilio[]> => {
    const response = await fetch(`${API_URL}/clientes/${clienteId}/domicilios`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener domicilios')
    }

    return response.json()
  },

  createDomicilio: async (clienteId: string, data: Omit<Domicilio, 'id' | 'clienteId' | 'codigoQR' | 'fechaCreacionQR'>): Promise<Domicilio> => {
    const response = await fetchWithAuth(`/clientes/${clienteId}/domicilios`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear domicilio')
    }

    const result = await response.json()
    return result.domicilio
  },

  updateDomicilio: async (id: string, data: Partial<Domicilio>): Promise<Domicilio> => {
    const response = await fetchWithAuth(`/clientes/domicilios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar domicilio')
    }

    const result = await response.json()
    return result.domicilio
  },

  deleteDomicilio: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/clientes/domicilios/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar domicilio')
    }
  },
}

// API de Categorías de Productos
export interface CategoriaProducto {
  id: string
  nombre: string
  codigo: string
  descripcion?: string
  activa: boolean
  fechaCreacion?: string
  fechaModificacion?: string
  _count?: {
    productos: number
  }
}

export interface CreateCategoriaProductoRequest {
  nombre: string
  codigo: string
  descripcion?: string
  activa?: boolean
}

export interface UpdateCategoriaProductoRequest {
  nombre?: string
  codigo?: string
  descripcion?: string
  activa?: boolean
}

export const categoriasProductoAPI = {
  getAll: async (filtros?: { activa?: boolean }): Promise<CategoriaProducto[]> => {
    try {
      const queryParams = new URLSearchParams()
      if (filtros?.activa !== undefined) queryParams.append('activa', filtros.activa.toString())
      const queryString = queryParams.toString()
      const url = `${API_URL}/categorias-producto${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        if (response.status === 404) return []
        let errorMessage = 'Error al obtener categorías'
        try {
          const error = await response.json()
          errorMessage = error.message || errorMessage
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      return response.json()
    } catch (error: any) {
      // Si es un error de red, retornar array vacío
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.warn('Error de conexión al obtener categorías. Retornando array vacío.')
        return []
      }
      throw error
    }
  },
  getById: async (id: string): Promise<CategoriaProducto> => {
    const response = await fetch(`${API_URL}/categorias-producto/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener categoría')
    }
    return response.json()
  },
  create: async (data: CreateCategoriaProductoRequest): Promise<CategoriaProducto> => {
    const response = await fetchWithAuth('/categorias-producto', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      const errorMessages = error.errors?.map((e: any) => e.msg || e.message).join(', ')
      if (errorMessages) {
        throw new Error(errorMessages || error.message || 'Error al crear categoría')
      }
      throw new Error(error.message || 'Error al crear categoría')
    }
    const result = await response.json()
    return result.categoria || result
  },
  update: async (id: string, data: UpdateCategoriaProductoRequest): Promise<CategoriaProducto> => {
    const response = await fetchWithAuth(`/categorias-producto/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      const errorMessages = error.errors?.map((e: any) => e.msg || e.message).join(', ')
      if (errorMessages) {
        throw new Error(errorMessages || error.message || 'Error al actualizar categoría')
      }
      throw new Error(error.message || 'Error al actualizar categoría')
    }
    const result = await response.json()
    return result.categoria || result
  },
  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/categorias-producto/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar categoría')
    }
  }
}

// API de Productos
export interface Producto {
  id: string
  nombre: string
  categoriaId: string
  categoria?: CategoriaProducto
  precio: number
  unidad: string
  descripcion: string
  cantidadKilos?: number
  activo: boolean
  sedeId?: string
  fechaCreacion?: string
  fechaModificacion?: string
}

export interface CreateProductoRequest {
  nombre: string
  categoriaId: string
  precio: number
  unidad: string
  descripcion: string
  cantidadKilos?: number
  activo?: boolean
  sedeId?: string
}

export interface UpdateProductoRequest {
  nombre?: string
  categoriaId?: string
  precio?: number
  unidad?: string
  descripcion?: string
  cantidadKilos?: number
  activo?: boolean
}

export interface ProductosFilters {
  categoria?: string
  activo?: boolean
  sedeId?: string
}

export const productosAPI = {
  getAll: async (filtros?: ProductosFilters): Promise<Producto[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.categoria) queryParams.append('categoria', filtros.categoria)
    if (filtros?.activo !== undefined) queryParams.append('activo', String(filtros.activo))
    if (filtros?.sedeId) queryParams.append('sedeId', filtros.sedeId)

    const queryString = queryParams.toString()
    const url = `${API_URL}/productos${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Si el endpoint no existe, retornar array vacío
      if (response.status === 404) return []
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener productos')
    }

    return response.json()
  },

  getById: async (id: string): Promise<Producto> => {
    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener producto')
    }

    return response.json()
  },

  create: async (data: CreateProductoRequest): Promise<Producto> => {
    const response = await fetchWithAuth('/productos', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      // Si hay errores de validación, mostrarlos de forma más detallada
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => `${e.param || e.path}: ${e.msg || e.message}`).join(', ')
        throw new Error(errorMessages || error.message || 'Error al crear producto')
      }
      throw new Error(error.message || 'Error al crear producto')
    }

    const result = await response.json()
    return result.producto || result
  },

  update: async (id: string, data: UpdateProductoRequest): Promise<Producto> => {
    const response = await fetchWithAuth(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      // Si hay errores de validación, mostrarlos de forma más detallada
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => `${e.param}: ${e.msg}`).join(', ')
        throw new Error(errorMessages || error.message || 'Error al actualizar producto')
      }
      throw new Error(error.message || 'Error al actualizar producto')
    }

    const result = await response.json()
    return result.producto || result
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/productos/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar producto')
    }
  },
}

// API de Descuentos por Repartidor
export interface DescuentoRepartidor {
  id: string
  repartidorId: string
  repartidor?: Usuario
  descuentoAutorizado: number
  descuentoPorLitro?: number
  activo: boolean
  fechaCreacion?: string
  fechaModificacion?: string
}

export interface CreateDescuentoRepartidorRequest {
  repartidorId: string
  descuentoAutorizado: number
  descuentoPorLitro?: number
  activo?: boolean
}

export interface UpdateDescuentoRepartidorRequest {
  descuentoAutorizado?: number
  descuentoPorLitro?: number
  activo?: boolean
}

export const descuentosRepartidorAPI = {
  getAll: async (): Promise<DescuentoRepartidor[]> => {
    try {
      const response = await fetch(`${API_URL}/descuentos-repartidor`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) return []
        let errorMessage = 'Error al obtener descuentos'
        try {
          const error = await response.json()
          errorMessage = error.message || errorMessage
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error: any) {
      // Si es un error de red, retornar array vacío
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.warn('Error de conexión al obtener descuentos. Retornando array vacío.')
        return []
      }
      throw error
    }
  },

  getByRepartidor: async (repartidorId: string): Promise<DescuentoRepartidor | null> => {
    const response = await fetch(`${API_URL}/descuentos-repartidor/repartidor/${repartidorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) return null
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener descuento')
    }

    return response.json()
  },

  create: async (data: CreateDescuentoRepartidorRequest): Promise<DescuentoRepartidor> => {
    const response = await fetchWithAuth('/descuentos-repartidor', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear descuento')
    }

    const result = await response.json()
    return result.descuento || result
  },

  update: async (id: string, data: UpdateDescuentoRepartidorRequest): Promise<DescuentoRepartidor> => {
    const response = await fetchWithAuth(`/descuentos-repartidor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar descuento')
    }

    const result = await response.json()
    return result.descuento || result
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/descuentos-repartidor/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar descuento')
    }
  },
}

// API de Pedidos
export interface PedidoProducto {
  id: string
  pedidoId: string
  productoId: string
  producto?: Producto
  cantidad: number
  precio: number
  subtotal: number
}

export interface Pedido {
  id: string
  numeroPedido: string
  clienteId: string
  cliente?: Cliente
  zona?: string
  rutaId?: string
  ruta?: Ruta
  fechaPedido: string
  horaPedido: string
  estado: 'entregado' | 'pendiente' | 'cancelado' | 'en_proceso' | 'en-proceso'
  sede?: Sede
  cantidadProductos: number
  ventaTotal: number
  tipoServicio: 'pipas' | 'cilindros'
  repartidorId?: string
  calculoPipas?: {
    tipoCalculo: 'ninguno' | 'litros' | 'porcentajes' | 'dinero'
    cantidadLitros?: number
    precioPorLitro?: number
    totalPorLitros?: number
    capacidadTanque?: number
    porcentajeInicial?: number
    porcentajeFinal?: number
    litrosALlenar?: number
    totalPorPorcentajes?: number
    cantidadDinero?: number
    litrosPorDinero?: number
  }
  repartidor?: Usuario
  observaciones?: string
  sedeId?: string
  fechaCreacion?: string
  fechaModificacion?: string
  productosPedido?: PedidoProducto[]
}

export interface CreatePedidoRequest {
  clienteId: string
  rutaId?: string
  fechaPedido?: string
  horaPedido?: string
  tipoServicio: 'pipas' | 'cilindros'
  repartidorId?: string
  observaciones?: string
  calculoPipas?: {
    tipoCalculo: 'ninguno' | 'litros' | 'porcentajes' | 'dinero'
    cantidadLitros?: number
    precioPorLitro?: number
    totalPorLitros?: number
    capacidadTanque?: number
    porcentajeInicial?: number
    porcentajeFinal?: number
    litrosALlenar?: number
    totalPorPorcentajes?: number
    cantidadDinero?: number
    litrosPorDinero?: number
    numeroCarga?: number
    totalCargas?: number
  } | Array<{
    tipoCalculo: 'ninguno' | 'litros' | 'porcentajes' | 'dinero'
    cantidadLitros?: number
    precioPorLitro?: number
    totalPorLitros?: number
    capacidadTanque?: number
    porcentajeInicial?: number
    porcentajeFinal?: number
    litrosALlenar?: number
    totalPorPorcentajes?: number
    cantidadDinero?: number
    litrosPorDinero?: number
    numeroCarga?: number
    totalCargas?: number
  }>
  sedeId?: string
  productos?: Array<{ 
    productoId: string
    cantidad: number
    precio: number
    litros?: number
    subtotal?: number
    descripcion?: string
    indice?: number
  }>
  totalLitros?: number
  totalMonto?: number
}

export interface PedidosFilters {
  fechaDesde?: string
  fechaHasta?: string
  clienteId?: string
  estado?: string
  tipoServicio?: string
  repartidorId?: string
  sedeId?: string
}

export const pedidosAPI = {
  getAll: async (filtros?: PedidosFilters): Promise<Pedido[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)
    if (filtros?.clienteId) queryParams.append('clienteId', filtros.clienteId)
    if (filtros?.estado) queryParams.append('estado', filtros.estado)
    if (filtros?.tipoServicio) queryParams.append('tipoServicio', filtros.tipoServicio)
    if (filtros?.repartidorId) queryParams.append('repartidorId', filtros.repartidorId)
    if (filtros?.sedeId) queryParams.append('sedeId', filtros.sedeId)

    const queryString = queryParams.toString()
    const url = `/pedidos${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      if (response.status === 404) return []
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener pedidos')
    }

    return response.json()
  },

  getById: async (id: string): Promise<Pedido> => {
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener pedido')
    }

    return response.json()
  },

  create: async (data: CreatePedidoRequest): Promise<Pedido> => {
    const response = await fetchWithAuth('/pedidos', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear pedido')
    }

    const result = await response.json()
    return result.pedido || result
  },

  update: async (id: string, data: Partial<CreatePedidoRequest>): Promise<Pedido> => {
    const response = await fetchWithAuth(`/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar pedido')
    }

    const result = await response.json()
    return result.pedido || result
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/pedidos/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar pedido')
    }
  },
}

// API de Ventas/Dashboard
export interface ResumenVentas {
  ventasHoy: number
  crecimientoPorcentaje: number
  pedidosCreados: number
  pedidosEntregados: number
  alertasCriticas: number
  efectivoConsolidado: number
}

export interface CorteRepartidor {
  rutasProgramadas: number
  cortesEntregados: number
  cortesValidados: number
  cortesPendientes: number
  totalVentas: number
  totalServicios: number
  totalAbonos: number
}

export const ventasAPI = {
  getResumen: async (sedeId?: string): Promise<ResumenVentas> => {
    const queryParams = new URLSearchParams()
    if (sedeId) queryParams.append('sedeId', sedeId)

    const queryString = queryParams.toString()
    const url = `/ventas/resumen${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      // Si no existe el endpoint, retornar datos por defecto
      if (response.status === 404) {
        return {
          ventasHoy: 0,
          crecimientoPorcentaje: 0,
          pedidosCreados: 0,
          pedidosEntregados: 0,
          alertasCriticas: 0,
          efectivoConsolidado: 0,
        }
      }
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener resumen de ventas')
    }

    return response.json()
  },

  getCortePipas: async (sedeId?: string): Promise<CorteRepartidor> => {
    const queryParams = new URLSearchParams()
    if (sedeId) queryParams.append('sedeId', sedeId)

    const queryString = queryParams.toString()
    const url = `/ventas/corte/pipas${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      if (response.status === 404) {
        return {
          rutasProgramadas: 0,
          cortesEntregados: 0,
          cortesValidados: 0,
          cortesPendientes: 0,
          totalVentas: 0,
          totalServicios: 0,
          totalAbonos: 0,
        }
      }
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener corte de pipas')
    }

    return response.json()
  },

  getCorteCilindros: async (sedeId?: string): Promise<CorteRepartidor> => {
    const queryParams = new URLSearchParams()
    if (sedeId) queryParams.append('sedeId', sedeId)

    const queryString = queryParams.toString()
    const url = `/ventas/corte/cilindros${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      if (response.status === 404) {
        return {
          rutasProgramadas: 0,
          cortesEntregados: 0,
          cortesValidados: 0,
          cortesPendientes: 0,
          totalVentas: 0,
          totalServicios: 0,
          totalAbonos: 0,
        }
      }
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener corte de cilindros')
    }

    return response.json()
  },

  getAllCortes: async (): Promise<any[]> => {
    const url = `/ventas`
    const response = await fetchWithAuth(url)

    if (!response.ok) {
      if (response.status === 404) return []
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener todos los cortes')
    }

    return response.json()
  },

  validarCorte: async (corteId: string, data: { estado: string; observaciones?: string; validaciones?: any }): Promise<any> => {
    const url = `/cortes-caja/${corteId}/validate`
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al validar el corte')
    }

    return response.json()
  }
}

// API de Créditos y Abonos
export interface NotaCredito {
  id: string
  numeroNota: string
  clienteId: string
  cliente?: Cliente
  pedidoId?: string
  pedido?: any
  fechaVenta: string
  fechaVencimiento: string
  importe: number
  saldoPendiente: number
  diasVencimiento: number
  estado: 'vigente' | 'por_vencer' | 'vencida' | 'pagada' | 'cancelada'
  observaciones?: string
  fechaCreacion: string
  fechaModificacion: string
}

export interface Pago {
  id: string
  clienteId: string
  cliente?: Cliente
  notaCreditoId?: string
  notaCredito?: NotaCredito
  montoTotal: number
  tipo: 'nota_especifica' | 'abono_general'
  fechaPago: string
  horaPago: string
  observaciones?: string
  usuarioRegistro: string
  usuarioAutorizacion?: string
  estado: 'pendiente' | 'autorizado' | 'rechazado' | 'cancelado'
  fechaCreacion: string
  fechaModificacion: string
  formasPago?: PagoFormaPago[]
}

export interface PagoFormaPago {
  id: string
  pagoId: string
  formaPagoId: string
  formaPago?: FormaPago
  monto: number
  referencia?: string
  banco?: string
}

export interface CreateNotaCreditoRequest {
  clienteId: string
  pedidoId?: string
  fechaVenta: string
  fechaVencimiento: string
  importe: number
  observaciones?: string
}

export interface CreatePagoRequest {
  clienteId: string
  notaCreditoId?: string
  montoTotal: number
  tipo: 'nota_especifica' | 'abono_general'
  fechaPago?: string
  horaPago?: string
  observaciones?: string
  estado?: 'pendiente' | 'autorizado' | 'rechazado' | 'cancelado'
  formasPago: Array<{
    formaPagoId: string
    monto: number
    referencia?: string
    banco?: string
  }>
}

export interface ResumenCartera {
  carteraTotal: number
  notasPendientes: number
  carteraVencida: number
  notasVencidas: number
  porcentajeVencida: number
  carteraPorVencer: number
  notasPorVencer: number
  porcentajePorVencer: number
}

export interface ClienteCredito {
  id: string
  nombre: string
  direccion: string
  telefono: string
  ruta: string
  limiteCredito: number
  saldoActual: number
  creditoDisponible: number
  diasPromedioPago: number
  estado: 'buen-pagador' | 'vencido' | 'critico' | 'bloqueado'
  notasPendientes: NotaCredito[]
}

export interface HistorialLimiteCredito {
  id: string
  clienteId: string
  cliente?: Cliente
  usuarioId: string
  usuario?: Usuario
  limiteAnterior: number
  limiteNuevo: number
  motivo: string
  fechaCreacion: string
}

export interface NotasCreditoFilters {
  clienteId?: string
  estado?: string
  fechaDesde?: string
  fechaHasta?: string
}

export interface PagosFilters {
  clienteId?: string
  estado?: string
  fechaDesde?: string
  fechaHasta?: string
}

export const creditosAbonosAPI = {
  // Notas de Crédito
  getAllNotasCredito: async (filtros?: NotasCreditoFilters): Promise<NotaCredito[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.clienteId) queryParams.append('clienteId', filtros.clienteId)
    if (filtros?.estado) queryParams.append('estado', filtros.estado)
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/creditos-abonos/notas-credito${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener notas de crédito')
    }

    return response.json()
  },

  getNotaCreditoById: async (id: string): Promise<NotaCredito> => {
    const response = await fetchWithAuth(`/creditos-abonos/notas-credito/${id}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener nota de crédito')
    }

    return response.json()
  },

  createNotaCredito: async (data: CreateNotaCreditoRequest): Promise<NotaCredito> => {
    const response = await fetchWithAuth('/creditos-abonos/notas-credito', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear nota de crédito')
    }

    const result = await response.json()
    return result.notaCredito || result
  },

  updateNotaCredito: async (id: string, data: Partial<CreateNotaCreditoRequest>): Promise<NotaCredito> => {
    const response = await fetchWithAuth(`/creditos-abonos/notas-credito/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar nota de crédito')
    }

    const result = await response.json()
    return result.notaCredito || result
  },

  deleteNotaCredito: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/creditos-abonos/notas-credito/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar nota de crédito')
    }
  },

  // Pagos
  getAllPagos: async (filtros?: PagosFilters): Promise<Pago[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.clienteId) queryParams.append('clienteId', filtros.clienteId)
    if (filtros?.estado) queryParams.append('estado', filtros.estado)
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/creditos-abonos/pagos${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener pagos')
    }

    return response.json()
  },

  getPagoById: async (id: string): Promise<Pago> => {
    const response = await fetchWithAuth(`/creditos-abonos/pagos/${id}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener pago')
    }

    return response.json()
  },

  createPago: async (data: CreatePagoRequest): Promise<Pago> => {
    const response = await fetchWithAuth('/creditos-abonos/pagos', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear pago')
    }

    const result = await response.json()
    return result.pago || result
  },

  updatePagoEstado: async (id: string, estado: 'pendiente' | 'autorizado' | 'rechazado' | 'cancelado'): Promise<Pago> => {
    const response = await fetchWithAuth(`/creditos-abonos/pagos/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar estado del pago')
    }

    const result = await response.json()
    return result.pago || result
  },

  // Resumen de Cartera
  getResumenCartera: async (clienteId?: string): Promise<ResumenCartera> => {
    const queryParams = new URLSearchParams()
    if (clienteId) queryParams.append('clienteId', clienteId)

    const queryString = queryParams.toString()
    const url = `/creditos-abonos/resumen-cartera${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener resumen de cartera')
    }

    return response.json()
  },

  // Clientes con Crédito
  getClientesCredito: async (filtros?: ClientesFilters): Promise<ClienteCredito[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.nombre) queryParams.append('nombre', filtros.nombre)
    if (filtros?.rutaId) queryParams.append('rutaId', filtros.rutaId)
    if (filtros?.estadoCliente) queryParams.append('estadoCliente', filtros.estadoCliente)
    if (filtros?.sedeId) queryParams.append('sedeId', filtros.sedeId)

    const queryString = queryParams.toString()
    const url = `/creditos-abonos/clientes-credito${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener clientes con crédito')
    }

    return response.json()
  },

  // Historial de Límites
  getHistorialLimites: async (clienteId?: string): Promise<HistorialLimiteCredito[]> => {
    const queryParams = new URLSearchParams()
    if (clienteId) queryParams.append('clienteId', clienteId)

    const queryString = queryParams.toString()
    const url = `/creditos-abonos/historial-limites${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener historial de límites')
    }

    return response.json()
  },

  updateLimiteCredito: async (clienteId: string, limiteCredito: number, motivo?: string): Promise<Cliente> => {
    const response = await fetchWithAuth(`/creditos-abonos/clientes/${clienteId}/limite-credito`, {
      method: 'PUT',
      body: JSON.stringify({ limiteCredito, motivo }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar límite de crédito')
    }

    const result = await response.json()
    return result.cliente || result
  },

  getPedidosPendientes: async (clienteId?: string): Promise<Pedido[]> => {
    const queryParams = new URLSearchParams()
    if (clienteId) queryParams.append('clienteId', clienteId)
    queryParams.append('estado', 'pendiente')

    const queryString = queryParams.toString()
    const url = `/pedidos${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener pedidos pendientes')
    }

    return response.json()
  },
}

// API de Newsletter
export interface NewsletterItem {
  id: string
  type: 'image' | 'notification'
  title?: string
  content?: string
  description?: string
  imageUrl?: string
  fechaCreacion: string
  fechaVencimiento?: string
  size?: 'small' | 'medium' | 'large'
  activo: boolean
  usuarioCreacion?: string
  usuarioModificacion?: string
  fechaModificacion?: string
}

export interface CreateNewsletterItemRequest {
  type: 'image' | 'notification'
  title?: string
  content?: string
  description?: string
  imageUrl?: string
  fechaVencimiento?: string
  size?: 'small' | 'medium' | 'large'
  activo?: boolean
}

export interface UpdateNewsletterItemRequest {
  title?: string
  content?: string
  description?: string
  imageUrl?: string
  fechaVencimiento?: string
  size?: 'small' | 'medium' | 'large'
  activo?: boolean
}

export interface NewsletterFilters {
  type?: 'image' | 'notification'
  activo?: boolean
  fechaDesde?: string
  fechaHasta?: string
}

export const newsletterAPI = {
  getAll: async (filtros?: NewsletterFilters): Promise<NewsletterItem[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.type) queryParams.append('type', filtros.type)
    if (filtros?.activo !== undefined) queryParams.append('activo', String(filtros.activo))
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/newsletter${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      if (response.status === 404) {
        // Si la ruta no existe, retornar array vacío en lugar de error
        return []
      }
      const error = await response.json().catch(() => ({ message: 'Error al obtener items del newsletter' }))
      throw new Error(error.message || 'Error al obtener items del newsletter')
    }

    return response.json()
  },

  getById: async (id: string): Promise<NewsletterItem> => {
    const response = await fetchWithAuth(`/newsletter/${id}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener item del newsletter')
    }

    return response.json()
  },

  create: async (data: CreateNewsletterItemRequest): Promise<NewsletterItem> => {
    const response = await fetchWithAuth('/newsletter', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: response.status === 404 
          ? 'La ruta del newsletter no está disponible. Por favor, asegúrese de que el backend esté corriendo y tenga la migración aplicada.'
          : 'Error al crear item del newsletter'
      }))
      throw new Error(error.message || 'Error al crear item del newsletter')
    }

    const result = await response.json()
    return result.newsletterItem || result
  },

  update: async (id: string, data: UpdateNewsletterItemRequest): Promise<NewsletterItem> => {
    const response = await fetchWithAuth(`/newsletter/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar item del newsletter')
    }

    const result = await response.json()
    return result.newsletterItem || result
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/newsletter/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al eliminar item del newsletter')
    }
  },

  // Historial de notificaciones
  getHistorialNotificaciones: async (): Promise<NewsletterItem[]> => {
    const response = await fetchWithAuth('/newsletter/historial/notificaciones')

    if (!response.ok) {
      if (response.status === 404) return []
      const error = await response.json().catch(() => ({ message: 'Error al obtener historial de notificaciones' }))
      throw new Error(error.message || 'Error al obtener historial de notificaciones')
    }

    return response.json()
  },
}

// API de Configuraciones
export interface Configuracion {
  id: string
  precioPorLitroGasLP: number
  precioPorKG: number
  fechaCreacion: string
  fechaModificacion: string
}

export interface UpdateConfiguracionRequest {
  precioPorLitroGasLP?: number
  precioPorKG?: number
}

export const configuracionesAPI = {
  get: async (): Promise<Configuracion> => {
    try {
      const response = await fetchWithAuth('/configuraciones')

      if (!response.ok) {
        if (response.status === 404) {
          // Si no existe configuración, retornar valores por defecto
          return {
            id: '',
            precioPorLitroGasLP: 18.50,
            precioPorKG: 18.50,
            fechaCreacion: new Date().toISOString(),
            fechaModificacion: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
        let errorMessage = 'Error al obtener configuración'
        try {
          const error = await response.json()
          errorMessage = error.message || errorMessage
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error: any) {
      // Si es un error de red, retornar valores por defecto
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.warn('Error de conexión al obtener configuración. Usando valores por defecto.')
        return {
          id: '',
          precioPorLitroGasLP: 18.50,
          precioPorKG: 18.50,
          fechaCreacion: new Date().toISOString(),
          fechaModificacion: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      throw error
    }
  },

  update: async (data: UpdateConfiguracionRequest): Promise<Configuracion> => {
    const response = await fetchWithAuth('/configuraciones', {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar configuración')
    }

    const result = await response.json()
    return result.configuracion || result
  },
}

// API de Reportes
export interface VentasPorMes {
  mes: string
  mesNombre: string
  total: number
  cantidad: number
}

export interface CortesPorMes {
  mes: string
  mesNombre: string
  cantidad: number
  validados: number
  pendientes: number
}

export interface DineroEntregado {
  mes: string
  mesNombre: string
  total: number
  totalVentas: number
  totalAbonos: number
  totalEfectivo: number
  totalOtros: number
}

export interface ClientesPorZona {
  zonaId: string
  zonaNombre: string
  cantidad: number
}

export interface EstadisticasCreditos {
  activos: number
  pagados: number
  deuda: number
  totalImporte: number
  totalSaldoPendiente: number
}

export interface CreditosPorMes {
  mes: string
  mesNombre: string
  activos: number
  pagados: number
  vencidos: number
  totalImporte: number
  totalSaldoPendiente: number
}

export interface VentasPorTipoServicio {
  pipas: { cantidad: number; total: number }
  cilindros: { cantidad: number; total: number }
}

export interface VentasPorFormaPago {
  nombre: string
  tipo: string
  cantidad: number
  total: number
}

export interface ResumenGeneral {
  ventasPorMes: VentasPorMes[]
  cortesPorMes: CortesPorMes[]
  dineroEntregado: DineroEntregado[]
  clientesPorZona: ClientesPorZona[]
  estadisticasCreditos: EstadisticasCreditos
  creditosPorMes: CreditosPorMes[]
  ventasPorTipoServicio: VentasPorTipoServicio
  ventasPorFormaPago: VentasPorFormaPago[]
}

export interface ReportesFilters {
  fechaDesde?: string
  fechaHasta?: string
}

export const reportesAPI = {
  getVentasPorMes: async (filtros?: ReportesFilters): Promise<VentasPorMes[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/reportes/ventas-por-mes${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener ventas por mes')
    }

    return response.json()
  },

  getCortesPorMes: async (filtros?: ReportesFilters): Promise<CortesPorMes[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/reportes/cortes-por-mes${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener cortes por mes')
    }

    return response.json()
  },

  getDineroEntregadoPorCortes: async (filtros?: ReportesFilters): Promise<DineroEntregado[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/reportes/dinero-entregado-cortes${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener dinero entregado por cortes')
    }

    return response.json()
  },

  getClientesPorZona: async (): Promise<ClientesPorZona[]> => {
    const response = await fetchWithAuth('/reportes/clientes-por-zona')

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener clientes por zona')
    }

    return response.json()
  },

  getEstadisticasCreditos: async (filtros?: ReportesFilters): Promise<EstadisticasCreditos> => {
    const queryParams = new URLSearchParams()
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/reportes/estadisticas-creditos${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener estadísticas de créditos')
    }

    return response.json()
  },

  getCreditosPorMes: async (filtros?: ReportesFilters): Promise<CreditosPorMes[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/reportes/creditos-por-mes${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener créditos por mes')
    }

    return response.json()
  },

  getVentasPorTipoServicio: async (filtros?: ReportesFilters): Promise<VentasPorTipoServicio> => {
    const queryParams = new URLSearchParams()
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/reportes/ventas-por-tipo-servicio${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener ventas por tipo de servicio')
    }

    return response.json()
  },

  getVentasPorFormaPago: async (filtros?: ReportesFilters): Promise<VentasPorFormaPago[]> => {
    const queryParams = new URLSearchParams()
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/reportes/ventas-por-forma-pago${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener ventas por forma de pago')
    }

    return response.json()
  },

  getResumenGeneral: async (filtros?: ReportesFilters): Promise<ResumenGeneral> => {
    const queryParams = new URLSearchParams()
    if (filtros?.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde)
    if (filtros?.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta)

    const queryString = queryParams.toString()
    const url = `/reportes/resumen-general${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener resumen general')
    }

    return response.json()
  },
}

// API de Reportes Financieros
export interface AntiguedadCartera {
  menos30: Array<{
    numeroNota: string
    cliente: string
    telefono: string
    ruta: string
    fechaVenta: string
    fechaVencimiento: string
    importe: number
    saldoPendiente: number
    diasVencidos: number
    estado: string
  }>
  entre30y60: Array<{
    numeroNota: string
    cliente: string
    telefono: string
    ruta: string
    fechaVenta: string
    fechaVencimiento: string
    importe: number
    saldoPendiente: number
    diasVencidos: number
    estado: string
  }>
  entre60y90: Array<{
    numeroNota: string
    cliente: string
    telefono: string
    ruta: string
    fechaVenta: string
    fechaVencimiento: string
    importe: number
    saldoPendiente: number
    diasVencidos: number
    estado: string
  }>
  mas90: Array<{
    numeroNota: string
    cliente: string
    telefono: string
    ruta: string
    fechaVenta: string
    fechaVencimiento: string
    importe: number
    saldoPendiente: number
    diasVencidos: number
    estado: string
  }>
}

export interface ClientePagador {
  id: string
  nombre: string
  telefono: string
  ruta: string
  totalPagado: number
  notasPagadas: number
  promedioDiasPago: number
  limiteCredito: number
  saldoActual: number
}

export interface AnalisisRiesgo {
  bajo: Array<{
    id: string
    nombre: string
    telefono: string
    ruta: string
    limiteCredito: number
    saldoActual: number
    porcentajeUso: number
    notasVencidas: number
    totalVencido: number
    diasPromedioVencimiento: number
  }>
  medio: Array<{
    id: string
    nombre: string
    telefono: string
    ruta: string
    limiteCredito: number
    saldoActual: number
    porcentajeUso: number
    notasVencidas: number
    totalVencido: number
    diasPromedioVencimiento: number
  }>
  alto: Array<{
    id: string
    nombre: string
    telefono: string
    ruta: string
    limiteCredito: number
    saldoActual: number
    porcentajeUso: number
    notasVencidas: number
    totalVencido: number
    diasPromedioVencimiento: number
  }>
  critico: Array<{
    id: string
    nombre: string
    telefono: string
    ruta: string
    limiteCredito: number
    saldoActual: number
    porcentajeUso: number
    notasVencidas: number
    totalVencido: number
    diasPromedioVencimiento: number
  }>
}

export interface ClienteVisitaCobranza {
  id: string
  nombre: string
  telefono: string
  calle: string
  numeroExterior: string
  colonia: string
  ruta: string
  rutaId: string | null
  zona: string
  totalVencido: number
  totalPorVencer: number
  cantidadNotas: number
  ultimaVisita: string | null
}

export interface Recordatorio {
  id: string
  numeroNota: string
  cliente: string
  email: string | null
  telefono: string
  fechaVencimiento: string
  diasParaVencer: number
  importe: number
  saldoPendiente: number
  enviado: boolean
}

export interface TransferenciaPendiente {
  id: string
  cliente: string
  telefono: string
  notaCredito: string
  montoTotal: number
  transferencias: Array<{
    monto: number
    referencia: string | null
    banco: string | null
    formaPago: string
  }>
  fechaPago: string
  fechaCreacion: string
  usuarioRegistro: string
}

export interface ClienteLimiteExcedido {
  id: string
  nombre: string
  telefono: string
  ruta: string
  limiteCredito: number
  saldoActual: number
  exceso: number
  porcentajeExceso: number
  cantidadNotas: number
  totalNotas: number
}

export interface ComparativoCarteraVentas {
  periodo: {
    fechaDesde: string | null
    fechaHasta: string | null
  }
  ventas: {
    total: number
    pagado: number
    pendiente: number
  }
  cartera: {
    total: number
    vigente: number
    porcentajeSobreVentas: string
  }
  indicadores: {
    ratioCobranza: string
    diasPromedioCartera: number
  }
}

export interface EficienciaRepartidor {
  id: string
  nombre: string
  totalVentas: number
  totalCartera: number
  totalCobrado: number
  eficiencia: number
  cantidadClientes: number
  cantidadPedidos: number
}

export interface TendenciaPago {
  mes: string
  mesNombre: string
  total: number
  porFormaPago: Record<string, number>
}

export interface ProyeccionFlujoCaja {
  mes: string
  mesNombre: string
  vencimientosEsperados: number
  cobranzaProyectada: number
  diferencia: number
}

export const reportesFinancierosAPI = {
  getAntiguedadCartera: async (): Promise<AntiguedadCartera> => {
    const response = await fetchWithAuth('/reportes-financieros/antiguedad-cartera')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener antigüedad de cartera')
    }
    return response.json()
  },

  getTopMejoresPagadores: async (limite: number = 10): Promise<ClientePagador[]> => {
    const response = await fetchWithAuth(`/reportes-financieros/top-mejores-pagadores?limite=${limite}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener mejores pagadores')
    }
    return response.json()
  },

  getTopPeoresPagadores: async (limite: number = 10): Promise<ClientePagador[]> => {
    const response = await fetchWithAuth(`/reportes-financieros/top-peores-pagadores?limite=${limite}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener peores pagadores')
    }
    return response.json()
  },

  getAnalisisRiesgo: async (): Promise<AnalisisRiesgo> => {
    const response = await fetchWithAuth('/reportes-financieros/analisis-riesgo')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener análisis de riesgo')
    }
    return response.json()
  },

  getClientesVisitaCobranza: async (rutaId?: string): Promise<ClienteVisitaCobranza[]> => {
    const url = rutaId 
      ? `/reportes-financieros/clientes-visita-cobranza?rutaId=${rutaId}`
      : '/reportes-financieros/clientes-visita-cobranza'
    const response = await fetchWithAuth(url)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener clientes para visita de cobranza')
    }
    return response.json()
  },

  getRecordatoriosPorEnviar: async (): Promise<Recordatorio[]> => {
    const response = await fetchWithAuth('/reportes-financieros/recordatorios-por-enviar')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener recordatorios por enviar')
    }
    return response.json()
  },

  getTransferenciasPendientes: async (): Promise<TransferenciaPendiente[]> => {
    const response = await fetchWithAuth('/reportes-financieros/transferencias-pendientes')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener transferencias pendientes')
    }
    return response.json()
  },

  getClientesLimiteExcedido: async (): Promise<ClienteLimiteExcedido[]> => {
    const response = await fetchWithAuth('/reportes-financieros/clientes-limite-excedido')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener clientes con límite excedido')
    }
    return response.json()
  },

  getComparativoCarteraVentas: async (fechaDesde?: string, fechaHasta?: string): Promise<ComparativoCarteraVentas> => {
    const queryParams = new URLSearchParams()
    if (fechaDesde) queryParams.append('fechaDesde', fechaDesde)
    if (fechaHasta) queryParams.append('fechaHasta', fechaHasta)
    const queryString = queryParams.toString()
    const url = `/reportes-financieros/comparativo-cartera-ventas${queryString ? `?${queryString}` : ''}`
    const response = await fetchWithAuth(url)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener comparativo cartera vs ventas')
    }
    return response.json()
  },

  getEficienciaCobranzaRepartidor: async (fechaDesde?: string, fechaHasta?: string): Promise<EficienciaRepartidor[]> => {
    const queryParams = new URLSearchParams()
    if (fechaDesde) queryParams.append('fechaDesde', fechaDesde)
    if (fechaHasta) queryParams.append('fechaHasta', fechaHasta)
    const queryString = queryParams.toString()
    const url = `/reportes-financieros/eficiencia-cobranza-repartidor${queryString ? `?${queryString}` : ''}`
    const response = await fetchWithAuth(url)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener eficiencia de cobranza por repartidor')
    }
    return response.json()
  },

  getTendenciasPago: async (meses: number = 12): Promise<TendenciaPago[]> => {
    const response = await fetchWithAuth(`/reportes-financieros/tendencias-pago?meses=${meses}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener tendencias de pago')
    }
    return response.json()
  },

  getProyeccionFlujoCaja: async (meses: number = 6): Promise<ProyeccionFlujoCaja[]> => {
    const response = await fetchWithAuth(`/reportes-financieros/proyeccion-flujo-caja?meses=${meses}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener proyección de flujo de caja')
    }
    return response.json()
  },
}

