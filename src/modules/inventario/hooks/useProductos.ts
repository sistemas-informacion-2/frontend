import useSWR from 'swr'
import { fetchProductos } from '../api'
import type { Producto } from '../types'

/** Catálogo público de productos activos, igual que `useCategorias`. */
export function useProductos() {
  const { data, isLoading } = useSWR<Producto[]>('inventario/productos', fetchProductos, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return { productos: data ?? [], isLoading }
}
