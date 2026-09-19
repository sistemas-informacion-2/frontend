import { httpClient } from '@/core/http/httpClient'
import type { ActualizarPerfilPayload, CambiarPasswordPayload, Perfil } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

export async function obtenerPerfil(): Promise<Perfil> {
  const response = await httpClient.get<Envelope<Perfil>>('/acceso/perfil')
  return response.data.data
}

export async function actualizarPerfil(payload: ActualizarPerfilPayload): Promise<Perfil> {
  const response = await httpClient.put<Envelope<Perfil>>('/acceso/perfil', payload)
  return response.data.data
}

export async function cambiarPassword(payload: CambiarPasswordPayload): Promise<void> {
  await httpClient.patch('/acceso/perfil/cambiar-password', payload)
}
