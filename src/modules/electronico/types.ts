export interface Notificacion {
  id: number
  idUsuario: number
  destinatario: string
  titulo: string
  mensaje: string
  leido: boolean
  fechaEnvio: string
}

export interface NotificacionesQuery {
  page?: number
  limit?: number
  idUsuario?: number
  leido?: boolean
  search?: string
  fechaDesde?: string
  fechaHasta?: string
}

export interface NotificacionesPaginatedResponse {
  items: Notificacion[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface EnvioNotificacionResponse {
  cantidadEnviada: number
}

export interface Destinatario {
  id: number
  nombre: string
  apellido: string
  email: string
  etiqueta: string
}

export type DestinatarioTipo = 'CLIENTES' | 'USUARIO'

export interface NotificacionFormValues {
  titulo: string
  mensaje: string
  destinatario: DestinatarioTipo
  idUsuario: string
}
