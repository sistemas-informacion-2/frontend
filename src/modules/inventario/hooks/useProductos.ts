import useSWR from 'swr'
import { fetchProductos, type FiltrosCatalogo } from '../api'
import type { Producto } from '../types'

/** Catálogo público de productos activos, igual que `useCategorias`. */
export function useProductos(filtros: FiltrosCatalogo = {}) {
  const { data, isLoading } = useSWR<Producto[]>(
    ['inventario/productos', filtros.idCategoria, filtros.idTemporada, filtros.idSucursal, filtros.soloOfertas, filtros.search],
    () => fetchProductos(filtros),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  )

  return { productos: data ?? [], isLoading }
}
