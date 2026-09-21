import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useSWR, { useSWRConfig } from 'swr'
import { confirmarQrPago, fetchMetodosOnline, fetchMiReserva, generarQrPago, iniciarPagoPaypal, pagarConTarjeta } from '../../api'
import { useCarrito } from '../../hooks'
import type { CodigoMetodoOnline, CompraOnline, DatosTarjeta, IniciarQrRespuesta } from '../../types'
import { bs, extraerMensajeError } from '../../utils/reservas'
import { CheckoutPageView, type PedidoPago, type SinPedido } from './CheckoutPage.view'

const TARJETA_VACIA: DatosTarjeta = { titular: '', numero: '', vencimiento: '', cvv: '' }

function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Agrupa el número de la tarjeta de a 4 dígitos mientras se escribe. */
function formatearNumero(valor: string): string {
  return soloDigitos(valor).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** Inserta la barra del vencimiento: "1229" -> "12/29". */
function formatearVencimiento(valor: string): string {
  const digitos = soloDigitos(valor).slice(0, 4)
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos
}

/** Pago del carrito (`/checkout`). */
export function CheckoutPage() {
  return <CheckoutContenido />
}

/** Pago del anticipo de una reserva (`/checkout/reserva/:id`). Un `key` por reserva evita arrastrar el formulario de otra. */
export function CheckoutReservaPage() {
  const { id } = useParams()
  return <CheckoutContenido key={id} idReserva={Number(id)} />
}

function CheckoutContenido({ idReserva }: { idReserva?: number }) {
  const navigate = useNavigate()
  const { mutate } = useSWRConfig()
  const { autenticado, esCliente, carrito, isLoading: cargandoCarrito, refrescar } = useCarrito()
  const { data: metodos = [], isLoading: cargandoMetodos } = useSWR(esCliente ? 'electronico/checkout/metodos' : null, fetchMetodosOnline, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })
  const { data: reserva, isLoading: cargandoReserva } = useSWR(
    esCliente && idReserva !== undefined ? ['electronico/reservas/mias', idReserva] : null,
    () => fetchMiReserva(idReserva as number),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  )

  const [elegido, setElegido] = useState<CodigoMetodoOnline | null>(null)
  const [tarjeta, setTarjeta] = useState<DatosTarjeta>(TARJETA_VACIA)
  const [qr, setQr] = useState<IniciarQrRespuesta | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [redirigiendo, setRedirigiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si el navegador restaura esta página desde su caché tras volver de PayPal, el botón no debe seguir "ocupado".
  useEffect(() => {
    const alRestaurar = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirigiendo(false)
    }
    window.addEventListener('pageshow', alRestaurar)
    return () => window.removeEventListener('pageshow', alRestaurar)
  }, [])

  // Mientras no elija, se muestra el primero disponible.
  const seleccionado = elegido && metodos.some((metodo) => metodo.codigo === elegido) ? elegido : (metodos[0]?.codigo ?? null)

  let pedido: PedidoPago | null = null
  let sinPedido: SinPedido | null = null
  if (idReserva === undefined) {
    if (carrito.items.length === 0) {
      sinPedido = { titulo: 'No hay nada que pagar', descripcion: 'Tu carrito está vacío. Agrega prendas desde el catálogo.', to: '/', etiqueta: 'Ir al catálogo' }
    } else {
      pedido = {
        titulo: 'Finalizar compra',
        resumenTitulo: 'Tu pedido',
        items: carrito.items.map((item) => ({
          id: item.id,
          titulo: `${item.cantidad} × ${item.productoNombre}`,
          detalle: `Talla ${item.talla} · ${item.color}`,
          subtotal: item.subtotal,
        })),
        totalEtiqueta: 'Total',
        total: carrito.total,
        hayNoDisponibles: carrito.items.some((item) => !item.disponible),
        volver: { to: '/carrito', etiqueta: 'Volver al carrito' },
      }
    }
  } else if (!reserva) {
    sinPedido = { titulo: 'No encontramos esa reserva', descripcion: 'Puede que ya no exista o que no sea tuya.', to: '/mi-cuenta/reservas', etiqueta: 'Ver mis reservas' }
  } else if (reserva.estado !== 'PENDIENTE') {
    sinPedido = {
      titulo: reserva.estado === 'PAGADA' ? 'Esta reserva ya tiene el anticipo pagado' : 'Esta reserva ya no admite pagos',
      descripcion: reserva.estado === 'PAGADA' ? 'Solo queda retirar tus prendas en la sucursal antes del plazo.' : 'Puede que haya vencido o que se haya cancelado.',
      to: '/mi-cuenta/reservas',
      etiqueta: 'Ver mis reservas',
    }
  } else {
    pedido = {
      titulo: 'Paga el anticipo de tu reserva',
      resumenTitulo: `Reserva ${reserva.codigoReserva}`,
      items: reserva.detalles.map((detalle) => ({
        id: detalle.id,
        titulo: `${detalle.cantidad} × ${detalle.productoNombre}`,
        detalle: `Talla ${detalle.talla} · ${detalle.color}`,
        subtotal: detalle.subtotal,
      })),
      totalEtiqueta: 'Anticipo a pagar',
      total: reserva.montoAnticipo,
      nota: `Total de la reserva: ${bs(reserva.montoTotal)}. El resto (${bs(reserva.montoTotal - reserva.montoAnticipo)}) se paga al retirar tus prendas en ${reserva.sucursalNombre}.`,
      hayNoDisponibles: false,
      volver: { to: '/mi-cuenta/reservas', etiqueta: 'Mis reservas' },
    }
  }

  // Un QR generado con otro monto ya no vale: si el total cambia, se descarta.
  const qrVigente = qr && pedido && qr.montoBob === pedido.total ? qr : null

  const terminar = async (compra: CompraOnline) => {
    // El pago cambia el carrito (queda vacío) o la reserva (queda pagada): se vuelve a leer lo que se muestra en otras pantallas.
    await Promise.all([refrescar(), mutate('electronico/reservas/mias')])
    navigate('/checkout/exito', { replace: true, state: { compra } })
  }

  const ejecutar = async (accion: () => Promise<void>) => {
    setProcesando(true)
    setError(null)
    try {
      await accion()
    } catch (requestError) {
      setError(extraerMensajeError(requestError, 'No se pudo procesar el pago. No se te cobró nada.'))
      // El stock o el monto pudieron cambiar: se vuelve a leer para mostrarlo al día.
      await Promise.all([refrescar(), mutate(['electronico/reservas/mias', idReserva])])
    } finally {
      setProcesando(false)
    }
  }

  return (
    <CheckoutPageView
      autenticado={autenticado}
      esCliente={esCliente}
      cargando={cargandoCarrito || cargandoReserva}
      pedido={pedido}
      sinPedido={sinPedido}
      metodos={metodos}
      cargandoMetodos={cargandoMetodos}
      seleccionado={seleccionado}
      tarjeta={tarjeta}
      qr={qrVigente}
      procesando={procesando}
      redirigiendo={redirigiendo}
      error={error}
      onSeleccionar={(codigo) => {
        setElegido(codigo)
        setError(null)
      }}
      onTarjeta={(campo, valor) =>
        setTarjeta((actual) => ({
          ...actual,
          [campo]: campo === 'numero' ? formatearNumero(valor) : campo === 'vencimiento' ? formatearVencimiento(valor) : campo === 'cvv' ? soloDigitos(valor).slice(0, 4) : valor,
        }))
      }
      onPagarTarjeta={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void ejecutar(async () => terminar(await pagarConTarjeta(tarjeta, idReserva)))
      }}
      onGenerarQr={() => void ejecutar(async () => setQr(await generarQrPago(idReserva)))}
      onConfirmarQr={() => qrVigente && void ejecutar(async () => terminar(await confirmarQrPago(qrVigente.referencia, idReserva)))}
      onPagarPaypal={() =>
        void ejecutar(async () => {
          const orden = await iniciarPagoPaypal(idReserva)
          // PayPal devuelve al cliente a /checkout/paypal/retorno, donde se cobra la orden aprobada.
          // Hasta que el navegador cambie de página el botón debe seguir ocupado: si no, parecería que no responde.
          setRedirigiendo(true)
          window.location.assign(orden.urlAprobacion)
        })
      }
    />
  )
}
