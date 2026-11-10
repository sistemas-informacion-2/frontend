import { ShoppingBag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Carrito } from '../types'
import { bs } from '../utils/reservas'
import { SelectorCantidad } from './SelectorCantidad'

interface CarritoDrawerViewProps {
  autenticado: boolean
  esCliente: boolean
  carrito: Carrito
  cargando: boolean
  error: string | null
  ocupado: number | null
  onCerrar: () => void
  onCantidad: (idItem: number, cantidad: number) => void
  onQuitar: (idItem: number) => void
}

const ENLACE_PRINCIPAL = 'flex w-full items-center justify-center rounded-md bg-brand-solid px-4 py-2.5 text-sm font-medium text-brand-on transition-colors hover:bg-brand-solid-hover'

export function CarritoDrawerView({ autenticado, esCliente, carrito, cargando, error, ocupado, onCerrar, onCantidad, onQuitar }: CarritoDrawerViewProps) {
  const hayNoDisponibles = carrito.items.some((item) => !item.disponible)

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Cerrar carrito" onClick={onCerrar} className="absolute inset-0 animate-fade-in cursor-default bg-black/40" />
      <aside role="dialog" aria-modal="true" aria-label="Tu carrito" className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col bg-white shadow-xl dark:bg-neutral-950">
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Tu carrito{carrito.cantidadTotal > 0 ? ` (${carrito.cantidadTotal})` : ''}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!autenticado || !esCliente ? (
            <EmptyState
              icon={<ShoppingBag className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />}
              title={autenticado ? 'El carrito es solo para clientes' : 'Inicia sesión para ver tu carrito'}
              description={autenticado ? 'Entraste con una cuenta del personal.' : 'Tus prendas te esperarán en cualquier dispositivo.'}
              action={
                !autenticado && (
                  <Link to="/login" onClick={onCerrar} className="rounded-md bg-brand-solid px-4 py-2 text-sm font-medium text-brand-on hover:bg-brand-solid-hover">
                    Iniciar sesión
                  </Link>
                )
              }
            />
          ) : cargando ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, indice) => (
                <Skeleton key={indice} className="h-24 w-full" />
              ))}
            </div>
          ) : carrito.items.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />}
              title="Tu carrito está vacío"
              description="Agrega tus prendas favoritas desde el catálogo."
              action={
                <button type="button" onClick={onCerrar} className="text-sm font-medium text-brand hover:underline">
                  Seguir comprando
                </button>
              }
            />
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {carrito.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  <Link to={`/producto/${item.idProducto}`} onClick={onCerrar} className="h-24 w-[72px] shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                    {item.imagenUrl && <img src={item.imagenUrl} alt={item.productoNombre} className="h-full w-full object-cover" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/producto/${item.idProducto}`} onClick={onCerrar} className="block truncate text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100">
                      {item.productoNombre}
                    </Link>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      Talla {item.talla} · {item.color}
                    </p>
                    {!item.disponible && <p className="mt-0.5 text-xs font-medium text-red-600 dark:text-red-400">{item.stockDisponible === 0 ? 'Agotado' : `Solo quedan ${item.stockDisponible}`}</p>}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <SelectorCantidad
                        cantidad={item.cantidad}
                        minimo={1}
                        maximo={ocupado === item.id ? item.cantidad : item.stockDisponible}
                        etiqueta={`${item.productoNombre} ${item.talla} ${item.color}`}
                        onMas={() => onCantidad(item.id, item.cantidad + 1)}
                        onMenos={() => onCantidad(item.id, item.cantidad - 1)}
                        onQuitar={() => onQuitar(item.id)}
                      />
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{bs(item.subtotal)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p role="alert" className="mt-3 animate-fade-in rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        {autenticado && esCliente && carrito.items.length > 0 && (
          <footer className="space-y-3 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <p className="flex justify-between text-base font-semibold text-neutral-900 dark:text-neutral-50">
              <span>Total</span>
              <span>{bs(carrito.total)}</span>
            </p>
            {hayNoDisponibles ? (
              <p className="text-xs text-red-600 dark:text-red-400">Ajusta las prendas sin stock para continuar.</p>
            ) : (
              <Link to="/checkout" onClick={onCerrar} className={ENLACE_PRINCIPAL}>
                Finalizar compra
              </Link>
            )}
            <Link to="/carrito" onClick={onCerrar} className="block text-center text-sm text-neutral-600 hover:underline dark:text-neutral-400">
              Ver carrito completo
            </Link>
          </footer>
        )}
      </aside>
    </div>
  )
}
