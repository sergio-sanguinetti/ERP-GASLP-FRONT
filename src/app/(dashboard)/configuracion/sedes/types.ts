// Tipos actualizados para coincidir con el backend

export interface Sede {
  id: string
  nombre: string
  direccion: string
  telefono: string
  email: string
  estado: 'activa' | 'inactiva'
  fechaCreacion: string
}

export interface CreateSedeData {
  nombre: string
  direccion: string
  telefono: string
  email: string
  estado: 'activa' | 'inactiva'
}
