import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { ReservaEstadoBadge } from '../../components/ReservaEstadoBadge'
import type { Reserva } from '../../types'
import { bs, estaActiva, formatearFechaHora, tiempoRestante } from '../../utils/reservas'

interface MisReservasPageViewProps {
  autenticado: boolean
  esCliente: boolean
  reservas: Reserva[]
  cargando: boolean
  error: string | null
  /** Id de la reserva que se está cancelando, para bloquear su botón. */
  cancelando: number | null
  /** Id de la reserva que espera confirmación de cancelación. */
  confirmando: number | null
  onPedirCancelar: (id: number | null) => void
  onCancelar: (id: number) => void
}

const BOTON_LINK =
  'rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200'

export function MisReservasPageView({
  autenticado,
  esCliente,
  reservas,
  cargando,
  error,
  cancelando,
  confirmando,
  onPedirCancelar,
  onCancelar,
}: MisReservasPageViewProps) {
  if (!autenticado || !esCliente) {
    return (
      <div className="py-6">
        <EmptyState
          icon={<span className="text-4xl">📌</span>}
          title={autenticado ? 'Las reservas son solo para clientes' : 'Inicia sesión para ver tus reservas'}
          description={
            autenticado
              ? 'Entraste con una cuenta del personal. Gestiona las reservas desde el panel de administración.'
              : 'Aquí verás las prendas que apartaste y el plazo que tienes para retirarlas.'
          }
          action={
            <Link to={autenticado ? '/admin/reservas' : '/login'} state={{ from: '/mi-cuenta/reservas' }} className={BOTON_LINK}>
              {autenticado ? 'Ir al panel' : 'Iniciar sesión'}
            </Link>
          }
        />
      </div>
    )
  }

  if (cargando) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, indice) => (
          <Skeleton key={indice} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  if (reservas.length === 0) {
    return (
      <div className="py-6">
        <EmptyState
          icon={<span className="text-4xl">📌</span>}
          title="Aún no tienes reservas"
          description="Elige tus prendas en el catálogo y usa el botón Reservar para apartarlas en la sucursal que prefieras."
          action={
            <Link to="/" className={BOTON_LINK}>
              Ir al catálogo
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Mis reservas</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Paga el anticipo en línea para confirmar tu reserva y retira tus prendas en la sucursal antes del plazo.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <ul className="mt-5 space-y-4">
        {reservas.map((reserva) => {
          const activa = estaActiva(reserva.estado)
          return (
            <li key={reserva.id} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">{reserva.codigoReserva}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Retira en {reserva.sucursalNombre}</p>
                </div>
                <ReservaEstadoBadge estado={reserva.estado} />
              </div>

              <ul className="mt-4 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                {reserva.detalles.map((detalle) => (
                  <li key={detalle.id} className="flex justify-between gap-3">
                    <span>
                      {detalle.cantidad} × {detalle.productoNombre}{' '}
                      <span className="text-neutral-500 dark:text-neutral-400">
                        ({detalle.talla} / {detalle.color})
                      </span>
                    </span>
                    <span>{bs(detalle.subtotal)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 grid gap-3 border-t border-neutral-200 pt-4 text-sm sm:grid-cols-3 dark:border-neutral-800">
                <div>
                  <dt className="text-xs text-neutral-500 dark:text-neutral-400">Total</dt>
                  <dd className="font-semibold text-neutral-900 dark:text-white">{bs(reserva.montoTotal)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500 dark:text-neutral-400">{reserva.anticipoPagado > 0 ? 'Anticipo pagado' : 'Anticipo a pagar'}</dt>
                  <dd className="font-semibold text-neutral-900 dark:text-white">{bs(reserva.anticipoPagado > 0 ? reserva.anticipoPagado : reserva.montoAnticipo)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500 dark:text-neutral-400">{activa ? 'Retirar hasta' : 'Vencía'}</dt>
                  <dd className="font-semibold text-neutral-900 dark:text-white">
                    {formatearFechaHora(reserva.fechaLimite)}
                    {activa && <span className="block text-xs font-normal text-amber-700 dark:text-amber-400">Quedan {tiempoRestante(reserva.fechaLimite)}</span>}
                  </dd>
                </div>
              </dl>

              {reserva.estado === 'COMPLETADA' && reserva.codigoNotaVenta && (
                <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">Retirada y pagada · nota de venta {reserva.codigoNotaVenta}</p>
              )}
              {reserva.estado === 'CANCELADA' && reserva.observaciones && (
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{reserva.observaciones}</p>
              )}

              {reserva.estado === 'PENDIENTE' && (
                <div className="mt-4 rounded-md bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <p>Tu reserva está apartada, pero se confirma al pagar el anticipo de {bs(reserva.montoAnticipo)}.</p>
                  <Link
                    to={`/checkout/reserva/${reserva.id}`}
                    className="mt-2 inline-block rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
                  >
                    Pagar anticipo
                  </Link>
                </div>
              )}

              {activa && (
                <div className="mt-4">
                  {confirmando === reserva.id ? (
                    <div className="space-y-3">
                      {reserva.anticipoPagado > 0 && (
                        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          Ya pagaste un anticipo de {bs(reserva.anticipoPagado)}. Al cancelar no se devuelve automáticamente; consulta en la sucursal si aplica un reembolso.
                        </p>
                      )}
                      <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => onPedirCancelar(null)} disabled={cancelando === reserva.id} className="rounded-full">
                          Volver
                        </Button>
                        <Button onClick={() => onCancelar(reserva.id)} loading={cancelando === reserva.id} className="rounded-full bg-red-700 hover:bg-red-600">
                          Sí, cancelar reserva
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPedirCancelar(reserva.id)}
                      className="text-sm font-medium text-red-700 underline hover:text-red-600 dark:text-red-400"
                    >
                      Cancelar reserva
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
