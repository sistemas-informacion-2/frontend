import useSWR from 'swr'
import { fetchProductoDetalle, fetchProductosRelacionados } from '../api'
import type { Producto } from '@/modules/inventario/types'
import type { ProductoDetalle } from '../types'

export function useProductoDetalle(id: number) {
  const { data, error, isLoading } = useSWR<ProductoDetalle>(
    Number.isInteger(id) && id > 0 ? ['electronico/producto', id] : null,
    () => fetchProductoDetalle(id),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  )
  return { producto: data, error, isLoading }
}

export function useProductosRelacionados(id: number) {
  const { data } = useSWR<Producto[]>(
    Number.isInteger(id) && id > 0 ? ['electronico/relacionados', id] : null,
    () => fetchProductosRelacionados(id),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  )
  return { relacionados: data ?? [] }
}
