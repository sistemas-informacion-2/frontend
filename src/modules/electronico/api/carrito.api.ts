import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { Carrito } from '../types'

// Todas devuelven el carrito ya actualizado, así la pantalla no necesita pedirlo otra vez.

export async function fetchCarrito(): Promise<Carrito> {
  return unwrap(await httpClient.get<Envelope<Carrito>>('/electronico/carrito'))
}

export async function agregarAlCarrito(idVarianteProducto: number, idSucursal: number, cantidad: number): Promise<Carrito> {
  return unwrap(await httpClient.post<Envelope<Carrito>>('/electronico/carrito/items', { idVarianteProducto, idSucursal, cantidad }))
}

export async function actualizarCantidadItem(idItem: number, cantidad: number): Promise<Carrito> {
  return unwrap(await httpClient.patch<Envelope<Carrito>>(`/electronico/carrito/items/${idItem}`, { cantidad }))
}

export async function quitarItemCarrito(idItem: number): Promise<Carrito> {
  return unwrap(await httpClient.delete<Envelope<Carrito>>(`/electronico/carrito/items/${idItem}`))
}

export async function vaciarCarrito(): Promise<Carrito> {
  return unwrap(await httpClient.delete<Envelope<Carrito>>('/electronico/carrito'))
}
