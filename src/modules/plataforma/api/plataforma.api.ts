import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { AuthResponse } from '@/modules/acceso/types'
import type { ActualizarEmpresaPayload, CambiarPlanPayload, CrearEmpresaPayload, Empresa, EstadoEmpresa } from '../types'

export async function loginPlataforma(email: string, password: string): Promise<AuthResponse> {
  return unwrap(await httpClient.post<Envelope<AuthResponse>>('/plataforma/auth/login', { email, password }))
}

export async function listarEmpresas(): Promise<Empresa[]> {
  return unwrap(await httpClient.get<Envelope<Empresa[]>>('/plataforma/empresas'))
}

export async function crearEmpresa(datos: CrearEmpresaPayload): Promise<Empresa> {
  return unwrap(await httpClient.post<Envelope<Empresa>>('/plataforma/empresas', datos))
}

export async function actualizarEmpresa(id: number, datos: ActualizarEmpresaPayload): Promise<Empresa> {
  return unwrap(await httpClient.patch<Envelope<Empresa>>(`/plataforma/empresas/${id}`, datos))
}

export async function cambiarEstadoEmpresa(id: number, estado: EstadoEmpresa): Promise<Empresa> {
  return unwrap(await httpClient.patch<Envelope<Empresa>>(`/plataforma/empresas/${id}/estado`, { estado }))
}

export async function cambiarPlanEmpresa(id: number, datos: CambiarPlanPayload): Promise<Empresa> {
  return unwrap(await httpClient.patch<Envelope<Empresa>>(`/plataforma/empresas/${id}/plan`, datos))
}
