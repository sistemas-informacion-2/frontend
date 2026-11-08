import { Search } from 'lucide-react'
import { useDeferredValue, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { fetchProductos } from '@/modules/inventario/api'
import { useSucursalActiva } from '../hooks'

const MIN_CARACTERES = 2
const MAX_SUGERENCIAS = 5

/** Buscador del encabezado: Ctrl/Cmd+K lo enfoca y, al escribir, sugiere productos sin salir de la página. */
export function BuscadorTienda({ inicial }: { inicial: string }) {
  const [texto, setTexto] = useState(inicial)
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLFormElement | null>(null)
  const entradaRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { sucursalActiva } = useSucursalActiva()
  const termino = useDeferredValue(texto.trim())
  const atajo = /mac/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'

  const { data: sugerencias = [] } = useSWR(
    abierto && termino.length >= MIN_CARACTERES ? ['tienda/sugerencias', termino, sucursalActiva?.id] : null,
    () => fetchProductos({ search: termino, idSucursal: sucursalActiva?.id }),
    { revalidateOnFocus: false, shouldRetryOnError: false, keepPreviousData: true },
  )

  useEffect(() => {
    const alPulsar = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        entradaRef.current?.focus()
      }
      if (event.key === 'Escape') setAbierto(false)
    }
    const alClicFuera = (event: MouseEvent) => {
      if (!contenedorRef.current?.contains(event.target as Node)) setAbierto(false)
    }
    document.addEventListener('keydown', alPulsar)
    document.addEventListener('mousedown', alClicFuera)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.removeEventListener('mousedown', alClicFuera)
    }
  }, [])

  // La búsqueda se suma a los filtros activos del catálogo (categoría, temporada).
  const buscar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAbierto(false)
    const params = new URLSearchParams(location.pathname === '/' ? location.search : '')
    if (texto.trim()) params.set('q', texto.trim())
    else params.delete('q')
    const query = params.toString()
    navigate(query ? `/?${query}` : '/')
  }

  const mostrar = abierto && termino.length >= MIN_CARACTERES && sugerencias.length > 0

  return (
    <form ref={contenedorRef} onSubmit={buscar} role="search" className="relative order-3 w-full md:order-none md:mx-auto md:w-auto md:max-w-xl md:flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
      <input
        ref={entradaRef}
        type="search"
        name="q"
        value={texto}
        onChange={(event) => {
          setTexto(event.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        autoComplete="off"
        aria-label="Buscar productos"
        placeholder="Buscar productos, categorías…"
        className="w-full rounded-full border border-neutral-200 bg-neutral-100/70 py-2 pl-10 pr-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-500 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand-ring md:pr-16 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:bg-neutral-900"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 md:block dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">{atajo}</kbd>

      {mostrar && (
        <ul className="absolute inset-x-0 top-full z-50 mt-2 animate-fade-in overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {sugerencias.slice(0, MAX_SUGERENCIAS).map((producto) => (
            <li key={producto.id}>
              <Link to={`/producto/${producto.id}`} onClick={() => setAbierto(false)} className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <span className="h-11 w-9 shrink-0 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">{producto.imagenes[0] && <img src={producto.imagenes[0].url} alt="" className="h-full w-full object-cover" />}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{producto.nombre}</span>
                <span className="shrink-0 text-sm text-neutral-600 dark:text-neutral-400">Bs {(producto.precio * (1 - producto.descuentoPorcentaje / 100)).toFixed(2)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
