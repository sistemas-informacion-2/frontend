import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Sucursal } from '@/modules/operaciones/types'
import type { Almacen, InventarioItem } from '@/modules/inventario/types'

interface StockPageViewProps {
  items: InventarioItem[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  almacenes: Almacen[]
  sucursales: Sucursal[]
  loading: boolean
  error: string | null
  search: string
  idAlmacen: number | ''
  idSucursal: number | ''
  bajoMinimo: boolean
  canManage: boolean
  modal: ReactNode
  onSearch: (value: string) => void
  onAlmacen: (value: number | '') => void
  onSucursal: (value: number | '') => void
  onBajoMinimo: (value: boolean) => void
  onCreate: () => void
  onAjustar: (item: InventarioItem) => void
  onPageChange: (page: number) => void
  onCloseModal: () => void
}

export function StockPageView({
  items,
  meta,
  almacenes,
  sucursales,
  loading,
  error,
  search,
  idAlmacen,
  idSucursal,
  bajoMinimo,
  canManage,
  modal,
  onSearch,
  onAlmacen,
  onSucursal,
  onBajoMinimo,
  onCreate,
  onAjustar,
  onPageChange,
  onCloseModal,
}: StockPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Stock por almacén</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Existencias de cada variante en cada almacén, con alertas de stock mínimo.
          </p>
        </div>
        {canManage && <Button onClick={onCreate}>Registrar stock</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Input label="Buscar" placeholder="SKU o producto" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Almacén" value={idAlmacen === '' ? '' : String(idAlmacen)} onChange={(event) => onAlmacen(event.target.value ? Number(event.target.value) : '')}>
            <option value="">Todos</option>
            {almacenes.map((almacen) => (
              <option key={almacen.id} value={String(almacen.id)}>{almacen.nombre}</option>
            ))}
          </Select>
          <Select label="Sucursal" value={idSucursal === '' ? '' : String(idSucursal)} onChange={(event) => onSucursal(event.target.value ? Number(event.target.value) : '')}>
            <option value="">Todas</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={String(sucursal.id)}>{sucursal.nombre}</option>
            ))}
          </Select>
          <label className="flex items-end gap-2 pb-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
              checked={bajoMinimo}
              onChange={(event) => onBajoMinimo(event.target.checked)}
            />
            Solo bajo mínimo
          </label>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Sin existencias registradas" description="No se encontraron registros de stock con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Registrar stock</Button> : undefined} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Almacén</th>
                  <th className="px-4 py-3 font-medium">Disponible</th>
                  <th className="px-4 py-3 font-medium">Reservado</th>
                  <th className="px-4 py-3 font-medium">Mín / Máx</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {items.map((item) => (
                  <tr key={item.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{item.productoNombre}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{item.sku}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.talla}/{item.color}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{item.almacenNombre}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.sucursalNombre}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{item.stockDisponible}</td>
                    <td className="px-4 py-3">{item.stockReservado}</td>
                    <td className="px-4 py-3">{item.stockMinimo} / {item.stockMaximo}</td>
                    <td className="px-4 py-3">
                      <Badge tone={item.bajoMinimo ? 'danger' : 'success'}>{item.bajoMinimo ? 'Bajo mínimo' : 'OK'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <button type="button" onClick={() => onAjustar(item)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Ajustar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />}

      <Modal open={!!modal} title={modal ? 'Inventario' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}
