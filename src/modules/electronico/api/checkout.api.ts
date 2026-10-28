import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { CompraOnline, DatosTarjeta, IniciarQrRespuesta, IniciarStripeRespuesta, MetodoPagoOnline } from '../types'

/**
 * Sin `idReserva` se paga el carrito; con `idReserva`, el anticipo de esa reserva. Las dos rutas comparten forma,
 * así que el mismo formulario de pago sirve para ambos.
 */
const base = (idReserva?: number) => (idReserva === undefined ? '/electronico/checkout' : `/electronico/checkout/reservas/${idReserva}`)

export async function fetchMetodosOnline(): Promise<MetodoPagoOnline[]> {
  return unwrap(await httpClient.get<Envelope<MetodoPagoOnline[]>>('/electronico/checkout/metodos'))
}

/** Crea la sesión de Stripe Checkout; después hay que enviar al cliente a `urlPago`. */
export async function iniciarPagoStripe(idReserva?: number): Promise<IniciarStripeRespuesta> {
  return unwrap(await httpClient.post<Envelope<IniciarStripeRespuesta>>(`${base(idReserva)}/stripe/sesion`))
}

/** Al volver de Stripe: cobra lo que el cliente autorizó y registra la compra o el anticipo. */
export async function confirmarPagoStripe(sessionId: string, idReserva?: number): Promise<CompraOnline> {
  return unwrap(await httpClient.post<Envelope<CompraOnline>>(`${base(idReserva)}/stripe/confirmar`, { sessionId }))
}

export async function generarQrPago(idReserva?: number): Promise<IniciarQrRespuesta> {
  return unwrap(await httpClient.post<Envelope<IniciarQrRespuesta>>(`${base(idReserva)}/qr`))
}

export async function confirmarQrPago(referencia: string, idReserva?: number): Promise<CompraOnline> {
  return unwrap(await httpClient.post<Envelope<CompraOnline>>(`${base(idReserva)}/qr/confirmar`, { referencia }))
}

export async function pagarConTarjeta(tarjeta: DatosTarjeta, idReserva?: number): Promise<CompraOnline> {
  return unwrap(await httpClient.post<Envelope<CompraOnline>>(`${base(idReserva)}/tarjeta`, tarjeta))
}
