// Tipos actualizados para coincidir con el backend

export type UserRole = 
  | 'superAdministrador'
  | 'administrador'
  | 'gestor'
  | 'repartidor'

export type UserStatus = 'activo' | 'inactivo'
export type TipoRepartidor = 'cilindros' | 'pipas'

export interface User {
  id: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  telefono?: string
  rol: UserRole
  tipoRepartidor?: TipoRepartidor
  estado: UserStatus
  sede?: string
  isTwoFactorEnabled: boolean
  fechaRegistro: string
}

export interface CreateUserData {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  password: string
  telefono?: string
  rol: UserRole
  tipoRepartidor?: TipoRepartidor
  estado: UserStatus
  sede?: string
}

export interface EditUserData {
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  email?: string
  telefono?: string
  rol?: UserRole
  tipoRepartidor?: TipoRepartidor
  estado?: UserStatus
  sede?: string
}
