/**
 * RF-SYNC-01. Compras directas confirmadas sin conexion, guardadas en IndexedDB hasta que el servidor valida el stock y
 * el cliente paga. Lo usan la pagina y el Service Worker (sw.ts), asi que no depende de React ni del DOM: solo de
 * `indexedDB`, que existe en ambos contextos.
 *
 * La cola de reintentos en si (las peticiones HTTP pendientes) la guarda Workbox en su propia base
 * ("workbox-background-sync"); aqui vive lo que la interfaz necesita mostrar de cada compra.
 */

export type EstadoSincronizacion =
  /** Guardada en el navegador; se enviara sola cuando vuelva la red. */
  | 'COMPRA_PENDIENTE_SINCRONIZACION'
  /** Hay stock: falta que el cliente pague el total en el checkout. */
  | 'COMPRA_PENDIENTE_PAGO'
  /** Pagada: ya tiene su Nota de Venta. */
  | 'COMPRA_COMPLETADA'
  /** 409: una prenda se agoto mientras el cliente estaba sin conexion. */
  | 'COMPRA_FALLIDA'
  /** Otro rechazo del servidor (sucursal inactiva, prenda retirada...). */
  | 'COMPRA_RECHAZADA'
  /** El token vencio mientras esperaba: hay que reenviarla con la sesion renovada. */
  | 'REQUIERE_SESION'

export type MetodoPagoCompra = 'QR' | 'STRIPE' | 'TARJETA'

export interface DetalleCompraOffline {
  id_variante: number
  cantidad: number
  precio_unitario: number
  /** Solo para mostrarlo sin conexion ("Polera (M/Negro)"). */
  descripcion: string
}

export interface ItemSinStock {
  id_variante: number
  stock_solicitado: number
  stock_actual: number
}

/** Objeto guardado en IndexedDB. No incluye datos de pago: sin red no se cobra nada. */
export interface PedidoOffline {
  id_local_offline: string
  tipo_transaccion: 'COMPRA_DIRECTA'
  id_sucursal: number
  id_cliente: number
  /** Con que quiere pagar al volver la red; null si no se conocian los metodos disponibles. */
  metodo_pago: MetodoPagoCompra | null
  detalles: DetalleCompraOffline[]
  estado_sincronizacion: EstadoSincronizacion
  fecha_creacion: string
  sucursal_nombre: string
  total: number
  fecha_actualizacion: string
  mensaje_error?: string | null
  codigo_error?: string | null
  items_afectados?: ItemSinStock[]
  /** Total vigente que validó el servidor. */
  monto_por_pagar?: number | null
  precios_actualizados?: boolean
  codigo_nota?: string | null
}

/** Mensaje que el Service Worker manda a las pestanas abiertas cuando cambia el estado de un pedido. */
export const MENSAJE_PEDIDO_ACTUALIZADO = 'PEDIDO_OFFLINE_ACTUALIZADO'
/** Mensaje que la pagina manda al Service Worker para que procese la cola ya (navegadores sin Background Sync). */
export const MENSAJE_SINCRONIZAR = 'SINCRONIZAR_PEDIDOS_OFFLINE'
export const NOMBRE_COLA = 'cola-compras-offline'
export const RUTA_SYNC = '/api/electronico/checkout/sync'

const NOMBRE_DB = 'fashionstore-offline'
const VERSION_DB = 2
const STORE_PEDIDOS = 'pedidos'
const STORE_META = 'meta'

const CLAVE_PEDIDO = 'id_local_offline'

let conexion: Promise<IDBDatabase> | null = null

/** Version 1: los pedidos se guardaban para volverse reservas. Los que aun no se enviaron pasan a ser compras. */
function migrarPedidos(db: IDBDatabase, transaccion: IDBTransaction): void {
  const viejos = transaccion.objectStore(STORE_PEDIDOS).getAll()
  viejos.onsuccess = () => {
    db.deleteObjectStore(STORE_PEDIDOS)
    const store = db.createObjectStore(STORE_PEDIDOS, { keyPath: CLAVE_PEDIDO })
    const estados: Record<string, EstadoSincronizacion> = {
      PENDIENTE_ENVIO: 'COMPRA_PENDIENTE_SINCRONIZACION',
      REQUIERE_SESION: 'REQUIERE_SESION',
      RECHAZADO_POR_STOCK: 'COMPRA_FALLIDA',
      RECHAZADO: 'COMPRA_RECHAZADA',
    }
    for (const viejo of viejos.result as Array<Record<string, unknown>>) {
      const estado = estados[String(viejo.estado_sincronizacion)]
      if (!estado) continue // SINCRONIZADO: ya es una reserva en el servidor
      const { id_local: idLocal, ...resto } = viejo
      delete resto.reserva
      store.put({ ...resto, id_local_offline: idLocal, tipo_transaccion: 'COMPRA_DIRECTA', metodo_pago: null, estado_sincronizacion: estado })
    }
  }
}

function abrir(): Promise<IDBDatabase> {
  conexion ??= new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(NOMBRE_DB, VERSION_DB)
    solicitud.onupgradeneeded = () => {
      const db = solicitud.result
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META)
      if (!db.objectStoreNames.contains(STORE_PEDIDOS)) {
        db.createObjectStore(STORE_PEDIDOS, { keyPath: CLAVE_PEDIDO })
        return
      }
      if (solicitud.transaction?.objectStore(STORE_PEDIDOS).keyPath === 'id_local') migrarPedidos(db, solicitud.transaction)
    }
    solicitud.onsuccess = () => resolve(solicitud.result)
    solicitud.onerror = () => {
      conexion = null
      reject(solicitud.error)
    }
  })
  return conexion
}

