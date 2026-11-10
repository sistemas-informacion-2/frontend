import { useNavigate } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { ALMACEN_REPORTES, borrar, leerTodo } from '@/core/offline/adminOfflineDb'
import { useAuthStore } from '@/core/store/authStore'
import { slugTienda } from '@/core/tenant/tienda'
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
    // Antes de clear(): despues ya no hay perfil para saber de quien son los reportes guardados.
    const idUsuario = useAuthStore.getState().perfil?.id ?? 0
    await desvincularWebPush().catch(() => undefined)
    if (refreshToken) await logoutRequest(refreshToken).catch(() => undefined)
    clear()
    limpiarSelecciones()
    await mutate(esClavePrivada, undefined, { revalidate: false })
    // La cache de la API del Service Worker guarda por URL, no por usuario: sin borrarla, quien entre despues en
    // este navegador podria ver sin conexion el carrito o las reservas de la persona anterior.
    await borrarCacheDeLaTienda().catch(() => undefined)
    // Igual con los reportes guardados. Los cambios sin enviar se conservan: son de esta cuenta y no se muestran a otra.
    await borrarReportesDe(idUsuario).catch(() => undefined)
    navigate(destino, { replace: true })
  }
}

/**
 * Solo la copia offline de esta tienda (el Service Worker marca cada entrada con `__tienda=<slug>`): las demas
 * tiendas abiertas en este navegador conservan la suya.
 */
async function borrarCacheDeLaTienda(): Promise<void> {
  if (!('caches' in window) || !slugTienda) return
  const cache = await caches.open('api-cache')
  const entradas = await cache.keys()
  await Promise.all(entradas.filter((entrada) => new URL(entrada.url).searchParams.get('__tienda') === slugTienda).map((entrada) => cache.delete(entrada)))
}

/** Solo los reportes de esta cuenta: su clave empieza con el id del usuario (ver reportes.service). */
async function borrarReportesDe(idUsuario: number): Promise<void> {
  const reportes = await leerTodo<{ clave: string }>(ALMACEN_REPORTES)
  await Promise.all(reportes.filter((reporte) => reporte.clave.startsWith(`${idUsuario}:`)).map((reporte) => borrar(ALMACEN_REPORTES, reporte.clave)))
}
