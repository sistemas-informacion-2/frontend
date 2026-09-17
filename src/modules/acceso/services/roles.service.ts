import { httpClient } from '@/core/http/httpClient'
import type {
  ActualizarRolPayload,
  CrearRolPayload,
  PermisoGrupo,
  Rol,
  RolResumen,
  RolesQuery,
} from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: RolesQuery = {}): string {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.activo !== undefined) params.set('activo', String(query.activo))
  const result = params.toString()
  return result ? `?${result}` : ''
}

export async function listarRoles(query: RolesQuery = {}): Promise<Rol[]> {
  const response = await httpClient.get<Envelope<Rol[]>>(`/acceso/roles${toQueryString(query)}`)
  return response.data.data
}

export async function listarRolesActivos(): Promise<RolResumen[]> {
  const roles = await listarRoles({ activo: true })
  return roles.map(({ id, nombre }) => ({ id, nombre }))
}

export async function obtenerRol(id: number): Promise<Rol> {
  const response = await httpClient.get<Envelope<Rol>>(`/acceso/roles/${id}`)
  return response.data.data
}

export async function crearRol(payload: CrearRolPayload): Promise<Rol> {
  const response = await httpClient.post<Envelope<Rol>>('/acceso/roles', payload)
  return response.data.data
}

export async function actualizarRol(id: number, payload: ActualizarRolPayload): Promise<Rol> {
  const response = await httpClient.put<Envelope<Rol>>(`/acceso/roles/${id}`, payload)
  return response.data.data
}

export async function desactivarRol(id: number): Promise<void> {
  await httpClient.delete(`/acceso/roles/${id}`)
}

export async function listarPermisosDeRol(id: number): Promise<Rol['permisos']> {
  const response = await httpClient.get<Envelope<Rol['permisos']>>(`/acceso/roles/${id}/permisos`)
  return response.data.data
}

export async function gestionarPermisos(id: number, permisos: number[]): Promise<Rol> {
  const response = await httpClient.post<Envelope<Rol>>(`/acceso/roles/${id}/permisos`, { permisos })
  return response.data.data
}

export async function listarPermisosAgrupados(): Promise<PermisoGrupo[]> {
  const response = await httpClient.get<Envelope<PermisoGrupo[]>>('/acceso/permisos')
  return response.data.data
}
