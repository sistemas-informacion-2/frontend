import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { capturarPagoPaypal } from '../../api'
import { useCarrito } from '../../hooks'
import { extraerMensajeError } from '../../utils/reservas'

const BOTON_LINK =
  'rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200'

/** PayPal vuelve aquí con `?token=<orden>`: se cobra la orden aprobada y se registra la compra. */
export function PaypalRetornoPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { mutate } = useSWRConfig()
  const { autenticado, esCliente, refrescar } = useCarrito()
  const orderId = params.get('token')
  // `?reserva=ID` lo agrega el servidor al crear la orden del anticipo de una reserva; sin él se cobra el carrito.
  const reservaParam = params.get('reserva')
  const idReserva = reservaParam && Number.isInteger(Number(reservaParam)) ? Number(reservaParam) : undefined
  const volverAlPago = idReserva === undefined ? '/checkout' : `/checkout/reserva/${idReserva}`
  const [error, setError] = useState<string | null>(null)
  // React en desarrollo monta los efectos dos veces; el servidor es idempotente, pero así se evita la llamada doble.
  const iniciado = useRef(false)

  useEffect(() => {
    if (!orderId || !esCliente || iniciado.current) return
    iniciado.current = true
    capturarPagoPaypal(orderId, idReserva)
      .then(async (compra) => {
        await Promise.all([refrescar(), mutate('electronico/reservas/mias')])
        navigate('/checkout/exito', { replace: true, state: { compra } })
      })
      .catch((requestError) => setError(extraerMensajeError(requestError, 'No se pudo confirmar el pago con PayPal.')))
  }, [orderId, idReserva, esCliente, navigate, refrescar, mutate])

  if (!autenticado || !esCliente) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<span className="text-4xl">🔒</span>}
          title="Inicia sesión para confirmar tu pago"
          description="Tu sesión se cerró mientras pagabas. Inicia sesión de nuevo y vuelve a intentarlo."
          action={
            <Link to="/login" state={{ from: volverAlPago }} className={BOTON_LINK}>
              Iniciar sesión
            </Link>
          }
        />
      </div>
    )
  }

  if (!orderId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<span className="text-4xl">⚠️</span>}
          title="No recibimos el pago de PayPal"
          description="Falta el identificador de la orden. Vuelve al pago e inténtalo de nuevo."
          action={
            <Link to={volverAlPago} className={BOTON_LINK}>
              Volver al pago
            </Link>
          }
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<span className="text-4xl">⚠️</span>}
          title="No pudimos completar tu compra"
          description={error}
          action={
            <Link to={volverAlPago} className={BOTON_LINK}>
              Volver al pago
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="text-4xl" aria-hidden="true">
        ⏳
      </p>
      <h1 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-white">Confirmando tu pago con PayPal…</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No cierres esta ventana.</p>
    </div>
  )
}
