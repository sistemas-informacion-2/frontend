import { httpClient } from '@/core/http/httpClient'
import type {
  Destinatario,
  EnvioNotificacionResponse,
  Notificacion,
  NotificacionFormValues,
  NotificacionesPaginatedResponse,
  NotificacionesQuery,
} from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: NotificacionesQuery = {}): string {
  const params = new URLSearchParams()
  if (query.page !== undefined) params.set('page', String(query.page))
  if (query.limit !== undefined) params.set('limit', String(query.limit))
  if (query.idUsuario !== undefined) params.set('idUsuario', String(query.idUsuario))
  if (query.leido !== undefined) params.set('leido', String(query.leido))
  if (query.search) params.set('search', query.search)
  if (query.fechaDesde) params.set('fechaDesde', query.fechaDesde)
  if (query.fechaHasta) params.set('fechaHasta', query.fechaHasta)
  const result = params.toString()
  return result ? `?${result}` : ''
}

export async function listarNotificaciones(query: NotificacionesQuery = {}): Promise<NotificacionesPaginatedResponse> {
  const response = await httpClient.get<Envelope<NotificacionesPaginatedResponse>>(
    `/electronico/notificaciones${toQueryString(query)}`,
  )
  return response.data.data
}

export async function listarMias(query: NotificacionesQuery = {}): Promise<NotificacionesPaginatedResponse> {
  const response = await httpClient.get<Envelope<NotificacionesPaginatedResponse>>(
    `/electronico/notificaciones/mias${toQueryString(query)}`,
  )
  return response.data.data
}

export async function listarDestinatarios(): Promise<Destinatario[]> {
  const response = await httpClient.get<Envelope<Destinatario[]>>('/electronico/notificaciones/destinatarios')
  return response.data.data
}

export async function contarNoLeidas(): Promise<number> {
  const response = await httpClient.get<Envelope<{ noLeidas: number }>>(
    '/electronico/notificaciones/mias/no-leidas',
  )
  return response.data.data.noLeidas
}

export async function marcarLeida(id: number): Promise<Notificacion> {
  const response = await httpClient.patch<Envelope<Notificacion>>(`/electronico/notificaciones/mias/${id}/leido`, {})
  return response.data.data
}

export async function marcarTodasLeidas(): Promise<number> {
  const response = await httpClient.patch<Envelope<{ cantidadActualizada: number }>>(
    '/electronico/notificaciones/mias/leer-todas',
    {},
  )
  return response.data.data.cantidadActualizada
}

export async function enviarNotificacion(values: NotificacionFormValues): Promise<EnvioNotificacionResponse> {
  const response = await httpClient.post<Envelope<EnvioNotificacionResponse>>('/electronico/notificaciones', {
    titulo: values.titulo,
    mensaje: values.mensaje,
    ...(values.destinatario === 'CLIENTES'
      ? { difundirTodos: true }
      : { idUsuario: Number(values.idUsuario) }),
  })
  return response.data.data
}

export async function eliminarNotificacion(id: number): Promise<void> {
  await httpClient.delete(`/electronico/notificaciones/${id}`)
}
