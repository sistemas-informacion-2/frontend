import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { Venta, VentasPaginatedResponse, VentasQuery } from '@/modules/comercial/types'

// Notas de venta de las compras hechas en la tienda en línea (permiso electronico:ventas:leer).

export async function listarVentasEnLinea(query: VentasQuery): Promise<VentasPaginatedResponse> {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) })
  if (query.search) params.set('search', query.search)
  if (query.idSucursal !== undefined) params.set('idSucursal', String(query.idSucursal))
  if (query.fechaDesde) params.set('fechaDesde', query.fechaDesde)
  if (query.fechaHasta) params.set('fechaHasta', query.fechaHasta)
  return unwrap(await httpClient.get<Envelope<VentasPaginatedResponse>>(`/electronico/ventas?${params.toString()}`))
}

export async function obtenerVentaEnLinea(id: number): Promise<Venta> {
  return unwrap(await httpClient.get<Envelope<Venta>>(`/electronico/ventas/${id}`))
}