async function operar<T>(store: string, modo: IDBTransactionMode, accion: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir()
  return new Promise<T>((resolve, reject) => {
    const transaccion = db.transaction(store, modo)
    const solicitud = accion(transaccion.objectStore(store))
    transaccion.oncomplete = () => resolve(solicitud.result)
    transaccion.onerror = () => reject(transaccion.error)
    transaccion.onabort = () => reject(transaccion.error)
  })
}

export function guardarPedido(pedido: PedidoOffline): Promise<IDBValidKey> {
  return operar(STORE_PEDIDOS, 'readwrite', (store) => store.put(pedido))
}

export function obtenerPedido(idLocal: string): Promise<PedidoOffline | undefined> {
  return operar<PedidoOffline | undefined>(STORE_PEDIDOS, 'readonly', (store) => store.get(idLocal))
}

export async function listarPedidos(): Promise<PedidoOffline[]> {
  const pedidos = await operar<PedidoOffline[]>(STORE_PEDIDOS, 'readonly', (store) => store.getAll())
  return pedidos.sort((a, b) => a.fecha_creacion.localeCompare(b.fecha_creacion))
}

export async function actualizarPedido(idLocal: string, cambios: Partial<PedidoOffline>): Promise<PedidoOffline | undefined> {
  const actual = await obtenerPedido(idLocal)
  if (!actual) return undefined
  const actualizado: PedidoOffline = { ...actual, ...cambios, id_local_offline: idLocal, fecha_actualizacion: new Date().toISOString() }
  await guardarPedido(actualizado)
  return actualizado
}

export function eliminarPedido(idLocal: string): Promise<undefined> {
  return operar(STORE_PEDIDOS, 'readwrite', (store) => store.delete(idLocal))
}

/** Sesion vigente que la pagina comparte con el Service Worker (que no puede leer localStorage). */
export interface SesionCompartida {
  accessToken: string | null
  idUsuario: number | null
}

export function guardarSesionCompartida(sesion: SesionCompartida): Promise<IDBValidKey> {
  return operar(STORE_META, 'readwrite', (store) => store.put(sesion, 'sesion'))
}

export async function leerSesionCompartida(): Promise<SesionCompartida | undefined> {
  return operar<SesionCompartida | undefined>(STORE_META, 'readonly', (store) => store.get('sesion'))
}

/**
 * Traduce la respuesta del servidor a POST /electronico/checkout/sync en el nuevo estado de la compra. La usan
 * la pagina (axios) y el Service Worker (fetch), para que ambos lleguen siempre al mismo resultado.
 */
export function interpretarRespuestaSync(status: number, cuerpo: unknown): Partial<PedidoOffline> | null {
  const datos = (cuerpo ?? {}) as Record<string, unknown>
  if (status === 200 || status === 201) {
    const compra = (datos.data ?? {}) as Record<string, unknown>
    const completada = compra.estadoSincronizacion === 'COMPLETADA'
    return {
      estado_sincronizacion: completada ? 'COMPRA_COMPLETADA' : 'COMPRA_PENDIENTE_PAGO',
      mensaje_error: null,
      codigo_error: null,
      items_afectados: [],
      monto_por_pagar: typeof compra.montoTotal === 'number' ? compra.montoTotal : null,
      precios_actualizados: compra.preciosActualizados === true,
      codigo_nota: typeof compra.codigoNota === 'string' ? compra.codigoNota : null,
    }
  }
  // 202: el Service Worker la dejo en su cola porque no hubo red; sigue pendiente.
  if (status === 202) return { estado_sincronizacion: 'COMPRA_PENDIENTE_SINCRONIZACION' }
  if (status === 401) return { estado_sincronizacion: 'REQUIERE_SESION', mensaje_error: 'Tu sesion vencio; inicia sesion para enviar esta compra.' }

  // 5xx o 404 (servidor caido, reiniciando o todavia sin esta ruta): no es una respuesta sobre la compra, sino una
  // falla del servidor. Quien llama la deja pendiente y la reintenta; nunca se descarta por esto.
  if (status >= 500 || status === 404) return null

  const mensajes = datos.message
  const mensaje = (typeof datos.mensaje === 'string' && datos.mensaje) || (Array.isArray(mensajes) ? String(mensajes[0] ?? '') : typeof mensajes === 'string' ? mensajes : '')
  const codigoError = typeof datos.codigo_error === 'string' ? datos.codigo_error : null
  if (status === 409 && codigoError === 'COMPRA_RECHAZADA_STOCK_AGOTADO') {
    return {
      estado_sincronizacion: 'COMPRA_FALLIDA',
      mensaje_error: mensaje || 'Tu compra no pudo concretarse porque ya no hay stock suficiente.',
      codigo_error: codigoError,
      items_afectados: Array.isArray(datos.items_afectados) ? (datos.items_afectados as ItemSinStock[]) : [],
    }
  }
  return { estado_sincronizacion: 'COMPRA_RECHAZADA', mensaje_error: mensaje || 'El servidor rechazo la compra.', codigo_error: codigoError, items_afectados: [] }
}
