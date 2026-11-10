import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { claveAlmacenamiento } from '@/core/tenant/tienda'

type Theme = 'light' | 'dark'

interface AppState {
  theme: Theme
  sidebarCollapsed: boolean
  /** Grupos del menú del panel que la persona abrió (true) o cerró (false) a mano; sin entrada, decide la ruta actual. */
  gruposAbiertos: Record<string, boolean>
  /** null = Vista General (todas las sucursales); un id = Vista por Sucursal. Se recuerda por tienda. */
  sucursalActivaId: number | null
  toggleTheme: () => void
  toggleSidebar: () => void
  setGrupoAbierto: (grupo: string, abierto: boolean) => void
  setSucursalActiva: (id: number | null) => void
}

/**
 * La sucursal elegida es de cada tienda: sus ids no existen en otra. Por eso no va en `fashionstore-app` (que
 * comparten todas las tiendas del navegador) sino en una clave propia de la tienda actual.
 */
const CLAVE_SUCURSAL_ACTIVA = claveAlmacenamiento('sucursal-activa')

function leerSucursalActiva(): number | null {
  try {
    const valor = Number(window.localStorage.getItem(CLAVE_SUCURSAL_ACTIVA))
    return Number.isInteger(valor) && valor > 0 ? valor : null
  } catch {
    return null
  }
}

function guardarSucursalActiva(id: number | null): void {
  try {
    if (id === null) window.localStorage.removeItem(CLAVE_SUCURSAL_ACTIVA)
    else window.localStorage.setItem(CLAVE_SUCURSAL_ACTIVA, String(id))
  } catch {
    // Sin almacenamiento: la sucursal vale solo mientras la pestana este abierta.
  }
}

/** Lo que si se comparte entre tiendas: preferencias de pantalla de la persona. */
type Preferencias = Pick<AppState, 'theme' | 'sidebarCollapsed' | 'gruposAbiertos'>

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      gruposAbiertos: {},
      sucursalActivaId: leerSucursalActiva(),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setGrupoAbierto: (grupo, abierto) => set((state) => ({ gruposAbiertos: { ...state.gruposAbiertos, [grupo]: abierto } })),
      setSucursalActiva: (id) => {
        guardarSucursalActiva(id)
        set({ sucursalActivaId: id })
      },
    }),
    {
      // El nombre se mantiene para no perder el tema guardado de cada navegador.
      name: 'fashionstore-app',
      // Version 1: la sucursal salio de esta clave. La migracion reescribe lo guardado sin ella al abrir la app.
      version: 1,
      migrate: (guardado) => {
        const { theme, sidebarCollapsed, gruposAbiertos } = (guardado ?? {}) as Partial<Preferencias>
        return { theme, sidebarCollapsed, gruposAbiertos } as AppState
      },
      partialize: (state): Preferencias => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed, gruposAbiertos: state.gruposAbiertos }),
      // Lo guardado antes de este cambio puede traer un sucursalActivaId de otra tienda: se descarta.
      merge: (guardado, actual) => {
        const { theme, sidebarCollapsed, gruposAbiertos } = (guardado ?? {}) as Partial<Preferencias>
        return {
          ...actual,
          ...(theme !== undefined && { theme }),
          ...(sidebarCollapsed !== undefined && { sidebarCollapsed }),
          ...(gruposAbiertos !== undefined && { gruposAbiertos }),
        }
      },
    },
  ),
)
