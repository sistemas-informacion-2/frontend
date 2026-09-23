import { useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/core/store/authStore'
import { useCerrarSesion } from '@/modules/acceso/hooks/useCerrarSesion'
import { NotificationBell } from '@/modules/electronico/components/NotificationBell'
import { Button } from '@/shared/components/ui/Button'
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'
import { Sidebar } from './Sidebar'

const ROL_LABEL: Record<string, string> = {
  A: 'Administrador',
  E: 'Empleado',
  C: 'Cliente',
}

function Breadcrumbs() {
  const location = useLocation()
  const segmentos = location.pathname.split('/').filter(Boolean)

  return (
    <nav className="min-w-0 truncate text-sm text-neutral-500 dark:text-neutral-400" aria-label="Breadcrumb">
      {segmentos.map((segmento, index) => (
        <span key={index}>
          {index > 0 && <span className="mx-1.5">/</span>}
          <span className={index === segmentos.length - 1 ? 'font-medium text-neutral-800 dark:text-neutral-100' : ''}>
            {segmento}
          </span>
        </span>
      ))}
    </nav>
  )
}

export function ProtectedLayout() {
  const perfil = useAuthStore((state) => state.perfil)
  const cerrarSesion = useCerrarSesion()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (!perfil) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => cerrarSesion('/login')

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menú"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 md:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              ☰
            </button>
            <Breadcrumbs />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="hidden text-sm font-medium text-neutral-500 hover:text-neutral-900 sm:inline-block dark:text-neutral-400 dark:hover:text-white"
            >
              Ir a la tienda
            </Link>
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                {perfil.nombre} {perfil.apellido}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {ROL_LABEL[perfil.tipoUsuario]}
                {perfil.sucursalNombre ? ` · ${perfil.sucursalNombre}` : ''}
              </p>
            </div>
            <Button variant="secondary" onClick={handleLogout} className="!px-3 sm:!px-4">
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden">Salir</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
