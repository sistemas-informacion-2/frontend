import { httpClient } from '@/core/http/httpClient'
import type { Cliente, ClienteFormValues, ClientesPaginatedResponse, ClientesQuery } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: ClientesQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  })

  if (query.search) params.set('search', query.search)
  if (query.activo !== undefined) params.set('activo', String(query.activo))

  return params.toString()
}

export async function listarClientes(query: ClientesQuery): Promise<ClientesPaginatedResponse> {
  const response = await httpClient.get<Envelope<ClientesPaginatedResponse>>(
    `/operaciones/clientes?${toQueryString(query)}`,
  )
  return response.data.data
}

export async function crearCliente(values: ClienteFormValues): Promise<Cliente> {
  const response = await httpClient.post<Envelope<Cliente>>('/operaciones/clientes', {
    nombre: values.nombre,
    apellido: values.apellido,
    email: values.email,
    telefono: values.telefono || undefined,
    sexo: values.sexo || undefined,
    password: values.password,
    ciudadResidencia: values.ciudadResidencia || undefined,
    direccionPrincipal: values.direccionPrincipal || undefined,
  })
  return response.data.data
}

export async function actualizarCliente(id: number, values: ClienteFormValues): Promise<Cliente> {
  const response = await httpClient.put<Envelope<Cliente>>(`/operaciones/clientes/${id}`, {
    nombre: values.nombre,
    apellido: values.apellido,
    email: values.email,
    telefono: values.telefono || null,
    sexo: values.sexo || null,
    ...(values.password ? { password: values.password } : {}),
    ciudadResidencia: values.ciudadResidencia || null,
    direccionPrincipal: values.direccionPrincipal || null,
  })
  return response.data.data
}
