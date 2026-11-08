import { create } from 'zustand'

export type EstadoPreparacion = 'inactiva' | 'preparando' | 'lista' | 'incompleta'

interface EstadoOffline {
  preparacion: EstadoPreparacion
  hechas: number
  total: number
  fallidas: number
  /** Pantallas que pidieron datos sin red y sin copia guardada: un "No hay..." ahi seria falso. */
  rutasSinCopia: string[]
  iniciarPreparacion: () => void
  sumarTareas: (cantidad: number) => void
  completarTarea: (correcta: boolean) => void
  terminarPreparacion: (interrumpida: boolean) => void
  marcarSinCopia: (ruta: string) => void
  limpiarSinCopia: () => void
}

export const useEstadoOffline = create<EstadoOffline>((set) => ({
  preparacion: 'inactiva',
  hechas: 0,
  total: 0,
  fallidas: 0,
  rutasSinCopia: [],
  iniciarPreparacion: () => set({ preparacion: 'preparando', hechas: 0, total: 0, fallidas: 0 }),
  sumarTareas: (cantidad) => set((estado) => ({ total: estado.total + cantidad })),
  completarTarea: (correcta) => set((estado) => ({ hechas: estado.hechas + 1, fallidas: estado.fallidas + (correcta ? 0 : 1) })),
  terminarPreparacion: (interrumpida) => set((estado) => ({ preparacion: interrumpida || estado.fallidas > 0 ? 'incompleta' : 'lista' })),
  marcarSinCopia: (ruta) => set((estado) => (estado.rutasSinCopia.includes(ruta) ? estado : { rutasSinCopia: [...estado.rutasSinCopia, ruta] })),
  limpiarSinCopia: () => set({ rutasSinCopia: [] }),
}))

if (typeof window !== 'undefined') window.addEventListener('online', () => useEstadoOffline.getState().limpiarSinCopia())
