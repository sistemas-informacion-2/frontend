import { QRCodeSVG } from 'qrcode.react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { CodigoMetodoOnline, DatosTarjeta, IniciarQrRespuesta, MetodoPagoOnline } from '../../types'
import { bs } from '../../utils/reservas'

/** Lo que se está pagando: el carrito entero o el anticipo de una reserva. */
export interface PedidoPago {
  titulo: string
  resumenTitulo: string
  items: Array<{ id: number; titulo: string; detalle: string; subtotal: number }>
  totalEtiqueta: string
  total: number
  /** Aclaración bajo el total (p. ej. cuánto falta pagar al retirar la reserva). */
  nota?: string
  hayNoDisponibles: boolean
  volver: { to: string; etiqueta: string }
}

/** Se muestra cuando no hay nada que pagar (carrito vacío, reserva ya pagada o vencida...). */
export interface SinPedido {
  titulo: string
  descripcion: string
  to: string
  etiqueta: string
}

interface CheckoutPageViewProps {
  autenticado: boolean
  esCliente: boolean
  cargando: boolean
  pedido: PedidoPago | null
  sinPedido: SinPedido | null
  metodos: MetodoPagoOnline[]
  cargandoMetodos: boolean
  seleccionado: CodigoMetodoOnline | null
  tarjeta: DatosTarjeta
  qr: IniciarQrRespuesta | null
  procesando: boolean
  /** true mientras el navegador va hacia PayPal: el botón debe seguir ocupado hasta que cambie de página. */
  redirigiendo: boolean
  error: string | null
  onSeleccionar: (codigo: CodigoMetodoOnline) => void
  onTarjeta: (campo: keyof DatosTarjeta, valor: string) => void
  onPagarTarjeta: (event: FormEvent<HTMLFormElement>) => void
  onGenerarQr: () => void
  onConfirmarQr: () => void
  onPagarPaypal: () => void
}

const BOTON_LINK =
  'rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200'

const ICONO: Record<CodigoMetodoOnline, string> = { QR: '📱', PAYPAL: '🅿️', TARJETA: '💳' }
const DESCRIPCION: Record<CodigoMetodoOnline, string> = {
  QR: 'Escanea el código con la app de tu banco',
  PAYPAL: 'Paga con tu cuenta PayPal',
  TARJETA: 'Tarjeta de crédito o débito',
}

