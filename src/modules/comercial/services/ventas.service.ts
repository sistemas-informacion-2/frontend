import { httpClient } from '@/core/http/httpClient'
import type { Venta, VentaFormValues, VentasPaginatedResponse, VentasQuery } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: VentasQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  })
  if (query.search) params.set('search', query.search)
  if (query.idSucursal !== undefined) params.set('idSucursal', String(query.idSucursal))
  if (query.idCajero !== undefined) params.set('idCajero', String(query.idCajero))
  if (query.fechaDesde) params.set('fechaDesde', query.fechaDesde)
  if (query.fechaHasta) params.set('fechaHasta', query.fechaHasta)
  return params.toString()
}

export async function listarVentas(query: VentasQuery): Promise<VentasPaginatedResponse> {
  const response = await httpClient.get<Envelope<VentasPaginatedResponse>>(`/comercial/ventas?${toQueryString(query)}`)
  return response.data.data
}

export async function obtenerVenta(id: number): Promise<Venta> {
  const response = await httpClient.get<Envelope<Venta>>(`/comercial/ventas/${id}`)
  return response.data.data
}

export async function crearVenta(values: VentaFormValues): Promise<Venta> {
  const response = await httpClient.post<Envelope<Venta>>('/comercial/ventas', {
    idCliente: Number(values.idCliente),
    ...(values.idSucursal === '' ? {} : { idSucursal: Number(values.idSucursal) }),
    idAlmacen: Number(values.idAlmacen),
    idPasarela: Number(values.idPasarela),
    descuento: Number(values.descuento || 0),
    impuesto: Number(values.impuesto || 0),
    nitRazonSocial: values.nitRazonSocial || undefined,
    items: values.items
      .filter((item) => item.idVarianteProducto !== '' && Number(item.cantidad) > 0)
      .map((item) => ({
        idVarianteProducto: Number(item.idVarianteProducto),
        cantidad: Number(item.cantidad),
      })),
  })
  return response.data.data
}
