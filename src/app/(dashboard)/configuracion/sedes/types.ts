export interface Sede {
  id: number
  nombre: string
  direccion: string
  telefono: string
  email: string
  estado: 'Activa' | 'Inactiva'
  fechaCreacion: string
}

export interface CreateSedeData {
  nombre: string
  direccion: string
  telefono: string
  email: string
  estado: 'Activa' | 'Inactiva'
}

