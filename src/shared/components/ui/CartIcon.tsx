import { Link } from 'react-router-dom'
import { useCarrito } from '@/modules/electronico/hooks/useCarrito'

export function CartIcon() {
  const { cantidadTotal } = useCarrito()

  return (
    <Link
      to="/carrito"
      aria-label="Carrito de compras"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      🛒
      {cantidadTotal > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white dark:bg-white dark:text-neutral-900">
          {cantidadTotal}
        </span>
      )}
    </Link>
  )
}
