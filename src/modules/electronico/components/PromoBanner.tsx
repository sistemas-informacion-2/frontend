interface PromoBannerProps {
  /** Mayor porcentaje de descuento entre los productos en oferta. */
  descuentoMaximo: number
  /** Temporada vigente, si existe, para nombrar la colección en el mensaje. */
  temporada?: string
  verOfertasActivo: boolean
  onVerOfertas: () => void
  onVerTodo: () => void
}

export function PromoBanner({ descuentoMaximo, temporada, verOfertasActivo, onVerOfertas, onVerTodo }: PromoBannerProps) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-100 px-6 py-6 sm:px-10 sm:py-7 md:flex-row md:items-center md:justify-between dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">★ Promoción activa</p>
        <h2 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-neutral-900 sm:text-2xl dark:text-white">
          Aprovecha hasta un {descuentoMaximo}% OFF en prendas seleccionadas
          {temporada ? ` de la Colección ${temporada}` : ''}.
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Envío gratis en compras mayores a Bs 200.</p>
      </div>

      <button
        type="button"
        onClick={verOfertasActivo ? onVerTodo : onVerOfertas}
        className="shrink-0 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {verOfertasActivo ? 'Ver todo el catálogo' : 'Ver ofertas'}
      </button>
    </div>
  )
}
