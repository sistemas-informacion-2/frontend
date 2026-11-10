import type { AuthResponse } from '@/modules/acceso/types'
import { claveDeTienda } from './tienda'

/**
 * Deja iniciada la sesion de una tienda desde fuera de ella (el portal de DOMINATR), escribiendola donde la lee
 * useAuthStore dentro de esa tienda: la misma clave y el mismo formato que usa el middleware `persist` de zustand
 * (version 0). Despues basta con abrir /t/:slug/admin y la tienda ya entra con la sesion.
 */
export function guardarSesionDeTienda(slug: string, auth: AuthResponse): void {
  const estado = {
    state: { accessToken: auth.accessToken, refreshToken: auth.refreshToken, perfil: auth.perfil, isAuthenticated: true },
    version: 0,
  }
  try {
    window.localStorage.setItem(claveDeTienda(slug, 'auth'), JSON.stringify(estado))
  } catch {
    // Sin almacenamiento (modo privado estricto): la tienda pedira iniciar sesion otra vez.
  }
}
