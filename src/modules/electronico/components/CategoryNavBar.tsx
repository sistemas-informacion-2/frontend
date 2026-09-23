import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCategorias } from '@/modules/inventario/hooks'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useSucursalActiva, useTemporadasPublicas } from '../hooks'

const CLASES_PILDORA_BASE = 'flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors'
const CLASES_PILDORA_ACTIVA = 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
const CLASES_PILDORA_INACTIVA = 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'

/** Emoji + color por estación, para que la píldora de temporada vigente se distinga a simple vista. */
const ESTILO_TEMPORADA: Record<string, { emoji: string; inactiva: string; activa: string }> = {
  Invierno: {
    emoji: '❄️',
    inactiva: 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/70',
    activa: 'bg-sky-500 text-white dark:bg-sky-400 dark:text-neutral-900',
  },
  Verano: {
    emoji: '🔥',
    inactiva: 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/70',
    activa: 'bg-orange-500 text-white dark:bg-orange-400 dark:text-neutral-900',
  },
  Primavera: {
    emoji: '🌱',
    inactiva: 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/70',
    activa: 'bg-green-500 text-white dark:bg-green-400 dark:text-neutral-900',
  },
  Otoño: {
    emoji: '🍂',
    inactiva: 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70',
    activa: 'bg-amber-700 text-white dark:bg-amber-600 dark:text-white',
  },
}
const ESTILO_TEMPORADA_POR_DEFECTO = { emoji: '📅', inactiva: CLASES_PILDORA_INACTIVA, activa: CLASES_PILDORA_ACTIVA }

/**
 * Barra de categorías debajo del buscador del catálogo público: "Todas"
 * primero (filtro global, no depende del árbol de categorías), y después una
 * píldora por cada categoría padre (Ropa Superior, Ropa Inferior, Vestidos y
 * Enterizos...) que al apretarla despliega sus subcategorías, y al final el
 * selector de sucursal. Reemplaza el acordeón "Categorías" que antes vivía
 * en `StoreSidebar`. Si hay una temporada VIGENTE, también se destaca una
 * píldora para esa (el resto de temporadas sigue solo en el sidebar: es un
 * filtro secundario, no hace falta duplicar la lista completa acá).
 *
 * La sucursal (CU08) no es un filtro más: no existe "Todas las sucursales"
 * — siempre hay una concreta elegida (`useSucursalActiva`), porque de ahí
 * sale el stock real al pagar (CU14). Cambiarla acá es lo único que la
 * cambia en todo el sitio (catálogo, ficha, carrito, checkout, reserva).
 *
 * Las Ofertas ya no son un filtro de acá: viven en su propio carrusel fijo
 * en el catálogo (`OfertasCarrusel`), que a propósito no se filtra por nada
 * de esta barra.
 */
