import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ImagenProducto, Producto } from '@/modules/inventario/types'
import { extraerMensajeError } from '@/shared/utils/error'
import { useCarrito, useEnLinea } from '../hooks'
import { useCarritoDrawer } from '../hooks/useCarritoDrawer'
import { StoreLogoMarca } from './StoreLogo'

interface ProductoCardProps {
  producto: Producto
  /** Retraso (ms) de la animacion de aparicion: en una grilla hace que las tarjetas entren en cascada. */
  retrasoAparicion?: number
}

/** La imagen principal va primero; el resto conserva el orden definido en el panel. */
function ordenarImagenes(imagenes: ImagenProducto[]): ImagenProducto[] {
  return [...imagenes].sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal) || a.orden - b.orden)
}

const FLECHA = 'absolute top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 dark:bg-neutral-900/90 dark:text-neutral-100'

export function ProductoCard({ producto, retrasoAparicion }: ProductoCardProps) {
  const imagenes = ordenarImagenes(producto.imagenes)
  const [indice, setIndice] = useState(0)
  const [cargada, setCargada] = useState(false)
  // La barra de agregado usa el carrito: se monta recién al pasar el cursor, no por cada tarjeta del catálogo.
  const [conBarra, setConBarra] = useState(false)
  const actual = imagenes[indice]
  const hayVarias = imagenes.length > 1
  const siguiente = hayVarias ? imagenes[(indice + 1) % imagenes.length] : undefined
  const rutaDetalle = `/producto/${producto.id}`

  // Navegacion circular: despues de la ultima imagen vuelve a la primera.
  const mover = (paso: number) => setIndice((current) => (current + paso + imagenes.length) % imagenes.length)

  return (
    <div
      className={`group ${retrasoAparicion === undefined ? '' : 'animate-aparecer'}`}
      style={retrasoAparicion ? { animationDelay: `${retrasoAparicion}ms` } : undefined}
      onMouseEnter={() => setConBarra(true)}
    >
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
        {producto.descuentoPorcentaje > 0 && (
          <span title={`${producto.descuentoPorcentaje}% de descuento`} className="pointer-events-none absolute left-2 top-2 z-20 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
            -{producto.descuentoPorcentaje}%
          </span>
        )}

        {actual ? (
          <>
            {!cargada && <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />}
            <img
              src={actual.url}
              alt={producto.nombre}
              loading="lazy"
              onLoad={() => setCargada(true)}
              className={`h-full w-full object-cover transition-[transform,opacity,filter] duration-300 ease-out group-hover:scale-105 ${cargada ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}
            />
            {siguiente && <img src={siguiente.url} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-105 [@media(hover:hover)]:group-hover:opacity-100" />}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_1px_1px,rgba(113,113,122,0.14)_1px,transparent_0)] bg-[length:14px_14px]">
            <StoreLogoMarca className="opacity-40 grayscale" />
            <span className="text-xs text-neutral-400">Foto próximamente</span>
          </div>
        )}

        <Link to={rutaDetalle} aria-label={`Ver detalle de ${producto.nombre}`} className="absolute inset-0 z-[1]" />

        {hayVarias && (
          <>
            <button type="button" onClick={() => mover(-1)} aria-label="Imagen anterior" className={`${FLECHA} left-2`}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => mover(1)} aria-label="Imagen siguiente" className={`${FLECHA} right-2`}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}

        {conBarra && <BarraAgregado producto={producto} rutaDetalle={rutaDetalle} />}
      </div>

      <Link to={rutaDetalle} className="mt-2 block truncate text-sm font-medium text-neutral-900 hover:text-brand dark:text-neutral-100">
        {producto.nombre}
      </Link>
      {producto.descuentoPorcentaje > 0 ? (
        <p className="text-sm">
          <span className="font-semibold text-neutral-900 dark:text-neutral-50">Bs {(producto.precio * (1 - producto.descuentoPorcentaje / 100)).toFixed(2)}</span>{' '}
          <span className="text-neutral-400 line-through">Bs {producto.precio}</span>
        </p>
      ) : (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Bs {producto.precio}</p>
      )}
    </div>
  )
}

/** Tallas para agregar sin entrar a la ficha. Con varios colores o cortes hay que elegir en la ficha. */
function BarraAgregado({ producto, rutaDetalle }: { producto: Producto; rutaDetalle: string }) {
  const { autenticado, esCliente, agregar } = useCarrito()
  const enLinea = useEnLinea()
  const abrirCarrito = useCarritoDrawer((estado) => estado.abrir)
  const navigate = useNavigate()
  const [ocupada, setOcupada] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if ((autenticado && !esCliente) || !enLinea) return null

  const activas = producto.variantes.filter((variante) => variante.activo)
  const unaPorTalla = new Set(activas.map((variante) => variante.talla)).size === activas.length && new Set(activas.map((variante) => variante.color)).size === 1

  const agregarTalla = async (idVariante: number) => {
    if (!autenticado) {
      navigate('/login', { state: { from: rutaDetalle } })
      return
    }
    setOcupada(idVariante)
    setError(null)
    try {
      await agregar([{ idVarianteProducto: idVariante, cantidad: 1 }])
      abrirCarrito()
    } catch (requestError) {
      setError(extraerMensajeError(requestError, 'No se pudo agregar.'))
    } finally {
      setOcupada(null)
    }
  }

  return (
    <div className="absolute inset-x-2 bottom-2 z-20 hidden translate-y-2 rounded-lg bg-white/95 p-1.5 opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)]:block dark:bg-neutral-900/95">
      {error && <p className="mb-1 px-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {unaPorTalla && activas.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <ShoppingBag className="mx-0.5 h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
          {activas.map((variante) => (
            <button
              key={variante.id}
              type="button"
              disabled={ocupada !== null}
              onClick={() => void agregarTalla(variante.id)}
              aria-label={`Agregar talla ${variante.talla} al carrito`}
              className="min-w-7 rounded px-1.5 py-1 text-xs font-medium text-neutral-800 transition-colors hover:bg-brand-solid hover:text-brand-on disabled:opacity-50 dark:text-neutral-200"
            >
              {variante.talla}
            </button>
          ))}
        </div>
      ) : (
        <Link to={rutaDetalle} className="block py-1 text-center text-xs font-medium text-neutral-800 hover:text-brand dark:text-neutral-200">
          Elegir talla y color
        </Link>
      )}
    </div>
  )
}
