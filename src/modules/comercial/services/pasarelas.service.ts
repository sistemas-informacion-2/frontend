import { httpClient } from '@/core/http/httpClient'
import type { Pasarela, PasarelaFormValues, PasarelasQuery } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: PasarelasQuery = {}): string {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.integracion) params.set('integracion', query.integracion)
  if (query.disponiblePresencial !== undefined) params.set('disponiblePresencial', String(query.disponiblePresencial))
  if (query.disponibleLinea !== undefined) params.set('disponibleLinea', String(query.disponibleLinea))
  const result = params.toString()
  return result ? `?${result}` : ''
}

export async function listarPasarelas(query: PasarelasQuery = {}): Promise<Pasarela[]> {
  const response = await httpClient.get<Envelope<Pasarela[]>>(`/comercial/pasarelas${toQueryString(query)}`)
  return response.data.data
}

export async function listarPasarelasPresencial(): Promise<Pasarela[]> {
  const response = await httpClient.get<Envelope<Pasarela[]>>('/comercial/pasarelas/presencial')
  return response.data.data
}

export async function listarPasarelasLinea(): Promise<Pasarela[]> {
  const response = await httpClient.get<Envelope<Pasarela[]>>('/comercial/pasarelas/linea')
  return response.data.data
}

export async function crearPasarela(values: PasarelaFormValues): Promise<Pasarela> {
  const response = await httpClient.post<Envelope<Pasarela>>('/comercial/pasarelas', {
    codigo: values.codigo,
    metodo: values.metodo,
    descripcion: values.descripcion || undefined,
    integracion: values.integracion,
    comisionPorcentaje: Number(values.comisionPorcentaje || 0),
    disponiblePresencial: values.disponiblePresencial,
    disponibleLinea: values.disponibleLinea,
    ...(values.apiKey ? { apiKey: values.apiKey } : {}),
    ...(values.apiSecret ? { apiSecret: values.apiSecret } : {}),
  })
  return response.data.data
}

export async function actualizarPasarela(id: number, values: PasarelaFormValues): Promise<Pasarela> {
  const response = await httpClient.put<Envelope<Pasarela>>(`/comercial/pasarelas/${id}`, {
    metodo: values.metodo,
    descripcion: values.descripcion || null,
    integracion: values.integracion,
    comisionPorcentaje: Number(values.comisionPorcentaje || 0),
    disponiblePresencial: values.disponiblePresencial,
    disponibleLinea: values.disponibleLinea,
    ...(values.apiKey ? { apiKey: values.apiKey } : {}),
    ...(values.apiSecret ? { apiSecret: values.apiSecret } : {}),
  })
  return response.data.data
}

export async function cambiarDisponibilidadPasarela(
  id: number,
  cambios: { presencial?: boolean; linea?: boolean },
): Promise<Pasarela> {
  const response = await httpClient.patch<Envelope<Pasarela>>(`/comercial/pasarelas/${id}/disponibilidad`, cambios)
  return response.data.data
}
