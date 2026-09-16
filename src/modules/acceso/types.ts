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
