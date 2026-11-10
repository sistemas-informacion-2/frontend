import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { isAxiosError } from 'axios'
import { ALMACEN_ESCRITURAS, CABECERA_DATO_FRESCO, borrar, cifrar, descifrar, guardar, leerTodo, type DatoCifrado } from './adminOfflineDb'
import { reglaDe, REGLAS, rutaDe, type ContextoRegla, type Fila, type Metodo, type Regla } from './reglasOffline'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** La envia la cola: si falla no se vuelve a encolar. */
    _sinCola?: boolean
    /** Lectura del dato real del servidor, sin los cambios pendientes encima. */
    _sinCambiosPendientes?: boolean
  }
}

export type EstadoEscritura = 'PENDIENTE' | 'RECHAZADA' | 'CONFLICTO'

interface ArchivoOffline {
  campo: string
  nombre: string
  archivo: Blob
}

export interface EscrituraOffline {
  idLocal: string
  idUsuario: number
  metodo: Metodo
  url: string
  cuerpo: Fila | null
  descripcion: string
  creadaEn: string
  estado: EstadoEscritura
  /** Id provisional con el que la pantalla ve lo creado; la URL provisional, si es una imagen. */
  temporal?: number | string
  secreto?: DatoCifrado
  archivos?: ArchivoOffline[]
  mensaje?: string
  /** Como estaba el registro al editarlo sin conexion: permite saber si otra persona lo cambio despues. */
  base?: Fila
  camposEnConflicto?: string[]
  /** La persona ya vio el conflicto y decidio aplicar su cambio. */
  forzar?: boolean
}

const CAMPOS_SECRETOS = ['password', 'passwordActual', 'nuevaPassword', 'apiKey', 'apiSecret']
const ETIQUETAS = ['nombre', 'empresa', 'titulo', 'concepto', 'email', 'metodo']

// --------------------------------------------------------------- estado en memoria, al dia con IndexedDB

let escrituras: EscrituraOffline[] = []
const oyentes = new Set<() => void>()

function publicar(lista: EscrituraOffline[]) {
  escrituras = [...lista].sort((a, b) => a.creadaEn.localeCompare(b.creadaEn))
  oyentes.forEach((oyente) => oyente())
}

export function suscribirEscrituras(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export const obtenerEscrituras = () => escrituras

export async function cargarEscrituras(): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  publicar(await leerTodo<EscrituraOffline>(ALMACEN_ESCRITURAS))
}

async function actualizar(escritura: EscrituraOffline) {
  await guardar(ALMACEN_ESCRITURAS, escritura)
  publicar([...escrituras.filter((e) => e.idLocal !== escritura.idLocal), escritura])
}

async function quitar(idLocal: string) {
  await borrar(ALMACEN_ESCRITURAS, idLocal)
  publicar(escrituras.filter((e) => e.idLocal !== idLocal))
}

const refiereA = (escritura: EscrituraOffline, temporal: number | string) => {
  if (typeof temporal === 'number' && new RegExp(`/${temporal}(/|$)`).test(escritura.url)) return true
  return JSON.stringify(escritura.cuerpo ?? null).includes(typeof temporal === 'number' ? String(temporal) : JSON.stringify(temporal).slice(1, -1))
}

/** Descarta un cambio y lo que dependia de el: editar un registro que ya no se va a crear no tiene sentido. */
export async function descartarEscritura(idLocal: string) {
  const escritura = escrituras.find((e) => e.idLocal === idLocal)
  if (!escritura) return
  await quitar(idLocal)
  if (escritura.temporal === undefined) return
  for (const dependiente of escrituras.filter((e) => refiereA(e, escritura.temporal as number | string))) await descartarEscritura(dependiente.idLocal)
}

/** Vuelve a la cola una escritura rechazada o en conflicto. */
export async function reintentarEscritura(idLocal: string) {
  const escritura = escrituras.find((e) => e.idLocal === idLocal)
  if (!escritura) return
  await actualizar({ ...escritura, estado: 'PENDIENTE', mensaje: undefined, camposEnConflicto: undefined, forzar: escritura.estado === 'CONFLICTO' || escritura.forzar })
}

