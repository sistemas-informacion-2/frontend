import { formatoFecha } from '@/modules/plataforma/portal/utils/formato'
import type { EstadoVigencia, MiPlan, TipoPagoPlan } from '../types'

export const ETIQUETA_VIGENCIA: Record<EstadoVigencia, { texto: string; tono: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  SIN_VENCIMIENTO: { texto: 'Sin vencimiento', tono: 'neutral' },
  VIGENTE: { texto: 'Vigente', tono: 'success' },
  POR_VENCER: { texto: 'Por vencer', tono: 'warning' },
  EN_GRACIA: { texto: 'En gracia', tono: 'danger' },
  VENCIDO: { texto: 'Vencido', tono: 'danger' },
}

export const TIPO_PAGO: Record<TipoPagoPlan, string> = {
  ALTA: 'Alta',
  RENOVACION: 'Renovación',
  CAMBIO_PLAN: 'Cambio de plan',
}

function dias(n: number): string {
  return `${n} ${n === 1 ? 'día' : 'días'}`
}

/** Una frase sobre el vencimiento: "Vence el 9 de diciembre de 2026 (en 30 días)". */
export function textoVencimiento(miPlan: Pick<MiPlan, 'venceEl' | 'vigencia' | 'diasRestantes' | 'finDeGracia'>): string {
  if (!miPlan.venceEl) return 'Tu plan no tiene fecha de vencimiento.'
  const fecha = formatoFecha(miPlan.venceEl)
  const restantes = miPlan.diasRestantes ?? 0
  if (miPlan.vigencia === 'EN_GRACIA') {
    return `Venció el ${fecha}. La tienda sigue operando hasta el ${formatoFecha(miPlan.finDeGracia!)}.`
  }
  if (miPlan.vigencia === 'VENCIDO') return `Venció el ${fecha}. Renuévalo para que la tienda vuelva a operar.`
  return `Vence el ${fecha} (${restantes <= 0 ? 'hoy' : `en ${dias(restantes)}`}).`
}
