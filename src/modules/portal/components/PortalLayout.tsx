import { Link, Outlet, useLocation } from 'react-router-dom'
import { env } from '@/core/config/env'
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'
import { MarcaDominatr } from './MarcaDominatr'

/** Encabezado y pie del portal de DOMINATR. */
export function PortalLayout() {
  const { pathname } = useLocation()
  const enLanding = pathname === '/'

  return (
    <div className="flex min-h-svh flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md dark:border-neutral-800/70 dark:bg-neutral-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <MarcaDominatr />
          {enLanding && (
            <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-600 md:flex dark:text-neutral-300" aria-label="Secciones">
              <a href="#funciones" className="hover:text-neutral-900 dark:hover:text-white">Funciones</a>
              <a href="#planes" className="hover:text-neutral-900 dark:hover:text-white">Planes</a>
              <a href="#preguntas" className="hover:text-neutral-900 dark:hover:text-white">Preguntas</a>
            </nav>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <Link
              to="/ingresar"
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Ingresar
            </Link>
            <Link
              to="/registro?plan=PRUEBA"
              className="hidden rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-700 sm:inline-flex dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Crear mi tienda
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="max-w-xs">
            <MarcaDominatr />
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Tienda en línea, mostrador, inventario y reportes para comercios de ropa en Bolivia.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Producto</span>
              <a href="/#funciones" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Funciones</a>
              <a href="/#planes" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Planes</a>
              <a href="/#preguntas" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Preguntas</a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Cuenta</span>
              <Link to="/registro?plan=PRUEBA" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Crear mi tienda</Link>
              <Link to="/ingresar" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Ingresar</Link>
            </div>
          </div>
        </div>
        <p className="border-t border-neutral-200 py-5 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          © {new Date().getFullYear()} {env.plataformaNombre}. Precios en bolivianos.
        </p>
      </footer>
    </div>
  )
}
