import { httpClient } from '@/core/http/httpClient'
import type { AuthResponse, Perfil } from './types'

interface Envelope<T> {
  data: T
  timestamp: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await httpClient.post<Envelope<AuthResponse>>('/acceso/auth/login', {
    email,
    password,
  })
  return response.data.data
}

export async function me(): Promise<Perfil> {
  const response = await httpClient.get<Envelope<Perfil>>('/acceso/auth/me')
  return response.data.data
}

export async function logout(refreshToken: string): Promise<void> {
  await httpClient.post('/acceso/auth/logout', { refreshToken })
}