// --------------------------------------------------------------- lo visto del servidor

/** Ultima version de cada registro que llego del servidor. */
const registrosVistos = new Map<string, Fila>()

function reglaDeLectura(ruta: string): Regla | undefined {
  return REGLAS.filter((r) => ruta === r.coleccion || ruta.startsWith(`${r.coleccion}/`)).sort((a, b) => b.coleccion.length - a.coleccion.length)[0]
}

/** Un registro creado sin conexion tambien puede usarse en otro: su nombre sale de lo que se guardo al crearlo. */
function filaCreadaSinConexion(id: unknown): Fila | undefined {
  const creacion = escrituras.find((e) => e.temporal === id)
  return creacion && reglaDe(creacion.metodo, creacion.url)?.regla.fila?.(contexto(creacion))
}

function contexto(escritura: Pick<EscrituraOffline, 'cuerpo' | 'creadaEn' | 'temporal'>): ContextoRegla {
  return {
    cuerpo: escritura.cuerpo ?? {},
    idTemporal: typeof escritura.temporal === 'number' ? escritura.temporal : 0,
    ahora: escritura.creadaEn,
    buscar: (coleccion, id) => registrosVistos.get(`${coleccion}/${String(id)}`) ?? filaCreadaSinConexion(id),
    buscarVariante: (idVariante) => {
      for (const [clave, fila] of registrosVistos) if (clave.startsWith('/inventario/stock/') && fila.idVarianteProducto === idVariante) return fila
      return undefined
    },
  }
}

function registrosDe(datos: unknown): { registros: Fila[]; forma: 'lista' | 'paginada' | 'objeto' } | null {
  if (!datos || typeof datos !== 'object') return null
  if (Array.isArray(datos)) return { registros: datos as Fila[], forma: 'lista' }
  const items = (datos as { items?: unknown }).items
  return Array.isArray(items) ? { registros: items as Fila[], forma: 'paginada' } : { registros: [datos as Fila], forma: 'objeto' }
}

// --------------------------------------------------------------- encolar

let ultimoTemporal = 0

function nuevoTemporal(): number {
  ultimoTemporal = Math.max(Date.now(), ultimoTemporal + 1)
  return -ultimoTemporal
}

const leerComoDataUrl = (archivo: Blob) =>
  new Promise<string>((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result))
    lector.onerror = () => reject(lector.error ?? new Error('No se pudo leer el archivo'))
    lector.readAsDataURL(archivo)
  })

function descripcionDe(regla: Regla, cuerpo: Fila | null, base?: Fila): string {
  if (regla.patron === '/comercial/ventas') {
    const items = Array.isArray(cuerpo?.items) ? (cuerpo.items as { cantidad?: number }[]) : []
    const prendas = items.reduce((total, item) => total + Number(item.cantidad ?? 0), 0)
    return `${regla.texto}: ${prendas} ${prendas === 1 ? 'prenda' : 'prendas'}`
  }
  const etiqueta = ETIQUETAS.flatMap((campo) => [cuerpo?.[campo], base?.[campo]]).find((valor) => typeof valor === 'string' && valor)
  return `${regla.texto}${etiqueta ? `: ${String(etiqueta)}` : ''}`
}

