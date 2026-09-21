import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCarrito, useMisReservas, useProductoDetalle, useProductosRelacionados, useSucursalesPublicas } from '../../hooks'
import { cargarSeleccion, guardarSeleccion, type SeleccionProducto } from '@/shared/utils/seleccionProducto'
import type { VarianteDetalle } from '../../types'
import { extraerMensajeError as mensajeDeError } from '../../utils/reservas'
import { ProductoPageView, type MensajeProducto } from './ProductoPage.view'

/** Cada producto monta su propio estado: al saltar a otro (p. ej. desde "También te puede interesar") no se arrastra la selección. */
export function ProductoPage() {
  const { id } = useParams()
  return <ProductoPageContenido key={id} />
}

function ProductoPageContenido() {
  const { id } = useParams()
  const idProducto = Number(id)
  const navigate = useNavigate()
  const location = useLocation()

  const { producto, error, isLoading } = useProductoDetalle(idProducto)
  const { relacionados } = useProductosRelacionados(idProducto)
  const { autenticado, esCliente, carrito, agregar } = useCarrito()
  const { reservar } = useMisReservas()
  const { sucursales } = useSucursalesPublicas()

  /**
   * idVariante -> unidades elegidas todavía sin agregar al carrito. Se guarda en el navegador: sobrevive a
   * iniciar sesión, a volver atrás y a recargar la página.
   */
  const [seleccionGuardada, setSeleccion] = useState<SeleccionProducto>(() => cargarSeleccion(idProducto))
  useEffect(() => guardarSeleccion(idProducto, seleccionGuardada), [idProducto, seleccionGuardada])
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<MensajeProducto | null>(null)
  const [reservaAbierta, setReservaAbierta] = useState(false)
  const [idSucursalReserva, setIdSucursalReserva] = useState<number | ''>('')
  const [errorReserva, setErrorReserva] = useState<string | null>(null)

  // Lo guardado puede haber quedado viejo (variante sin stock, ya en el carrito): se muestra solo lo que todavía es válido.
  const seleccion = seleccionValida(seleccionGuardada, producto?.variantes, (idVariante) =>
    carrito.items.find((item) => item.idVarianteProducto === idVariante)?.cantidad ?? 0,
  )

  const enCarrito = (idVariante: number) => carrito.items.find((item) => item.idVarianteProducto === idVariante)?.cantidad ?? 0
  // Lo que ya está en el carrito cuenta contra el stock: no se puede elegir más de lo que queda.
  const maximoElegible = (variante: VarianteDetalle) => Math.max(0, variante.stockDisponible - enCarrito(variante.id))

  const cambiarCantidad = (variante: VarianteDetalle, delta: number) => {
    setMensaje(null)
    setSeleccion((actual) => {
      const nueva = Math.min(maximoElegible(variante), Math.max(0, (actual[variante.id] ?? 0) + delta))
      const copia = { ...actual }
      if (nueva === 0) delete copia[variante.id]
      else copia[variante.id] = nueva
      return copia
    })
  }

  const quitarSeleccion = (idVariante: number) =>
    setSeleccion((actual) => {
      const copia = { ...actual }
      delete copia[idVariante]
      return copia
    })

  const lineas = Object.entries(seleccion).map(([idVariante, cantidad]) => ({ idVarianteProducto: Number(idVariante), cantidad }))
  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0)
  const total = Math.round((unidades * (producto?.precioFinal ?? 0) + Number.EPSILON) * 100) / 100

  /** Devuelve true si la selección quedó en el carrito. */
  const agregarSeleccion = async (): Promise<boolean> => {
    setMensaje(null)
    if (lineas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Elige al menos una variante con el botón +.' })
      return false
    }
    if (!autenticado) {
      // Sin sesión no hay carrito: se manda a iniciar sesión y se vuelve a este producto.
      navigate('/login', { state: { from: location.pathname } })
      return false
    }
    if (!esCliente) {
      setMensaje({ tipo: 'error', texto: 'El carrito es solo para clientes. Inicia sesión con una cuenta de cliente.' })
      return false
    }

    setEnviando(true)
    try {
      await agregar(lineas)
      setSeleccion({})
      return true
    } catch (requestError) {
      setMensaje({ tipo: 'error', texto: extraerMensajeError(requestError) })
      return false
    } finally {
      setEnviando(false)
    }
  }

  const onAgregar = async () => {
    if (await agregarSeleccion()) setMensaje({ tipo: 'ok', texto: 'Agregado a tu carrito.' })
  }

  const onComprarAhora = async () => {
    // Sin nada elegido pero con carrito armado, "Comprar ahora" simplemente lleva al carrito.
    if (lineas.length === 0 && carrito.items.length > 0) {
      navigate('/carrito')
      return
    }
    if (await agregarSeleccion()) navigate('/carrito')
  }

  const onAbrirReserva = () => {
    setMensaje(null)
    if (lineas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Elige al menos una variante con el botón + para reservarla.' })
      return
    }
    if (!autenticado) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    if (!esCliente) {
      setMensaje({ tipo: 'error', texto: 'Las reservas son solo para clientes. Inicia sesión con una cuenta de cliente.' })
      return
    }
    setErrorReserva(null)
    setReservaAbierta(true)
  }

  const onConfirmarReserva = async () => {
    if (idSucursalReserva === '') {
      setErrorReserva('Elige la sucursal donde retirarás tus prendas.')
      return
    }
    setEnviando(true)
    setErrorReserva(null)
    try {
      const reserva = await reservar({ idSucursal: idSucursalReserva, items: lineas })
      setSeleccion({})
      setReservaAbierta(false)
      // La reserva ya aparta el stock; el siguiente paso es pagar su anticipo para confirmarla.
      navigate(`/checkout/reserva/${reserva.id}`)
    } catch (requestError) {
      setErrorReserva(mensajeDeError(requestError, 'No se pudo crear la reserva. Inténtalo de nuevo.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ProductoPageView
      producto={producto}
      relacionados={relacionados}
      cargando={isLoading}
      noEncontrado={!!error}
      seleccion={seleccion}
      enCarrito={Object.fromEntries(carrito.items.map((item) => [item.idVarianteProducto, item.cantidad]))}
      unidades={unidades}
      total={total}
      cantidadEnCarrito={carrito.cantidadTotal}
      enviando={enviando}
      mensaje={mensaje}
      onCambiarCantidad={cambiarCantidad}
      onQuitar={quitarSeleccion}
      onAgregar={onAgregar}
      onComprarAhora={onComprarAhora}
      reservaAbierta={reservaAbierta}
      sucursales={sucursales}
      idSucursalReserva={idSucursalReserva}
      errorReserva={errorReserva}
      onAbrirReserva={onAbrirReserva}
      onCerrarReserva={() => !enviando && setReservaAbierta(false)}
      onSucursalReserva={setIdSucursalReserva}
      onConfirmarReserva={onConfirmarReserva}
    />
  )
}

/** Recorta la selección guardada a las variantes que existen y a lo que aún se puede elegir (stock menos lo del carrito). */
function seleccionValida(
  guardada: SeleccionProducto,
  variantes: VarianteDetalle[] | undefined,
  enCarrito: (idVariante: number) => number,
): SeleccionProducto {
  // Mientras el producto no carga no se sabe qué es válido: se conserva tal cual.
  if (!variantes) return guardada
  const valida: SeleccionProducto = {}
  for (const variante of variantes) {
    const cantidad = Math.min(guardada[variante.id] ?? 0, Math.max(0, variante.stockDisponible - enCarrito(variante.id)))
    if (cantidad > 0) valida[variante.id] = cantidad
  }
  return valida
}

function extraerMensajeError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }
  return 'No se pudo agregar al carrito. Inténtalo de nuevo.'
}