export function CheckoutPageView({
  autenticado,
  esCliente,
  cargando,
  pedido,
  sinPedido,
  metodos,
  cargandoMetodos,
  seleccionado,
  tarjeta,
  qr,
  procesando,
  redirigiendo,
  error,
  onSeleccionar,
  onTarjeta,
  onPagarTarjeta,
  onGenerarQr,
  onConfirmarQr,
  onPagarPaypal,
}: CheckoutPageViewProps) {
  if (!autenticado || !esCliente) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<span className="text-4xl">🔒</span>}
          title={autenticado ? 'El pago es solo para clientes' : 'Inicia sesión para pagar'}
          description={autenticado ? 'Entraste con una cuenta del personal.' : 'Inicia sesión para terminar tu pago.'}
          action={
            <Link to="/login" state={{ from: window.location.pathname }} className={BOTON_LINK}>
              Iniciar sesión
            </Link>
          }
        />
      </div>
    )
  }

  if (cargando) {
    return (
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<span className="text-4xl">🧾</span>}
          title={sinPedido?.titulo ?? 'No hay nada que pagar'}
          description={sinPedido?.descripcion}
          action={
            <Link to={sinPedido?.to ?? '/'} className={BOTON_LINK}>
              {sinPedido?.etiqueta ?? 'Ir al catálogo'}
            </Link>
          }
        />
      </div>
    )
  }

  const actual = metodos.find((metodo) => metodo.codigo === seleccionado)
  const ocupado = procesando || redirigiendo

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{pedido.titulo}</h1>
        <Link to={pedido.volver.to} className="text-sm text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          ← {pedido.volver.etiqueta}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Elige cómo pagar</h2>
            {cargandoMetodos ? (
              <Skeleton className="h-24 w-full" />
            ) : metodos.length === 0 ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Por ahora no hay métodos de pago en línea disponibles. Inténtalo de nuevo más tarde.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {metodos.map((metodo) => (
                  <button
                    key={metodo.codigo}
                    type="button"
                    onClick={() => onSeleccionar(metodo.codigo)}
                    aria-pressed={metodo.codigo === seleccionado}
                    disabled={ocupado}
                    className={`rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${
                      metodo.codigo === seleccionado
                        ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900'
                        : 'border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600'
                    }`}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {ICONO[metodo.codigo]}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">{metodo.metodo}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{DESCRIPCION[metodo.codigo]}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {actual?.simulado && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Modo demostración: este método no cobra dinero real; el pago se aprueba de forma simulada.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          {actual?.codigo === 'PAYPAL' && (
            <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Te llevaremos a PayPal para que apruebes el pago. PayPal no opera en bolivianos: se cobra el equivalente en dólares (USD) al tipo de cambio de la tienda.
              </p>
              <Button onClick={onPagarPaypal} loading={ocupado} disabled={pedido.hayNoDisponibles} className="mt-4 rounded-full">
                Pagar {bs(pedido.total)} con PayPal
              </Button>
              {redirigiendo && (
                <p role="status" className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                  Abriendo PayPal… puede tardar unos segundos. No cierres esta ventana.
                </p>
              )}
            </div>
          )}

          {actual?.codigo === 'QR' && (
            <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
              {qr ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-lg bg-white p-3">
                    <QRCodeSVG value={qr.referencia} size={200} />
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Escanea el código con la app de tu banco y paga <strong>{bs(qr.montoBob)}</strong>. Vence a las{' '}
                    {new Date(qr.expiraEn).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}.
                  </p>
                  <Button onClick={onConfirmarQr} loading={ocupado} className="rounded-full">
                    Ya realicé el pago
                  </Button>
                  <button type="button" onClick={onGenerarQr} disabled={ocupado} className="text-sm text-neutral-500 underline">
                    Generar un código nuevo
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Generaremos un código QR por {bs(pedido.total)}.</p>
                  <Button onClick={onGenerarQr} loading={ocupado} disabled={pedido.hayNoDisponibles} className="mt-4 rounded-full">
                    Generar código QR
                  </Button>
                </div>
              )}
            </div>
          )}

          {actual?.codigo === 'TARJETA' && (
            <form onSubmit={onPagarTarjeta} className="space-y-4 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
              <Input label="Titular de la tarjeta" autoComplete="cc-name" required maxLength={80} value={tarjeta.titular} onChange={(event) => onTarjeta('titular', event.target.value)} />
              <Input
                label="Número de tarjeta"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4111 1111 1111 1111"
                required
                value={tarjeta.numero}
                onChange={(event) => onTarjeta('numero', event.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Vencimiento (MM/AA)" inputMode="numeric" autoComplete="cc-exp" placeholder="12/29" required value={tarjeta.vencimiento} onChange={(event) => onTarjeta('vencimiento', event.target.value)} />
                <Input label="CVV" inputMode="numeric" autoComplete="cc-csc" type="password" required maxLength={4} value={tarjeta.cvv} onChange={(event) => onTarjeta('cvv', event.target.value)} />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Los datos de tu tarjeta no se guardan.</p>
              <Button type="submit" loading={ocupado} disabled={pedido.hayNoDisponibles} className="rounded-full">
                Pagar {bs(pedido.total)}
              </Button>
            </form>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{pedido.resumenTitulo}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {pedido.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="text-neutral-700 dark:text-neutral-300">
                  {item.titulo}
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">{item.detalle}</span>
                </span>
                <span className="text-neutral-900 dark:text-white">{bs(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-base font-semibold text-neutral-900 dark:border-neutral-800 dark:text-white">
            <span>{pedido.totalEtiqueta}</span>
            <span>{bs(pedido.total)}</span>
          </div>
          {pedido.nota && <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">{pedido.nota}</p>}
          {pedido.hayNoDisponibles && (
            <p className="mt-3 text-xs text-red-700 dark:text-red-400">Algunas prendas ya no tienen stock. Ajusta tu carrito para continuar.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
