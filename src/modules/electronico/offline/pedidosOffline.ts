import { isAxiosError } from 'axios'
import { httpClient } from '@/core/http/httpClient'
import { useAuthStore } from '@/core/store/authStore'
import {
  MENSAJE_PEDIDO_ACTUALIZADO,
  MENSAJE_SINCRONIZAR,
  actualizarPedido,
  eliminarPedido,
  guardarPedido,
  guardarSesionCompartida,
  interpretarRespuestaSync,
  listarPedidos,
  type PedidoOffline,
} from '@/core/offline/pedidosOfflineDb'
import { mutate } from 'swr'
import type { Carrito } from '../types'
import { sincronizarCarritoLocal } from './carritoOffline'

/**
 * RF-SYNC-01, lado de la pagina. El Service Worker (src/sw.ts) encola y reenvia los pedidos aunque la pestana este
 * cerrada; esta parte cubre lo que el SW no puede hacer solo:
 *  - guardar el pedido en IndexedDB antes de intentar enviarlo,
 *  - compartirle el token vigente (el SW no puede leer localStorage),
 *  - reenviar con la sesion renovada los pedidos que volvieron con 401, y
 *  - reintentar al volver la red en navegadores sin Background Sync (Firefox, Safari) o cuando todavia no habia SW.
 * El backend es idempotente por `id_local`, asi que un pedido enviado a la vez por la pagina y el SW no se duplica.
 */

const INTERVALO_REINTENTO_MS = 30_000

/** Evento de ventana que avisa a la interfaz que cambio algun pedido offline. */
export const EVENTO_PEDIDOS_OFFLINE = 'fashionstore:pedidos-offline'

function avisarCambio(): void {
  window.dispatchEvent(new Event(EVENTO_PEDIDOS_OFFLINE))
}

function nuevoIdLocal(): string {
  return `off_${Date.now()}${Math.random().toString(36).slice(2, 8)}`
}

/** Pedido armado con el carrito que ya estaba cargado (memoria o cache del SW), listo para enviarse. */
export async function crearPedidoOffline(carrito: Carrito, idSucursal: number, sucursalNombre: string, idCliente: number): Promise<PedidoOffline> {
  const ahora = new Date().toISOString()
  const pedido: PedidoOffline = {
    id_local: nuevoIdLocal(),
    id_sucursal: idSucursal,
    id_cliente: idCliente,
    detalles: carrito.items.map((item) => ({
      id_variante: item.idVarianteProducto,
      cantidad: item.cantidad,
      precio_unitario: item.precioUnitario,
      descripcion: `${item.productoNombre} (${item.talla}/${item.color})`,
    })),
    estado_sincronizacion: 'PENDIENTE_ENVIO',
    fecha_creacion: ahora,
    fecha_actualizacion: ahora,
    sucursal_nombre: sucursalNombre,
    total: carrito.total,
    mensaje_error: null,
    items_afectados: [],
    reserva: null,
  }
  await guardarPedido(pedido)
  avisarCambio()
  return pedido
}

/** Envia el pedido y deja en IndexedDB el estado que corresponda a la respuesta (o PENDIENTE_ENVIO si no hubo red). */
export async function enviarPedido(pedido: PedidoOffline): Promise<PedidoOffline> {
  let cambios: Partial<PedidoOffline> | null
  try {
    const respuesta = await httpClient.post('/electronico/checkout/sync', {
      idLocal: pedido.id_local,
      idSucursal: pedido.id_sucursal,
      detalles: pedido.detalles.map((detalle) => ({ idVariante: detalle.id_variante, cantidad: detalle.cantidad, precioUnitario: detalle.precio_unitario })),
      fechaCreacion: pedido.fecha_creacion,
    })
    cambios = interpretarRespuestaSync(respuesta.status, respuesta.data)
  } catch (error) {
    // Sin respuesta (sin red y sin SW que lo encole): sigue pendiente y se reintenta al volver la red.
    cambios = isAxiosError(error) && error.response ? interpretarRespuestaSync(error.response.status, error.response.data) : { estado_sincronizacion: 'PENDIENTE_ENVIO' }
  }
  const actualizado = await actualizarPedido(pedido.id_local, cambios ?? { estado_sincronizacion: 'PENDIENTE_ENVIO', mensaje_error: 'El servidor no respondio; se reintentara solo.' })
  avisarCambio()
  return actualizado ?? pedido
}

