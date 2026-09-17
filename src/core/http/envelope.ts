import type { AxiosResponse } from 'axios'

/** Forma en la que el backend envuelve toda respuesta exitosa (ver TransformInterceptor). */
export interface Envelope<T> {
  data: T
  timestamp: string
}

/** Azúcar para no repetir `response.data.data` en cada función de `api/`. */
export function unwrap<T>(response: AxiosResponse<Envelope<T>>): T {
  return response.data.data
}
