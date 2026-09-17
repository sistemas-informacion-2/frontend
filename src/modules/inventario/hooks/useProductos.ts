import useSWR from 'swr'
import { fetchProductos } from '../api'
import type { Producto } from '../types'

/** Igual que `useCategorias`: CU09 (productos) todavía no existe en el backend. */
export function useProductos() {
  const { data, isLoading } = useSWR<Producto[]>('inventario/productos', fetchProductos, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return { productos: data ?? [], isLoading }
}
