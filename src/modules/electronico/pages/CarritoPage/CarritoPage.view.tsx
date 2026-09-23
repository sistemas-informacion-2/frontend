import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { SelectorCantidad } from '../../components/SelectorCantidad'
import type { Carrito } from '../../types'

interface CarritoPageViewProps {
  autenticado: boolean
  esCliente: boolean
  carrito: Carrito
  cargando: boolean
  error: string | null
  ocupado: number | 'todo' | null
  onCantidad: (idItem: number, cantidad: number) => void
  onQuitar: (idItem: number) => void
  onVaciar: () => void
}

const BOTON_LINK =
  'rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200'

function bs(valor: number): string {
  return `Bs ${valor.toFixed(2)}`
}

export function CarritoPageView({ autenticado, esCliente, carrito, cargando, error, ocupado, onCantidad, onQuitar, onVaciar }: CarritoPageViewProps) {
  if (!autenticado || !esCliente) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<span className="text-4xl">🛒</span>}
          title={autenticado ? 'El carrito es solo para clientes' : 'Inicia sesión para ver tu carrito'}
          description={
            autenticado
              ? 'Entraste con una cuenta del personal. Inicia sesión con una cuenta de cliente para comprar.'
              : 'Tu carrito se guarda en tu cuenta, así lo encuentras en cualquier dispositivo.'
          }
          action={
            <Link to="/login" state={{ from: '/carrito' }} className={BOTON_LINK}>
              Iniciar sesión
            </Link>
          }
        />
      </div>
    )
  }

  if (cargando) {
    return (
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 sm:px-6">
        {Array.from({ length: 3 }).map((_, indice) => (
          <Skeleton key={indice} className="h-28 w-full" />
        ))}
      </div>
    )
  }

  if (carrito.items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<span className="text-4xl">🛒</span>}
          title="Tu carrito está vacío"
          description="Explora el catálogo y agrega las prendas que te gusten."
          action={
            <Link to="/" className={BOTON_LINK}>
              Ir al catálogo
            </Link>
          }
        />
      </div>
    )
  }

  const hayNoDisponibles = carrito.items.some((item) => !item.disponible)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Tu carrito</h1>
        <button
          type="button"
          onClick={onVaciar}
          disabled={ocupado !== null}
          className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
        >
          Vaciar carrito
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {hayNoDisponibles && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Algunos productos ya no tienen stock suficiente. Ajusta la cantidad o quítalos antes de continuar.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ul className="space-y-3">
          {carrito.items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <Link to={`/producto/${item.idProducto}`} className="h-28 w-22 shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                {item.imagenUrl && <img src={item.imagenUrl} alt={item.productoNombre} className="h-full w-full object-cover" />}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <Link to={`/producto/${item.idProducto}`} className="block truncate text-sm font-medium text-neutral-900 hover:underline dark:text-white">
                    {item.productoNombre}
                  </Link>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Talla {item.talla} · {item.color} · {item.corte}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{bs(item.precioUnitario)} c/u</p>
                  {!item.disponible && (
                    <p className="mt-1 text-xs font-medium text-red-700 dark:text-red-400">
                      {item.stockDisponible === 0 ? 'Agotado' : `Solo quedan ${item.stockDisponible}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <SelectorCantidad
                    cantidad={item.cantidad}
                    minimo={1}
                    maximo={ocupado === item.id ? item.cantidad : item.stockDisponible}
                    etiqueta={`${item.productoNombre} ${item.talla} ${item.color}`}
                    onMas={() => onCantidad(item.id, item.cantidad + 1)}
                    onMenos={() => onCantidad(item.id, item.cantidad - 1)}
                    onQuitar={() => onQuitar(item.id)}
                  />
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{bs(item.subtotal)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Resumen</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <dt>Productos</dt>
              <dd>{carrito.cantidadTotal}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold text-neutral-900 dark:text-white">
              <dt>Total</dt>
              <dd>{bs(carrito.total)}</dd>
            </div>
          </dl>

          {hayNoDisponibles ? (
            <Button disabled className="mt-5 w-full rounded-full" title="Ajusta o quita las prendas sin stock para continuar">
              Finalizar compra
            </Button>
          ) : (
            <Link
              to="/checkout"
              className="mt-5 flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Finalizar compra
            </Link>
          )}
          <Link to="/mi-cuenta/reservas" className="mt-3 block text-center text-sm text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
            Mis reservas
          </Link>
          <Link to="/" className="mt-3 block text-center text-sm text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  )
}
