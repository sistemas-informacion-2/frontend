import type { AxiosResponse } from 'axios'
import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { ProbadorVariante } from '../types'

/** Assets de una variante para superponerla en el probador virtual (CU19). */
export async function fetchProbadorVariante(id: number): Promise<ProbadorVariante> {
  return unwrap(await httpClient.get<Envelope<ProbadorVariante>>(`/electronico/probador/variante/${id}`))
}

/** Variante vista por la seccion admin del probador virtual (CU19). */
export interface ProbadorVarianteAdmin {
  id: number
  sku: string
  talla: string
  color: string
  corte: string
  modelo3dUrl: string | null
  producto: { id: number; nombre: string }
}

/** Lista las variantes activas para asociarles un modelo 3D. */
export async function listarVariantesProbador(q?: string): Promise<ProbadorVarianteAdmin[]> {
  const busqueda = q?.trim()
  return unwrap(
    await httpClient.get<Envelope<ProbadorVarianteAdmin[]>>('/electronico/probador/variantes', {
      params: busqueda ? { q: busqueda } : undefined,
    }),
  )
}

/** Sube un modelo 3D .glb y lo asocia a la variante. */
export async function subirModeloProbador(varianteId: number, file: File): Promise<ProbadorVarianteAdmin> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await httpClient.post<Envelope<ProbadorVarianteAdmin>, AxiosResponse<Envelope<ProbadorVarianteAdmin>>>(
    `/electronico/probador/modelos/${varianteId}`,
    formData,
  )
  return response.data.data
}

/** Desvincula y elimina el modelo 3D de la variante. */
export async function quitarModeloProbador(varianteId: number): Promise<ProbadorVarianteAdmin> {
  return unwrap(
    await httpClient.delete<Envelope<ProbadorVarianteAdmin>>(`/electronico/probador/modelos/${varianteId}`),
  )
}