/** Si esta escritura se puede enviar despues, la guarda y responde como si el servidor la hubiera aceptado. */
export async function encolarSiCorresponde(config: InternalAxiosRequestConfig, idUsuario: number | null): Promise<AxiosResponse | null> {
  const metodo = (config.method ?? 'get').toLowerCase()
  if (config._sinCola || idUsuario === null || !config.url) return null
  const destino = reglaDe(metodo, config.url)
  if (!destino) return null

  let cuerpo: Fila | null = null
  let archivos: ArchivoOffline[] | undefined
  if (config.data instanceof FormData) {
    archivos = [...config.data.entries()].flatMap(([campo, valor]) => (valor instanceof Blob ? [{ campo, nombre: valor instanceof File ? valor.name : 'archivo', archivo: valor }] : []))
  } else if (typeof config.data === 'string' && config.data) {
    cuerpo = JSON.parse(config.data) as Fila
  } else if (config.data !== undefined) {
    return null
  }

  const secretos = Object.fromEntries(Object.entries(cuerpo ?? {}).filter(([campo]) => CAMPOS_SECRETOS.includes(campo)))
  const secreto = Object.keys(secretos).length > 0 ? await cifrar(secretos) : undefined
  const visible = cuerpo && Object.fromEntries(Object.entries(cuerpo).filter(([campo]) => !CAMPOS_SECRETOS.includes(campo)))

  const { regla, id } = destino
  const creadaEn = new Date().toISOString()
  const final = regla.patron === '/comercial/ventas' ? { ...visible, fechaOffline: creadaEn } : visible
  const esSubida = archivos && archivos.length > 0
  const generaId = regla.accion === 'crear' || regla.idRespuesta !== undefined
  const temporal = esSubida ? await leerComoDataUrl(archivos![0].archivo) : generaId ? nuevoTemporal() : undefined
  const base = id === null ? undefined : registrosVistos.get(`${regla.coleccion}/${id}`)

  const escritura: EscrituraOffline = {
    idLocal: crypto.randomUUID(),
    idUsuario,
    metodo: metodo as Metodo,
    url: config.url,
    cuerpo: final,
    descripcion: descripcionDe(regla, final, base),
    creadaEn,
    estado: 'PENDIENTE',
    temporal,
    secreto,
    archivos,
    base,
  }
  await actualizar(escritura)

  return {
    data: { data: respuestaLocal(regla, escritura, base, esSubida ? (temporal as string) : undefined), timestamp: creadaEn },
    status: 202,
    statusText: 'Guardado sin conexion',
    headers: {},
    config,
  }
}

/** Lo que recibe la pantalla al guardar: lo mismo que devolveria el servidor, hasta donde se puede saber aqui. */
function respuestaLocal(regla: Regla, escritura: EscrituraOffline, base: Fila | undefined, urlSubida?: string): unknown {
  if (urlSubida) return { url: urlSubida }
  const c = contexto(escritura)
  if (regla.respuesta) return regla.respuesta(c)
  if (regla.accion === 'crear') return regla.fila ? regla.fila(c) : { ...c.cuerpo, id: c.idTemporal }
  if (regla.accion === 'eliminar') return null
  // Variantes e imagenes: la pantalla se redibuja con el producto completo.
  return aplicarEfecto(regla, base ?? { id: reglaDe(escritura.metodo, escritura.url)?.id }, c, escritura)
}

function aplicarEfecto(regla: Regla, item: Fila, c: ContextoRegla, escritura: EscrituraOffline): Fila {
  if (regla.aplicar) return regla.aplicar(item, c)
  const sub = escritura.url.match(/\/(variantes|imagenes)\/(-?\d+)$/)
  if (!sub) return { ...item, ...c.cuerpo }
  const campo = sub[1]
  const idSub = Number(sub[2])
  const hijos = Array.isArray(item[campo]) ? (item[campo] as Fila[]) : []
  return { ...item, [campo]: escritura.metodo === 'delete' ? hijos.filter((hijo) => hijo.id !== idSub) : hijos.map((hijo) => (hijo.id === idSub ? { ...hijo, ...c.cuerpo } : hijo)) }
}

// --------------------------------------------------------------- mostrar los cambios pendientes

function pasaFiltros(fila: Fila, query: URLSearchParams): boolean {
  for (const [clave, valor] of query) {
    if (['page', 'limit', 'fechaDesde', 'fechaHasta'].includes(clave)) continue
    if (clave === 'search') {
      if (!JSON.stringify(fila).toLowerCase().includes(valor.toLowerCase())) return false
    } else if (clave in fila && String(fila[clave]) !== valor) {
      return false
    }
  }
  return true
}

