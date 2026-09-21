import { type FormEvent, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { env } from '@/core/config/env'
import { useAuthStore } from '@/core/store/authStore'
import { NotificationBell } from '@/modules/electronico/components/NotificationBell'
import { StoreFooter } from '@/modules/electronico/components/StoreFooter'
import { StoreSidebar } from '@/modules/electronico/components/StoreSidebar'
import { CartIcon } from '@/shared/components/ui/CartIcon'
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'

export function PublicLayout() {
  const perfil = useAuthStore((state) => state.perfil)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const enCatalogo = location.pathname === '/'
  const busquedaActual = enCatalogo ? (new URLSearchParams(location.search).get('q') ?? '') : ''

  // La búsqueda se suma a los filtros activos del catálogo (categoría, temporada, ofertas).
  const handleBuscar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const texto = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    const params = new URLSearchParams(enCatalogo ? location.search : '')
    if (texto) params.set('q', texto)
    else params.delete('q')
    const query = params.toString()
    navigate(query ? `/?${query}` : '/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <header className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            ☰
          </button>
          <Link to="/" className="shrink-0 text-lg font-semibold tracking-tight sm:text-xl dark:text-white">
            {env.appName}
          </Link>

          <form
            onSubmit={handleBuscar}
            className="order-3 w-full md:order-none md:mx-auto md:w-auto md:flex-1 md:max-w-xl"
          >
            <input
              key={busquedaActual}
              type="search"
              name="q"
              defaultValue={busquedaActual}
              aria-label="Buscar productos"
              placeholder="Buscar productos, categorías…"
              className="w-full rounded-full border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
            />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0 sm:gap-2">
            {perfil ? (
              <Link
                to={perfil.tipoUsuario === 'C' ? '/mi-cuenta' : '/admin/dashboard'}
                className="max-w-24 truncate text-sm font-medium text-neutral-700 hover:text-neutral-900 sm:max-w-none dark:text-neutral-300 dark:hover:text-white"
              >
                Hola, {perfil.nombre}
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 sm:px-4 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                <span className="sm:hidden">Ingresar</span>
                <span className="hidden sm:inline">Iniciar sesión / Registrarse</span>
              </Link>
            )}
            <NotificationBell />
            <CartIcon />
            <ThemeToggle />
          </div>
        </div>

      </header>

      <StoreSidebar open={menuAbierto} onClose={() => setMenuAbierto(false)} />

      <main className="flex-1">
        <Outlet />
      </main>

      <StoreFooter />
    </div>
  )
}
