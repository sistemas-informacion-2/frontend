export type TipoUsuario = 'A' | 'E' | 'C'

export interface Perfil {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  tipoUsuario: TipoUsuario
  permisos: string[]
  sucursalId?: number
  sucursalNombre?: string
  puntosFidelidad?: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  perfil: Perfil
}

export type EstadoAcceso = 'HABILITADO' | 'BLOQUEADO' | 'SUSPENDIDO'

export interface RolResumen {
  id: number
  nombre: string
}

export interface Usuario {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  sexo: string | null
  tipoUsuario: TipoUsuario
  estadoAcceso: EstadoAcceso
  fechaCreacion: string
  activo: boolean
  roles: RolResumen[]
}

export interface UsuariosQuery {
  page: number
  limit: number
  search?: string
  tipoUsuario?: TipoUsuario
  estadoAcceso?: EstadoAcceso
  activo?: boolean
}

export interface UsuariosPaginatedResponse {
  items: Usuario[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UsuarioFormValues {
  nombre: string
  apellido: string
  email: string
  telefono: string
  sexo: string
  password: string
  tipoUsuario: TipoUsuario
  estadoAcceso: EstadoAcceso
  roles: number[]
}