function aplicarSobreCajaAbierta(sobre: unknown, query: URLSearchParams, propias: EscrituraOffline[]): unknown {
  const idSucursal = Number(query.get('idSucursal'))
  let caja = ((sobre as { data?: unknown } | null)?.data ?? null) as Fila | null
  for (const escritura of propias) {
    const destino = reglaDe(escritura.metodo, escritura.url)
    if (destino?.regla.coleccion !== '/comercial/cajas') continue
    const c = contexto(escritura)
    if (destino.regla.accion === 'crear' && destino.regla.fila) {
      const nueva = destino.regla.fila(c)
      if (nueva.idSucursal === idSucursal) caja = nueva
    } else if (caja && destino.id === caja.id) {
      const actualizada = aplicarEfecto(destino.regla, caja, c, escritura)
      caja = actualizada.estado === 'Abierta' ? actualizada : null
    }
  }
  return { ...(sobre as object | null), data: caja }
}

/**
 * Sobre lo que llega del servidor (o de la cache) aplica en orden los cambios pendientes, para que cada pantalla muestre
 * lo que la persona acaba de hacer.
 */
export function aplicarCambiosPendientes(url: string | undefined, sobre: unknown, idUsuario: number | null): unknown {
  if (!url) return sobre
  const ruta = rutaDe(url)
  const query = new URLSearchParams(url.split('?')[1] ?? '')
  const propias = escrituras.filter((e) => e.idUsuario === idUsuario && e.estado !== 'RECHAZADA')
  if (ruta === '/comercial/cajas/abierta') return propias.length > 0 ? aplicarSobreCajaAbierta(sobre, query, propias) : sobre

  const datos = registrosDe((sobre as { data?: unknown } | null)?.data)
  if (!datos) return sobre
  const regla = reglaDeLectura(ruta)
  if (regla) datos.registros.forEach((item) => typeof item.id === 'number' && registrosVistos.set(`${regla.coleccion}/${item.id}`, item))
  if (propias.length === 0) return sobre

  let registros = datos.registros
  let agregados = 0
  const primeraPagina = (query.get('page') ?? '1') === '1'
  for (const escritura of propias) {
    const destino = reglaDe(escritura.metodo, escritura.url)
    if (!destino) continue
    const c = contexto(escritura)
    const r = destino.regla
    if (r.accion === 'crear') {
      if (datos.forma !== 'objeto' && primeraPagina && r.fila && (r.listas ?? [r.coleccion]).includes(ruta)) {
        const fila = r.fila(c)
        if (pasaFiltros(fila, query)) {
          registros = [fila, ...registros]
          agregados += 1
        }
      }
    } else if (ruta === r.coleccion || ruta.startsWith(`${r.coleccion}/`)) {
      registros = registros.flatMap((item) => {
        if (item.id !== destino.id && r.coleccion !== '/acceso/perfil') return [item]
        const cambiado = r.accion === 'eliminar' ? ('activo' in item ? { ...item, activo: false } : null) : aplicarEfecto(r, item, c, escritura)
        return cambiado && (datos.forma === 'objeto' || pasaFiltros(cambiado, query)) ? [cambiado] : []
      })
    }
  }

  const envoltura = sobre as { data: Fila | Fila[] }
  if (datos.forma === 'lista') return { ...envoltura, data: registros }
  if (datos.forma === 'objeto') return { ...envoltura, data: registros[0] ?? envoltura.data }
  const paginada = envoltura.data as Fila & { meta?: Fila }
  return { ...envoltura, data: { ...paginada, items: registros, meta: paginada.meta && { ...paginada.meta, total: Number(paginada.meta.total ?? 0) + agregados } } }
}

