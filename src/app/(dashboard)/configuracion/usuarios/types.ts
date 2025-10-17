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
  fechaCreacion: string
}

export interface CreateUserData {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  rol: UserRole
  correo: string
  estado: UserStatus
}

export interface EditUserData extends CreateUserData {
  id: number
  fechaCreacion: string
}

