/// <reference lib="webworker" />
/**
 * Service Worker de FashionStore (vite-plugin-pwa en modo injectManifest). Ademas del cacheo de la PWA, implementa
 * RF-SYNC-01: las compras confirmadas sin conexion (POST /api/electronico/checkout/sync) se encolan con Workbox
 * Background Sync y se reenvian solos al volver la red, sin que el cliente tenga que hacer nada.
 *
 * Las reglas comparan `url.pathname` y no la URL completa: asi tambien aplican cuando la API vive en otro origen
 * (en desarrollo, localhost:3000 frente a localhost:5173). Un RegExp de Workbox sobre otro origen solo coincide si
 * empieza a coincidir desde el inicio de la URL, por eso las reglas anteriores no cacheaban nada en `npm run dev`.
 */
import { Queue } from 'workbox-background-sync'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'
import { CABECERA_DATO_FRESCO } from './core/offline/adminOfflineDb'
import {
  MENSAJE_PEDIDO_ACTUALIZADO,
  MENSAJE_SINCRONIZAR,
  NOMBRE_COLA,
  RUTA_SYNC,
  actualizarPedido,
  interpretarRespuestaSync,
  leerSesionCompartida,
  type EstadoSincronizacion,
} from './core/offline/pedidosOfflineDb'

declare let self: ServiceWorkerGlobalScope

// registerType 'autoUpdate': la version nueva toma el control sin esperar a que se cierren las pestanas.
self.skipWaiting()
clientsClaim()

// ---------------------------------------------------------------- app shell

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA: una navegacion sin match cae al index (como el try_files de nginx) para que React Router la resuelva offline.
// Nunca intercepta la API ni el retorno de Stripe. En dev el index puede no estar precacheado: entonces no aplica.
try {
  registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//, /^\/checkout\/stripe\//] }))
} catch {
  // Sin index precacheado (npm run dev): la navegacion va a la red como siempre.
}

// ---------------------------------------------------------------- RF-SYNC-01: cola de compras offline

interface EntradaCola {
  request: Request
  metadata?: { idLocal?: string; idCliente?: number }
}

const cola = new Queue(NOMBRE_COLA, {
  // Un pedido puede esperar hasta 7 dias sin red; despues Workbox lo descarta (sigue visible en IndexedDB).
  maxRetentionTime: 7 * 24 * 60,
  onSync: () => procesarCola(),
})

let procesando: Promise<void> | null = null

/** Reenvia la cola en orden. Un solo proceso a la vez: el evento `sync` y el mensaje de la pagina pueden coincidir. */
function procesarCola(): Promise<void> {
  procesando ??= vaciarCola().finally(() => {
    procesando = null
  })
  return procesando
}

async function vaciarCola(): Promise<void> {
  let entrada = (await cola.shiftRequest()) as EntradaCola | undefined
  while (entrada) {
    const idLocal = entrada.metadata?.idLocal
    let respuesta: Response
    try {
      respuesta = await fetch(await conSesionVigente(entrada))
    } catch (error) {
      // Sigue sin red: vuelve al frente de la cola y Workbox reintenta en el proximo `sync`.
      await cola.unshiftRequest(entrada)
      throw error
    }

    const cuerpo: unknown = await respuesta.json().catch(() => null)
    const cambios = interpretarRespuestaSync(respuesta.status, cuerpo)
    if (!cambios) {
      // 5xx: el servidor fallo de forma pasajera; se reintenta mas tarde sin perder el pedido.
      await cola.unshiftRequest(entrada)
      throw new Error(`El servidor respondio ${respuesta.status} al sincronizar ${idLocal ?? 'un pedido'}`)
    }
    if (idLocal) {
      await actualizarPedido(idLocal, cambios)
      await avisar(idLocal, cambios.estado_sincronizacion ?? 'COMPRA_PENDIENTE_SINCRONIZACION')
    }
    entrada = (await cola.shiftRequest()) as EntradaCola | undefined
  }
}

/**
 * El access token dura 15 minutos y el pedido pudo esperar horas: se reenvia con el token mas reciente que la
 * pagina compartio, pero solo si es de la misma persona que hizo el pedido (nunca a nombre de otra cuenta).
 * Si no hay uno valido, el servidor responde 401 y el pedido queda en REQUIERE_SESION para que la pagina lo
 * reenvie al renovar la sesion.
 */
async function conSesionVigente(entrada: EntradaCola): Promise<Request> {
  const sesion = await leerSesionCompartida().catch(() => undefined)
  if (!sesion?.accessToken || sesion.idUsuario !== entrada.metadata?.idCliente) return entrada.request
  const headers = new Headers(entrada.request.headers)
  headers.set('Authorization', `Bearer ${sesion.accessToken}`)
  return new Request(entrada.request, { headers })
}

async function avisar(idLocal: string, estado: EstadoSincronizacion): Promise<void> {
  const pestanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const pestana of pestanas) pestana.postMessage({ tipo: MENSAJE_PEDIDO_ACTUALIZADO, id_local: idLocal, estado })
}

/**
 * Intenta enviar el pedido; si no hay red lo encola y responde 202 para que la pagina muestre "Pedido guardado
 * localmente" en vez de un error de red (criterio 1).
 */
registerRoute(
  ({ url }) => url.pathname === RUTA_SYNC,
  async ({ request }) => {
    const cuerpo = (await request.clone().json().catch(() => null)) as { idLocal?: string } | null
    const copia = request.clone()
    try {
      return await fetch(request)
    } catch {
      const sesion = await leerSesionCompartida().catch(() => undefined)
      await cola.pushRequest({ request: copia, metadata: { idLocal: cuerpo?.idLocal, idCliente: sesion?.idUsuario ?? undefined } })
      return new Response(JSON.stringify({ data: { idLocal: cuerpo?.idLocal, estadoSincronizacion: 'COMPRA_PENDIENTE_SINCRONIZACION', encolado: true } }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
  'POST',
)

// Navegadores sin Background Sync (Firefox, Safari): la pagina avisa al volver la red y la cola se procesa aqui.
self.addEventListener('message', (event) => {
  if ((event.data as { tipo?: string } | null)?.tipo === MENSAJE_SINCRONIZAR) event.waitUntil(procesarCola().catch(() => undefined))
})

// ---------------------------------------------------------------- cacheo en tiempo de ejecucion

// Pagos y checkout: jamas desde cache. Una venta no puede "funcionar offline" ni duplicarse con datos viejos.
registerRoute(({ url }) => url.pathname.startsWith('/api/electronico/checkout/'), new NetworkOnly())

// Sesion (login/refresh) y reportes con IA: siempre en vivo.
registerRoute(({ url }) => url.pathname.startsWith('/api/acceso/auth/') || url.pathname.startsWith('/api/reports/generativo'), new NetworkOnly())

// La comprobacion de conflictos necesita el dato real: una copia vieja haria creer que nadie mas lo cambio.
registerRoute(({ request }) => request.headers.has(CABECERA_DATO_FRESCO), new NetworkOnly())

// Catalogo, carrito, inventario...: red primero; sin conexion, la ultima respuesta buena (asi el checkout offline
// todavia conoce el carrito y las sucursales).
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 6,
    // 800 entradas: alcanza para el catalogo precargado y para las pantallas del panel por cada sucursal (usePrecargaAdmin).
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 800, maxAgeSeconds: 24 * 60 * 60 })],
  }),
)

// Imagenes de productos: cache primero, se revalidan en segundo plano.
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
)
