import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { CodigoPlan } from '@/modules/plataforma/portal/types'
import type { MiPlan, PagoConfirmado, PagoIniciado } from '../types'

export async function obtenerMiPlan(): Promise<MiPlan> {
  return unwrap(await httpClient.get<Envelope<MiPlan>>('/suscripcion'))
}

/** Abre el pago con Stripe de otro periodo (mismo plan) o de un cambio de plan. */
export async function pagarPlan(codigoPlan: CodigoPlan): Promise<PagoIniciado> {
  return unwrap(await httpClient.post<Envelope<PagoIniciado>>('/suscripcion/pagar', { codigoPlan }))
}

export async function confirmarPagoDePlan(sessionId: string): Promise<PagoConfirmado> {
  return unwrap(await httpClient.post<Envelope<PagoConfirmado>>('/suscripcion/confirmar', { sessionId }))
}
