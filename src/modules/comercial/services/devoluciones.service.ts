import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type {
  CrearDevolucionInput,
  Devolucion,
  DevolucionesPaginatedResponse,
  DevolucionesQuery,
  OrigenDevolucion,
} from '../types'

export async function listarDevoluciones(query: DevolucionesQuery): Promise<DevolucionesPaginatedResponse> {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) })
  if (query.search) params.set('search', query.search)
  if (query.tipoDevolucion) params.set('tipoDevolucion', query.tipoDevolucion)
  if (query.idSucursal !== undefined) params.set('idSucursal', String(query.idSucursal))
  return unwrap(await httpClient.get<Envelope<DevolucionesPaginatedResponse>>(`/comercial/devoluciones?${params.toString()}`))
}

export async function obtenerDevolucion(id: number): Promise<Devolucion> {
  return unwrap(await httpClient.get<Envelope<Devolucion>>(`/comercial/devoluciones/${id}`))
}

/** Busca la nota de venta o la reserva a devolver por su código. */
export async function buscarOrigenDevolucion(codigo: { codigoNota?: string; codigoReserva?: string }): Promise<OrigenDevolucion> {
  const params = new URLSearchParams()
  if (codigo.codigoNota) params.set('codigoNota', codigo.codigoNota)
  if (codigo.codigoReserva) params.set('codigoReserva', codigo.codigoReserva)
  return unwrap(await httpClient.get<Envelope<OrigenDevolucion>>(`/comercial/devoluciones/origen?${params.toString()}`))
}

export async function crearDevolucion(input: CrearDevolucionInput): Promise<Devolucion> {
  return unwrap(await httpClient.post<Envelope<Devolucion>>('/comercial/devoluciones', input))
}
