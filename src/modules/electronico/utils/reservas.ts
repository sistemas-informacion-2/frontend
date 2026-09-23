import type { EstadoReserva } from '../types'

export const PORCENTAJE_ANTICIPO_MINIMO = 20

/** Una reserva sigue apartando stock mientras esté pendiente o con anticipo pagado. */
export function estaActiva(estado: EstadoReserva): boolean {
  return estado === 'PENDIENTE' || estado === 'PAGADA'
}

export function bs(valor: number): string {
  return `Bs ${valor.toFixed(2)}`
}

/** "21/09/2026 16:30" en hora local. */
export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

/** Tiempo que queda hasta el límite: "2 d 4 h", "35 min" o "Vencida". */
export function tiempoRestante(iso: string, ahora: number = Date.now()): string {
  const restante = new Date(iso).getTime() - ahora
  if (restante <= 0) return 'Vencida'
  const minutos = Math.floor(restante / 60_000)
  if (minutos < 60) return `${Math.max(1, minutos)} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas} h ${minutos % 60} min`
  return `${Math.floor(horas / 24)} d ${horas % 24} h`
}

export function extraerMensajeError(error: unknown, porDefecto = 'No se pudo completar la operación.'): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  if (Array.isArray(message)) return String(message[0] ?? porDefecto)
  if (typeof message === 'string') return message
  return porDefecto
}
