import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/core/store/authStore'
import { BuscadorTienda } from '@/modules/electronico/components/BuscadorTienda'
import { CarritoDrawer } from '@/modules/electronico/components/CarritoDrawer'
import { CategoryNavBar } from '@/modules/electronico/components/CategoryNavBar'
import { NotificationBell } from '@/modules/electronico/components/NotificationBell'
import { InvitacionWebPush } from '@/modules/electronico/components/PanelWebPush'
import { PedidosOfflineMonitor } from '@/modules/electronico/components/PedidosOffline'
import { StoreFooter } from '@/modules/electronico/components/StoreFooter'
import { StoreLogo } from '@/modules/electronico/components/StoreLogo'
import { StoreSidebar } from '@/modules/electronico/components/StoreSidebar'
import { CartIcon } from '@/shared/components/ui/CartIcon'
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'

export function PublicLayout() {
  const perfil = useAuthStore((state) => state.perfil)
  const autenticado = useAuthStore((state) => state.isAuthenticated)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()
  const busquedaActual = location.pathname === '/' ? (new URLSearchParams(location.search).get('q') ?? '') : ''

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/80">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:gap-6 sm:px-6">
          {autenticado && (
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <Link to="/" className="shrink-0 text-lg text-neutral-900 sm:text-xl dark:text-neutral-50">
            <StoreLogo />
          </Link>

          <BuscadorTienda key={busquedaActual} inicial={busquedaActual} />

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0 sm:gap-2">
            {perfil ? (
              <Link to={perfil.tipoUsuario === 'C' ? '/mi-cuenta' : '/admin/dashboard'} className="max-w-24 truncate text-sm font-medium text-neutral-700 hover:text-brand sm:max-w-none dark:text-neutral-200">
                Hola, {perfil.nombre}
              </Link>
            ) : (
              <Link to="/login" className="rounded-full bg-brand-solid px-3 py-2 text-sm font-medium text-brand-on transition-colors hover:bg-brand-solid-hover sm:px-4">
                <span className="sm:hidden">Ingresar</span>
                <span className="hidden sm:inline">Iniciar sesión / Registrarse</span>
              </Link>
            )}
            <NotificationBell />
            <CartIcon />
            <ThemeToggle />
          </div>
        </div>

        <CategoryNavBar />
      </header>

      {autenticado && <StoreSidebar open={menuAbierto} onClose={() => setMenuAbierto(false)} />}

      <main className="flex-1">
        <Outlet />
      </main>

      <StoreFooter />

      <CarritoDrawer />
      {perfil?.tipoUsuario === 'C' && <PedidosOfflineMonitor />}
      {perfil && <InvitacionWebPush />}
    </div>
  )
}
