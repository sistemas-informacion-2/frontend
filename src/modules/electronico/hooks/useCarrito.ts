import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { actualizarCantidadItem, agregarAlCarrito, fetchCarrito, quitarItemCarrito, vaciarCarrito } from '../api'
import type { Carrito } from '../types'

const CARRITO_VACIO: Carrito = { id: null, items: [], cantidadTotal: 0, total: 0, fechaActualizacion: null }

export interface LineaAgregar {
  idVarianteProducto: number
  cantidad: number
}

/**
 * Carrito del cliente (CU14). Vive en el servidor; SWR lo comparte entre el ícono del header, el
 * detalle del producto y la página del carrito. Solo un cliente autenticado tiene carrito.
 */
export function useCarrito() {
  const autenticado = useAuthStore((state) => state.isAuthenticated)
  const esCliente = useAuthStore((state) => state.perfil?.tipoUsuario === 'C')

  const { data, isLoading, mutate } = useSWR<Carrito>(esCliente ? 'electronico/carrito' : null, fetchCarrito, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  /** Ejecuta un cambio y deja en caché el carrito que devuelve el servidor. */
  const aplicar = async (accion: () => Promise<Carrito>): Promise<Carrito> => {
    const actualizado = await accion()
    await mutate(actualizado, { revalidate: false })
    return actualizado
  }

  const carrito = data ?? CARRITO_VACIO

  return {
    autenticado,
    esCliente,
    carrito,
    cantidadTotal: carrito.cantidadTotal,
    isLoading,
    /** Vuelve a pedir el carrito al servidor (p. ej. tras pagar, que lo vacía). */
    refrescar: () => mutate(),
    /** Agrega varias variantes en orden; si una falla, las anteriores ya quedaron en el carrito. */
    agregar: async (lineas: LineaAgregar[]) => {
      try {
        let ultimo = carrito
        for (const linea of lineas) {
          ultimo = await aplicar(() => agregarAlCarrito(linea.idVarianteProducto, linea.cantidad))
        }
        return ultimo
      } catch (error) {
        await mutate()
        throw error
      }
    },
    actualizarCantidad: (idItem: number, cantidad: number) => aplicar(() => actualizarCantidadItem(idItem, cantidad)),
    quitar: (idItem: number) => aplicar(() => quitarItemCarrito(idItem)),
    vaciar: () => aplicar(() => vaciarCarrito()),
  }
}
