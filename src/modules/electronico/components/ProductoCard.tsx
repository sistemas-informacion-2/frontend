import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ImagenProducto, Producto } from '@/modules/inventario/types'

interface ProductoCardProps {
  producto: Producto
  /** Retraso (ms) de la animacion de aparicion: en una grilla hace que las tarjetas entren en cascada. */
  retrasoAparicion?: number
}

/** La imagen principal va primero; el resto conserva el orden definido en el panel. */
function ordenarImagenes(imagenes: ImagenProducto[]): ImagenProducto[] {
  return [...imagenes].sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal) || a.orden - b.orden)
}

const FLECHA =
  'absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg leading-none text-neutral-900 shadow transition-opacity hover:bg-white focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:bg-neutral-900/85 dark:text-white dark:hover:bg-neutral-900'

export function ProductoCard({ producto, retrasoAparicion }: ProductoCardProps) {
  const imagenes = ordenarImagenes(producto.imagenes)
  const [indice, setIndice] = useState(0)
  const actual = imagenes[indice]
  const hayVarias = imagenes.length > 1
  const rutaDetalle = `/producto/${producto.id}`

  // Navegacion circular: despues de la ultima imagen vuelve a la primera.
  const mover = (paso: number) => setIndice((current) => (current + paso + imagenes.length) % imagenes.length)

  return (
    <div className="group animate-aparecer" style={retrasoAparicion ? { animationDelay: `${retrasoAparicion}ms` } : undefined}>
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg bg-neutral-100 transition-shadow duration-300 group-hover:shadow-lg dark:bg-neutral-800">
        {producto.descuentoPorcentaje > 0 && (
          <span
            title={`${producto.descuentoPorcentaje}% de descuento`}
            className="pointer-events-none absolute left-0 top-3 z-10 rounded-r-full bg-neutral-900 py-1 pl-2.5 pr-3 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm dark:bg-white dark:text-neutral-900"
          >
            -{producto.descuentoPorcentaje}%
          </span>
        )}

        {actual && (
          <img
            src={actual.url}
            alt={producto.nombre}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        )}

        <Link
          to={rutaDetalle}
          aria-label={`Ver detalle de ${producto.nombre}`}
          className="absolute inset-0 z-[1]"
        />

        {hayVarias && (
          <>
            <button type="button" onClick={() => mover(-1)} aria-label="Imagen anterior" className={`${FLECHA} left-2`}>
              ‹
            </button>
            <button type="button" onClick={() => mover(1)} aria-label="Imagen siguiente" className={`${FLECHA} right-2`}>
              ›
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
              {imagenes.map((imagen, posicion) => (
                <span
                  key={imagen.id}
                  aria-hidden="true"
                  className={`h-1.5 rounded-full transition-all ${posicion === indice ? 'w-4 bg-white shadow' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Link to={rutaDetalle} className="mt-2 block text-sm font-medium dark:text-white">
        {/* Subrayado que crece de izquierda a derecha al pasar el mouse por la tarjeta. */}
        <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-bottom-left bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
          {producto.nombre}
        </span>
      </Link>
      {producto.descuentoPorcentaje > 0 ? (
        <p className="text-sm">
          <span className="font-semibold text-neutral-900 dark:text-white">
            Bs {(producto.precio * (1 - producto.descuentoPorcentaje / 100)).toFixed(2)}
          </span>{' '}
          <span className="text-neutral-400 line-through dark:text-neutral-500">Bs {producto.precio}</span>
        </p>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Bs {producto.precio}</p>
      )}
    </div>
  )
}
