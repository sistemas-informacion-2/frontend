import type { EstadoAcceso } from '@/modules/acceso/types'

export interface Departamento {
  id: number
  nombre: string
}

export interface Ciudad {
  id: number
  nombre: string
  departamentoId: number
  departamentoNombre: string
}

export interface Sucursal {
  id: number
  nombre: string
  ubicacion: string
  telefono: string | null
  correo: string | null
  horarioApertura: string | null
  horarioCierre: string | null
  activo: boolean
  ciudadId: number
  ciudadNombre: string
  departamentoNombre: string
}

export interface SucursalFormValues {
  idCiudad: number | ''
  nombre: string
  ubicacion: string
  telefono: string
  correo: string
  horarioApertura: string
  horarioCierre: string
  activo: boolean
}

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
  meta: { page: number; limit: number; total: number; totalPages: number }
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

export interface SucursalAsignada {
  id: number
  nombre: string
  activo: boolean
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
  sucursales: SucursalAsignada[]
}

export interface EmpleadosQuery {
  page: number
  limit: number
  search?: string
  idSucursal?: number
  activo?: boolean
}

export interface EmpleadosPaginatedResponse {
  items: Empleado[]
  meta: { page: number; limit: number; total: number; totalPages: number }
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
  sucursalIds: number[]
}
