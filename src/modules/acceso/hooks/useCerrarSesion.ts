import { useNavigate } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { limpiarSelecciones } from '@/shared/utils/seleccionProducto'
import { logout as logoutRequest } from '../api'

/**
 * Cierra la sesión: revoca el refresh token en el servidor (aunque falle, la sesión local se cierra),
 * limpia el estado y descarta la caché de SWR para que la siguiente persona no vea datos del carrito
 * o las reservas de la anterior. El catálogo público se conserva: borrarlo lo dejaría vacío hasta recargar.
 */
const CLAVES_PUBLICAS = ['inventario/categorias', 'inventario/productos', 'electronico/producto', 'electronico/relacionados', 'electronico/sucursales', 'electronico/temporadas']

const esClavePrivada = (clave: unknown): boolean => {
  const raiz = Array.isArray(clave) ? clave[0] : clave
  return !(typeof raiz === 'string' && CLAVES_PUBLICAS.includes(raiz))
}

export function useCerrarSesion() {
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const clear = useAuthStore((state) => state.clear)
  const navigate = useNavigate()
  const { mutate } = useSWRConfig()

  return async (destino: string) => {
    if (refreshToken) await logoutRequest(refreshToken).catch(() => undefined)
    clear()
    limpiarSelecciones()
    await mutate(esClavePrivada, undefined, { revalidate: false })
    navigate(destino, { replace: true })
  }
}
