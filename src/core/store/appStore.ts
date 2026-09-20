import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface AppState {
  theme: Theme
  sidebarCollapsed: boolean
  /** null = Vista General (todas las sucursales); un id = Vista por Sucursal. */
  sucursalActivaId: number | null
  toggleTheme: () => void
  toggleSidebar: () => void
  setSucursalActiva: (id: number | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      sucursalActivaId: null,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSucursalActiva: (id) => set({ sucursalActivaId: id }),
    }),
    { name: 'fashionstore-app' },
  ),
)
