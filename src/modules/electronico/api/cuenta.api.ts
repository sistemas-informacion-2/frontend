import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { Devolucion, DevolucionesPaginatedResponse, Venta, VentasPaginatedResponse } from '@/modules/comercial/types'

// Compras y devoluciones del cliente autenticado ("Mi cuenta"): el servidor filtra por el cliente del token.

const paginacion = (page: number, limit: number) => new URLSearchParams({ page: String(page), limit: String(limit) }).toString()

export async function fetchMisCompras(page: number, limit = 10): Promise<VentasPaginatedResponse> {
  return unwrap(await httpClient.get<Envelope<VentasPaginatedResponse>>(`/comercial/mi-cuenta/compras?${paginacion(page, limit)}`))
}

export async function fetchMiCompra(id: number): Promise<Venta> {
  return unwrap(await httpClient.get<Envelope<Venta>>(`/comercial/mi-cuenta/compras/${id}`))
}

export async function fetchMisDevoluciones(page: number, limit = 10): Promise<DevolucionesPaginatedResponse> {
  return unwrap(await httpClient.get<Envelope<DevolucionesPaginatedResponse>>(`/comercial/mi-cuenta/devoluciones?${paginacion(page, limit)}`))
}

export async function fetchMiDevolucion(id: number): Promise<Devolucion> {
  return unwrap(await httpClient.get<Envelope<Devolucion>>(`/comercial/mi-cuenta/devoluciones/${id}`))
}
