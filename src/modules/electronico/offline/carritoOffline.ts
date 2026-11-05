import { isAxiosError } from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from '@/core/store/authStore'
import { agregarAlCarrito } from '../api'
import type { ItemCarrito, ProductoDetalle } from '../types'

/**
 * Prendas agregadas al carrito SIN conexion (RF-SYNC-01). El carrito real vive en el servidor, asi que sin red no se
 * le puede agregar nada: estas lineas se guardan en el dispositivo, se muestran junto al carrito del servidor y
 *  - entran en el pedido offline si el cliente lo confirma sin red, o
 *  - pasan al carrito del servidor en cuanto vuelve la conexion.
 * El stock y el precio son los de la ultima vez que hubo red: el servidor los vuelve a validar al sincronizar.
 */
export interface LineaCarritoLocal {
  idCliente: number
  idSucursal: number
  idVarianteProducto: number
  idProducto: number
  productoNombre: string
  sku: string
  talla: string
  color: string
  corte: string
  imagenUrl: string | null
  precioUnitario: number
  cantidad: number
  /** Stock que se vio la ultima vez que hubo red (tope para no elegir de mas sin conexion). */
  stockDisponible: number
}

interface CarritoOfflineState {
  lineas: LineaCarritoLocal[]
  /** Avisos de lineas que el servidor no acepto al volver la red (sin stock, producto desactivado...). */
  avisos: string[]
}

export const useCarritoOfflineStore = create<CarritoOfflineState>()(
  persist((): CarritoOfflineState => ({ lineas: [], avisos: [] }), { name: 'fashionstore-carrito-offline' }),
)

/** Id negativo y estable para que la interfaz distinga una linea local de una del servidor. */
export function idLineaLocal(idVarianteProducto: number): number {
  return -idVarianteProducto
}

export function lineasDe(idCliente: number | null, lineas: LineaCarritoLocal[]): LineaCarritoLocal[] {
  return idCliente === null ? [] : lineas.filter((linea) => linea.idCliente === idCliente)
}

export function aItemCarrito(linea: LineaCarritoLocal): ItemCarrito {
  return {
    id: idLineaLocal(linea.idVarianteProducto),
    idVarianteProducto: linea.idVarianteProducto,
    idProducto: linea.idProducto,
    productoNombre: linea.productoNombre,
    sku: linea.sku,
    talla: linea.talla,
    color: linea.color,
    corte: linea.corte,
    imagenUrl: linea.imagenUrl,
    precioUnitario: linea.precioUnitario,
    cantidad: linea.cantidad,
    subtotal: Math.round((linea.precioUnitario * linea.cantidad + Number.EPSILON) * 100) / 100,
    notasEspeciales: 'Agregado sin conexión',
    stockDisponible: linea.stockDisponible,
    disponible: linea.cantidad <= linea.stockDisponible,
  }
}

/** Suma (o crea) la linea local de una variante del producto que el cliente esta viendo. */
export function agregarLocal(idCliente: number, idSucursal: number, producto: ProductoDetalle, idVarianteProducto: number, cantidad: number): void {
  const variante = producto.variantes.find((candidata) => candidata.id === idVarianteProducto)
  if (!variante) throw new Error('Esa variante ya no está disponible.')
  useCarritoOfflineStore.setState((estado) => {
    const existente = estado.lineas.find((linea) => linea.idCliente === idCliente && linea.idVarianteProducto === idVarianteProducto)
    if (existente) {
      return {
        lineas: estado.lineas.map((linea) =>
          linea === existente ? { ...linea, cantidad: Math.min(linea.stockDisponible, linea.cantidad + cantidad) } : linea,
        ),
      }
    }
    const nueva: LineaCarritoLocal = {
      idCliente,
      idSucursal,
      idVarianteProducto,
      idProducto: producto.id,
      productoNombre: producto.nombre,
      sku: variante.sku,
      talla: variante.talla,
      color: variante.color,
      corte: variante.corte,
      imagenUrl: producto.imagenes[0]?.url ?? null,
      precioUnitario: producto.precioFinal,
      cantidad: Math.min(variante.stockDisponible, cantidad),
      stockDisponible: variante.stockDisponible,
    }
    return { lineas: [...estado.lineas, nueva] }
  })
}

export function cambiarCantidadLocal(idCliente: number, idVarianteProducto: number, cantidad: number): void {
  useCarritoOfflineStore.setState((estado) => ({
    lineas: estado.lineas
      .map((linea) =>
        linea.idCliente === idCliente && linea.idVarianteProducto === idVarianteProducto ? { ...linea, cantidad: Math.min(linea.stockDisponible, cantidad) } : linea,
      )
      .filter((linea) => linea.cantidad > 0),
  }))
}

export function quitarLocal(idCliente: number, idVarianteProducto: number): void {
  useCarritoOfflineStore.setState((estado) => ({
    lineas: estado.lineas.filter((linea) => !(linea.idCliente === idCliente && linea.idVarianteProducto === idVarianteProducto)),
  }))
}

/** Se llama al guardar un pedido offline: esas prendas ya van en el pedido, no deben subir luego al carrito. */
export function vaciarLocal(idCliente: number): void {
  useCarritoOfflineStore.setState((estado) => ({ lineas: estado.lineas.filter((linea) => linea.idCliente !== idCliente) }))
}

export function descartarAvisos(): void {
  useCarritoOfflineStore.setState({ avisos: [] })
}

let sincronizando = false

/**
 * Con red de nuevo, pasa las lineas locales del cliente al carrito del servidor. Si el servidor rechaza una (sin
 * stock, producto desactivado) se quita y se avisa; si no hay respuesta (sigue sin red) se deja para el proximo intento.
 * Devuelve true si cambio algo, para que quien llama vuelva a pedir el carrito.
 */
export async function sincronizarCarritoLocal(): Promise<boolean> {
  const perfil = useAuthStore.getState().perfil
  if (sincronizando || !navigator.onLine || !perfil || perfil.tipoUsuario !== 'C') return false
  const pendientes = lineasDe(perfil.id, useCarritoOfflineStore.getState().lineas)
  if (pendientes.length === 0) return false

  sincronizando = true
  let cambio = false
  try {
    for (const linea of pendientes) {
      try {
        await agregarAlCarrito(linea.idVarianteProducto, linea.idSucursal, linea.cantidad)
      } catch (error) {
        if (!isAxiosError(error) || !error.response) break // sigue sin red: se reintenta despues
        const mensaje = error.response.data?.message
        const texto = Array.isArray(mensaje) ? mensaje[0] : typeof mensaje === 'string' ? mensaje : 'el servidor no la aceptó'
        useCarritoOfflineStore.setState((estado) => ({ avisos: [...estado.avisos, `${linea.productoNombre} (${linea.talla}/${linea.color}): ${texto}`] }))
      }
      quitarLocal(perfil.id, linea.idVarianteProducto)
      cambio = true
    }
  } finally {
    sincronizando = false
  }
  return cambio
}
