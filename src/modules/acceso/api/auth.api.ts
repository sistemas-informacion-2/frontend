import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { AuthResponse, Perfil } from '../types'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await httpClient.post<Envelope<AuthResponse>>('/acceso/auth/login', {
    email,
    password,
  })
  return unwrap(response)
}

export async function me(): Promise<Perfil> {
  const response = await httpClient.get<Envelope<Perfil>>('/acceso/auth/me')
  return unwrap(response)
}

export async function logout(refreshToken: string): Promise<void> {
  await httpClient.post('/acceso/auth/logout', { refreshToken })
}
