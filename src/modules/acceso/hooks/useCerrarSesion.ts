import { useNavigate } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { ALMACEN_REPORTES, vaciar } from '@/core/offline/adminOfflineDb'
import { useAuthStore } from '@/core/store/authStore'
import { limpiarSelecciones } from '@/shared/utils/seleccionProducto'
import { desvincularWebPush } from '@/modules/electronico/services/webPush.service'
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
    await desvincularWebPush().catch(() => undefined)
    if (refreshToken) await logoutRequest(refreshToken).catch(() => undefined)
    clear()
    limpiarSelecciones()
    await mutate(esClavePrivada, undefined, { revalidate: false })
    // La cache de la API del Service Worker guarda por URL, no por usuario: sin borrarla, quien entre despues en
    // este navegador podria ver sin conexion el carrito o las reservas de la persona anterior.
    if ('caches' in window) await caches.delete('api-cache').catch(() => false)
    // Igual con los reportes guardados. Los cambios sin enviar se conservan: son de esta cuenta y no se muestran a otra.
    await vaciar(ALMACEN_REPORTES).catch(() => undefined)
    navigate(destino, { replace: true })
  }
}
