import { httpClient } from '@/core/http/httpClient'
import type { EstadoTemporada, Temporada, TemporadaFormValues } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

export async function listarTemporadas(): Promise<Temporada[]> {
  const response = await httpClient.get<Envelope<Temporada[]>>('/inventario/temporadas')
  return response.data.data
}

export async function crearTemporada(values: TemporadaFormValues): Promise<Temporada> {
  const response = await httpClient.post<Envelope<Temporada>>('/inventario/temporadas', {
    nombre: values.nombre,
    fechaInicio: values.fechaInicio,
    fechaFin: values.fechaFin,
    descripcion: values.descripcion || undefined,
  })
  return response.data.data
}

export async function actualizarTemporada(id: number, values: TemporadaFormValues): Promise<Temporada> {
  const response = await httpClient.put<Envelope<Temporada>>(`/inventario/temporadas/${id}`, {
    nombre: values.nombre,
    fechaInicio: values.fechaInicio,
    fechaFin: values.fechaFin,
    descripcion: values.descripcion || undefined,
  })
  return response.data.data
}

export async function eliminarTemporada(id: number): Promise<void> {
  await httpClient.delete(`/inventario/temporadas/${id}`)
}

export const ESTADO_TEMPORADA_LABEL: Record<EstadoTemporada, string> = {
  PROXIMA: 'Próxima',
  VIGENTE: 'Vigente',
  FINALIZADA: 'Finalizada',
}
