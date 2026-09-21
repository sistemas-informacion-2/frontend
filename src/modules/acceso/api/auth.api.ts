import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { AuthResponse, Perfil, RegistroClientePayload } from '../types'

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

/** Autoregistro de un cliente. La respuesta ya trae la sesión iniciada, igual que el login. */
export async function registrarCliente(datos: RegistroClientePayload): Promise<AuthResponse> {
  return unwrap(await httpClient.post<Envelope<AuthResponse>>('/acceso/auth/registro', datos))
}
