import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface AppState {
  theme: Theme
  sidebarCollapsed: boolean
  /** Grupos del menú del panel que la persona abrió (true) o cerró (false) a mano; sin entrada, decide la ruta actual. */
  gruposAbiertos: Record<string, boolean>
  /** null = Vista General (todas las sucursales); un id = Vista por Sucursal. */
  sucursalActivaId: number | null
  toggleTheme: () => void
  toggleSidebar: () => void
  setGrupoAbierto: (grupo: string, abierto: boolean) => void
  setSucursalActiva: (id: number | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      gruposAbiertos: {},
      sucursalActivaId: null,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setGrupoAbierto: (grupo, abierto) => set((state) => ({ gruposAbiertos: { ...state.gruposAbiertos, [grupo]: abierto } })),
      setSucursalActiva: (id) => set({ sucursalActivaId: id }),
    }),
    { name: 'fashionstore-app' },
  ),
)
