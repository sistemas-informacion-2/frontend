import { isAxiosError } from 'axios'
import { useEffect } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { useTiendaStore } from '@/core/store/tiendaStore'
import { actualizarCantidadItem, agregarAlCarrito, fetchCarrito, quitarItemCarrito, vaciarCarrito } from '../api'
import {
  aItemCarrito,
  agregarLocal,
  cambiarCantidadLocal,
  lineasDe,
  quitarLocal,
  sincronizarCarritoLocal,
  useCarritoOfflineStore,
  vaciarLocal,
} from '../offline/carritoOffline'
import type { Carrito, ProductoDetalle } from '../types'

const CARRITO_VACIO: Carrito = { id: null, idSucursal: null, items: [], cantidadTotal: 0, total: 0, fechaActualizacion: null }
const SIN_CONEXION_SERVIDOR = 'Sin conexión solo puedes cambiar las prendas que agregaste sin conexión. Las demás, cuando vuelva la red.'

export interface LineaAgregar {
  idVarianteProducto: number
  cantidad: number
}

/** Sin respuesta del servidor (sin red o servidor caido): la operacion se puede hacer en el carrito local. */
function sinRespuesta(error: unknown): boolean {
  return isAxiosError(error) && !error.response
}

/**
 * Carrito del cliente (CU14). Vive en el servidor; SWR lo comparte entre el ícono del header, el
 * detalle del producto y la página del carrito. Solo un cliente autenticado tiene carrito.
 *
 * RF-SYNC-01: sin conexion, lo que se agrega queda en el dispositivo (offline/carritoOffline.ts) y se muestra junto
 * al carrito del servidor (lineas con id negativo); al volver la red sube solo al servidor.
 */
export function useCarrito() {
  const autenticado = useAuthStore((state) => state.isAuthenticated)
  const esCliente = useAuthStore((state) => state.perfil?.tipoUsuario === 'C')
  const idCliente = useAuthStore((state) => (state.perfil?.tipoUsuario === 'C' ? state.perfil.id : null))
  const idSucursal = useTiendaStore((state) => state.idSucursal)
  const todasLocales = useCarritoOfflineStore((state) => state.lineas)
  const locales = lineasDe(idCliente, todasLocales)

  const { data, isLoading, mutate } = useSWR<Carrito>(esCliente ? 'electronico/carrito' : null, fetchCarrito, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  // Con red de nuevo, lo agregado sin conexion pasa al carrito del servidor.
  const hayLocales = locales.length > 0
  useEffect(() => {
    if (!hayLocales) return
    const subir = () => {
      void sincronizarCarritoLocal().then((cambio) => {
        if (cambio) void mutate()
      })
    }
    subir()
    window.addEventListener('online', subir)
    return () => window.removeEventListener('online', subir)
  }, [hayLocales, mutate])

  /** Ejecuta un cambio y deja en caché el carrito que devuelve el servidor. */
  const aplicar = async (accion: () => Promise<Carrito>): Promise<Carrito> => {
    const actualizado = await accion()
    await mutate(actualizado, { revalidate: false })
    return actualizado
  }

  const servidor = data ?? CARRITO_VACIO
  const itemsLocales = locales.map(aItemCarrito)
  const items = [...servidor.items, ...itemsLocales]
  const carrito: Carrito = {
    ...servidor,
    idSucursal: servidor.idSucursal ?? locales[0]?.idSucursal ?? null,
    items,
    cantidadTotal: items.reduce((suma, item) => suma + item.cantidad, 0),
    total: Math.round((items.reduce((suma, item) => suma + item.subtotal, 0) + Number.EPSILON) * 100) / 100,
  }

  /** Sin red: agrega al carrito local con los datos del producto que se esta viendo (stock y precio de la ultima consulta). */
  const agregarSinConexion = (lineas: LineaAgregar[], producto: ProductoDetalle | undefined): Carrito => {
    if (!producto || idCliente === null || idSucursal === null) {
      throw new Error('Sin conexión no se puede agregar este producto. Inténtalo cuando vuelva la red.')
    }
    for (const linea of lineas) agregarLocal(idCliente, idSucursal, producto, linea.idVarianteProducto, linea.cantidad)
    return carrito
  }

  return {
    autenticado,
    esCliente,
    carrito,
    cantidadTotal: carrito.cantidadTotal,
    isLoading,
    /** true si hay prendas agregadas sin conexion que todavia no estan en el servidor. */
    tieneLineasLocales: hayLocales,
    /** Vuelve a pedir el carrito al servidor (p. ej. tras pagar, que lo vacía). */
    refrescar: () => mutate(),
    /**
     * Agrega varias variantes en orden; si una falla, las anteriores ya quedaron en el carrito. Con `producto` (la ficha
     * que se esta viendo) tambien funciona sin conexion: las lineas quedan en el dispositivo.
     */
    agregar: async (lineas: LineaAgregar[], producto?: ProductoDetalle) => {
      if (idSucursal === null) throw new Error('Todavía no se eligió una sucursal; recarga la página e intenta de nuevo')
      if (!navigator.onLine) return agregarSinConexion(lineas, producto)
      try {
        let ultimo = carrito
        for (const linea of lineas) {
          ultimo = await aplicar(() => agregarAlCarrito(linea.idVarianteProducto, idSucursal, linea.cantidad))
        }
        return ultimo
      } catch (error) {
        // El navegador cree tener red pero el servidor no responde: tambien se guarda en el dispositivo.
        if (sinRespuesta(error) && producto) return agregarSinConexion(lineas, producto)
        await mutate()
        throw error
      }
    },
    actualizarCantidad: async (idItem: number, cantidad: number) => {
      const local = locales.find((linea) => aItemCarrito(linea).id === idItem)
      if (local && idCliente !== null) {
        cambiarCantidadLocal(idCliente, local.idVarianteProducto, cantidad)
        return carrito
      }
      if (!navigator.onLine) throw new Error(SIN_CONEXION_SERVIDOR)
      return aplicar(() => actualizarCantidadItem(idItem, cantidad))
    },
    quitar: async (idItem: number) => {
      const local = locales.find((linea) => aItemCarrito(linea).id === idItem)
      if (local && idCliente !== null) {
        quitarLocal(idCliente, local.idVarianteProducto)
        return carrito
      }
      if (!navigator.onLine) throw new Error(SIN_CONEXION_SERVIDOR)
      return aplicar(() => quitarItemCarrito(idItem))
    },
    vaciar: async () => {
      if (idCliente !== null) vaciarLocal(idCliente)
      if (servidor.items.length === 0) return carrito
      if (!navigator.onLine) throw new Error(SIN_CONEXION_SERVIDOR)
      return aplicar(() => vaciarCarrito())
    },
  }
}
