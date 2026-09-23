import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { ESTADO_TEMPORADA_LABEL } from '@/modules/inventario/services/temporadas.service'
import type { EstadoTemporada, Temporada } from '@/modules/inventario/types'

interface TemporadasPageViewProps {
  temporadas: Temporada[]
  loading: boolean
  error: string | null
  search: string
  estado: EstadoTemporada | ''
  canManage: boolean
  modal: ReactNode
  onSearch: (value: string) => void
  onEstado: (value: EstadoTemporada | '') => void
  onClearFilters: () => void
  onCreate: () => void
  onEdit: (temporada: Temporada) => void
  onDelete: (temporada: Temporada) => void
  onCloseModal: () => void
}

const ESTADO_TONE: Record<EstadoTemporada, 'success' | 'warning' | 'neutral'> = {
  VIGENTE: 'success',
  PROXIMA: 'warning',
  FINALIZADA: 'neutral',
}

export function TemporadasPageView({
  temporadas,
  loading,
  error,
  search,
  estado,
  canManage,
  modal,
  onSearch,
  onEstado,
  onClearFilters,
  onCreate,
  onEdit,
  onDelete,
  onCloseModal,
}: TemporadasPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Temporadas</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Colecciones comerciales para agrupar productos (ej. Verano 2026).</p>
        </div>
        {canManage && <Button onClick={onCreate}>Nueva temporada</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Buscar" placeholder="Nombre o descripción" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Estado" value={estado} onChange={(event) => onEstado(event.target.value as EstadoTemporada | '')}>
            <option value="">Todos</option>
            <option value="PROXIMA">Próxima</option>
            <option value="VIGENTE">Vigente</option>
            <option value="FINALIZADA">Finalizada</option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClearFilters} className="text-sm text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
            Limpiar filtros
          </button>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        ) : temporadas.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay temporadas" description="No se encontraron temporadas con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Crear temporada</Button> : undefined} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Temporada</th>
                  <th className="px-4 py-3 font-medium">Vigencia</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {temporadas.map((temporada) => (
                  <tr key={temporada.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900 dark:text-white">{temporada.nombre}</p>
                      <p className="max-w-sm truncate text-xs text-neutral-500 dark:text-neutral-400">{temporada.descripcion || 'Sin descripción'}</p>
                    </td>
                    <td className="px-4 py-3">{temporada.fechaInicio} — {temporada.fechaFin}</td>
                    <td className="px-4 py-3">
                      <Badge tone={ESTADO_TONE[temporada.estado]}>{ESTADO_TEMPORADA_LABEL[temporada.estado]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => onEdit(temporada)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Editar</button>
                          <button type="button" onClick={() => onDelete(temporada)} className="text-sm font-medium text-red-600 underline hover:text-red-800 dark:text-red-400">Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={!!modal} title={modal ? 'Gestionar temporada' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}
