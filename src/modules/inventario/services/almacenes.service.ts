import { httpClient } from '@/core/http/httpClient'
import type { Almacen, AlmacenFormValues, AlmacenesQuery } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: AlmacenesQuery = {}): string {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.idSucursal !== undefined) params.set('idSucursal', String(query.idSucursal))
  if (query.activo !== undefined) params.set('activo', String(query.activo))
  const result = params.toString()
  return result ? `?${result}` : ''
}

export async function listarAlmacenes(query: AlmacenesQuery = {}): Promise<Almacen[]> {
  const response = await httpClient.get<Envelope<Almacen[]>>(`/inventario/almacenes${toQueryString(query)}`)
  return response.data.data
}

export async function crearAlmacen(values: AlmacenFormValues): Promise<Almacen> {
  const response = await httpClient.post<Envelope<Almacen>>('/inventario/almacenes', {
    idSucursal: Number(values.idSucursal),
    nombre: values.nombre,
    ubicacionFisica: values.ubicacionFisica || undefined,
  })
  return response.data.data
}

export async function actualizarAlmacen(id: number, values: AlmacenFormValues): Promise<Almacen> {
  const response = await httpClient.put<Envelope<Almacen>>(`/inventario/almacenes/${id}`, {
    idSucursal: Number(values.idSucursal),
    nombre: values.nombre,
    ubicacionFisica: values.ubicacionFisica || null,
    activo: values.activo,
  })
  return response.data.data
}
