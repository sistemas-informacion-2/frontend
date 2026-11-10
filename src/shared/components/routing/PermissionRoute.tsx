import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/core/store/authStore'

interface PermissionRouteProps {
  /** Un permiso, o varios: con tener cualquiera de ellos alcanza (p. ej. gestionar o solo leer el stock). */
  permission: string | string[]
  children: ReactNode
}

export function PermissionRoute({ permission, children }: PermissionRouteProps) {
  const perfil = useAuthStore((state) => state.perfil)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  if (!perfil) return <Navigate to="/login" replace />
  const permisos = Array.isArray(permission) ? permission : [permission]
  if (!permisos.some((permiso) => hasPermission(permiso))) return <Navigate to="/admin/dashboard" replace />
  return children
}
