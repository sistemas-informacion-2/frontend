import { httpClient } from '@/core/http/httpClient'
import type {
  Empleado,
  EmpleadoFormValues,
  EmpleadosPaginatedResponse,
  EmpleadosQuery,
} from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: EmpleadosQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  })

  if (query.search) params.set('search', query.search)
  if (query.idSucursal !== undefined) params.set('idSucursal', String(query.idSucursal))
  if (query.activo !== undefined) params.set('activo', String(query.activo))

  return params.toString()
}

export async function listarEmpleados(query: EmpleadosQuery): Promise<EmpleadosPaginatedResponse> {
  const response = await httpClient.get<Envelope<EmpleadosPaginatedResponse>>(
    `/operaciones/empleados?${toQueryString(query)}`,
  )
  return response.data.data
}

export async function crearEmpleado(values: EmpleadoFormValues): Promise<Empleado> {
  const response = await httpClient.post<Envelope<Empleado>>('/operaciones/empleados', {
    nombre: values.nombre,
    apellido: values.apellido,
    email: values.email,
    telefono: values.telefono || undefined,
    sexo: values.sexo || undefined,
    password: values.password,
    salario: Number(values.salario),
    fechaContratacion: values.fechaContratacion,
    sucursalIds: values.sucursalIds,
  })
  return response.data.data
}

export async function actualizarEmpleado(id: number, values: EmpleadoFormValues): Promise<Empleado> {
  const response = await httpClient.put<Envelope<Empleado>>(`/operaciones/empleados/${id}`, {
    nombre: values.nombre,
    apellido: values.apellido,
    email: values.email,
    telefono: values.telefono || null,
    sexo: values.sexo || null,
    ...(values.password ? { password: values.password } : {}),
    salario: Number(values.salario),
    fechaContratacion: values.fechaContratacion,
    fechaFinalizacion: values.fechaFinalizacion || null,
    sucursalIds: values.sucursalIds,
  })
  return response.data.data
}
