import useSWR from 'swr'
import { fetchProductoDetalle, fetchProductosRelacionados } from '../api'
import type { Producto } from '@/modules/inventario/types'
import type { ProductoDetalle } from '../types'

/** `idSucursal` acota el stock mostrado a la sucursal que el cliente tiene elegida en el catálogo. */
export function useProductoDetalle(id: number, idSucursal?: number) {
  const { data, error, isLoading } = useSWR<ProductoDetalle>(
    Number.isInteger(id) && id > 0 ? ['electronico/producto', id, idSucursal] : null,
    () => fetchProductoDetalle(id, idSucursal),
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
