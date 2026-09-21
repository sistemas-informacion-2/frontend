import { Link } from 'react-router-dom'
import type { Producto } from '@/modules/inventario/types'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { GaleriaProducto } from '../../components/GaleriaProducto'
import { ProductoCard } from '../../components/ProductoCard'
import { SelectorCantidad } from '../../components/SelectorCantidad'
import type { ProductoDetalle, SucursalPublica, VarianteDetalle } from '../../types'
import { PORCENTAJE_ANTICIPO_MINIMO } from '../../utils/reservas'

export interface MensajeProducto {
  tipo: 'ok' | 'error'
  texto: string
}

interface ProductoPageViewProps {
  producto?: ProductoDetalle
  relacionados: Producto[]
  cargando: boolean
  noEncontrado: boolean
  /** idVariante -> unidades elegidas sin agregar todavía. */
  seleccion: Record<number, number>
  /** idVariante -> unidades que ya están en el carrito. */
  enCarrito: Record<number, number>
  unidades: number
  total: number
  cantidadEnCarrito: number
  enviando: boolean
  mensaje: MensajeProducto | null
  onCambiarCantidad: (variante: VarianteDetalle, delta: number) => void
  onQuitar: (idVariante: number) => void
  onAgregar: () => void
  onComprarAhora: () => void
  reservaAbierta: boolean
  sucursales: SucursalPublica[]
  idSucursalReserva: number | ''
  errorReserva: string | null
  onAbrirReserva: () => void
  onCerrarReserva: () => void
  onSucursalReserva: (id: number | '') => void
  onConfirmarReserva: () => void
}

const TARJETA = 'rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950'

function bs(valor: number): string {
  return `Bs ${valor.toFixed(2)}`
}

