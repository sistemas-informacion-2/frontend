import { Link } from 'react-router-dom'
import type { Categoria, Producto } from '@/modules/inventario/types'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'

interface CatalogoPageViewProps {
  categorias: Categoria[]
  productos: Producto[]
  cargando: boolean
  mostrarInvitacionAdmin: boolean
}

export function CatalogoPageView({ categorias, productos, cargando, mostrarInvitacionAdmin }: CatalogoPageViewProps) {
  return (
    <div>
      <section className="bg-neutral-100 px-4 py-12 text-center sm:px-6 sm:py-20 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl dark:text-white">Nueva colección disponible</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-600 sm:text-base dark:text-neutral-400">
          Descubre las últimas tendencias en moda, seleccionadas para cada temporada.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {cargando ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-3/4 w-full" />
            ))}
          </div>
        ) : productos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
            {productos.map((producto) => {
              const imagenPrincipal = producto.imagenes.find((imagen) => imagen.esPrincipal) ?? producto.imagenes[0]
              return (
                <div key={producto.id} className="group">
                  <div className="aspect-3/4 w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    {imagenPrincipal && (
                      <img
                        src={imagenPrincipal.url}
                        alt={producto.nombre}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium dark:text-white">{producto.nombre}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Bs {producto.precio}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={<span className="text-4xl">🛍️</span>}
            title={categorias.length === 0 ? 'Todavía no hay catálogo cargado' : 'Sin productos en esta selección'}
            description="El equipo está preparando el catálogo. Vuelve pronto o inicia sesión como administrador para comenzar a cargar productos."
            action={
              mostrarInvitacionAdmin ? (
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
