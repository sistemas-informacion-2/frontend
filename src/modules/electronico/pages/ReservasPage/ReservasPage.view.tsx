import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { ReservaEstadoBadge } from '../../components/ReservaEstadoBadge'
import type { EstadoReserva, Reserva } from '../../types'
import { bs, estaActiva, formatearFechaHora, tiempoRestante } from '../../utils/reservas'

interface ReservasPageViewProps {
  reservas: Reserva[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  loading: boolean
  error: string | null
  search: string
  estado: EstadoReserva | ''
  sucursalNombre: string | null
  canManage: boolean
  modal: 'crear' | 'detalle' | null
  modalContent: ReactNode
  onSearch: (value: string) => void
  onEstado: (value: EstadoReserva | '') => void
  onCreate: () => void
  onVerDetalle: (id: number) => void
  onPageChange: (page: number) => void
  onCloseModal: () => void
}

export function ReservasPageView({
  reservas,
  meta,
  loading,
  error,
  search,
  estado,
  sucursalNombre,
  canManage,
  modal,
  modalContent,
  onSearch,
  onEstado,
  onCreate,
  onVerDetalle,
  onPageChange,
  onCloseModal,
}: ReservasPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Reservas</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Aparta prendas contra un anticipo, cobra el saldo al retirarlas o libera el stock si vence el plazo.
            {sucursalNombre ? ` Sucursal: ${sucursalNombre}.` : ' Mostrando todas las sucursales.'}
          </p>
        </div>
        {canManage && <Button onClick={onCreate}>Nueva reserva</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Buscar" placeholder="Código o cliente" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Estado" value={estado} onChange={(event) => onEstado(event.target.value as EstadoReserva | '')}>
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente de anticipo</option>
            <option value="PAGADA">Anticipo pagado</option>
            <option value="COMPLETADA">Completada</option>
            <option value="CANCELADA">Cancelada</option>
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
        ) : reservas.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Sin reservas"
              description="No hay reservas con los filtros seleccionados."
              action={canManage ? <Button onClick={onCreate}>Crear reserva</Button> : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Retirar hasta</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Anticipo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {reservas.map((reserva) => (
                  <tr key={reserva.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{reserva.codigoReserva}</td>
                    <td className="px-4 py-3">{reserva.clienteNombre}</td>
                    <td className="px-4 py-3">{reserva.sucursalNombre}</td>
                    <td className="px-4 py-3">
                      {formatearFechaHora(reserva.fechaLimite)}
                      {estaActiva(reserva.estado) && (
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400">{tiempoRestante(reserva.fechaLimite)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{bs(reserva.montoTotal)}</td>
                    <td className="px-4 py-3">
                      {bs(reserva.anticipoPagado)}
                      <span className="block text-xs text-neutral-500 dark:text-neutral-400">de {bs(reserva.montoAnticipo)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ReservaEstadoBadge estado={reserva.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onVerDetalle(reserva.id)}
                        className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                      >
                        {estaActiva(reserva.estado) && canManage ? 'Gestionar' : 'Ver'}
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

      <Modal open={!!modal} title={modal === 'crear' ? 'Nueva reserva' : 'Detalle de reserva'} onClose={onCloseModal}>
        {modalContent}
      </Modal>
    </div>
  )
}