let sincronizando = false

/** Reenvia los pedidos del cliente actual que siguen pendientes o que esperaban una sesion valida. */
export async function sincronizarPendientes(): Promise<void> {
  if (sincronizando || !navigator.onLine) return
  const perfil = useAuthStore.getState().perfil
  if (!perfil || perfil.tipoUsuario !== 'C') return

  sincronizando = true
  try {
    navigator.serviceWorker?.controller?.postMessage({ tipo: MENSAJE_SINCRONIZAR })
    const pendientes = (await listarPedidos()).filter(
      (pedido) => pedido.id_cliente === perfil.id && (pedido.estado_sincronizacion === 'PENDIENTE_ENVIO' || pedido.estado_sincronizacion === 'REQUIERE_SESION'),
    )
    for (const pedido of pendientes) await enviarPedido(pedido)
  } finally {
    sincronizando = false
  }
}

/** Resolucion del 409 por stock: reintenta el mismo pedido retirando en otra sucursal. */
export function cambiarSucursalPedido(idLocal: string, idSucursal: number, sucursalNombre: string): Promise<PedidoOffline | undefined> {
  return reintentarPedido(idLocal, { id_sucursal: idSucursal, sucursal_nombre: sucursalNombre })
}

/** Vuelve a enviar un pedido rechazado (p. ej. despues de cancelar otra reserva para liberar el limite). */
export async function reintentarPedido(idLocal: string, cambios: Partial<PedidoOffline> = {}): Promise<PedidoOffline | undefined> {
  const pedido = await actualizarPedido(idLocal, {
    ...cambios,
    estado_sincronizacion: 'PENDIENTE_ENVIO',
    mensaje_error: null,
    codigo_error: null,
    items_afectados: [],
  })
  avisarCambio()
  return pedido ? enviarPedido(pedido) : undefined
}

/** Cancela un pedido que no se pudo registrar (no se cobro nada) o descarta uno ya convertido en reserva. */
export async function quitarPedido(idLocal: string): Promise<void> {
  await eliminarPedido(idLocal)
  avisarCambio()
}

/** Se llama una vez al arrancar la app (main.tsx). */
export function iniciarSincronizacionOffline(): void {
  if (typeof indexedDB === 'undefined') return

  // El SW reenvia la cola con el token mas reciente, siempre que sea de la misma persona que hizo el pedido.
  const compartirSesion = () => {
    const { accessToken, perfil } = useAuthStore.getState()
    void guardarSesionCompartida({ accessToken, idUsuario: perfil?.id ?? null }).catch(() => undefined)
  }
  compartirSesion()
  let sesionAnterior = useAuthStore.getState().accessToken
  useAuthStore.subscribe((estado) => {
    if (estado.accessToken === sesionAnterior) return
    const recienIniciada = sesionAnterior === null && estado.accessToken !== null
    sesionAnterior = estado.accessToken
    compartirSesion()
    // Al iniciar sesion de nuevo se reenvian los pedidos que habian vuelto con 401.
    if (recienIniciada) void sincronizarPendientes()
  })

  window.addEventListener('online', () => void sincronizarPendientes())
  // Si el navegador nunca creyo estar sin red (wifi sin internet, adaptadores virtuales, servidor caido) no llega
  // ningun evento `online`: mientras haya pedidos pendientes se reintenta cada tanto.
  window.setInterval(() => {
    void sincronizarCarritoLocal().then((cambio) => {
      if (cambio) void mutate('electronico/carrito')
    })
    void listarPedidos()
      .then((pedidos) => {
        if (pedidos.some((pedido) => pedido.estado_sincronizacion === 'PENDIENTE_ENVIO')) void sincronizarPendientes()
      })
      .catch(() => undefined)
  }, INTERVALO_REINTENTO_MS)
  navigator.serviceWorker?.addEventListener('message', (event: MessageEvent) => {
    if ((event.data as { tipo?: string } | null)?.tipo === MENSAJE_PEDIDO_ACTUALIZADO) avisarCambio()
  })

  // Pedidos que quedaron pendientes de una visita anterior.
  void sincronizarPendientes()
}
