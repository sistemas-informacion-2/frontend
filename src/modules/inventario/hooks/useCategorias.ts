import useSWR from 'swr'
import { fetchCategorias } from '../api'
import type { Categoria } from '../types'

/** Expone una lista vacía en vez de propagar el error, para que el header público no rompa el layout. */
export function useCategorias() {
  const { data, isLoading } = useSWR<Categoria[]>('inventario/categorias', fetchCategorias, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return { categorias: data ?? [], isLoading }
}
