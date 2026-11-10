import type { TipoMovimientoInventario } from '../types'

type Tono = 'success' | 'warning' | 'danger' | 'neutral'

/** Clave SWR del kardex de una fila de stock, con su rango de fechas. */
export function claveKardex(idStock: number, desde: string, hasta: string) {
  return ['kardex', idStock, desde, hasta] as const
}

/** Coincide con todas las claves del kardex de esa fila (cualquier rango): para revalidarlo tras un ajuste. */
export function esClaveKardexDe(idStock: number) {
  return (clave: unknown) => Array.isArray(clave) && clave[0] === 'kardex' && clave[1] === idStock
}

/** Topes del backend: sin rango devuelve los ultimos 200; con rango, hasta 1000. */
export const TOPE_RECIENTES = 200
export const TOPE_CON_RANGO = 1000

/** Como se muestra cada tipo de movimiento del kardex: verde entra, rojo sale, ambar reserva, gris ajustes. */
export const TIPO_MOVIMIENTO: Record<TipoMovimientoInventario, { texto: string; tono: Tono }> = {
  SALDO_INICIAL: { texto: 'Saldo inicial', tono: 'neutral' },
  ENTRADA_COMPRA: { texto: 'Compra', tono: 'success' },
  SALIDA_VENTA: { texto: 'Venta', tono: 'danger' },
  RESERVA: { texto: 'Reservado', tono: 'warning' },
  LIBERACION_RESERVA: { texto: 'Reserva liberada', tono: 'neutral' },
  SALIDA_RESERVA: { texto: 'Reserva entregada', tono: 'danger' },
  DEVOLUCION_REINGRESO: { texto: 'Devolución', tono: 'success' },
  MERMA: { texto: 'Merma', tono: 'danger' },
  AJUSTE_ENTRADA: { texto: 'Ajuste (entra)', tono: 'neutral' },
  AJUSTE_SALIDA: { texto: 'Ajuste (sale)', tono: 'neutral' },
  TRANSFERENCIA_SALIDA: { texto: 'Transferencia (sale)', tono: 'warning' },
  TRANSFERENCIA_ENTRADA: { texto: 'Transferencia (entra)', tono: 'success' },
}

/** "Bs 42.50"; vacio si no hay costo. */
export function costoKardex(valor: number | null): string {
  return valor === null ? '—' : `Bs ${valor.toFixed(2)}`
}

/** "05/11/2026 14:30" en hora local. */
export function fechaHoraKardex(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

/** Un cambio con signo: "+5", "−3" o vacio si no hubo cambio. */
export function conSigno(valor: number): string {
  if (valor === 0) return ''
  return valor > 0 ? `+${valor}` : `−${Math.abs(valor)}`
}
