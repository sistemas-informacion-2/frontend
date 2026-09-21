import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/core/store/authStore'

/**
 * Contenedor de "Mi cuenta". La navegación (perfil, reservas, compras, devoluciones) vive en el menú lateral
 * de la tienda, que cambia a modo cuenta mientras un cliente está en estas rutas.
 */
export function CuentaLayout() {
  const perfil = useAuthStore((state) => state.perfil)

  if (!perfil) return <Navigate to="/login" state={{ from: '/mi-cuenta' }} replace />

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
      <Outlet />
    </div>
  )
}
