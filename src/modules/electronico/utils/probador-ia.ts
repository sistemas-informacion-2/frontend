import type { ImagenProducto } from '@/modules/inventario/types'

/*
 * Probador con IA: la cámara del cliente va en vivo a Decart (modelo lucy-vton-3.5), que devuelve
 * el mismo video con la prenda puesta. Misma lógica que el probador de la app móvil.
 */

// --- Prompt ---

export type ZonaPrendaIA = 'upper' | 'lower' | 'outfit' | 'footwear'

/**
 * Palabras clave por zona. El orden importa: lo más específico va primero para que
 * "Vestido camisero" sea outfit y no upper. Se compara por inicio de palabra ("poleras" -> "polera").
 */
const PALABRAS_POR_ZONA: [ZonaPrendaIA, string[]][] = [
  ['outfit', ['vestido', 'enterizo', 'conjunto', 'overol', 'jumpsuit']],
  ['footwear', ['zapato', 'zapatilla', 'calzado', 'bota', 'botin', 'sandalia', 'tenis', 'mocasin']],
  ['lower', ['pantalon', 'jean', 'falda', 'short', 'bermuda', 'legging', 'jogger']],
  [
    'upper',
    ['camisa', 'polera', 'blusa', 'chaqueta', 'casaca', 'chompa', 'sueter', 'sweater', 'sudadera', 'polo', 'top', 'abrigo', 'hoodie', 'chaleco'],
  ],
]

/** Plantillas recomendadas por Decart para VTON 3.5 (en inglés, idioma del modelo). */
const PLANTILLAS_POR_ZONA: Record<ZonaPrendaIA, string> = {
  upper: 'Substitute the upper body garment with',
  lower: 'Substitute the lower body garment with',
  outfit: 'Substitute the outfit with',
  footwear: 'Substitute the footwear with',
}

/** Decart recomienda prompts de 20-30 palabras. */
const MAX_PALABRAS_PROMPT = 30

const TILDES: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n' }

function aPalabras(texto: string): string[] {
  return texto
    .toLowerCase()
    .replace(/[áéíóúüñ]/g, (letra) => TILDES[letra])
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function buscarZona(texto: string): ZonaPrendaIA | null {
  const palabras = aPalabras(texto)
  for (const [zona, claves] of PALABRAS_POR_ZONA) {
    if (palabras.some((palabra) => claves.some((clave) => palabra.startsWith(clave)))) return zona
  }
  return null
}

/** Busca primero en la categoría y luego en el nombre; sin coincidencias se asume el outfit completo. */
export function detectarZonaPrenda(categoriaNombre: string, nombre: string): ZonaPrendaIA {
  return buscarZona(categoriaNombre) ?? buscarZona(nombre) ?? 'outfit'
}

export function construirPromptProbador(producto: { nombre: string; categoriaNombre: string; descripcion: string | null }): string {
  const zona = detectarZonaPrenda(producto.categoriaNombre, producto.nombre)
  const base = `${PLANTILLAS_POR_ZONA[zona]} ${producto.nombre.trim()}, as shown in the reference image.`
  const descripcion = producto.descripcion?.trim()
  if (!descripcion) return base

  // "Details:" también cuenta como palabra.
  const espacio = MAX_PALABRAS_PROMPT - base.split(/\s+/).length - 1
  if (espacio <= 0) return base

  const detalles = descripcion.split(/\s+/).slice(0, espacio).join(' ')
  return `${base} Details: ${detalles}`
}

/** Misma prioridad que GaleriaProducto: principal primero, luego menor orden. */
export function elegirImagenPrenda(imagenes: ImagenProducto[]): ImagenProducto | null {
  const [primera] = [...imagenes].sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal) || a.orden - b.orden)
  return primera ?? null
}

// --- Disponibilidad ---

export interface DisponibilidadIA {
  habilitado: boolean
  motivo?: string
}

/** Lo que no depende de nosotros (HTTPS, navegador) se muestra primero. */
export function obtenerDisponibilidadIA({ configurado, tieneImagen }: { configurado: boolean; tieneImagen: boolean }): DisponibilidadIA {
  // Fuera de HTTPS (o localhost) el navegador ni siquiera expone la cámara.
  if (!window.isSecureContext) return { habilitado: false, motivo: 'Requiere HTTPS' }
  if (typeof RTCPeerConnection === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { habilitado: false, motivo: 'Navegador no compatible' }
  }
  if (!configurado) return { habilitado: false, motivo: 'No configurado' }
  if (!tieneImagen) return { habilitado: false, motivo: 'Sin imagen' }
  return { habilitado: true }
}

// --- Errores ---

export type CodigoErrorProbadorIA = 'missing-config' | 'camera-denied' | 'garment-download' | 'connection-lost'

/** Errores propios del probador; los del SDK de Decart llegan como objetos { code, message, data? }. */
export class ErrorProbadorIA extends Error {
  readonly codigo: CodigoErrorProbadorIA

  constructor(codigo: CodigoErrorProbadorIA, cause?: unknown) {
    super(codigo, { cause })
    this.name = 'ErrorProbadorIA'
    this.codigo = codigo
  }
}