export function CategoryNavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { categorias, isLoading } = useCategorias()
  const { temporadas } = useTemporadasPublicas()
  const { sucursales, sucursalActiva, setSucursal } = useSucursalActiva()
  const temporadaVigente = temporadas.find((temporada) => temporada.estado === 'VIGENTE')
  // 'sucursal' es un valor centinela: el desplegable de sucursal usa el mismo
  // mecanismo de apertura/cierre que las categorías (mismo click-afuera, mismo Escape).
  const [abiertaId, setAbiertaId] = useState<number | 'sucursal' | null>(null)
  const contenedorRef = useRef<HTMLDivElement | null>(null)

  const enCatalogo = location.pathname === '/'
  const params = new URLSearchParams(enCatalogo ? location.search : '')
  const categoriaActiva = Number(params.get('categoria')) || null
  const temporadaActiva = Number(params.get('temporada')) || null
  // "Todas" está activa cuando no hay ningún filtro de categoría puesto (búsqueda y temporada no cuentan; sucursal ya no es un filtro removible).
  const todasActiva = enCatalogo && categoriaActiva === null

  useEffect(() => {
    if (abiertaId === null) return
    const cerrarSiEsFuera = (event: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) setAbiertaId(null)
    }
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbiertaId(null)
    }
    document.addEventListener('mousedown', cerrarSiEsFuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarSiEsFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abiertaId])

  const irATodas = () => {
    setAbiertaId(null)
    navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const irATemporada = (id: number) => {
    setAbiertaId(null)
    navigate(`/?temporada=${id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const irACategoria = (id: number) => {
    setAbiertaId(null)
    const nuevosParams = new URLSearchParams(params)
    nuevosParams.set('categoria', String(id))
    navigate(`/?${nuevosParams.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // La sucursal vive en su propio store (persistido), no en la URL: cambiarla no toca categoría/temporada.
  const cambiarSucursal = (id: number) => {
    setAbiertaId(null)
    setSucursal(id)
    if (enCatalogo) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const categoriasRaiz = categorias.filter((categoria) => categoria.categoriaPadreId === null)

  return (
    <div ref={contenedorRef} className="relative border-b border-neutral-100 dark:border-neutral-800">
      {/* flex-wrap en vez de overflow-x-auto: un scroll horizontal aquí obliga al
          navegador a recortar también el eje vertical, y eso tapaba el desplegable
          de subcategorías (se abría, pero quedaba invisible). */}
      <nav aria-label="Categorías" className="flex flex-wrap justify-center gap-1 px-4 py-1.5 sm:px-6">
        <button
          type="button"
          onClick={irATodas}
          className={`${CLASES_PILDORA_BASE} ${todasActiva ? CLASES_PILDORA_ACTIVA : CLASES_PILDORA_INACTIVA}`}
        >
          Todas
        </button>
        {temporadaVigente &&
          (() => {
            const estilo = ESTILO_TEMPORADA[temporadaVigente.nombre] ?? ESTILO_TEMPORADA_POR_DEFECTO
            return (
              <button
                type="button"
                onClick={() => irATemporada(temporadaVigente.id)}
                className={`${CLASES_PILDORA_BASE} ${temporadaActiva === temporadaVigente.id ? estilo.activa : estilo.inactiva}`}
              >
                {estilo.emoji} {temporadaVigente.nombre}
              </button>
            )
          })()}

        {isLoading ? (
          <span className="flex items-center gap-4 pl-2">
            {Array.from({ length: 3 }).map((_, indice) => (
              <Skeleton key={indice} className="h-5 w-24" />
            ))}
          </span>
        ) : (
          categoriasRaiz.map((categoria) => {
            const tieneHijos = categoria.hijos.length > 0
            const abierta = tieneHijos && abiertaId === categoria.id
            const seleccionada = categoria.id === categoriaActiva || categoria.hijos.some((hijo) => hijo.id === categoriaActiva)

            return (
              <div key={categoria.id} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => (tieneHijos ? setAbiertaId(abierta ? null : categoria.id) : irACategoria(categoria.id))}
                  aria-expanded={tieneHijos ? abierta : undefined}
                  aria-haspopup={tieneHijos ? 'menu' : undefined}
                  className={`${CLASES_PILDORA_BASE} ${abierta || seleccionada ? CLASES_PILDORA_ACTIVA : CLASES_PILDORA_INACTIVA}`}
                >
                  {categoria.nombre}
                  {tieneHijos && (
                    <span aria-hidden="true" className={`text-xs transition-transform ${abierta ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  )}
                </button>

                {abierta && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full z-30 mt-1 min-w-48 rounded-lg border border-neutral-200 bg-white py-1.5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    {categoria.hijos.map((hijo) => (
                      <button
                        key={hijo.id}
                        type="button"
                        role="menuitem"
                        onClick={() => irACategoria(hijo.id)}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                          hijo.id === categoriaActiva
                            ? 'font-semibold text-neutral-900 dark:text-white'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {hijo.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}

        {sucursales.length > 0 &&
          (() => {
            const abierta = abiertaId === 'sucursal'
            return (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setAbiertaId(abierta ? null : 'sucursal')}
                  aria-expanded={abierta}
                  aria-haspopup="menu"
                  className={`${CLASES_PILDORA_BASE} ${abierta ? CLASES_PILDORA_ACTIVA : CLASES_PILDORA_INACTIVA}`}
                >
                  📍 {sucursalActiva?.nombre ?? '…'}
                  <span aria-hidden="true" className={`text-xs transition-transform ${abierta ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>

                {abierta && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-30 mt-1 min-w-48 rounded-lg border border-neutral-200 bg-white py-1.5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    {sucursales.map((sucursal) => (
                      <button
                        key={sucursal.id}
                        type="button"
                        role="menuitem"
                        onClick={() => cambiarSucursal(sucursal.id)}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                          sucursal.id === sucursalActiva?.id
                            ? 'font-semibold text-neutral-900 dark:text-white'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {sucursal.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
      </nav>
    </div>
  )
}
