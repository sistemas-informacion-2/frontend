import { Link } from 'react-router-dom'
import { PromoBanner } from '../../components/PromoBanner'
import { ProductoCard } from '../../components/ProductoCard'
import type { Categoria, Producto } from '@/modules/inventario/types'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'

export interface FiltroActivo {
  clave: 'categoria' | 'temporada' | 'ofertas' | 'q'
  etiqueta: string
}

interface CatalogoPageViewProps {
  categorias: Categoria[]
  productos: Producto[]
  cargando: boolean
  mostrarInvitacionAdmin: boolean
  filtros: FiltroActivo[]
  onQuitarFiltro: (clave: FiltroActivo['clave']) => void
  onQuitarTodos: () => void
  descuentoMaximo: number
  temporadaVigente?: string
  onVerOfertas: () => void
}

export function CatalogoPageView({
  categorias,
  productos,
  cargando,
  mostrarInvitacionAdmin,
  filtros,
  onQuitarFiltro,
  onQuitarTodos,
  descuentoMaximo,
  temporadaVigente,
  onVerOfertas,
}: CatalogoPageViewProps) {
  return (
    <div>
      {descuentoMaximo > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
          <PromoBanner
            descuentoMaximo={descuentoMaximo}
            temporada={temporadaVigente}
            verOfertasActivo={filtros.some((filtro) => filtro.clave === 'ofertas')}
            onVerOfertas={onVerOfertas}
            onVerTodo={() => onQuitarFiltro('ofertas')}
          />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {filtros.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            {filtros.map((filtro) => (
              <span
                key={filtro.clave}
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 py-1 pl-3 pr-2 font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
              >
                {filtro.etiqueta}
                <button
                  type="button"
                  onClick={() => onQuitarFiltro(filtro.clave)}
                  aria-label={`Quitar filtro ${filtro.etiqueta}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
                >
                  ✕
                </button>
              </span>
            ))}
            <button type="button" onClick={onQuitarTodos} className="ml-1 text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
              Quitar filtros
            </button>
          </div>
        )}
        {cargando ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-3/4 w-full" />
            ))}
          </div>
        ) : productos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
            {productos.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<span className="text-4xl">🛍️</span>}
            title={
              filtros.length > 0
                ? 'No encontramos productos con esos filtros'
                : categorias.length === 0
                  ? 'Todavía no hay catálogo cargado'
                  : 'Sin productos en esta selección'
            }
            description={
              filtros.length > 0
                ? 'Prueba con otra búsqueda o quita alguno de los filtros activos.'
                : 'El equipo está preparando el catálogo. Vuelve pronto o inicia sesión como administrador para comenzar a cargar productos.'
            }
            action={
              filtros.length === 0 && mostrarInvitacionAdmin ? (
                <Link
                  to="/login"
                  className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
                >
                  Iniciar sesión como administrador
                </Link>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  )
}
