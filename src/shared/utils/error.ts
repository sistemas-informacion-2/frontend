import { isAxiosError } from 'axios'
import { mensajeSinConexion } from '@/core/http/errors'

/** Mensaje legible de un error: el del servidor, el de falta de conexión, uno propio de la app o el mensaje por defecto. */
export function extraerMensajeError(error: unknown, fallbackMessage = 'No se pudo completar la operación.'): string {
  if (typeof error === 'string') return error
  if (isAxiosError<{ message?: string | string[]; error?: string }>(error)) {
    const data = error.response?.data
    if (typeof data?.message === 'string') return data.message
    if (Array.isArray(data?.message) && data.message.length > 0) return data.message.join(', ')
    if (typeof data?.error === 'string') return data.error
    return mensajeSinConexion(error) ?? fallbackMessage
  }
  // Errores lanzados por la propia app (p. ej. el carrito sin conexión) traen un texto ya listo para mostrar.
  if (error instanceof Error && error.message) return error.message
  return fallbackMessage
}
