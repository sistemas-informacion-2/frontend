import type { EstadoAcceso } from '@/modules/acceso/types'

export interface Cliente {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  sexo: string | null
  estadoAcceso: EstadoAcceso
  activo: boolean
  ciudadResidencia: string | null
  direccionPrincipal: string | null
  puntosFidelidad: number
}

export interface ClientesQuery {
  page: number
  limit: number
  search?: string
  activo?: boolean
}

export interface ClientesPaginatedResponse {
  items: Cliente[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ClienteFormValues {
  nombre: string
  apellido: string
  email: string
  telefono: string
  sexo: string
  password: string
  ciudadResidencia: string
  direccionPrincipal: string
}

export interface Empleado {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  sexo: string | null
  estadoAcceso: EstadoAcceso
  activo: boolean
  codigoEmpleado: string
  salario: number
  fechaContratacion: string
  fechaFinalizacion: string | null
}

export interface EmpleadosQuery {
  page: number
  limit: number
  search?: string
  activo?: boolean
}

export interface EmpleadosPaginatedResponse {
  items: Empleado[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface EmpleadoFormValues {
  nombre: string
  apellido: string
  email: string
  telefono: string
  sexo: string
  password: string
  salario: string
  fechaContratacion: string
  fechaFinalizacion: string
}
