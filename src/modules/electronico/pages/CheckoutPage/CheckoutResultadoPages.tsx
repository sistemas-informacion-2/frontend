import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import type { CompraOnline } from '../../types'
import { bs } from '../../utils/reservas'

const BOTON_LINK =
  'rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200'
const BOTON_SECUNDARIO =
  'rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'

/** Confirmación tras una compra pagada. Los datos llegan por el estado de navegación; sin ellos no hay nada que mostrar. */
export function CompraExitosaPage() {
  const compra = (useLocation().state as { compra?: CompraOnline } | null)?.compra
  if (!compra) return <Navigate to="/mi-cuenta/compras" replace />

  const esReserva = compra.tipo === 'ANTICIPO_RESERVA'

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
      <p className="text-5xl" aria-hidden="true">
        ✅
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        {esReserva ? '¡Reserva confirmada!' : '¡Compra confirmada!'}
      </h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {esReserva ? (
          <>
            Pagaste el anticipo de <strong>{bs(compra.montoTotal)}</strong> con {compra.metodo}. Tu reserva es la{' '}
            <span className="font-mono font-semibold">{compra.codigoReserva}</span>: retira tus prendas en la sucursal antes del plazo y paga el saldo al recogerlas.
          </>
        ) : (
          <>
            Pagaste <strong>{bs(compra.montoTotal)}</strong> con {compra.metodo}. Tu nota de venta es la{' '}
            <span className="font-mono font-semibold">{compra.codigoNota}</span>.
          </>
        )}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to={esReserva ? '/mi-cuenta/reservas' : '/mi-cuenta/compras'} className={BOTON_LINK}>
          {esReserva ? 'Ver mis reservas' : 'Ver mis compras'}
        </Link>
        <Link to="/" className={BOTON_SECUNDARIO}>
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}

export function PagoCanceladoPage() {
  const reserva = useSearchParams()[0].get('reserva')
  const volver = reserva && Number.isInteger(Number(reserva)) ? `/checkout/reserva/${reserva}` : '/checkout'

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <EmptyState
        icon={<span className="text-4xl">↩️</span>}
        title="Cancelaste el pago en PayPal"
        description={reserva ? 'No se te cobró nada. Tu reserva sigue apartada hasta que venza su plazo; puedes pagar el anticipo cuando quieras.' : 'No se te cobró nada y tu carrito sigue como lo dejaste.'}
        action={
          <Link to={volver} className={BOTON_LINK}>
            Volver al pago
          </Link>
        }
      />
    </div>
  )
}
