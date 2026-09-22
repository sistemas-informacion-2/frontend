import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TiendaState {
  /**
   * Sucursal donde el cliente compra/retira/reserva (CU08). No es un filtro
   * más del catálogo: es de dónde sale el stock al pagar, así que se guarda
   * acá (no en la URL) para que sobreviva de catálogo → producto → carrito →
   * checkout → reserva. `useSucursalActiva` (electronico/hooks) es quien la
   * inicializa con la primera sucursal creada la primera vez — este store no
   * tiene un valor "todas las sucursales": o hay una elegida, o todavía no
   * se cargó la lista de sucursales.
   */
  idSucursal: number | null
  setSucursal: (id: number) => void
}

export const useTiendaStore = create<TiendaState>()(
  persist(
    (set) => ({
      idSucursal: null,
      setSucursal: (id) => set({ idSucursal: id }),
    }),
    { name: 'fashionstore-tienda' },
  ),
)