export interface InfoErrorProbadorIA {
  mensaje: string
  reintentable: boolean
}

const MENSAJES: Record<CodigoErrorProbadorIA, InfoErrorProbadorIA> = {
  'missing-config': { mensaje: 'El probador con IA no está configurado.', reintentable: false },
  'camera-denied': {
    mensaje: 'Necesitamos acceso a la cámara para probarte la prenda. Permítelo desde el candado de la barra de direcciones.',
    reintentable: true,
  },
  'garment-download': { mensaje: 'No pudimos obtener la imagen de la prenda.', reintentable: true },
  'connection-lost': { mensaje: 'Se perdió la conexión con el probador.', reintentable: true },
}

const RECHAZADO: InfoErrorProbadorIA = {
  mensaje: 'El servicio de IA rechazó la conexión. Revisa la configuración.',
  reintentable: false,
}

/** Códigos de DecartSDKError que indican configuración inválida: reintentar no los arregla. */
const CODIGOS_SDK_NO_REINTENTABLES = new Set([
  'INVALID_API_KEY',
  'INVALID_OPTIONS',
  'INVALID_INPUT',
  'MODEL_NOT_FOUND',
  'UNSUPPORTED_PLATFORM_FEATURE',
  'LIVEKIT_INITIALIZATION_ERROR',
])

const ESTADOS_HTTP_RECHAZO = new Set([401, 402, 403])

function esErrorSdk(error: unknown): error is { code: string; data?: Record<string, unknown> } {
  return typeof error === 'object' && error !== null && typeof (error as { code?: unknown }).code === 'string'
}

/** Traduce cualquier error a un mensaje fijo en español; nunca expone el texto original. */
export function mensajeErrorProbadorIA(error: unknown): InfoErrorProbadorIA {
  if (error instanceof ErrorProbadorIA) return MENSAJES[error.codigo]

  if (esErrorSdk(error)) {
    const estado = error.data?.status
    const rechazoHttp = typeof estado === 'number' && ESTADOS_HTTP_RECHAZO.has(estado)
    if (CODIGOS_SDK_NO_REINTENTABLES.has(error.code) || rechazoHttp) return RECHAZADO
  }

  return MENSAJES['connection-lost']
}

// --- Sesión ---

/** Estados de conexión que reporta el SDK de Decart (ConnectionState). */
export type EstadoConexionIA = 'connecting' | 'connected' | 'generating' | 'disconnected' | 'reconnecting'

export interface SesionRemota {
  disconnect(): void
  /** Errores del SDK o fin de sesión impuesto por el servidor. */
  onFailure(listener: (error: unknown) => void): void
}

export interface EventosConexionIA {
  onRemoteStream: (stream: MediaStream) => void
  onConnectionChange: (estado: EstadoConexionIA) => void
}

export interface DependenciasSesionIA {
  abrirCamara: () => Promise<MediaStream>
  descargarPrenda: () => Promise<Blob>
  conectar: (camara: MediaStream, prenda: Blob, eventos: EventosConexionIA) => Promise<SesionRemota>
}

export interface EventosSesionIA extends EventosConexionIA {
  onError: (error: unknown) => void
}

/**
 * Arranca cámara -> descarga de prenda -> sesión Decart. Devuelve detener(), idempotente y seguro en
 * cualquier fase: si un paso termina después de detener() sus recursos se liberan al llegar, para que
 * ninguna sesión huérfana siga usando la cámara ni facturando.
 */
export function iniciarSesionProbadorIA(deps: DependenciasSesionIA, eventos: EventosSesionIA): () => void {
  let detenida = false
  let camara: MediaStream | null = null
  let sesion: SesionRemota | null = null

  const liberar = () => {
    sesion?.disconnect()
    sesion = null
    camara?.getTracks().forEach((track) => track.stop())
    camara = null
  }

  // Una sesión fallida queda terminada: se reporta una sola vez y se ignoran eventos posteriores.
  const fallar = (error: unknown) => {
    if (detenida) return
    detenida = true
    liberar()
    eventos.onError(error)
  }

  const correr = async () => {
    const stream = await deps.abrirCamara().catch((error: unknown) => {
      throw new ErrorProbadorIA('camera-denied', error)
    })
    camara = stream
    if (detenida) {
      liberar()
      return
    }

    const prenda = await deps.descargarPrenda().catch((error: unknown) => {
      throw new ErrorProbadorIA('garment-download', error)
    })
    // Si detener() llegó durante la descarga, ya liberó la cámara.
    if (detenida) return

    const conectada = await deps.conectar(stream, prenda, {
      onRemoteStream: (remoto) => {
        if (!detenida) eventos.onRemoteStream(remoto)
      },
      onConnectionChange: (estado) => {
        if (!detenida) eventos.onConnectionChange(estado)
      },
    })
    if (detenida) {
      conectada.disconnect()
      return
    }
    sesion = conectada
    conectada.onFailure(fallar)
  }

  correr().catch(fallar)

  return () => {
    if (detenida) return
    detenida = true
    liberar()
  }
}
