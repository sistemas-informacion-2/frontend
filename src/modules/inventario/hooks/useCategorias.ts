import useSWR from 'swr'
import { fetchCategorias } from '../api'
import type { Categoria } from '../types'

/**
 * El backend aún no expone CU08 (categorías). Mientras no exista el
 * endpoint, SWR reintenta con backoff y este hook expone una lista vacía en
 * vez de propagar el error, para que el header público no rompa el layout.
 */
export function useCategorias() {
  const { data, isLoading } = useSWR<Categoria[]>('inventario/categorias', fetchCategorias, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return { categorias: data ?? [], isLoading }
}
