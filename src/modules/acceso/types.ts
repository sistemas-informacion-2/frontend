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
  direccion?: string | null
}

export interface ActualizarPerfilPayload {
  nombre: string
  apellido: string
  telefono: string | null
  direccion?: string | null
}

export interface CambiarPasswordPayload {
  passwordActual: string
  nuevaPassword: string
}

export interface PerfilFormValues {
  nombre: string
  apellido: string
  telefono: string
  direccion: string
}

export interface CambiarPasswordFormValues {
  passwordActual: string
  nuevaPassword: string
  confirmarPassword: string
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

export interface Permiso {
  id: number
  accion: string
  descripcion: string | null
  modulo: string
  activo: boolean
}

export interface PermisoGrupo {
  modulo: string
  permisos: Permiso[]
}

export interface Rol {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  fechaCreacion: string
  cantidadUsuarios: number
  permisos: Permiso[]
}

export interface RolesQuery {
  search?: string
  activo?: boolean
}

export interface CrearRolPayload {
  nombre: string
  descripcion: string
}

export interface ActualizarRolPayload extends Partial<CrearRolPayload> {
  activo?: boolean
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

export interface RegistroClienteFormValues {
  nombre: string
  apellido: string
  email: string
  telefono: string
  password: string
  confirmarPassword: string
}

export interface RegistroClientePayload {
  nombre: string
  apellido: string
  email: string
  telefono?: string
  password: string
}
