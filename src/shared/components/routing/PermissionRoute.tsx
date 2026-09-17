import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/core/store/authStore'

interface PermissionRouteProps {
  permission: string
  children: ReactNode
}

export function PermissionRoute({ permission, children }: PermissionRouteProps) {
  const perfil = useAuthStore((state) => state.perfil)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  if (!perfil) return <Navigate to="/login" replace />
  if (!hasPermission(permission)) return <Navigate to="/admin/dashboard" replace />
  return children
}
