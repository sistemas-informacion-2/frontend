import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { Categoria } from '../types'

export async function fetchCategorias(): Promise<Categoria[]> {
  const response = await httpClient.get<Envelope<Categoria[]>>('/inventario/categorias')
  return unwrap(response)
}
