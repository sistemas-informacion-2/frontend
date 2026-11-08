import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import type { MetodoPagoCompra, PedidoOffline } from '@/core/offline/pedidosOfflineDb'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { fetchMetodosOnline } from '../api/checkout.api'
import { useEnLinea, usePedidosOffline, useSucursalesPublicas } from '../hooks'
import { descartarAvisos, useCarritoOfflineStore, vaciarLocal } from '../offline/carritoOffline'
import { crearPedidoOffline, enviarPedido, metodosPagoRecordados, quitarPedido, recordarMetodosPago, reintentarPedido } from '../offline/pedidosOffline'
import type { Carrito } from '../types'
import { bs } from '../utils/reservas'

const TARJETA = 'rounded-xl border border-neutral-200 p-5 dark:border-neutral-800'
const TEXTO_SUAVE = 'text-sm text-neutral-600 dark:text-neutral-400'

const esperaEnvio = (pedido: PedidoOffline) => pedido.estado_sincronizacion === 'COMPRA_PENDIENTE_SINCRONIZACION' || pedido.estado_sincronizacion === 'REQUIERE_SESION'
const porPagar = (pedido: PedidoOffline) => pedido.monto_por_pagar ?? pedido.total

/**
 * Checkout sin conexion (RF-SYNC-01, criterio 1): en vez de un error de red, el cliente confirma su compra y se guarda
 * en el dispositivo. El pago queda pendiente hasta que vuelva la conexion: entonces paga el total y recibe su Nota de Venta.
 */
