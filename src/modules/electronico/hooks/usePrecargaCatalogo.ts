import { useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { fetchProductoDetalle } from '../api'

/** Tope por visita al catalogo: suficiente para la grilla sin descargar el inventario entero. */
const MAX_PRECARGA = 60
const DESCARGAS_SIMULTANEAS = 3
const ESPERA_INICIAL_MS = 1500

/** Fichas ya precargadas en esta sesion ("idSucursal:idProducto"), para no repetirlas en cada visita. */
const precargadas = new Set<string>()

/**
 * RF-SYNC-01: con red, descarga en segundo plano la ficha (tallas, colores, stock de la sucursal elegida) y la imagen
 * principal de los productos que muestra el catalogo. Pasan por el Service Worker, que las deja en su cache con la
 * misma URL que pide la ficha, y ademas quedan en SWR: sin conexion se puede abrir cualquiera de esos productos y
 * agregarlo al carrito, aunque nunca se haya entrado a su ficha.
 */
export function usePrecargaCatalogo(idsProducto: number[], idSucursal: number | null) {
  const { mutate } = useSWRConfig()
  const clave = idsProducto.join(',')

  useEffect(() => {
    const ahorroDeDatos = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (!navigator.onLine || ahorroDeDatos || idSucursal === null || clave === '') return

    const pendientes = clave
      .split(',')
      .map(Number)
      .filter((id) => !precargadas.has(`${idSucursal}:${id}`))
      .slice(0, MAX_PRECARGA)
    let cancelado = false

    const trabajar = async () => {
      while (!cancelado && navigator.onLine) {
        const id = pendientes.shift()
        if (id === undefined) return
        const marca = `${idSucursal}:${id}`
        precargadas.add(marca)
        try {
          const detalle = await fetchProductoDetalle(id, idSucursal)
          void mutate(['electronico/producto', id, idSucursal], detalle, { revalidate: false })
          const imagen = detalle.imagenes[0]?.url
          if (imagen) new Image().src = imagen
        } catch {
          precargadas.delete(marca)
        }
      }
    }

    // Se espera a que la pagina termine de cargar lo que el cliente esta viendo.
    const temporizador = window.setTimeout(() => {
      for (let i = 0; i < DESCARGAS_SIMULTANEAS; i += 1) void trabajar()
    }, ESPERA_INICIAL_MS)
    return () => {
      cancelado = true
      window.clearTimeout(temporizador)
    }
  }, [clave, idSucursal, mutate])
}
