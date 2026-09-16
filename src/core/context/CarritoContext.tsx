import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CarritoContext, type CarritoContextValue, type ItemCarrito } from './carrito-context-definition'

const STORAGE_KEY = 'fashionstore-carrito'

function leerCarritoGuardado(): ItemCarrito[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ItemCarrito[]) : []
  } catch {
    return []
  }
}

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(leerCarritoGuardado)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // almacenamiento no disponible (modo privado, cuota llena): se ignora
    }
  }, [items])

  const value = useMemo<CarritoContextValue>(
    () => ({
      items,
      cantidadTotal: items.reduce((total, item) => total + item.cantidad, 0),
      agregarItem: (item) =>
        setItems((prev) => {
          const existente = prev.find((i) => i.idVariante === item.idVariante)
          if (existente) {
            return prev.map((i) =>
              i.idVariante === item.idVariante ? { ...i, cantidad: i.cantidad + item.cantidad } : i,
            )
          }
          return [...prev, item]
        }),
      quitarItem: (idVariante) => setItems((prev) => prev.filter((i) => i.idVariante !== idVariante)),
      vaciar: () => setItems([]),
    }),
    [items],
  )

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>
}
