import { httpClient } from '@/core/http/httpClient'
import type {
  EstadoAcceso,
  TipoUsuario,
  Usuario,
  UsuarioFormValues,
  UsuariosPaginatedResponse,
  UsuariosQuery,
} from '../types'
import { listarRolesActivos } from './roles.service'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: UsuariosQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  })

  if (query.search) params.set('search', query.search)
  if (query.tipoUsuario) params.set('tipoUsuario', query.tipoUsuario)
  if (query.estadoAcceso) params.set('estadoAcceso', query.estadoAcceso)
  if (query.activo !== undefined) params.set('activo', String(query.activo))

  return params.toString()
}

export async function listarUsuarios(query: UsuariosQuery): Promise<UsuariosPaginatedResponse> {
  const response = await httpClient.get<Envelope<UsuariosPaginatedResponse>>(
    `/acceso/usuarios?${toQueryString(query)}`,
  )
  return response.data.data
}

export const listarRoles = listarRolesActivos

export async function crearUsuario(values: UsuarioFormValues): Promise<Usuario> {
  const response = await httpClient.post<Envelope<Usuario>>('/acceso/usuarios', {
    nombre: values.nombre,
    apellido: values.apellido,
    email: values.email,
    telefono: values.telefono || undefined,
    sexo: values.sexo || undefined,
    password: values.password,
    tipoUsuario: values.tipoUsuario,
    estadoAcceso: values.estadoAcceso,
    roles: values.roles,
  })
  return response.data.data
}

export async function actualizarUsuario(id: number, values: UsuarioFormValues): Promise<Usuario> {
  const response = await httpClient.put<Envelope<Usuario>>(`/acceso/usuarios/${id}`, {
    nombre: values.nombre,
    apellido: values.apellido,
    email: values.email,
    telefono: values.telefono || null,
    sexo: values.sexo || null,
    ...(values.password ? { password: values.password } : {}),
    tipoUsuario: values.tipoUsuario,
    estadoAcceso: values.estadoAcceso,
  })

  await asignarRoles(id, values.roles)
  return response.data.data
}

export async function asignarRoles(id: number, roles: number[]): Promise<Usuario> {
  const response = await httpClient.post<Envelope<Usuario>>(`/acceso/usuarios/${id}/roles`, { roles })
  return response.data.data
}

export async function desactivarUsuario(id: number): Promise<void> {
  await httpClient.delete(`/acceso/usuarios/${id}`)
}

export const TIPO_USUARIO_LABEL: Record<TipoUsuario, string> = {
  A: 'Administrador',
  E: 'Empleado',
  C: 'Cliente',
}

export const ESTADO_ACCESO_LABEL: Record<EstadoAcceso, string> = {
  HABILITADO: 'Habilitado',
  BLOQUEADO: 'Bloqueado',
  SUSPENDIDO: 'Suspendido',
}
