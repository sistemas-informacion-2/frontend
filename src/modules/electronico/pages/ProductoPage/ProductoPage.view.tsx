import { ArrowLeft, MapPin, Search, ShoppingBag, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Producto } from '@/modules/inventario/types'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { GaleriaProducto } from '../../components/GaleriaProducto'
import { ProbadorIA } from '../../components/ProbadorIA'
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
  /** Sucursal ya elegida en la barra de categorías (CU08): la reserva no vuelve a preguntar. */
  sucursalActiva: SucursalPublica | null
  errorReserva: string | null
  onAbrirReserva: () => void
  onCerrarReserva: () => void
  onConfirmarReserva: () => void
  /** Probador con IA (CU19). */
  probadorVariante: VarianteDetalle | null
  probadorAbierto: boolean
  onProbarPrenda: (variante: VarianteDetalle) => void
  onCerrarProbador: () => void
  onAgregarDesdeProbador: () => void
  enviandoProbador: boolean
}

const TARJETA = 'rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950'
/** Con menos variantes, estirar las filas las deja enormes y con el contenido flotando: se quedan arriba con su alto normal. */
const MINIMO_VARIANTES_PARA_LLENAR = 3

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
  sucursalActiva,
  errorReserva,
  onAbrirReserva,
  onCerrarReserva,
  onConfirmarReserva,
  probadorVariante,
  probadorAbierto,
  onProbarPrenda,
  onCerrarProbador,
  onAgregarDesdeProbador,
  enviandoProbador,
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
          icon={<Search className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />}
          title="No encontramos este producto"
          description="Puede que ya no esté disponible."
          action={
            <Link to="/" className="rounded-full bg-brand-solid px-5 py-2 text-sm font-medium text-brand-on transition-colors hover:bg-brand-solid-hover">
              Volver al catálogo
            </Link>
          }
        />
      </div>
    )
  }

  const conDescuento = producto.descuentoPorcentaje > 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al catálogo
      </Link>

      {/* La foto fija la altura de la fila y la columna de datos la llena: las dos terminan a la misma altura. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none lg:self-start">
          <GaleriaProducto imagenes={producto.imagenes} nombre={producto.nombre} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
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
                -{producto.descuentoPorcentaje}% de descuento
              </span>
            )}

            <div className="mt-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Precio</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {bs(producto.precioFinal)}
                {conDescuento && <span className="ml-2 text-base font-normal text-neutral-400 line-through dark:text-neutral-400">{bs(producto.precio)}</span>}
              </p>
            </div>

            {producto.descripcion && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Descripción</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-600 lg:max-h-20 lg:overflow-y-auto lg:[scrollbar-width:thin] dark:text-neutral-400">{producto.descripcion}</p>
              </div>
            )}
          </section>

          <section className={`${TARJETA} flex flex-col lg:min-h-[215px] lg:flex-[1_1_0px]`}>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Elige talla, color y cantidad</h2>

            {producto.variantes.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Este producto todavía no tiene variantes disponibles.</p>
            ) : (
              // En escritorio ocupa solo el espacio libre junto a la foto: la base de 0 px evita que alargue la columna.
              <ul tabIndex={0} aria-label="Variantes disponibles" className="mt-3 flex max-h-[290px] flex-col gap-2 overflow-y-auto overscroll-contain pr-1 outline-none [scrollbar-width:thin] focus-visible:ring-2 focus-visible:ring-brand lg:max-h-none lg:min-h-0 lg:flex-[1_1_0px]">

                {producto.variantes.map((variante) => {
                  const elegidas = seleccion[variante.id] ?? 0
                  const yaEnCarrito = enCarrito[variante.id] ?? 0
                  const maximo = Math.max(0, variante.stockDisponible - yaEnCarrito)
                  const agotado = variante.stockDisponible === 0

                  return (
                    <li
                      key={variante.id}
                      className={`flex shrink-0 flex-wrap content-center items-center justify-between gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5 ${
                        producto.variantes.length >= MINIMO_VARIANTES_PARA_LLENAR ? 'lg:grow' : ''
                      } ${
                        agotado
                          ? 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className={`min-w-0 flex-1 basis-36 ${agotado ? 'text-neutral-400 dark:text-neutral-400' : ''}`}>
                        <p className={`text-sm font-medium ${agotado ? '' : 'text-neutral-900 dark:text-white'}`}>
                          Talla {variante.talla} · {variante.color}
                        </p>
                        <p className="truncate text-xs" title={`${variante.corte} · ${variante.sku}`}>
                          {variante.corte} · {variante.sku}
                        </p>
                        <p className="mt-0.5 text-xs font-medium">
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

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => onProbarPrenda(variante)}
                          aria-label={`Probar con IA talla ${variante.talla} ${variante.color}`}
                          title="Probar con IA"
                          className="rounded-full px-3 py-1.5 text-xs"
                        >
                          <Sparkles className="h-4 w-4" aria-hidden="true" /> Probar
                        </Button>
                        <SelectorCantidad
                          cantidad={elegidas}
                          maximo={maximo}
                          etiqueta={`${variante.talla} ${variante.color}`}
                          onMas={() => onCambiarCantidad(variante, 1)}
                          onMenos={() => onCambiarCantidad(variante, -1)}
                          onQuitar={() => onQuitar(variante.id)}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

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
                Agregar <ShoppingBag className="inline h-4 w-4 align-text-bottom" aria-hidden="true" />
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

      {relacionados.length > 0 && (
        <section aria-labelledby="titulo-relacionados" className="mt-10 rounded-xl border border-neutral-200 bg-white p-4 sm:-mx-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 id="titulo-relacionados" className="mb-3 text-base font-semibold text-neutral-900 dark:text-white">
            También te puede interesar
          </h2>
          {/* Mismas columnas que el catálogo: 2, 3 o 4 prendas a la vista y el resto al desplazar. */}
          <div tabIndex={0} aria-label="Prendas recomendadas" className="flex snap-x gap-4 overflow-x-auto overscroll-x-contain pb-3 outline-none [scrollbar-width:thin] focus-visible:ring-2 focus-visible:ring-brand sm:gap-6">
            {relacionados.map((relacionado) => (
              <div key={relacionado.id} className="w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-3rem)/3)] md:w-[calc((100%-4.5rem)/4)]">
                <ProductoCard producto={relacionado} />
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal open={reservaAbierta} title="Reservar en sucursal" onClose={onCerrarReserva}>
        <div className="space-y-4 text-sm">
          <p className="text-neutral-600 dark:text-neutral-400">
            Apartamos {unidades} {unidades === 1 ? 'prenda' : 'prendas'} de <strong>{producto.nombre}</strong> por {bs(total)}. Para confirmarla pagas un anticipo del {PORCENTAJE_ANTICIPO_MINIMO}% con QR, Stripe o tarjeta en el paso siguiente, y el resto se cobra al retirarlas en la sucursal. Tienes 48 horas; pasado ese plazo el stock se libera.
          </p>
          <p className="rounded-md bg-neutral-100 px-3 py-2 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            <MapPin className="inline h-4 w-4 align-text-bottom" aria-hidden="true" /> Retiras en <strong>{sucursalActiva?.nombre ?? '…'}</strong>
            {sucursalActiva && ` — ${sucursalActiva.ubicacion}`}. Para cambiar de sucursal, usa el selector de arriba antes de reservar.
          </p>
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

      <ProbadorIA
        open={probadorAbierto}
        producto={producto}
        detalleVariante={probadorVariante ? `Talla ${probadorVariante.talla} · ${probadorVariante.color} · ${probadorVariante.corte}` : undefined}
        onCerrar={onCerrarProbador}
        onAgregarAlCarrito={onAgregarDesdeProbador}
        agregandoAlCarrito={enviandoProbador}
      />
    </div>
  )
}
