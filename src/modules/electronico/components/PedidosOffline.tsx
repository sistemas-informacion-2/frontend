import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import type { PedidoOffline } from '@/core/offline/pedidosOfflineDb'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { useEnLinea, usePedidosOffline, useSucursalesPublicas } from '../hooks'
import { descartarAvisos, useCarritoOfflineStore, vaciarLocal } from '../offline/carritoOffline'
import { cambiarSucursalPedido, crearPedidoOffline, enviarPedido, quitarPedido, reintentarPedido } from '../offline/pedidosOffline'
import type { Carrito } from '../types'
import { bs, formatearFechaHora } from '../utils/reservas'

const TARJETA = 'rounded-xl border border-neutral-200 p-5 dark:border-neutral-800'
const TEXTO_SUAVE = 'text-sm text-neutral-600 dark:text-neutral-400'

/**
 * Checkout sin conexion (RF-SYNC-01, criterio 1): en vez de un error de red, el cliente guarda el pedido en el
 * dispositivo. Sin red no se puede cobrar, asi que al sincronizarse se convierte en una reserva para retiro.
 */
export function PedidoOfflinePanel({ carrito, onReintentarConexion }: { carrito: Carrito; onReintentarConexion?: () => void }) {
  const perfil = useAuthStore((state) => state.perfil)
  const enLinea = useEnLinea()
  const { sucursales } = useSucursalesPublicas()
  const pedidos = usePedidosOffline()
  const [idGuardado, setIdGuardado] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sucursal = sucursales.find((candidata) => candidata.id === carrito.idSucursal)
  const guardado = pedidos.find((pedido) => pedido.id_local === idGuardado)

  const guardar = async () => {
    if (!perfil || carrito.idSucursal === null) return
    setGuardando(true)
    setError(null)
    try {
      const pedido = await crearPedidoOffline(carrito, carrito.idSucursal, sucursal?.nombre ?? `Sucursal ${carrito.idSucursal}`, perfil.id)
      setIdGuardado(pedido.id_local)
      // Lo agregado sin conexion ya va dentro del pedido: no debe subir despues al carrito y cobrarse dos veces.
      vaciarLocal(perfil.id)
      // Sin red el Service Worker lo deja en su cola (202) o queda pendiente para el proximo intento.
      await enviarPedido(pedido)
    } catch {
      setError('No se pudo guardar el pedido en este dispositivo. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          ● {enLinea ? 'No podemos conectar con la tienda' : 'Sin conexión'}
        </p>
        {onReintentarConexion && !guardado && (
          <button type="button" onClick={onReintentarConexion} className="text-xs font-medium underline dark:text-neutral-300">
            Reintentar conexión
          </button>
        )}
      </div>
      <h1 className="mb-2 text-2xl font-semibold dark:text-white">Guarda tu pedido para retirarlo en tienda</h1>
      <p className={`mb-6 ${TEXTO_SUAVE}`}>
        Ahora no podemos cobrar en línea. Guardamos tu pedido en este dispositivo y lo enviamos solo cuando vuelva la conexión, aunque cierres
        la pestaña. Al llegar se registra como una <strong>reserva</strong> en {sucursal?.nombre ?? 'tu sucursal'}: pagas el anticipo en línea
        o todo al retirar. No se te cobra nada ahora.
      </p>

      <div className={`${TARJETA} mb-6`}>
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {carrito.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-2 text-sm dark:text-neutral-200">
              <span>
                {item.cantidad} × {item.productoNombre}{' '}
                <span className="text-neutral-500">
                  ({item.talla}/{item.color})
                </span>
              </span>
              <span className="shrink-0">{bs(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-neutral-200 pt-3 font-semibold dark:border-neutral-800 dark:text-white">
          <span>Total</span>
          <span>{bs(carrito.total)}</span>
        </p>
      </div>

      {guardado ? (
        <EstadoPedidoGuardado pedido={guardado} />
      ) : carrito.idSucursal === null ? (
        <p className={TEXTO_SUAVE}>Tu carrito no tiene una sucursal asignada. Cuando vuelva la conexión, elige tu sucursal en el catálogo.</p>
      ) : (
        <>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <Button onClick={() => void guardar()} loading={guardando} className="w-full sm:w-auto">
            Guardar pedido sin conexión
          </Button>
        </>
      )}
    </section>
  )
}

function EstadoPedidoGuardado({ pedido }: { pedido: PedidoOffline }) {
  if (pedido.estado_sincronizacion === 'SINCRONIZADO' && pedido.reserva) {
    return (
      <div className={`${TARJETA} border-emerald-300 dark:border-emerald-800`}>
        <p className="font-medium text-emerald-700 dark:text-emerald-400">Tu pedido ya es la reserva {pedido.reserva.codigo_reserva}.</p>
        <p className={`mt-1 ${TEXTO_SUAVE}`}>Paga el anticipo de {bs(pedido.reserva.monto_anticipo)} antes del {formatearFechaHora(pedido.reserva.fecha_limite)}.</p>
        <Link to={`/checkout/reserva/${pedido.reserva.id}`} className="mt-3 inline-block text-sm font-medium underline">
          Pagar el anticipo
        </Link>
      </div>
    )
  }
  if (pedido.estado_sincronizacion === 'PENDIENTE_ENVIO' || pedido.estado_sincronizacion === 'REQUIERE_SESION') {
    return (
      <div className={TARJETA}>
        <p className="font-medium dark:text-white">Pedido guardado localmente</p>
        <p className={`mt-1 ${TEXTO_SUAVE}`}>
          {pedido.estado_sincronizacion === 'REQUIERE_SESION'
            ? 'Tu sesión venció: vuelve a iniciar sesión y lo enviamos automáticamente.'
            : 'Se enviará automáticamente cuando vuelva la conexión. Te avisaremos aquí mismo.'}
        </p>
      </div>
    )
  }
  return <p className={TEXTO_SUAVE}>No pudimos registrar este pedido. Revisa el aviso para elegir qué hacer.</p>
}

/**
 * Siempre visible en la tienda (PublicLayout): avisa de los pedidos que esperan red, confirma los que ya son reserva
 * y abre el modal de resolucion cuando el servidor rechazo uno por stock (criterio 3).
 */
export function PedidosOfflineMonitor() {
  const pedidos = usePedidosOffline()
  const enLinea = useEnLinea()
  const { mutate } = useSWRConfig()
  const [ocultos, setOcultos] = useState<Set<string>>(new Set())
  const avisosCarrito = useCarritoOfflineStore((estado) => estado.avisos)

  const pendientes = pedidos.filter((pedido) => pedido.estado_sincronizacion === 'PENDIENTE_ENVIO' || pedido.estado_sincronizacion === 'REQUIERE_SESION')
  const sincronizados = pedidos.filter((pedido) => pedido.estado_sincronizacion === 'SINCRONIZADO')
  const rechazados = pedidos.filter((pedido) => pedido.estado_sincronizacion === 'RECHAZADO_POR_STOCK' || pedido.estado_sincronizacion === 'RECHAZADO')
  const conflicto = rechazados.find((pedido) => !ocultos.has(pedido.id_local)) ?? null

  // Un pedido sincronizado cambia el carrito (se quitan las prendas reservadas) y crea una reserva.
  const vistos = useRef(new Set<string>())
  useEffect(() => {
    const nuevos = sincronizados.filter((pedido) => !vistos.current.has(pedido.id_local))
    if (nuevos.length === 0) return
    for (const pedido of nuevos) vistos.current.add(pedido.id_local)
    void mutate('electronico/carrito')
    void mutate('electronico/reservas/mias')
  }, [sincronizados, mutate])

  if (pedidos.length === 0 && avisosCarrito.length === 0) return null

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {avisosCarrito.length > 0 && (
          <div className="rounded-xl border border-red-300 bg-white p-4 text-sm shadow-lg dark:border-red-900 dark:bg-neutral-900 dark:text-neutral-100">
            <p className="font-medium text-red-700 dark:text-red-400">Algunas prendas que agregaste sin conexión no pasaron a tu carrito:</p>
            <ul className="mt-1 list-disc pl-5 text-neutral-600 dark:text-neutral-400">
              {avisosCarrito.map((aviso) => (
                <li key={aviso}>{aviso}</li>
              ))}
            </ul>
            <button type="button" onClick={descartarAvisos} className="mt-2 text-neutral-500 hover:underline">
              Entendido
            </button>
          </div>
        )}

        {pendientes.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm shadow-lg dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            <p className="font-medium">
              {pendientes.length === 1 ? '1 pedido guardado sin conexión' : `${pendientes.length} pedidos guardados sin conexión`}
            </p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
              {pendientes.some((pedido) => pedido.estado_sincronizacion === 'REQUIERE_SESION')
                ? 'Inicia sesión de nuevo para enviarlos.'
                : enLinea
                  ? 'Enviándolos…'
                  : 'Se enviarán solos cuando vuelva la conexión.'}
            </p>
          </div>
        )}

        {sincronizados.map((pedido) => (
          <div key={pedido.id_local} className="rounded-xl border border-emerald-300 bg-white p-4 text-sm shadow-lg dark:border-emerald-800 dark:bg-neutral-900 dark:text-neutral-100">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">Tu pedido sin conexión se registró ✓</p>
            {pedido.reserva && (
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Es la reserva {pedido.reserva.codigo_reserva} en {pedido.sucursal_nombre}. Paga el anticipo de {bs(pedido.reserva.monto_anticipo)} antes del{' '}
                {formatearFechaHora(pedido.reserva.fecha_limite)}.
              </p>
            )}
            <div className="mt-3 flex gap-3">
              {pedido.reserva && (
                <Link to={`/checkout/reserva/${pedido.reserva.id}`} onClick={() => void quitarPedido(pedido.id_local)} className="font-medium underline">
                  Pagar anticipo
                </Link>
              )}
              <button type="button" onClick={() => void quitarPedido(pedido.id_local)} className="text-neutral-500 hover:underline">
                Entendido
              </button>
            </div>
          </div>
        ))}

        {rechazados.length > 0 && !conflicto && (
          <button
            type="button"
            onClick={() => setOcultos(new Set())}
            className="rounded-xl border border-red-300 bg-white p-4 text-left text-sm shadow-lg dark:border-red-900 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <span className="font-medium text-red-700 dark:text-red-400">Un pedido sin conexión necesita tu decisión.</span> <span className="underline">Resolver</span>
          </button>
        )}
      </div>

      {conflicto && <ResolverConflicto pedido={conflicto} onCerrar={() => setOcultos((actual) => new Set(actual).add(conflicto.id_local))} />}
    </>
  )
}

/**
 * Modal de resolucion de un pedido rechazado. Las salidas dependen del motivo: sin stock -> otra sucursal; limite de
 * reservas -> liberar una y reintentar; otro motivo -> reintentar u otra sucursal. Siempre se puede cancelar: no se
 * cobro nada, asi que no hay reembolso que hacer.
 */
function ResolverConflicto({ pedido, onCerrar }: { pedido: PedidoOffline; onCerrar: () => void }) {
  const { sucursales } = useSucursalesPublicas()
  const otras = sucursales.filter((sucursal) => sucursal.id !== pedido.id_sucursal)
  const [idSucursal, setIdSucursal] = useState<number | null>(null)
  const [procesando, setProcesando] = useState(false)
  const elegida = otras.find((sucursal) => sucursal.id === (idSucursal ?? otras[0]?.id)) ?? null
  const porStock = pedido.estado_sincronizacion === 'RECHAZADO_POR_STOCK'
  const porLimite = pedido.codigo_error === 'LIMITE_RESERVAS'

  const descripcion = (idVariante: number) => pedido.detalles.find((detalle) => detalle.id_variante === idVariante)?.descripcion ?? `Variante ${idVariante}`

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setProcesando(true)
    try {
      await accion()
    } finally {
      setProcesando(false)
    }
  }
  const reintentar = () => ejecutar(() => reintentarPedido(pedido.id_local))
  const enviarAOtra = () => elegida && ejecutar(() => cambiarSucursalPedido(pedido.id_local, elegida.id, elegida.nombre))

  return (
    <Modal open title={porStock ? 'Se agotó parte de tu pedido' : 'No pudimos registrar tu pedido'} onClose={onCerrar} maxWidthClassName="sm:max-w-lg">
      <p className={`mb-4 ${TEXTO_SUAVE}`}>
        {porStock
          ? `Mientras estabas sin conexión, estas prendas se vendieron en ${pedido.sucursal_nombre}:`
          : (pedido.mensaje_error ?? 'El servidor rechazó el pedido.')}
      </p>

      {porStock && (
        <ul className="mb-5 space-y-2 text-sm dark:text-neutral-200">
          {(pedido.items_afectados ?? []).map((item) => (
            <li key={item.id_variante} className="flex justify-between gap-4 rounded-md bg-red-50 px-3 py-2 dark:bg-red-950/40">
              <span>{descripcion(item.id_variante)}</span>
              <span className="shrink-0 text-red-700 dark:text-red-400">
                pediste {item.stock_solicitado}, quedan {item.stock_actual}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className={`mb-4 ${TEXTO_SUAVE}`}>No se te cobró nada. ¿Qué quieres hacer?</p>

      {porLimite && (
        <div className="mb-4 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800 dark:text-neutral-200">
          <p className="mb-3">
            Cancela o completa una de tus reservas en{' '}
            <Link to="/mi-cuenta/reservas" onClick={onCerrar} className="font-medium underline">
              Mis reservas
            </Link>{' '}
            y vuelve a enviar este pedido.
          </p>
          <Button onClick={() => void reintentar()} loading={procesando} className="w-full">
            Volver a enviar el pedido
          </Button>
        </div>
      )}

      {!porStock && !porLimite && (
        <Button onClick={() => void reintentar()} loading={procesando} className="mb-4 w-full">
          Volver a enviar el pedido
        </Button>
      )}

      {!porLimite && otras.length > 0 && (
        <div className="mb-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <label htmlFor="sucursal-retiro" className="mb-2 block text-sm font-medium dark:text-white">
            {porStock ? 'Retirar en otra sucursal' : 'O retirarlo en otra sucursal'}
          </label>
          <select
            id="sucursal-retiro"
            value={elegida?.id ?? ''}
            onChange={(event) => setIdSucursal(Number(event.target.value))}
            className="mb-3 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          >
            {otras.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre} — {sucursal.ciudadNombre}
              </option>
            ))}
          </select>
          <Button variant={porStock ? 'primary' : 'secondary'} onClick={() => void enviarAOtra()} loading={procesando} disabled={!elegida} className="w-full">
            Enviar el pedido a {elegida?.nombre ?? 'esa sucursal'}
          </Button>
        </div>
      )}

      <Button variant="secondary" onClick={() => void quitarPedido(pedido.id_local)} disabled={procesando} className="w-full">
        Cancelar el pedido
      </Button>
    </Modal>
  )
}
