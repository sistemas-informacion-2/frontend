import { isAxiosError } from 'axios'

/** Forma en la que el backend envuelve todo error (ver AllExceptionsFilter). */
export interface ApiErrorBody {
  statusCode: number
  message: string[]
  error: string
  timestamp: string
  path: string
}

/** Código HTTP de un error de la API, si lo es. */
export function getApiStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined
}

/**
 * Extrae un mensaje legible de un error de axios contra la API.
 * Si no es un error de axios o no trae `message`, devuelve `fallback`.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    const message = err.response?.data?.message
    if (Array.isArray(message) && message.length > 0) return message[0]
    if (typeof message === 'string') return message
  }
  return fallback
}
