import { useState } from 'react'
import type { ImagenProducto } from '@/modules/inventario/types'

interface GaleriaProductoProps {
  imagenes: ImagenProducto[]
  nombre: string
}

const FLECHA =
  'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-2xl leading-none text-neutral-900 shadow hover:bg-white dark:bg-neutral-900/85 dark:text-white dark:hover:bg-neutral-900'

/** Miniaturas a la izquierda (arriba en móvil), foto grande con contador "1 / N" y flechas. */
export function GaleriaProducto({ imagenes, nombre }: GaleriaProductoProps) {
  const ordenadas = [...imagenes].sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal) || a.orden - b.orden)
  const [indice, setIndice] = useState(0)
  const actual = ordenadas[indice]
  const hayVarias = ordenadas.length > 1
  const mover = (paso: number) => setIndice((current) => (current + paso + ordenadas.length) % ordenadas.length)

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {hayVarias && (
        <div className="flex gap-2 overflow-x-auto md:max-h-[640px] md:flex-col md:overflow-x-hidden md:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ordenadas.map((imagen, posicion) => (
            <button
              key={imagen.id}
              type="button"
              onClick={() => setIndice(posicion)}
              aria-label={`Ver imagen ${posicion + 1}`}
              aria-current={posicion === indice}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-neutral-100 dark:bg-neutral-800 ${
                posicion === indice ? 'border-neutral-900 dark:border-white' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={imagen.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
        {actual ? (
          <img src={actual.url} alt={`${nombre} (imagen ${indice + 1})`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-neutral-300 dark:text-neutral-600">🛍️</div>
        )}

        {hayVarias && (
          <>
            <span className="absolute left-3 top-3 z-10 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-neutral-900 shadow dark:bg-neutral-900/85 dark:text-white">
              {indice + 1} / {ordenadas.length}
            </span>
            <button type="button" onClick={() => mover(-1)} aria-label="Imagen anterior" className={`${FLECHA} left-3`}>
              ‹
            </button>
            <button type="button" onClick={() => mover(1)} aria-label="Imagen siguiente" className={`${FLECHA} right-3`}>
              ›
            </button>
          </>
        )}
      </div>
    </div>
  )
}
