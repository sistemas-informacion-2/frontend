import { type FormEvent, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { env } from '@/core/config/env'
import { useAuthStore } from '@/core/store/authStore'
import { useCategorias } from '@/modules/inventario/api'
import { CartIcon } from '@/shared/components/ui/CartIcon'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'

function BarraCategorias() {
  const { categorias, isLoading } = useCategorias()

  if (isLoading) {
    return (
      <div className="flex gap-4 border-t border-neutral-100 px-4 py-2.5 sm:px-6 dark:border-neutral-800">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
    )
  }

  if (categorias.length === 0) {
    return null
  }

  return (
    <nav className="flex gap-5 overflow-x-auto border-t border-neutral-100 px-4 py-2.5 text-sm sm:px-6 dark:border-neutral-800">
      {categorias.map((categoria) => (
        <Link
          key={categoria.id}
          to={`/categoria/${categoria.slug}`}
          className="whitespace-nowrap text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
        >
          {categoria.nombre}
        </Link>
      ))}
    </nav>
  )
}

export function PublicLayout() {
  const perfil = useAuthStore((state) => state.perfil)
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()

  const handleBuscar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busqueda.trim()) navigate(`/buscar?q=${encodeURIComponent(busqueda.trim())}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <header className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
          <Link to="/" className="shrink-0 text-lg font-semibold tracking-tight sm:text-xl dark:text-white">
            {env.appName}
          </Link>

          <form
            onSubmit={handleBuscar}
            className="order-3 w-full md:order-none md:mx-auto md:w-auto md:flex-1 md:max-w-xl"
          >
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
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
            <CartIcon />
            <ThemeToggle />
          </div>
        </div>

        <BarraCategorias />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