export function ProductoPageView({
  producto,
  relacionados,
  cargando,
  noEncontrado,
  seleccion,
  enCarrito,
  unidades,
  total,
  cantidadEnCarrito,
  enviando,
  mensaje,
  onCambiarCantidad,
  onQuitar,
  onAgregar,
  onComprarAhora,
  reservaAbierta,
  sucursales,
  idSucursalReserva,
  errorReserva,
  onAbrirReserva,
  onCerrarReserva,
  onSucursalReserva,
  onConfirmarReserva,
}: ProductoPageViewProps) {
  if (cargando) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-2">
        <Skeleton className="aspect-3/4 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (noEncontrado || !producto) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<span className="text-4xl">🔎</span>}
          title="No encontramos este producto"
          description="Puede que ya no esté disponible."
          action={
            <Link to="/" className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900">
              Volver al catálogo
            </Link>
          }
        />
      </div>
    )
  }

  const conDescuento = producto.descuentoPorcentaje > 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <GaleriaProducto imagenes={producto.imagenes} nombre={producto.nombre} />

        <div className="space-y-4">
          <section className={TARJETA}>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-white">{producto.nombre}</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Categoría:{' '}
              <Link to={`/?categoria=${producto.categoriaId}`} className="underline hover:text-neutral-900 dark:hover:text-white">
                {producto.categoriaNombre}
              </Link>
            </p>

            {conDescuento && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-neutral-900">
                <span aria-hidden="true">★</span>-{producto.descuentoPorcentaje}% de descuento
              </span>
            )}

            <div className="mt-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Precio</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {bs(producto.precioFinal)}
                {conDescuento && <span className="ml-2 text-base font-normal text-neutral-400 line-through dark:text-neutral-500">{bs(producto.precio)}</span>}
              </p>
            </div>

            {producto.descripcion && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Descripción</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400">{producto.descripcion}</p>
              </div>
            )}
          </section>

          <section className={TARJETA}>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Elige talla, color y cantidad</h2>

            {producto.variantes.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Este producto todavía no tiene variantes disponibles.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {producto.variantes.map((variante) => {
                  const elegidas = seleccion[variante.id] ?? 0
                  const yaEnCarrito = enCarrito[variante.id] ?? 0
                  const maximo = Math.max(0, variante.stockDisponible - yaEnCarrito)
                  const agotado = variante.stockDisponible === 0

                  return (
                    <li
                      key={variante.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${
                        agotado
                          ? 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className={agotado ? 'text-neutral-400 dark:text-neutral-600' : ''}>
                        <p className={`text-sm font-medium ${agotado ? '' : 'text-neutral-900 dark:text-white'}`}>
                          Talla {variante.talla} · {variante.color}
                        </p>
                        <p className="text-xs">
                          {variante.corte} · {variante.sku}
                        </p>
                        <p className="mt-1 text-xs font-medium">
                          {agotado ? (
                            'Agotado'
                          ) : variante.stockDisponible <= 5 ? (
                            <span className="text-amber-700 dark:text-amber-400">Quedan {variante.stockDisponible}</span>
                          ) : (
                            <span className="text-neutral-500 dark:text-neutral-400">Disponible</span>
                          )}
                          {yaEnCarrito > 0 && (
                            <span className="ml-2 font-normal text-neutral-500 dark:text-neutral-400">· En tu carrito: {yaEnCarrito}</span>
                          )}
                        </p>
                      </div>

                      <SelectorCantidad
                        cantidad={elegidas}
                        maximo={maximo}
                        etiqueta={`${variante.talla} ${variante.color}`}
                        onMas={() => onCambiarCantidad(variante, 1)}
                        onMenos={() => onCambiarCantidad(variante, -1)}
                        onQuitar={() => onQuitar(variante.id)}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {relacionados.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">También te puede interesar</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {relacionados.map((relacionado) => (
                  <ProductoCard key={relacionado.id} producto={relacionado} />
                ))}
              </div>
            </section>
          )}

          <section className={TARJETA}>
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Tu selección</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">{bs(total)}</p>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
              </p>
            </div>

            {mensaje && (
              <p
                role={mensaje.tipo === 'error' ? 'alert' : 'status'}
                className={`mt-3 rounded-md px-3 py-2 text-sm ${
                  mensaje.tipo === 'error'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                {mensaje.texto}
              </p>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button onClick={onAgregar} loading={enviando} className="rounded-full">
                Agregar <span aria-hidden="true">🛒</span>
              </Button>
              <Button variant="secondary" onClick={onAbrirReserva} disabled={enviando} className="rounded-full">
                Reservar
              </Button>
              <Link
                to="/carrito"
                className="flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Ir al carrito{cantidadEnCarrito > 0 ? ` (${cantidadEnCarrito})` : ''}
              </Link>
              <Button variant="secondary" onClick={onComprarAhora} disabled={enviando} className="rounded-full">
                Comprar ahora
              </Button>
            </div>
          </section>
        </div>
      </div>

      <Modal open={reservaAbierta} title="Reservar en sucursal" onClose={onCerrarReserva}>
        <div className="space-y-4 text-sm">
          <p className="text-neutral-600 dark:text-neutral-400">
            Apartamos {unidades} {unidades === 1 ? 'prenda' : 'prendas'} de <strong>{producto.nombre}</strong> por {bs(total)}. Para confirmarla pagas un anticipo del {PORCENTAJE_ANTICIPO_MINIMO}% con QR, PayPal o tarjeta en el paso siguiente, y el resto se cobra al retirarlas en la sucursal. Tienes 48 horas; pasado ese plazo el stock se libera.
          </p>
          <Select
            label="Sucursal donde retirarás"
            value={idSucursalReserva === '' ? '' : String(idSucursalReserva)}
            onChange={(event) => onSucursalReserva(event.target.value === '' ? '' : Number(event.target.value))}
          >
            <option value="">Selecciona una sucursal</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre} — {sucursal.ubicacion}
              </option>
            ))}
          </Select>
          {errorReserva && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {errorReserva}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button variant="secondary" onClick={onCerrarReserva} disabled={enviando}>
              Volver
            </Button>
            <Button onClick={onConfirmarReserva} loading={enviando}>
              Reservar y pagar anticipo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
