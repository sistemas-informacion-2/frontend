import { createContext } from 'react'

export interface ItemCarrito {
  idVariante: number
  nombre: string
  precioUnitario: number
  cantidad: number
}

export interface CarritoContextValue {
  items: ItemCarrito[]
  cantidadTotal: number
  agregarItem: (item: ItemCarrito) => void
  quitarItem: (idVariante: number) => void
  vaciar: () => void
}

export const CarritoContext = createContext<CarritoContextValue | null>(null)
