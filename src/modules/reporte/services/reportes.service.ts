import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import { getApiErrorMessage, isNetworkError } from '@/core/http/errors'
import { ALMACEN_REPORTES, guardar, leerUno } from '@/core/offline/adminOfflineDb'
import { useAuthStore } from '@/core/store/authStore'
import type {
  ContextoExportacion,
  FormatoExportacion,
  PlantillaReporte,
  ReporteDefinicion,
  ReportePredefinido,
  ReportePredefinidoEjecutado,
  ReportRunRequest,
  ResultadoReporte,
  RespuestaGenerativo,
} from '../reportes.types'

const BASE = '/reports'

interface ReporteGuardado<T> {
  clave: string
  respuesta: T
  guardadoEn: string
}

const claveDe = (reporte: string) => `${useAuthStore.getState().perfil?.id ?? 0}:${reporte}`

/** Guarda cada resultado y, sin conexion, devuelve el ultimo con su fecha: el servidor es quien calcula los reportes. */
async function conResultadoGuardado<T extends object>(reporte: string, pedir: () => Promise<T>): Promise<T & { guardadoEn?: string }> {
  const clave = claveDe(reporte)
  try {
    const respuesta = await pedir()
    await guardar(ALMACEN_REPORTES, { clave, respuesta, guardadoEn: new Date().toISOString() } satisfies ReporteGuardado<T>).catch(() => undefined)
    return respuesta
  } catch (error) {
    if (!isNetworkError(error)) throw error
    const guardado = await leerUno<ReporteGuardado<T>>(ALMACEN_REPORTES, clave).catch(() => undefined)
    if (!guardado) throw error
    return { ...guardado.respuesta, guardadoEn: guardado.guardadoEn }
  }
}

/** Cuando se guardo por ultima vez un reporte predefinido, para no volver a calcularlo sin necesidad. */
export async function fechaPredefinidoGuardado(codigo: string): Promise<string | null> {
  const guardado = await leerUno<ReporteGuardado<unknown>>(ALMACEN_REPORTES, claveDe(`predefinido:${codigo}`)).catch(() => undefined)
  return guardado?.guardadoEn ?? null
}

/** Mensaje para un reporte que no se pudo mostrar. */
export function mensajeErrorReporte(error: unknown, porDefecto: string): string {
  return isNetworkError(error) ? 'Sin conexión: este reporte aún no está guardado en este dispositivo. Ejecútalo una vez con red.' : getApiErrorMessage(error, porDefecto)
}

export async function obtenerCatalogoReportes(): Promise<ReporteDefinicion[]> {
  const response = await httpClient.get<Envelope<ReporteDefinicion[]>>(`${BASE}/catalog`)
  return unwrap(response)
}

export async function listarReportesPredefinidos(): Promise<ReportePredefinido[]> {
  const response = await httpClient.get<Envelope<ReportePredefinido[]>>(`${BASE}/predefinidos`)
  return unwrap(response)
}

/** Una página de un predefinido (`offset` = desde qué fila). Cada página se guarda aparte para verla sin conexión. */
export async function ejecutarReportePredefinido(codigo: string, offset = 0): Promise<ReportePredefinidoEjecutado> {
  // La primera página conserva la clave de siempre: fechaPredefinidoGuardado la consulta.
  const clave = offset > 0 ? `predefinido:${codigo}:${offset}` : `predefinido:${codigo}`
  return conResultadoGuardado(clave, async () => {
    const response = await httpClient.post<Envelope<ReportePredefinidoEjecutado>>(`${BASE}/predefinidos/${codigo}/ejecutar`, undefined, {
      params: offset > 0 ? { offset } : undefined,
    })
    return unwrap(response)
  })
}

export async function ejecutarReporte(request: ReportRunRequest): Promise<ResultadoReporte> {
  return conResultadoGuardado(`constructor:${JSON.stringify(request)}`, async () => {
    const response = await httpClient.post<Envelope<ResultadoReporte>>(`${BASE}/run`, request)
    return unwrap(response)
  })
}

export async function generarReporte(prompt: string): Promise<RespuestaGenerativo> {
  const response = await httpClient.post<Envelope<RespuestaGenerativo>>(`${BASE}/generativo`, { prompt })
  return unwrap(response)
}

export async function listarPlantillas(): Promise<PlantillaReporte[]> {
  const response = await httpClient.get<Envelope<PlantillaReporte[]>>(`${BASE}/templates`)
  return unwrap(response)
}

export async function crearPlantilla(nombre: string, config: ReportRunRequest): Promise<PlantillaReporte> {
  const response = await httpClient.post<Envelope<PlantillaReporte>>(`${BASE}/templates`, { nombre, config })
  return unwrap(response)
}

export async function actualizarPlantilla(
  id: number,
  nombre: string,
  config: ReportRunRequest,
): Promise<PlantillaReporte> {
  const response = await httpClient.put<Envelope<PlantillaReporte>>(`${BASE}/templates/${id}`, { nombre, config })
  return unwrap(response)
}

export async function eliminarPlantilla(id: number): Promise<void> {
  await httpClient.delete(`${BASE}/templates/${id}`)
}

/**
 * Descarga el reporte en el formato elegido. La respuesta es binaria (el
 * controlador responde con `@Res()` y el backend no la envuelve en envelope).
 */
export async function descargarReporte(
  formato: FormatoExportacion,
  request: ReportRunRequest,
  contexto?: ContextoExportacion,
): Promise<{ blob: Blob; nombreArchivo: string }> {
  const response = await httpClient.post<Blob>(`${BASE}/export`, contexto ? { ...request, contexto } : request, {
    params: { format: formato },
    responseType: 'blob',
  })
  return archivoDescargado(response.data, response.headers['content-disposition'] as string | undefined, formato)
}

/**
 * Descarga un predefinido. El servidor arma su configuracion, por eso funciona en todos los planes; /export (cualquier
 * configuracion) exige reportes avanzados.
 */
export async function descargarPredefinido(formato: FormatoExportacion, codigo: string): Promise<{ blob: Blob; nombreArchivo: string }> {
  const response = await httpClient.post<Blob>(`${BASE}/predefinidos/${codigo}/exportar`, undefined, {
    params: { format: formato },
    responseType: 'blob',
  })
  return archivoDescargado(response.data, response.headers['content-disposition'] as string | undefined, formato)
}

function archivoDescargado(blob: Blob, disposicion: string | undefined, formato: FormatoExportacion): { blob: Blob; nombreArchivo: string } {
  const coincidencia = disposicion?.match(/filename="([^"]+)"/)
  return { blob, nombreArchivo: coincidencia?.[1] ?? `reporte.${formato === 'excel' ? 'xlsx' : formato}` }
}