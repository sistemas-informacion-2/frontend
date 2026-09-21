import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { CompraOnline, DatosTarjeta, IniciarPaypalRespuesta, IniciarQrRespuesta, MetodoPagoOnline } from '../types'

/**
 * Sin `idReserva` se paga el carrito; con `idReserva`, el anticipo de esa reserva. Las dos rutas comparten forma,
 * así que el mismo formulario de pago sirve para ambos.
 */
const base = (idReserva?: number) => (idReserva === undefined ? '/electronico/checkout' : `/electronico/checkout/reservas/${idReserva}`)

export async function fetchMetodosOnline(): Promise<MetodoPagoOnline[]> {
  return unwrap(await httpClient.get<Envelope<MetodoPagoOnline[]>>('/electronico/checkout/metodos'))
}

/** Crea la orden en PayPal; después hay que enviar al cliente a `urlAprobacion`. */
export async function iniciarPagoPaypal(idReserva?: number): Promise<IniciarPaypalRespuesta> {
  return unwrap(await httpClient.post<Envelope<IniciarPaypalRespuesta>>(`${base(idReserva)}/paypal/orden`))
}

/** Al volver de PayPal: cobra la orden aprobada y registra la compra o el anticipo. */
export async function capturarPagoPaypal(orderId: string, idReserva?: number): Promise<CompraOnline> {
  return unwrap(await httpClient.post<Envelope<CompraOnline>>(`${base(idReserva)}/paypal/capturar`, { orderId }))
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
