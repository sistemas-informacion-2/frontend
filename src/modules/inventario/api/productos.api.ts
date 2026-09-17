import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { Producto } from '../types'

export async function fetchProductos(): Promise<Producto[]> {
  const response = await httpClient.get<Envelope<Producto[]>>('/inventario/productos')
  return unwrap(response)
}
