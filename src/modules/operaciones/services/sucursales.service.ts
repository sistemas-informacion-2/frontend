import { httpClient } from '@/core/http/httpClient'
import type { Ciudad, Departamento, Sucursal, SucursalFormValues } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

export async function listarSucursales(): Promise<Sucursal[]> {
  const response = await httpClient.get<Envelope<Sucursal[]>>('/operaciones/sucursales')
  return response.data.data
}

export async function listarCiudades(): Promise<Ciudad[]> {
  const response = await httpClient.get<Envelope<Ciudad[]>>('/operaciones/ciudades')
  return response.data.data
}

export async function listarDepartamentos(): Promise<Departamento[]> {
  const response = await httpClient.get<Envelope<Departamento[]>>('/operaciones/departamentos')
  return response.data.data
}

export async function crearCiudad(values: { idDepartamento: number; nombre: string }): Promise<Ciudad> {
  const response = await httpClient.post<Envelope<Ciudad>>('/operaciones/ciudades', values)
  return response.data.data
}

export async function crearSucursal(values: SucursalFormValues): Promise<Sucursal> {
  const response = await httpClient.post<Envelope<Sucursal>>('/operaciones/sucursales', {
    idCiudad: values.idCiudad,
    nombre: values.nombre,
    ubicacion: values.ubicacion,
    telefono: values.telefono || undefined,
    correo: values.correo || undefined,
    horarioApertura: values.horarioApertura || undefined,
    horarioCierre: values.horarioCierre || undefined,
  })
  return response.data.data
}

export async function actualizarSucursal(id: number, values: SucursalFormValues): Promise<Sucursal> {
  const response = await httpClient.put<Envelope<Sucursal>>(`/operaciones/sucursales/${id}`, {
    idCiudad: values.idCiudad,
    nombre: values.nombre,
    ubicacion: values.ubicacion,
    telefono: values.telefono || undefined,
    correo: values.correo || undefined,
    horarioApertura: values.horarioApertura || undefined,
    horarioCierre: values.horarioCierre || undefined,
    activo: values.activo,
  })
  return response.data.data
}
