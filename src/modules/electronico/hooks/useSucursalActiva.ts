import { useEffect } from 'react'
import { useTiendaStore } from '@/core/store/tiendaStore'
import { useSucursalesPublicas } from './useSucursalesPublicas'

/**
 * Sucursal del cliente (CU08): no existe "Todas las sucursales" para elegir
 * — siempre hay una concreta. Si todavía no eligió ninguna (o la que tenía
 * guardada ya no existe/está inactiva), se cae sola a la primera sucursal
 * creada (menor id). Antes el catálogo dejaba comprar "de la sucursal con
 * más stock" sin que el cliente lo supiera, y a veces terminaba despachando
 * desde una sucursal de otro departamento; con esto la sucursal es explícita
 * desde el principio y se usa igual en catálogo, ficha, carrito y checkout.
 */
export function useSucursalActiva() {
  const { sucursales, isLoading } = useSucursalesPublicas()
  const idSucursal = useTiendaStore((state) => state.idSucursal)
  const setSucursal = useTiendaStore((state) => state.setSucursal)

  useEffect(() => {
    if (isLoading || sucursales.length === 0) return
    const sigueActiva = sucursales.some((sucursal) => sucursal.id === idSucursal)
    if (idSucursal === null || !sigueActiva) {
      const primera = [...sucursales].sort((a, b) => a.id - b.id)[0]
      setSucursal(primera.id)
    }
  }, [isLoading, sucursales, idSucursal, setSucursal])

  const sucursalActiva = sucursales.find((sucursal) => sucursal.id === idSucursal) ?? null

  return { sucursales, sucursalActiva, idSucursal, setSucursal, isLoading }
}
