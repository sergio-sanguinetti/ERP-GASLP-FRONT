export type UserRole = 'Administrador' | 'Gestor' | 'Repartidor'

export type UserStatus = 'Activo' | 'Inactivo'

export interface User {
  id: number
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  rol: UserRole
  correo: string
  estado: UserStatus
  sedeId?: number
  sedeNombre?: string
  fechaCreacion: string
}

export interface CreateUserData {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  rol: UserRole
  correo: string
  estado: UserStatus
  sedeId?: number
}

export interface EditUserData extends CreateUserData {
  id: number
  fechaCreacion: string
}








