import { ShoppingBag } from 'lucide-react'
import { useCarrito } from '@/modules/electronico/hooks/useCarrito'
import { useCarritoDrawer } from '@/modules/electronico/hooks/useCarritoDrawer'

export function CartIcon() {
  const { cantidadTotal } = useCarrito()
  const abrir = useCarritoDrawer((estado) => estado.abrir)

  return (
    <button
      type="button"
      onClick={abrir}
      aria-label="Abrir carrito de compras"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
      {cantidadTotal > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-solid px-1 text-[10px] font-semibold text-brand-on">{cantidadTotal}</span>}
    </button>
  )
}
