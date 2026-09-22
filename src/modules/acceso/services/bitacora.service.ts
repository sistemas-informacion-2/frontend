import { httpClient } from '@/core/http/httpClient'
import type { BitacoraPaginatedResponse, BitacoraQuery, BitacoraRegistro } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: BitacoraQuery): string {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) })
  if (query.usuarioId !== undefined) params.set('usuarioId', String(query.usuarioId))
  if (query.tablaAfectada) params.set('tablaAfectada', query.tablaAfectada)
  if (query.operacion) params.set('operacion', query.operacion)
  if (query.fechaDesde) params.set('fechaDesde', query.fechaDesde)
  if (query.fechaHasta) params.set('fechaHasta', query.fechaHasta)
  return params.toString()
}

export async function listarBitacora(query: BitacoraQuery): Promise<BitacoraPaginatedResponse> {
  const response = await httpClient.get<Envelope<BitacoraPaginatedResponse>>(`/acceso/bitacora?${toQueryString(query)}`)
  return response.data.data
}

export async function obtenerBitacora(id: string): Promise<BitacoraRegistro> {
  const response = await httpClient.get<Envelope<BitacoraRegistro>>(`/acceso/bitacora/${id}`)
  return response.data.data
}