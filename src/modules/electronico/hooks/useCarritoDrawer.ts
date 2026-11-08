import { create } from 'zustand'

interface CarritoDrawerState {
  abierto: boolean
  abrir: () => void
  cerrar: () => void
}

/** Panel lateral del carrito: lo abren el ícono del encabezado y el agregado rápido de las tarjetas. */
export const useCarritoDrawer = create<CarritoDrawerState>((set) => ({
  abierto: false,
  abrir: () => set({ abierto: true }),
  cerrar: () => set({ abierto: false }),
}))
