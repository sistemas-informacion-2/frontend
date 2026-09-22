import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { Producto } from '@/modules/inventario/types'
import type { ProductoDetalle } from '../types'

/** `idSucursal` acota el stock mostrado a esa sucursal (la que el cliente tiene elegida), no la suma de todas. */
export async function fetchProductoDetalle(id: number, idSucursal?: number): Promise<ProductoDetalle> {
  const response = await httpClient.get<Envelope<ProductoDetalle>>(`/inventario/productos/${id}/publico`, {
    params: idSucursal ? { idSucursal } : undefined,
  })
  return unwrap(response)
}

/** Productos activos de la misma categoría, para "También te puede interesar". */
export async function fetchProductosRelacionados(id: number): Promise<Producto[]> {
  const response = await httpClient.get<Envelope<Producto[]>>(`/inventario/productos/${id}/relacionados`)
  return unwrap(response)
}
