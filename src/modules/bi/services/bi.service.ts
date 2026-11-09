import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type {
  ConversacionDetalle,
  ConversacionResumen,
  DatosGrafico,
  EjecucionEtl,
  EstadoBi,
  Frecuencia,
  Grafico,
  GraficoGuardado,
  PronosticoModelo,
  RespuestaAgente,
  ResultadoHerramienta,
  ResumenEtl,
  ResumenModelos,
} from '../bi.types'

export async function preguntar(pregunta: string, idConversacion: number | null): Promise<RespuestaAgente> {
  const response = await httpClient.post<Envelope<RespuestaAgente>>('/bi/preguntar', { pregunta, ...(idConversacion ? { idConversacion } : {}) })
  return unwrap(response)
}

export async function listarConversaciones(): Promise<ConversacionResumen[]> {
  return unwrap(await httpClient.get<Envelope<ConversacionResumen[]>>('/bi/conversaciones'))
}

export async function obtenerConversacion(id: number): Promise<ConversacionDetalle> {
  return unwrap(await httpClient.get<Envelope<ConversacionDetalle>>(`/bi/conversaciones/${id}`))
}

export async function borrarConversacion(id: number): Promise<void> {
  await httpClient.delete(`/bi/conversaciones/${id}`)
}

export async function listarGraficos(): Promise<GraficoGuardado[]> {
  return unwrap(await httpClient.get<Envelope<GraficoGuardado[]>>('/bi/graficos'))
}

export async function guardarGrafico(grafico: Grafico): Promise<GraficoGuardado> {
  const cuerpo = { herramienta: grafico.herramienta, parametros: grafico.parametros, titulo: grafico.titulo }
  return unwrap(await httpClient.post<Envelope<GraficoGuardado>>('/bi/graficos', cuerpo))
}

export async function obtenerDatosGrafico(id: number): Promise<DatosGrafico> {
  return unwrap(await httpClient.get<Envelope<DatosGrafico>>(`/bi/graficos/${id}/datos`))
}

export async function borrarGrafico(id: number): Promise<void> {
  await httpClient.delete(`/bi/graficos/${id}`)
}

export async function obtenerResumenModelos(): Promise<ResumenModelos> {
  return unwrap(await httpClient.get<Envelope<ResumenModelos>>('/bi/modelos'))
}

export async function obtenerPronostico(frecuencia: Frecuencia, sucursal?: string): Promise<PronosticoModelo> {
  return unwrap(await httpClient.get<Envelope<PronosticoModelo>>('/bi/modelos/pronostico', { params: { frecuencia, sucursal: sucursal || undefined } }))
}

export type SeccionModelo = 'clientes-en-riesgo' | 'segmentos' | 'canasta' | 'anomalias' | 'sugerencia-compra'

export async function obtenerSeccionModelo(seccion: SeccionModelo, filtros: { nivel?: string; sucursal?: string }): Promise<ResultadoHerramienta> {
  const params = { nivel: filtros.nivel || undefined, sucursal: filtros.sucursal || undefined }
  return unwrap(await httpClient.get<Envelope<ResultadoHerramienta>>(`/bi/modelos/${seccion}`, { params }))
}

export async function obtenerEstadoBi(): Promise<EstadoBi> {
  return unwrap(await httpClient.get<Envelope<EstadoBi>>('/bi/estado'))
}

export async function obtenerHistorialEtl(): Promise<EjecucionEtl[]> {
  return unwrap(await httpClient.get<Envelope<EjecucionEtl[]>>('/bi/etl/historial'))
}

export async function ejecutarEtl(): Promise<ResumenEtl> {
  return unwrap(await httpClient.post<Envelope<ResumenEtl>>('/bi/etl/ejecutar'))
}
