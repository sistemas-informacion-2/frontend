import { useCallback, useEffect, useLayoutEffect, useRef, useState, type TransitionEvent } from 'react'
import type { Producto } from '@/modules/inventario/types'
import { useProductos } from '@/modules/inventario/hooks'
import { ProductoCard } from './ProductoCard'

const VISIBLES_ESCRITORIO = 4
const VISIBLES_TABLET = 3
const INTERVALO_MS = 3500

/** Mismos cortes que la cuadrícula del catálogo (sm y md), para que las columnas coincidan. */
function contarVisibles(): number {
  if (typeof window === 'undefined') return VISIBLES_ESCRITORIO
  if (window.matchMedia('(min-width: 768px)').matches) return VISIBLES_ESCRITORIO
  return window.matchMedia('(min-width: 640px)').matches ? VISIBLES_TABLET : 1
}

/** Cuántas tarjetas se ven a la vez: 4 en escritorio, 3 en tablet y 1 en móvil. */
function useVisibles() {
  const [visibles, setVisibles] = useState(contarVisibles)

  useEffect(() => {
    const medios = [window.matchMedia('(min-width: 640px)'), window.matchMedia('(min-width: 768px)')]
    const actualizar = () => setVisibles(contarVisibles())
    actualizar()
    medios.forEach((media) => media.addEventListener('change', actualizar))
    return () => medios.forEach((media) => media.removeEventListener('change', actualizar))
  }, [])

  return visibles
}

interface CarruselPistaProps {
  ofertas: Producto[]
  visibles: number
  pausado: boolean
}

/**
 * Pista deslizante del carrusel. Se monta con una `key` que cambia al variar
 * `visibles` o la cantidad de ofertas, de modo que el índice arranca limpio sin
 * necesidad de sincronizar estado dentro de un efecto.
 */
function CarruselPista({ ofertas, visibles, pausado }: CarruselPistaProps) {
  const total = ofertas.length
  const hayLoop = total > visibles
  const contenedorRef = useRef<HTMLDivElement | null>(null)
  const pistaRef = useRef<HTMLDivElement | null>(null)
  const [anchoSlide, setAnchoSlide] = useState(0)
  // La posición real empieza después de los clones del inicio (solo existen si hayLoop).
  // Sin loop no hay clones: el índice debe arrancar en 0 o apunta fuera de la pista
  // y la traslada entera fuera de vista (queda el cuadro en blanco).
  const [indice, setIndice] = useState(hayLoop ? visibles : 0)
  const [sinTransicion, setSinTransicion] = useState(false)

  const prefijo = hayLoop ? ofertas.slice(-visibles) : []
  const sufijo = hayLoop ? ofertas.slice(0, visibles) : []
  const slides = hayLoop ? [...prefijo, ...ofertas, ...sufijo] : ofertas

  // Medimos el ancho de cada tarjeta para poder desplazar la pista en píxeles.
  useLayoutEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return
    const medir = () => setAnchoSlide(contenedor.clientWidth / visibles)
    medir()
    const observer = new ResizeObserver(medir)
    observer.observe(contenedor)
    return () => observer.disconnect()
  }, [visibles])

  const siguiente = useCallback(() => {
    setIndice((actual) => (actual >= visibles + total ? actual : actual + 1))
  }, [visibles, total])

  const anterior = useCallback(() => {
    setIndice((actual) => (actual <= 0 ? actual : actual - 1))
  }, [])

  // Auto-avance en loop, en pausa mientras el mouse está encima o la grilla está abierta.
  useEffect(() => {
    if (!hayLoop || pausado) return
    const id = window.setInterval(siguiente, INTERVALO_MS)
    return () => window.clearInterval(id)
  }, [hayLoop, pausado, siguiente])

  // Al cruzar los clones de los extremos, saltamos sin transición a la posición real equivalente.
  const alTerminarTransicion = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== pistaRef.current || event.propertyName !== 'transform' || !hayLoop) return
    if (indice >= visibles + total) {
      setSinTransicion(true)
      setIndice((actual) => actual - total)
      requestAnimationFrame(() => setSinTransicion(false))
    } else if (indice < visibles) {
      setSinTransicion(true)
      setIndice((actual) => actual + total)
      requestAnimationFrame(() => setSinTransicion(false))
    }
  }

  return (
    <div className="relative">
      {/* El margen negativo compensa la separación de los extremos: la primera y la última prenda alinean con la cuadrícula. */}
      <div ref={contenedorRef} className="overflow-hidden sm:-mx-3">
        <div
          ref={pistaRef}
          onTransitionEnd={alTerminarTransicion}
          className="flex"
          style={{
            transform: `translateX(-${indice * anchoSlide}px)`,
            transition: sinTransicion ? 'none' : 'transform 450ms ease-in-out',
          }}
        >
          {slides.map((producto, posicion) => (
            <div
              key={`${producto.id}-${posicion}`}
              className="shrink-0 px-2 sm:px-3"
              style={{ width: anchoSlide ? `${anchoSlide}px` : `${100 / visibles}%` }}
            >
              <ProductoCard producto={producto} />
            </div>
          ))}
        </div>
      </div>

      {hayLoop && (
        <>
          <button
            type="button"
            onClick={anterior}
            aria-label="Ver ofertas anteriores"
            className="absolute -left-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow hover:bg-neutral-50 sm:flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={siguiente}
            aria-label="Ver más ofertas"
            className="absolute -right-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow hover:bg-neutral-50 sm:flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}

/**
 * Carrusel de "Ofertas" del catálogo (CU08): trae TODOS los productos con
 * descuento (sin filtrar por categoría/temporada/sucursal/búsqueda). Solo
 * tiene sentido mostrarlo en "Todas" — `CatalogoPageView` lo monta o no
 * según `mostrarOfertas`, así que este componente en sí no decide cuándo
 * aparece, solo qué trae cuando lo montan.
 *
 * Muestra `visibles` tarjetas centradas (4 en escritorio, 3 en tablet, 1 en móvil). Si hay
 * más ofertas que tarjetas visibles, la pista se mueve en un loop infinito:
 * auto-avance cada pocos segundos (se pausa al pasar el mouse) y flechas
 * manuales. El bucle sin cortes se logra clonando `visibles` productos al
 * inicio y al final de la pista, y reubicando el índice sin transición cuando
 * cruza esos clones. "Ver todas" sigue desplegando la grilla completa.
 */
export function OfertasCarrusel() {
  const { productos: ofertas, isLoading } = useProductos({ soloOfertas: true })
  const visibles = useVisibles()
  const [expandido, setExpandido] = useState(false)
  const [pausado, setPausado] = useState(false)

  if (isLoading) return null
  if (ofertas.length === 0) return null

  return (
    <section
      className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      {/* En pantallas medianas el recuadro sobresale lo que mide su relleno: las prendas quedan del ancho de la cuadrícula. */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:-mx-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Ofertas</h2>
          {ofertas.length > VISIBLES_ESCRITORIO && (
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
            {ofertas.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <CarruselPista key={`${visibles}-${ofertas.length}`} ofertas={ofertas} visibles={visibles} pausado={pausado} />
        )}
      </div>
    </section>
  )
}