/** Para un GET sin respuesta: lo creado sin conexion solo existe aqui, asi que su detalle se arma localmente. */
export function lecturaLocal(url: string | undefined, idUsuario: number | null): unknown {
  if (!url) return undefined
  const ruta = rutaDe(url)
  const propias = escrituras.filter((e) => e.idUsuario === idUsuario && e.estado !== 'RECHAZADA')
  if (ruta === '/comercial/cajas/abierta' && propias.length > 0) {
    const resultado = aplicarSobreCajaAbierta({ data: null }, new URLSearchParams(url.split('?')[1] ?? ''), propias) as { data: unknown }
    return resultado.data ? resultado : undefined
  }
  const coincidencia = ruta.match(/^(.*)\/(-\d+)(\/[a-z]+)?$/)
  if (!coincidencia) return undefined
  if (coincidencia[3]) return { data: [] }
  const temporal = Number(coincidencia[2])
  const creacion = propias.find((e) => e.temporal === temporal)
  const regla = creacion && reglaDe(creacion.metodo, creacion.url)?.regla
  if (!creacion || !regla?.fila) return undefined
  return aplicarCambiosSobreRegistro(regla.fila(contexto(creacion)), temporal, propias)
}

function aplicarCambiosSobreRegistro(fila: Fila, temporal: number, propias: EscrituraOffline[]): { data: Fila } {
  let actual = fila
  for (const escritura of propias) {
    const destino = reglaDe(escritura.metodo, escritura.url)
    if (destino?.id === temporal && destino.regla.accion === 'editar') actual = aplicarEfecto(destino.regla, actual, contexto(escritura), escritura)
  }
  return { data: actual }
}

/** Resta del stock lo vendido sin conexion, para no ofrecer dos veces la misma prenda en este dispositivo. */
export function descontarVentasPendientes<T extends { idVarianteProducto: number; stockDisponible: number }>(
  stock: T[],
  pendientes: EscrituraOffline[],
  idSucursal: number | null,
): T[] {
  const vendidas = new Map<number, number>()
  for (const escritura of pendientes) {
    if (rutaDe(escritura.url) !== '/comercial/ventas' || escritura.estado === 'RECHAZADA') continue
    const sucursal = escritura.cuerpo?.idSucursal
    if (sucursal !== undefined && sucursal !== idSucursal) continue
    for (const item of (escritura.cuerpo?.items ?? []) as { idVarianteProducto: number; cantidad: number }[]) {
      vendidas.set(item.idVarianteProducto, (vendidas.get(item.idVarianteProducto) ?? 0) + item.cantidad)
    }
  }
  if (vendidas.size === 0) return stock
  return stock
    .map((item) => ({ ...item, stockDisponible: item.stockDisponible - (vendidas.get(item.idVarianteProducto) ?? 0) }))
    .filter((item) => item.stockDisponible > 0)
}

// --------------------------------------------------------------- enviar

const comoTexto = (valor: unknown) => (valor === null || valor === undefined ? '' : String(valor))
const esSimple = (valor: unknown) => valor === null || ['string', 'number', 'boolean'].includes(typeof valor)

/** Campos que esta edicion cambia y que otra persona modifico de otra forma mientras no habia red. */
export function camposEnConflicto(cuerpo: Fila | null, base: Fila, actual: Fila): string[] {
  return Object.keys(cuerpo ?? {}).filter((campo) => {
    if (!(campo in base) || !(campo in actual) || !esSimple(base[campo]) || !esSimple(actual[campo])) return false
    return comoTexto(actual[campo]) !== comoTexto(base[campo]) && comoTexto(actual[campo]) !== comoTexto(cuerpo?.[campo])
  })
}

async function leerActual(cliente: AxiosInstance, escritura: EscrituraOffline): Promise<Fila | null> {
  const destino = reglaDe(escritura.metodo, escritura.url)
  if (!destino?.regla.lectura || destino.id === null) return null
  const respuesta = await cliente.get<{ data: unknown }>(destino.regla.lectura(destino.id), { _sinCambiosPendientes: true, headers: { [CABECERA_DATO_FRESCO]: '1' } })
  const datos = respuesta.data.data as Fila | Fila[]
  return Array.isArray(datos) ? (datos.find((item) => item.id === destino.id) ?? null) : datos
}

function mensajeDe(error: unknown): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const mensaje = error.response?.data?.message
    if (Array.isArray(mensaje) && mensaje[0]) return mensaje[0]
    if (typeof mensaje === 'string') return mensaje
  }
  return 'El servidor rechazó este cambio.'
}

