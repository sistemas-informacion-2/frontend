/** IndexedDB del panel sin conexion: cambios por enviar y ultimos resultados de reportes. Separada de la de pedidos, que tambien usa el Service Worker. */
const NOMBRE_DB = 'fashionstore-admin-offline'
const VERSION_DB = 2
export const ALMACEN_ESCRITURAS = 'escrituras'
export const ALMACEN_REPORTES = 'reportes'
const ALMACEN_CLAVES = 'claves'
/** Una lectura con esta cabecera siempre va a la red: el Service Worker no responde con su copia. */
export const CABECERA_DATO_FRESCO = 'x-dato-fresco'

let conexion: Promise<IDBDatabase> | null = null

function abrir(): Promise<IDBDatabase> {
  conexion ??= new Promise((resolve, reject) => {
    const peticion = indexedDB.open(NOMBRE_DB, VERSION_DB)
    peticion.onupgradeneeded = () => {
      const db = peticion.result
      if (!db.objectStoreNames.contains(ALMACEN_ESCRITURAS)) db.createObjectStore(ALMACEN_ESCRITURAS, { keyPath: 'idLocal' })
      if (!db.objectStoreNames.contains(ALMACEN_REPORTES)) db.createObjectStore(ALMACEN_REPORTES, { keyPath: 'clave' })
      if (!db.objectStoreNames.contains(ALMACEN_CLAVES)) db.createObjectStore(ALMACEN_CLAVES, { keyPath: 'nombre' })
    }
    peticion.onsuccess = () => resolve(peticion.result)
    peticion.onerror = () => {
      conexion = null
      reject(peticion.error ?? new Error('No se pudo abrir la base local'))
    }
  })
  return conexion
}

async function operar<T>(almacen: string, modo: IDBTransactionMode, accion: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await abrir()
  return new Promise((resolve, reject) => {
    const transaccion = db.transaction(almacen, modo)
    const peticion = accion(transaccion.objectStore(almacen))
    transaccion.oncomplete = () => resolve(peticion.result as T)
    transaccion.onerror = () => reject(transaccion.error ?? new Error('No se pudo escribir en la base local'))
    transaccion.onabort = () => reject(transaccion.error ?? new Error('Se cancelo la escritura en la base local'))
  })
}

export const leerTodo = <T>(almacen: string) => operar<T[]>(almacen, 'readonly', (store) => store.getAll())
export const leerUno = <T>(almacen: string, clave: string) => operar<T | undefined>(almacen, 'readonly', (store) => store.get(clave))
export const guardar = (almacen: string, valor: object) => operar<IDBValidKey>(almacen, 'readwrite', (store) => store.put(valor))
export const borrar = (almacen: string, clave: string) => operar<undefined>(almacen, 'readwrite', (store) => store.delete(clave))
export const vaciar = (almacen: string) => operar<undefined>(almacen, 'readwrite', (store) => store.clear())

// --------------------------------------------------------------- datos sensibles

export interface DatoCifrado {
  iv: Uint8Array<ArrayBuffer>
  datos: ArrayBuffer
}

/** Clave no extraible: el navegador la usa para cifrar y descifrar, pero nadie puede leerla ni copiarla del dispositivo. */
async function claveDeCifrado(): Promise<CryptoKey> {
  const guardada = await leerUno<{ nombre: string; clave: CryptoKey }>(ALMACEN_CLAVES, 'escrituras')
  if (guardada) return guardada.clave
  const clave = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  await guardar(ALMACEN_CLAVES, { nombre: 'escrituras', clave })
  return clave
}

/** Contrasenas y llaves de pago esperan cifradas hasta enviarse; despues se borran con el cambio. */
export async function cifrar(valores: Record<string, unknown>): Promise<DatoCifrado> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const datos = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await claveDeCifrado(), new TextEncoder().encode(JSON.stringify(valores)))
  return { iv, datos }
}

export async function descifrar(cifrado: DatoCifrado): Promise<Record<string, unknown>> {
  const datos = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: cifrado.iv }, await claveDeCifrado(), cifrado.datos)
  return JSON.parse(new TextDecoder().decode(datos)) as Record<string, unknown>
}
