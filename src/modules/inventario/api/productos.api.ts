import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { Producto } from '../types'

export interface FiltrosCatalogo {
  idCategoria?: number
  idTemporada?: number
  soloOfertas?: boolean
  search?: string
}

export async function fetchProductos(filtros: FiltrosCatalogo = {}): Promise<Producto[]> {
  const response = await httpClient.get<Envelope<Producto[]>>('/inventario/productos', { params: filtros })
  return unwrap(response)
}
