import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, Perfil } from '@/modules/acceso/types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  perfil: Perfil | null
  isAuthenticated: boolean
  setSession: (auth: AuthResponse) => void
  setPerfil: (perfil: Perfil) => void
  clear: () => void
  hasPermission: (accion: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      perfil: null,
      isAuthenticated: false,
      setSession: (auth) =>
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          perfil: auth.perfil,
          isAuthenticated: true,
        }),
      setPerfil: (perfil) => set({ perfil, isAuthenticated: true }),
      clear: () =>
        set({ accessToken: null, refreshToken: null, perfil: null, isAuthenticated: false }),
      hasPermission: (accion) => {
        const perfil = get().perfil
        if (!perfil) return false
        if (perfil.tipoUsuario === 'A') return true
        return perfil.permisos.includes(accion)
      },
    }),
    { name: 'fashionstore-auth' },
  ),
)
