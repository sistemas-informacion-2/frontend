import useSWR from 'swr'
import { httpClient } from '@/core/http/httpClient'
import type { Categoria, Producto } from './types'

interface Envelope<T> {
  data: T
}

async function fetchCategorias(url: string): Promise<Categoria[]> {
  const response = await httpClient.get<Envelope<Categoria[]>>(url)
  return response.data.data
}

/**
 * El backend aún no expone CU08 (categorías). Mientras no exista el
 * endpoint, SWR reintenta con backoff y este hook expone una lista vacía en
 * vez de propagar el error, para que el header público no rompa el layout.
 */
export function useCategorias() {
  const { data, isLoading } = useSWR<Categoria[]>('/inventario/categorias', fetchCategorias, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return { categorias: data ?? [], isLoading }
}

async function fetchProductos(url: string): Promise<Producto[]> {
  const response = await httpClient.get<Envelope<Producto[]>>(url)
  return response.data.data
}

/** Igual que `useCategorias`: CU09 (productos) todavía no existe en el backend. */
export function useProductos() {
  const { data, isLoading } = useSWR<Producto[]>('/inventario/productos', fetchProductos, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return { productos: data ?? [], isLoading }
}
