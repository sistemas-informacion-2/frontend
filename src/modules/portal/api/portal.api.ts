import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { AuthResponse } from '@/modules/acceso/types'
import type { Plan, RegistroPayload, RegistroResponse, SlugDisponible, TiendaCreada, TiendaDeUsuario } from '../types'

export async function listarPlanes(): Promise<Plan[]> {
  return unwrap(await httpClient.get<Envelope<Plan[]>>('/plataforma/planes'))
}

export async function revisarSlug(slug: string): Promise<SlugDisponible> {
  return unwrap(await httpClient.get<Envelope<SlugDisponible>>('/plataforma/registro/slug-disponible', { params: { slug } }))
}

export async function registrarEmpresa(datos: RegistroPayload): Promise<RegistroResponse> {
  return unwrap(await httpClient.post<Envelope<RegistroResponse>>('/plataforma/registro', datos))
}

export async function confirmarRegistro(sessionId: string): Promise<TiendaCreada> {
  return unwrap(await httpClient.post<Envelope<TiendaCreada>>('/plataforma/registro/confirmar', { sessionId }))
}

/** Tiendas donde ese correo y esa contrasena del personal son validos. */
export async function tiendasDeUsuario(email: string, password: string): Promise<TiendaDeUsuario[]> {
  return unwrap(await httpClient.post<Envelope<TiendaDeUsuario[]>>('/plataforma/ingreso/tiendas', { email, password }))
}

/** Login normal de una tienda, desde el portal (que no esta dentro de ninguna): la tienda va en X-Empresa. */
export async function iniciarSesionEnTienda(slug: string, email: string, password: string): Promise<AuthResponse> {
  return unwrap(
    await httpClient.post<Envelope<AuthResponse>>('/acceso/auth/login', { email, password }, { headers: { 'X-Empresa': slug } }),
  )
}
