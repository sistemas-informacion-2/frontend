import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type {
  FormatoExportacion,
  PlantillaReporte,
  ReporteDefinicion,
  ReportRunRequest,
  ResultadoReporte,
  RespuestaGenerativo,
} from '../reportes.types'

const BASE = '/reports'

export async function obtenerCatalogoReportes(): Promise<ReporteDefinicion[]> {
  const response = await httpClient.get<Envelope<ReporteDefinicion[]>>(`${BASE}/catalog`)
  return unwrap(response)
}

export async function ejecutarReporte(request: ReportRunRequest): Promise<ResultadoReporte> {
  const response = await httpClient.post<Envelope<ResultadoReporte>>(`${BASE}/run`, request)
  return unwrap(response)
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
): Promise<{ blob: Blob; nombreArchivo: string }> {
  const response = await httpClient.post<Blob>(`${BASE}/export`, request, {
    params: { format: formato },
    responseType: 'blob',
  })
  const disposicion = response.headers['content-disposition'] as string | undefined
  const coincidencia = disposicion?.match(/filename="([^"]+)"/)
  return { blob: response.data, nombreArchivo: coincidencia?.[1] ?? `reporte.${formato === 'excel' ? 'xls' : formato}` }
}