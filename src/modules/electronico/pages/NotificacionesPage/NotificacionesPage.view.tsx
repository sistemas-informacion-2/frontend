import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Notificacion } from '@/modules/electronico/types'

interface NotificacionesPageViewProps {
  notificaciones: Notificacion[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  loading: boolean
  error: string | null
  search: string
  leido: 'true' | 'false' | ''
  canManage: boolean
  modal: ReactNode
  onSearch: (value: string) => void
  onLeido: (value: 'true' | 'false' | '') => void
  onCreate: () => void
  onEliminar: (notificacion: Notificacion) => void
  onPageChange: (page: number) => void
  onCloseModal: () => void
}

function formatearFecha(fecha: string): string {
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
}

export function NotificacionesPageView({
  notificaciones,
  meta,
  loading,
  error,
  search,
  leido,
  canManage,
  modal,
  onSearch,
  onLeido,
  onCreate,
  onEliminar,
  onPageChange,
  onCloseModal,
}: NotificacionesPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Notificaciones Push</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Envía avisos a un usuario o difúndelos a todos los clientes.
          </p>
        </div>
        {canManage && <Button onClick={onCreate}>Nueva notificación</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Buscar" placeholder="Título o mensaje" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Estado" value={leido} onChange={(event) => onLeido(event.target.value as 'true' | 'false' | '')}>
            <option value="">Todas</option>
            <option value="false">No leídas</option>
            <option value="true">Leídas</option>
          </Select>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay notificaciones" description="No se encontraron notificaciones con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Enviar notificación</Button> : undefined} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Destinatario</th>
                  <th className="px-4 py-3 font-medium">Mensaje</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {notificaciones.map((notificacion) => (
                  <tr key={notificacion.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{notificacion.destinatario || `Usuario #${notificacion.idUsuario}`}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{notificacion.titulo}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{notificacion.mensaje}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={notificacion.leido ? 'neutral' : 'warning'}>{notificacion.leido ? 'Leída' : 'No leída'}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatearFecha(notificacion.fechaEnvio)}</td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <button type="button" onClick={() => onEliminar(notificacion)} className="text-sm font-medium text-red-600 underline hover:text-red-800 dark:text-red-400">Eliminar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {meta && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />
      )}

      <Modal open={!!modal} title={modal ? 'Enviar notificación' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}
