import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Devolucion, TipoDevolucion } from '../../types'

interface DevolucionesPageViewProps {
  devoluciones: Devolucion[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  loading: boolean
  error: string | null
  search: string
  tipo: TipoDevolucion | ''
  sucursalNombre: string | null
  canManage: boolean
  modal: 'crear' | 'detalle' | null
  modalContent: ReactNode
  onSearch: (value: string) => void
  onTipo: (value: TipoDevolucion | '') => void
  onCreate: () => void
  onVerDetalle: (id: number) => void
  onPageChange: (page: number) => void
  onCloseModal: () => void
}

const MOTIVOS = {
  FALLA_FABRICA: 'Falla de fábrica',
  TALLA_INCORRECTA: 'Talla incorrecta',
  ARREPENTIMIENTO: 'Arrepentimiento',
  CANCELACION: 'Cancelación',
} as const

export function DevolucionesPageView({
  devoluciones,
  meta,
  loading,
  error,
  search,
  tipo,
  sucursalNombre,
  canManage,
  modal,
  modalContent,
  onSearch,
  onTipo,
  onCreate,
  onVerDetalle,
  onPageChange,
  onCloseModal,
}: DevolucionesPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Devoluciones</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Devuelve el dinero de una venta o del anticipo de una reserva cancelada y decide si la prenda vuelve al inventario.
            {sucursalNombre ? ` Sucursal: ${sucursalNombre}.` : ' Mostrando todas las sucursales.'}
          </p>
        </div>
        {canManage && <Button onClick={onCreate}>Nueva devolución</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Buscar" placeholder="Código, nota, reserva o cliente" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Tipo" value={tipo} onChange={(event) => onTipo(event.target.value as TipoDevolucion | '')}>
            <option value="">Todas</option>
            <option value="PRODUCTO_ENTREGADO">De una venta</option>
            <option value="CANCELACION_RESERVA">De una reserva</option>
          </Select>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : devoluciones.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Sin devoluciones"
              description="No hay devoluciones registradas con los filtros seleccionados."
              action={canManage ? <Button onClick={onCreate}>Registrar devolución</Button> : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="px-4 py-3 font-medium">Reembolso</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {devoluciones.map((devolucion) => (
                  <tr key={devolucion.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{devolucion.codigoDevolucion}</td>
                    <td className="px-4 py-3">{new Date(devolucion.fechaEmision).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3">{devolucion.clienteNombre}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{devolucion.codigoNota ?? devolucion.codigoReserva}</span>
                      <span className="mt-0.5 block">
                        <Badge tone={devolucion.tipoDevolucion === 'PRODUCTO_ENTREGADO' ? 'neutral' : 'warning'}>
                          {devolucion.tipoDevolucion === 'PRODUCTO_ENTREGADO' ? 'Venta' : 'Reserva'}
                        </Badge>
                      </span>
                    </td>
                    <td className="px-4 py-3">{MOTIVOS[devolucion.motivoDevolucion]}</td>
                    <td className="px-4 py-3">Bs {devolucion.montoTotalReembolsado.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onVerDetalle(devolucion.id)}
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

      <Modal open={!!modal} title={modal === 'crear' ? 'Nueva devolución' : 'Detalle de devolución'} onClose={onCloseModal}>
        {modalContent}
      </Modal>
    </div>
  )
}