export function PedidoOfflinePanel({ carrito, onReintentarConexion }: { carrito: Carrito; onReintentarConexion?: () => void }) {
  const perfil = useAuthStore((state) => state.perfil)
  const enLinea = useEnLinea()
  const { sucursales } = useSucursalesPublicas()
  const pedidos = usePedidosOffline()
  const [metodos] = useState(metodosPagoRecordados)
  const [metodo, setMetodo] = useState<MetodoPagoCompra | null>(metodos[0]?.codigo ?? null)
  const [idGuardado, setIdGuardado] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sucursal = sucursales.find((candidata) => candidata.id === carrito.idSucursal)
  const guardado = pedidos.find((pedido) => pedido.id_local_offline === idGuardado)

  const guardar = async () => {
    if (!perfil || carrito.idSucursal === null) return
    setGuardando(true)
    setError(null)
    try {
      const pedido = await crearPedidoOffline(carrito, carrito.idSucursal, sucursal?.nombre ?? `Sucursal ${carrito.idSucursal}`, metodo, perfil.id)
      setIdGuardado(pedido.id_local_offline)
      // Lo agregado sin conexion ya va dentro de la compra: no debe subir despues al carrito y cobrarse dos veces.
      vaciarLocal(perfil.id)
      // Sin red el Service Worker la deja en su cola (202) o queda pendiente para el proximo intento.
      await enviarPedido(pedido)
    } catch {
      setError('No se pudo guardar la compra en este dispositivo. Intenta de nuevo.')
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
      <h1 className="mb-2 text-2xl font-semibold dark:text-white">Confirma tu compra</h1>
      <p className={`mb-6 ${TEXTO_SUAVE}`}>
        Ahora no podemos cobrar en línea, así que <strong>no se te cobra nada todavía</strong>. Guardamos tu compra en este dispositivo y, cuando vuelva
        la conexión, comprobamos que sigan disponibles tus prendas en {sucursal?.nombre ?? 'tu sucursal'} para que pagues el total.
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
        <EstadoCompraGuardada pedido={guardado} />
      ) : carrito.idSucursal === null ? (
        <p className={TEXTO_SUAVE}>Tu carrito no tiene una sucursal asignada. Cuando vuelva la conexión, elige tu sucursal en el catálogo.</p>
      ) : (
        <>
          {metodos.length > 0 ? (
            <div className="mb-4">
              <label htmlFor="metodo-compra-offline" className="mb-2 block text-sm font-medium dark:text-white">
                ¿Cómo quieres pagar cuando vuelva la conexión?
              </label>
              <select
                id="metodo-compra-offline"
                value={metodo ?? ''}
                onChange={(event) => setMetodo(event.target.value as MetodoPagoCompra)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm sm:w-72 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              >
                {metodos.map((opcion) => (
                  <option key={opcion.codigo} value={opcion.codigo}>
                    {opcion.metodo}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className={`mb-4 ${TEXTO_SUAVE}`}>Elegirás el método de pago cuando vuelva la conexión.</p>
          )}
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <Button onClick={() => void guardar()} loading={guardando} className="w-full sm:w-auto">
            Confirmar compra sin conexión
          </Button>
        </>
      )}
    </section>
  )
}

function EstadoCompraGuardada({ pedido }: { pedido: PedidoOffline }) {
  if (pedido.estado_sincronizacion === 'COMPRA_PENDIENTE_PAGO') {
    return (
      <div className={`${TARJETA} border-emerald-300 dark:border-emerald-800`}>
        <p className="font-medium text-emerald-700 dark:text-emerald-400">Tus prendas siguen disponibles.</p>
        <Link to="/checkout" className="mt-3 inline-block text-sm font-medium underline">
          Pagar {bs(porPagar(pedido))}
        </Link>
      </div>
    )
  }
  if (esperaEnvio(pedido)) {
    return (
      <div className={TARJETA}>
        <p className="font-medium dark:text-white">Procesando compra en cuanto vuelva la conexión…</p>
        <p className={`mt-1 ${TEXTO_SUAVE}`}>
          {pedido.estado_sincronizacion === 'REQUIERE_SESION' ? 'Tu sesión venció: vuelve a iniciar sesión y la enviamos automáticamente.' : 'Tu compra está guardada. Te avisaremos aquí mismo.'}
        </p>
      </div>
    )
  }
  return <p className={TEXTO_SUAVE}>No pudimos procesar esta compra. Revisa el aviso.</p>
}

/**
 * Siempre visible en la tienda (PublicLayout): avisa de las compras que esperan red, invita a pagar las ya validadas,
 * confirma las pagadas y explica las que no pudieron concretarse (criterio 3).
 */
export function PedidosOfflineMonitor() {
  const pedidos = usePedidosOffline()
  const enLinea = useEnLinea()
  const { mutate } = useSWRConfig()
  const [ocultos, setOcultos] = useState<Set<string>>(new Set())
  const avisosCarrito = useCarritoOfflineStore((estado) => estado.avisos)

  const pendientes = pedidos.filter(esperaEnvio)
  const paraPagar = pedidos.filter((pedido) => pedido.estado_sincronizacion === 'COMPRA_PENDIENTE_PAGO')
  const completadas = pedidos.filter((pedido) => pedido.estado_sincronizacion === 'COMPRA_COMPLETADA')
  const fallidas = pedidos.filter((pedido) => pedido.estado_sincronizacion === 'COMPRA_FALLIDA' || pedido.estado_sincronizacion === 'COMPRA_RECHAZADA')
  const conflicto = fallidas.find((pedido) => !ocultos.has(pedido.id_local_offline)) ?? null

  // Con red se recuerdan los metodos de pago, para poder elegirlos si luego se pierde la conexion.
  useEffect(() => {
    if (enLinea) void fetchMetodosOnline().then(recordarMetodosPago).catch(() => undefined)
  }, [enLinea])

  // Una compra validada reemplaza el contenido del carrito del servidor.
  const vistos = useRef(new Set<string>())
  useEffect(() => {
    const nuevos = paraPagar.filter((pedido) => !vistos.current.has(pedido.id_local_offline))
    if (nuevos.length === 0) return
    for (const pedido of nuevos) vistos.current.add(pedido.id_local_offline)
    void mutate('electronico/carrito')
  }, [paraPagar, mutate])

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
            <p className="font-medium">Procesando compra en cuanto vuelva la conexión…</p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
              {pendientes.some((pedido) => pedido.estado_sincronizacion === 'REQUIERE_SESION')
                ? 'Inicia sesión de nuevo para enviarla.'
                : enLinea
                  ? 'Enviándola…'
                  : pendientes.length === 1
                    ? 'Tienes 1 compra guardada. Todavía no se te cobró nada.'
                    : `Tienes ${pendientes.length} compras guardadas. Todavía no se te cobró nada.`}
            </p>
          </div>
        )}

        {paraPagar.map((pedido) => (
          <div key={pedido.id_local_offline} className="rounded-xl border border-emerald-300 bg-white p-4 text-sm shadow-lg dark:border-emerald-800 dark:bg-neutral-900 dark:text-neutral-100">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">Volvió la conexión: completa tu compra</p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              Tus prendas siguen disponibles en {pedido.sucursal_nombre}. Total: {bs(porPagar(pedido))}.{pedido.precios_actualizados ? ' Algún precio cambió mientras no había conexión.' : ''}
            </p>
            <div className="mt-3 flex gap-3">
              <Link to="/checkout" className="font-medium underline">
                Pagar ahora
              </Link>
              <button type="button" onClick={() => void quitarPedido(pedido.id_local_offline)} className="text-neutral-500 hover:underline">
                Cancelar compra
              </button>
            </div>
          </div>
        ))}

        {completadas.map((pedido) => (
          <div key={pedido.id_local_offline} className="rounded-xl border border-emerald-300 bg-white p-4 text-sm shadow-lg dark:border-emerald-800 dark:bg-neutral-900 dark:text-neutral-100">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">Compra confirmada ✓</p>
            {pedido.codigo_nota && <p className="mt-1 text-neutral-600 dark:text-neutral-400">Tu nota de venta es la {pedido.codigo_nota}.</p>}
            <button type="button" onClick={() => void quitarPedido(pedido.id_local_offline)} className="mt-2 text-neutral-500 hover:underline">
              Entendido
            </button>
          </div>
        ))}

        {fallidas.length > 0 && !conflicto && (
          <button
            type="button"
            onClick={() => setOcultos(new Set())}
            className="rounded-xl border border-red-300 bg-white p-4 text-left text-sm shadow-lg dark:border-red-900 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <span className="font-medium text-red-700 dark:text-red-400">Una compra sin conexión no pudo concretarse.</span> <span className="underline">Ver</span>
          </button>
        )}
      </div>

      {conflicto && <CompraNoConcretada pedido={conflicto} onCerrar={() => setOcultos((actual) => new Set(actual).add(conflicto.id_local_offline))} />}
    </>
  )
}

