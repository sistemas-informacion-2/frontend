/**
 * RF-SYNC-01. Pedidos confirmados sin conexion, guardados en IndexedDB hasta que el servidor los acepta o los
 * rechaza. Lo usan la pagina y el Service Worker (sw.ts), asi que no depende de React ni del DOM: solo de
 * `indexedDB`, que existe en ambos contextos.
 *
 * La cola de reintentos en si (las peticiones HTTP pendientes) la guarda Workbox en su propia base
 * ("workbox-background-sync"); aqui vive lo que la interfaz necesita mostrar de cada pedido.
 */

export type EstadoSincronizacion =
  /** Guardado en el navegador; se enviara solo cuando vuelva la red. */
  | 'PENDIENTE_ENVIO'
  /** El servidor lo acepto y lo convirtio en una reserva. */
  | 'SINCRONIZADO'
  /** 409 STOCK_AGOTADO_COLISION: el stock se agoto mientras el cliente estaba sin conexion. */
  | 'RECHAZADO_POR_STOCK'
  /** Otro rechazo del servidor (sucursal inactiva, limite de reservas...). */
  | 'RECHAZADO'
  /** El token vencio mientras esperaba: hay que reenviarlo con la sesion renovada. */
  | 'REQUIERE_SESION'

export interface DetallePedidoOffline {
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

export interface ReservaSincronizada {
  id: number
  codigo_reserva: string
  monto_total: number
  monto_anticipo: number
  fecha_limite: string
}

/** Objeto guardado en IndexedDB (contrato A de RF-SYNC-01, mas lo que la interfaz necesita mostrar). */
export interface PedidoOffline {
  id_local: string
  id_sucursal: number
  id_cliente: number
  detalles: DetallePedidoOffline[]
  estado_sincronizacion: EstadoSincronizacion
  fecha_creacion: string
  sucursal_nombre: string
  total: number
  fecha_actualizacion: string
  mensaje_error?: string | null
  /** codigo_error del 409 (STOCK_AGOTADO_COLISION, LIMITE_RESERVAS...) para ofrecer la salida adecuada. */
  codigo_error?: string | null
  items_afectados?: ItemSinStock[]
  reserva?: ReservaSincronizada | null
}

/** Mensaje que el Service Worker manda a las pestanas abiertas cuando cambia el estado de un pedido. */
export const MENSAJE_PEDIDO_ACTUALIZADO = 'PEDIDO_OFFLINE_ACTUALIZADO'
/** Mensaje que la pagina manda al Service Worker para que procese la cola ya (navegadores sin Background Sync). */
export const MENSAJE_SINCRONIZAR = 'SINCRONIZAR_PEDIDOS_OFFLINE'
export const NOMBRE_COLA = 'cola-compras-offline'
export const RUTA_SYNC = '/api/electronico/checkout/sync'

const NOMBRE_DB = 'fashionstore-offline'
const VERSION_DB = 1
const STORE_PEDIDOS = 'pedidos'
const STORE_META = 'meta'

let conexion: Promise<IDBDatabase> | null = null

function abrir(): Promise<IDBDatabase> {
  conexion ??= new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(NOMBRE_DB, VERSION_DB)
    solicitud.onupgradeneeded = () => {
      const db = solicitud.result
      if (!db.objectStoreNames.contains(STORE_PEDIDOS)) db.createObjectStore(STORE_PEDIDOS, { keyPath: 'id_local' })
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META)
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
  const actualizado: PedidoOffline = { ...actual, ...cambios, id_local: idLocal, fecha_actualizacion: new Date().toISOString() }
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
 * Traduce la respuesta del servidor a POST /electronico/checkout/sync en el nuevo estado del pedido. La usan
 * la pagina (axios) y el Service Worker (fetch), para que ambos lleguen siempre al mismo resultado.
 */
export function interpretarRespuestaSync(status: number, cuerpo: unknown): Partial<PedidoOffline> | null {
  const datos = (cuerpo ?? {}) as Record<string, unknown>
  if (status === 200 || status === 201) {
    const reserva = ((datos.data as Record<string, unknown> | undefined)?.reserva ?? null) as Record<string, unknown> | null
    return {
      estado_sincronizacion: 'SINCRONIZADO',
      mensaje_error: null,
      codigo_error: null,
      items_afectados: [],
      reserva: reserva
        ? {
            id: Number(reserva.id),
            codigo_reserva: String(reserva.codigoReserva),
            monto_total: Number(reserva.montoTotal),
            monto_anticipo: Number(reserva.montoAnticipo),
            fecha_limite: String(reserva.fechaLimite),
          }
        : null,
    }
  }
  // 202: el Service Worker lo dejo en su cola porque no hubo red; sigue pendiente.
  if (status === 202) return { estado_sincronizacion: 'PENDIENTE_ENVIO' }
  if (status === 401) return { estado_sincronizacion: 'REQUIERE_SESION', mensaje_error: 'Tu sesion vencio; inicia sesion para enviar este pedido.' }

  // 5xx o 404 (servidor caido, reiniciando o todavia sin esta ruta): no es una respuesta sobre el pedido, sino una
  // falla del servidor. Quien llama lo deja pendiente y lo reintenta; nunca se descarta por esto.
  if (status >= 500 || status === 404) return null

  const mensajes = datos.message
  const mensaje = (typeof datos.mensaje === 'string' && datos.mensaje) || (Array.isArray(mensajes) ? String(mensajes[0] ?? '') : typeof mensajes === 'string' ? mensajes : '')
  const codigoError = typeof datos.codigo_error === 'string' ? datos.codigo_error : null
  if (status === 409 && codigoError === 'STOCK_AGOTADO_COLISION') {
    return {
      estado_sincronizacion: 'RECHAZADO_POR_STOCK',
      mensaje_error: mensaje || 'No hay stock suficiente para procesar la orden efectuada offline.',
      codigo_error: codigoError,
      items_afectados: Array.isArray(datos.items_afectados) ? (datos.items_afectados as ItemSinStock[]) : [],
    }
  }
  return { estado_sincronizacion: 'RECHAZADO', mensaje_error: mensaje || 'El servidor rechazo el pedido.', codigo_error: codigoError, items_afectados: [] }
}
