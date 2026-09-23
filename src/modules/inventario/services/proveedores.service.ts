import { httpClient } from '@/core/http/httpClient'
import type { Proveedor, ProveedorFormValues, ProveedoresQuery } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: ProveedoresQuery = {}): string {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.activo !== undefined) params.set('activo', String(query.activo))
  const result = params.toString()
  return result ? `?${result}` : ''
}

export async function listarProveedores(query: ProveedoresQuery = {}): Promise<Proveedor[]> {
  const response = await httpClient.get<Envelope<Proveedor[]>>(`/inventario/proveedores${toQueryString(query)}`)
  return response.data.data
}

export async function crearProveedor(values: ProveedorFormValues): Promise<Proveedor> {
  const response = await httpClient.post<Envelope<Proveedor>>('/inventario/proveedores', {
    empresa: values.empresa,
    nit: values.nit,
    nombreContacto: values.nombreContacto || undefined,
    telefonoContacto: values.telefonoContacto || undefined,
    correoContacto: values.correoContacto || undefined,
  })
  return response.data.data
}

export async function actualizarProveedor(id: number, values: ProveedorFormValues): Promise<Proveedor> {
  const response = await httpClient.put<Envelope<Proveedor>>(`/inventario/proveedores/${id}`, {
    empresa: values.empresa,
    nit: values.nit,
    nombreContacto: values.nombreContacto || null,
    telefonoContacto: values.telefonoContacto || null,
    correoContacto: values.correoContacto || null,
    activo: values.activo,
  })
  return response.data.data
}
