import { useRef, useState } from 'react'
import { useProductos } from '@/modules/inventario/hooks'
import { ProductoCard } from './ProductoCard'

const ANCHO_TARJETA_PX = 176 // w-44

/**
 * Carrusel de "Ofertas" del catálogo (CU08): trae TODOS los productos con
 * descuento (sin filtrar por categoría/temporada/sucursal/búsqueda). Solo
 * tiene sentido mostrarlo en "Todas" — `CatalogoPageView` lo monta o no
 * según `mostrarOfertas`, así que este componente en sí no decide cuándo
 * aparece, solo qué trae cuando lo montan. Se acomodan en una sola fila que
 * se desplaza en horizontal con los botones ‹ › (o "Ver todas" para
 * desplegar todo en una grilla normal), en vez de acumularse hacia abajo.
 */
export function OfertasCarrusel() {
  const { productos: ofertas, isLoading } = useProductos({ soloOfertas: true })
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [expandido, setExpandido] = useState(false)

  if (isLoading) return null
  if (ofertas.length === 0) return null

  const desplazar = (direccion: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direccion * ANCHO_TARJETA_PX * 2, behavior: 'smooth' })
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Ofertas</h2>
          {ofertas.length > 4 && (
            <button
              type="button"
              onClick={() => setExpandido((actual) => !actual)}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              {expandido ? 'Ver menos' : 'Ver todas'}
            </button>
          )}
        </div>

        {expandido ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {ofertas.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <div className="relative">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scroll-smooth pb-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              {ofertas.map((producto) => (
                <div key={producto.id} className="w-36 shrink-0 sm:w-44">
                  <ProductoCard producto={producto} />
                </div>
              ))}
            </div>

            {ofertas.length > 2 && (
              <>
                <button
                  type="button"
                  onClick={() => desplazar(-1)}
                  aria-label="Ver ofertas anteriores"
                  className="absolute -left-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow hover:bg-neutral-50 sm:flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => desplazar(1)}
                  aria-label="Ver más ofertas"
                  className="absolute -right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow hover:bg-neutral-50 sm:flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