/** Criterio 3: sin stock la compra se cancela, sin reserva ni cobro. Otro rechazo se puede volver a intentar. */
function CompraNoConcretada({ pedido, onCerrar }: { pedido: PedidoOffline; onCerrar: () => void }) {
  const [procesando, setProcesando] = useState(false)
  const sinStock = pedido.estado_sincronizacion === 'COMPRA_FALLIDA'
  const descripcion = (idVariante: number) => pedido.detalles.find((detalle) => detalle.id_variante === idVariante)?.descripcion ?? `Variante ${idVariante}`

  const reintentar = async () => {
    setProcesando(true)
    try {
      await reintentarPedido(pedido.id_local_offline)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Modal open title={sinStock ? 'Tu compra fue cancelada por falta de stock' : 'No pudimos procesar tu compra'} onClose={onCerrar} maxWidthClassName="sm:max-w-lg">
      <p className={`mb-4 ${TEXTO_SUAVE}`}>{sinStock ? `Mientras estabas sin conexión, estas prendas se agotaron en ${pedido.sucursal_nombre}:` : (pedido.mensaje_error ?? 'El servidor rechazó la compra.')}</p>

      {sinStock && (
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

      <p className={`mb-4 ${TEXTO_SUAVE}`}>No se te cobró nada.</p>

      {!sinStock && (
        <Button onClick={() => void reintentar()} loading={procesando} className="mb-3 w-full">
          Intentar de nuevo
        </Button>
      )}
      <Button variant="secondary" onClick={() => void quitarPedido(pedido.id_local_offline)} disabled={procesando} className="w-full">
        {sinStock ? 'Entendido' : 'Cancelar la compra'}
      </Button>
    </Modal>
  )
}