/** Sin respuesta, 401 o error del servidor: es pasajero, se detiene y se reintenta luego, sin perder el orden. */
function esPasajero(error: unknown): boolean {
  if (!isAxiosError(error) || !error.response) return true
  return error.response.status === 401 || error.response.status >= 500
}

function sustituir(valor: unknown, temporal: number | string, real: unknown): unknown {
  if (valor === temporal) return real
  if (Array.isArray(valor)) return valor.map((item) => sustituir(item, temporal, real))
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([clave, v]) => [clave, sustituir(v, temporal, real)]))
  return valor
}

/** Lo que dependia de un registro recien creado pasa a apuntar a su id real. */
async function reemplazarTemporal(temporal: number | string, real: unknown) {
  for (const dependiente of escrituras.filter((e) => refiereA(e, temporal))) {
    await actualizar({
      ...dependiente,
      url: typeof temporal === 'number' ? dependiente.url.replace(new RegExp(`/${temporal}(?=/|$)`), `/${String(real)}`) : dependiente.url,
      cuerpo: sustituir(dependiente.cuerpo, temporal, real) as Fila | null,
    })
  }
}

async function cuerpoParaEnviar(escritura: EscrituraOffline): Promise<unknown> {
  if (escritura.archivos?.length) {
    const formulario = new FormData()
    for (const { campo, nombre, archivo } of escritura.archivos) formulario.append(campo, archivo, nombre)
    return formulario
  }
  if (!escritura.cuerpo && !escritura.secreto) return undefined
  return { ...escritura.cuerpo, ...(escritura.secreto ? await descifrar(escritura.secreto) : {}) }
}

let enviando = false

/** Envia en orden los cambios de este usuario. Devuelve true si algo cambio en el servidor. */
export async function sincronizarEscrituras(cliente: AxiosInstance, idUsuario: number): Promise<boolean> {
  if (enviando) return false
  enviando = true
  let huboCambios = false
  try {
    const ids = escrituras.filter((e) => e.idUsuario === idUsuario && e.estado === 'PENDIENTE').map((e) => e.idLocal)
    for (const idLocal of ids) {
      // Se relee: al crear un registro, los cambios siguientes reciben su id real.
      const escritura = escrituras.find((e) => e.idLocal === idLocal)
      if (!escritura || escritura.estado !== 'PENDIENTE') continue
      // Depende de algo que aun no se creo (por ejemplo, fue rechazado): espera.
      if (escrituras.some((e) => e.idLocal !== idLocal && e.temporal !== undefined && e.creadaEn <= escritura.creadaEn && refiereA(escritura, e.temporal))) continue

      try {
        if (escritura.metodo === 'put' && escritura.base && !escritura.forzar) {
          const actual = await leerActual(cliente, escritura)
          const campos = actual ? camposEnConflicto(escritura.cuerpo, escritura.base, actual) : []
          if (campos.length > 0) {
            await actualizar({ ...escritura, estado: 'CONFLICTO', camposEnConflicto: campos, mensaje: 'Otra persona cambió este registro mientras no había conexión.' })
            continue
          }
        }
        const respuesta = await cliente.request<{ data?: Fila }>({
          method: escritura.metodo,
          url: escritura.url,
          data: await cuerpoParaEnviar(escritura),
          headers: { 'Idempotency-Key': escritura.idLocal },
          _sinCola: true,
        })
        if (escritura.temporal !== undefined) {
          const datos = respuesta.data.data ?? {}
          const regla = reglaDe(escritura.metodo, escritura.url)?.regla
          const real = regla?.idRespuesta ? regla.idRespuesta(datos, escritura.cuerpo ?? {}) : datos.id
          if (real !== undefined) await reemplazarTemporal(escritura.temporal, real)
        }
        await quitar(escritura.idLocal)
        huboCambios = true
      } catch (error) {
        if (esPasajero(error)) return huboCambios
        await actualizar({ ...escritura, estado: 'RECHAZADA', mensaje: mensajeDe(error) })
      }
    }
    return huboCambios
  } finally {
    enviando = false
  }
}

void cargarEscrituras().catch(() => undefined)
