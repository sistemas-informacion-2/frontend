import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Proveedor } from '@/modules/inventario/types'
import type { Sucursal } from '@/modules/operaciones/types'
import type { Compra } from '../../types'

interface ComprasPageViewProps {
  items: Compra[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  proveedores: Proveedor[]
  sucursales: Sucursal[]
  loading: boolean
  error: string | null
  nroFactura: string
  idProveedor: number | ''
  idSucursal: number | ''
  fechaDesde: string
  fechaHasta: string
  detalle: Compra | null
  modal: ReactNode
  onNroFactura: (value: string) => void
  onProveedor: (value: number | '') => void
  onSucursal: (value: number | '') => void
  onFechaDesde: (value: string) => void
  onFechaHasta: (value: string) => void
  onCreate: () => void
  onVer: (compra: Compra) => void
  onPageChange: (page: number) => void
  onCloseModal: () => void
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' })

function bs(valor: number): string {
  return `Bs ${valor.toFixed(2)}`
}

export function ComprasPageView({
  items,
  meta,
  proveedores,
  sucursales,
  loading,
  error,
  nroFactura,
  idProveedor,
  idSucursal,
  fechaDesde,
  fechaHasta,
  detalle,
  modal,
  onNroFactura,
  onProveedor,
  onSucursal,
  onFechaDesde,
  onFechaHasta,
  onCreate,
  onVer,
  onPageChange,
  onCloseModal,
}: ComprasPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Compras</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Notas de compra a proveedores. Al registrarlas, el stock de los almacenes de la sucursal aumenta automáticamente.
          </p>
        </div>
        <Button onClick={onCreate}>Registrar compra</Button>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Input label="Nº de factura" placeholder="Buscar factura" value={nroFactura} onChange={(event) => onNroFactura(event.target.value)} />
          <Select label="Proveedor" value={idProveedor === '' ? '' : String(idProveedor)} onChange={(event) => onProveedor(event.target.value ? Number(event.target.value) : '')}>
            <option value="">Todos</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={String(proveedor.id)}>
                {proveedor.empresa}
              </option>
            ))}
          </Select>
          <Select label="Sucursal" value={idSucursal === '' ? '' : String(idSucursal)} onChange={(event) => onSucursal(event.target.value ? Number(event.target.value) : '')}>
            <option value="">Todas</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={String(sucursal.id)}>
                {sucursal.nombre}
              </option>
            ))}
          </Select>
          <Input label="Desde" type="date" value={fechaDesde} onChange={(event) => onFechaDesde(event.target.value)} />
          <Input label="Hasta" type="date" value={fechaHasta} onChange={(event) => onFechaHasta(event.target.value)} />
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Sin compras registradas" description="No se encontraron compras con los filtros seleccionados." action={<Button onClick={onCreate}>Registrar compra</Button>} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Factura</th>
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Líneas</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {items.map((compra) => (
                  <tr key={compra.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3">{FORMATO_FECHA.format(new Date(compra.fechaEmision))}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{compra.nroFactura ?? `#${compra.id}`}</td>
                    <td className="px-4 py-3">{compra.proveedorNombre}</td>
                    <td className="px-4 py-3">{compra.sucursalNombre}</td>
                    <td className="px-4 py-3">{compra.cantidadLineas}</td>
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{bs(compra.total)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={compra.idMovimientoCaja ? 'success' : 'neutral'}>{compra.idMovimientoCaja ? 'Pagado en caja' : 'Sin pago en caja'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => onVer(compra)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />}

      <Modal open={!!modal || !!detalle} title={detalle ? `Compra ${detalle.nroFactura ?? `#${detalle.id}`}` : 'Registrar compra'} onClose={onCloseModal}>
        {detalle ? <DetalleCompra compra={detalle} /> : modal}
      </Modal>
    </div>
  )
}

function DetalleCompra({ compra }: { compra: Compra }) {
  return (
    <div className="space-y-4 text-sm text-neutral-700 dark:text-neutral-300">
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Proveedor</dt>
          <dd className="font-medium text-neutral-900 dark:text-white">{compra.proveedorNombre}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Sucursal</dt>
          <dd className="font-medium text-neutral-900 dark:text-white">{compra.sucursalNombre}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Emisión</dt>
          <dd>{FORMATO_FECHA.format(new Date(compra.fechaEmision))}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Entrega programada</dt>
          <dd>{compra.fechaEntregaProgramada ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Pago</dt>
          <dd>{compra.idMovimientoCaja ? `Egreso de caja el ${compra.fechaPago}` : 'Sin pago desde caja'}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Estado</dt>
          <dd>{compra.estado}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[520px] text-left">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">Almacén</th>
              <th className="px-3 py-2 text-right font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">P. unit.</th>
              <th className="px-3 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {compra.detalles.map((linea) => (
              <tr key={linea.id}>
                <td className="px-3 py-2">
                  <p className="font-medium text-neutral-900 dark:text-white">{linea.productoNombre}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {linea.sku} · {linea.talla}/{linea.color}
                    {linea.nroLote ? ` · Lote ${linea.nroLote}` : ''}
                  </p>
                </td>
                <td className="px-3 py-2">{linea.almacenNombre}</td>
                <td className="px-3 py-2 text-right">{linea.cantidad}</td>
                <td className="px-3 py-2 text-right">{bs(linea.precioUnitario)}</td>
                <td className="px-3 py-2 text-right font-medium">{bs(linea.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-right text-base font-semibold text-neutral-900 dark:text-white">Total: {bs(compra.total)}</p>
    </div>
  )
}
