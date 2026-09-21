import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/store/authStore'
import { useCerrarSesion } from '@/modules/acceso/hooks/useCerrarSesion'
import { useCategorias } from '@/modules/inventario/hooks'
import type { Categoria } from '@/modules/inventario/types'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useTemporadasPublicas } from '../hooks'
import type { EstadoTemporadaPublica } from '../types'
import { StoreLogo } from './StoreLogo'

const ITEMS_CUENTA = [
  { to: '/mi-cuenta', label: 'Perfil', end: true },
  { to: '/mi-cuenta/reservas', label: 'Mis reservas', end: false },
  { to: '/mi-cuenta/compras', label: 'Mis compras', end: false },
  { to: '/mi-cuenta/devoluciones', label: 'Mis devoluciones', end: false },
]

interface StoreSidebarProps {
  open: boolean
  onClose: () => void
}

const ESTADO_LABEL: Record<EstadoTemporadaPublica, string> = {
  VIGENTE: 'Vigente',
  PROXIMA: 'Próxima',
  FINALIZADA: 'Finalizada',
}

export function StoreSidebar({ open, onClose }: StoreSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const paramsActuales = new URLSearchParams(location.pathname === '/' ? location.search : '')
  const categoriaActiva = Number(paramsActuales.get('categoria')) || null
  const temporadaActiva = Number(paramsActuales.get('temporada')) || null
  const { categorias, isLoading: cargandoCategorias } = useCategorias()
  const { temporadas, isLoading: cargandoTemporadas } = useTemporadasPublicas()
  const autenticado = useAuthStore((state) => state.isAuthenticated)
  const esCliente = useAuthStore((state) => state.perfil?.tipoUsuario === 'C')
  // Un cliente dentro de "Mi cuenta" ve su menú de cuenta en lugar de categorías y temporadas.
  const modoCuenta = esCliente && location.pathname.startsWith('/mi-cuenta')
  const cerrarSesion = useCerrarSesion()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflowAnterior
    }
  }, [open, onClose])

  const filtrarPor = (parametro: 'categoria' | 'temporada', id: number) => {
    onClose()
    const params = new URLSearchParams(paramsActuales)
    params.set(parametro, String(id))
    navigate(`/?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCerrarSesion = () => {
    onClose()
    void cerrarSesion('/')
  }

  const irAContacto = () => {
    onClose()
    // Se espera a que el drawer libere el scroll del body antes de desplazar.
    window.setTimeout(() => {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Cerrar menú"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú de la tienda"
        className={`absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-[transform,visibility] duration-300 ease-out dark:bg-neutral-950 ${
          open ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-4 dark:border-neutral-800">
          <StoreLogo className="text-lg dark:text-white" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-md px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        {modoCuenta ? (
          <nav aria-label="Mi cuenta" className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Mi cuenta</p>
            {ITEMS_CUENTA.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="my-2 border-t border-neutral-100 dark:border-neutral-800" />
            <NavLink
              to="/"
              onClick={onClose}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
            >
              ← Seguir comprando
            </NavLink>
          </nav>
        ) : (
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          <Acordeon titulo="Categorías">
            {cargandoCategorias ? (
              <SkeletonLista />
            ) : categorias.length === 0 ? (
              <p className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">Aún no hay categorías.</p>
            ) : (
              <ListaCategorias
                categorias={categorias}
                nivel={0}
                activa={categoriaActiva}
                onSeleccionar={(id) => filtrarPor('categoria', id)}
              />
            )}
          </Acordeon>

          <Acordeon titulo="Temporadas">
            {cargandoTemporadas ? (
              <SkeletonLista />
            ) : temporadas.length === 0 ? (
              <p className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">Aún no hay temporadas.</p>
            ) : (
              <ul>
                {temporadas.map((temporada) => (
                  <li key={temporada.id}>
                    <button
                      type="button"
                      onClick={() => filtrarPor('temporada', temporada.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                        temporada.id === temporadaActiva
                          ? 'bg-neutral-100 font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-white'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span>{temporada.nombre}</span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">{ESTADO_LABEL[temporada.estado]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Acordeon>

          <button
            type="button"
            onClick={irAContacto}
            className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
          >
            Contáctanos
          </button>
        </nav>
        )}

        <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
          <button
            type="button"
            className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Necesitas ayuda
          </button>
          {autenticado && (
            <button
              type="button"
              onClick={handleCerrarSesion}
              className="mt-3 w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}

function Acordeon({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((actual) => !actual)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
      >
        {titulo}
        <span aria-hidden="true" className={`text-neutral-400 transition-transform ${abierto ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {abierto && <div className="pb-2 pl-2">{children}</div>}
    </div>
  )
}

function ListaCategorias({
  categorias,
  nivel,
  activa,
  onSeleccionar,
}: {
  categorias: Categoria[]
  nivel: number
  activa: number | null
  onSeleccionar: (id: number) => void
}) {
  return (
    <ul>
      {categorias.map((categoria) => (
        <li key={categoria.id}>
          <button
            type="button"
            onClick={() => onSeleccionar(categoria.id)}
            style={{ paddingLeft: `${12 + nivel * 16}px` }}
            className={`w-full rounded-md py-2 pr-3 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
              categoria.id === activa
                ? 'bg-neutral-100 font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {categoria.nombre}
          </button>
          {categoria.hijos.length > 0 && (
            <ListaCategorias categorias={categoria.hijos} nivel={nivel + 1} activa={activa} onSeleccionar={onSeleccionar} />
          )}
        </li>
      ))}
    </ul>
  )
}

function SkeletonLista() {
  return (
    <div className="space-y-2 px-3 py-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </div>
  )
}
