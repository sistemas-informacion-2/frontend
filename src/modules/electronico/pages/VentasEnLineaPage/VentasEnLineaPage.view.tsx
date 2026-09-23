import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Venta } from '@/modules/comercial/types'
import { bs } from '../../utils/reservas'

interface VentasEnLineaPageViewProps {
  ventas: Venta[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  loading: boolean
  error: string | null
  search: string
  sucursalNombre: string | null
  abierta: boolean
  detalle: ReactNode
  onSearch: (value: string) => void
  onVer: (id: number) => void
  onCerrar: () => void
  onPageChange: (page: number) => void
}

export function VentasEnLineaPageView({
  ventas,
  meta,
  loading,
  error,
  search,
  sucursalNombre,
  abierta,
  detalle,
  onSearch,
  onVer,
  onCerrar,
  onPageChange,
}: VentasEnLineaPageViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Ventas en línea</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Notas de venta de las compras que los clientes pagaron en la tienda en línea.
          {sucursalNombre ? ` Sucursal: ${sucursalNombre}.` : ' Mostrando todas las sucursales.'}
        </p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <Input label="Buscar" placeholder="Código, factura o cliente" value={search} onChange={(event) => onSearch(event.target.value)} />
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : ventas.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Sin ventas en línea" description="Aún no hay compras pagadas en la tienda en línea con los filtros seleccionados." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Método de pago</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{venta.codigoNota}</td>
                    <td className="px-4 py-3">{`${venta.fechaEmision} · ${venta.horaEmision.slice(0, 5)}`}</td>
                    <td className="px-4 py-3">{venta.clienteNombre}</td>
                    <td className="px-4 py-3">{venta.sucursalNombre}</td>
                    <td className="px-4 py-3">{venta.pasarelaMetodo ?? '—'}</td>
                    <td className="px-4 py-3">{bs(venta.montoTotal)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={venta.estadoPago === 'Pagado' ? 'success' : 'warning'}>{venta.estadoPago}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onVer(venta.id)}
                        className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-4">
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />
          </div>
        )}
      </section>

      <Modal open={abierta} title="Detalle de venta en línea" onClose={onCerrar}>
        {detalle}
      </Modal>
    </div>
  )
}
