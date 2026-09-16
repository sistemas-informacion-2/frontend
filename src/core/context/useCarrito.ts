import { useContext } from 'react'
import { CarritoContext, type CarritoContextValue } from './carrito-context-definition'

export function useCarrito(): CarritoContextValue {
  const ctx = useContext(CarritoContext)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>')
  return ctx
}
