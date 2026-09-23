interface SelectorCantidadProps {
  cantidad: number
  /** Máximo que se puede tener; 0 deja todo en gris (agotado). */
  maximo: number
  /** Piso del botón −: 0 en el detalle (deselecciona) y 1 en el carrito (para quitar se usa la papelera). */
  minimo?: number
  onMas: () => void
  onMenos: () => void
  onQuitar: () => void
  /** Texto accesible del producto/variante, para lectores de pantalla. */
  etiqueta: string
}

const BOTON =
  'flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 text-base text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-300 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:disabled:border-neutral-800 dark:disabled:bg-neutral-900 dark:disabled:text-neutral-600'

/** Botones "papelera  −  cantidad  +" del detalle del producto y del carrito. */
export function SelectorCantidad({ cantidad, maximo, minimo = 0, onMas, onMenos, onQuitar, etiqueta }: SelectorCantidadProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={onQuitar} disabled={cantidad === 0} aria-label={`Quitar ${etiqueta}`} className={BOTON}>
        🗑
      </button>
      <button type="button" onClick={onMenos} disabled={cantidad <= minimo} aria-label={`Menos ${etiqueta}`} className={BOTON}>
        −
      </button>
      <span aria-live="polite" className="flex h-8 min-w-8 items-center justify-center rounded-md border border-neutral-300 px-2 text-sm font-medium text-neutral-900 dark:border-neutral-700 dark:text-white">
        {cantidad}
      </span>
      <button type="button" onClick={onMas} disabled={cantidad >= maximo} aria-label={`Más ${etiqueta}`} className={BOTON}>
        +
      </button>
    </div>
  )
}
