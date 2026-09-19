import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Cliente } from '@/modules/operaciones/types'

interface ClientesPageViewProps {
  clientes: Cliente[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  loading: boolean
  error: string | null
  search: string
  activo: 'true' | 'false' | ''
  canManage: boolean
  modal: ReactNode
  onCloseModal: () => void
  onSearch: (value: string) => void
  onActivo: (value: 'true' | 'false' | '') => void
  onClearFilters: () => void
  onCreate: () => void
  onEdit: (cliente: Cliente) => void
  onPageChange: (page: number) => void
}

export function ClientesPageView({
  clientes,
  meta,
  loading,
  error,
  search,
  activo,
  canManage,
  modal,
  onCloseModal,
  onSearch,
  onActivo,
  onClearFilters,
  onCreate,
  onEdit,
  onPageChange,
}: ClientesPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Clientes</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Administra la información de clientes registrados y de ventanilla.
          </p>
        </div>
        {canManage && <Button onClick={onCreate}>Nuevo cliente</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Buscar"
            placeholder="Nombre, apellido o email"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
          <Select label="Registro" value={activo} onChange={(event) => onActivo(event.target.value as 'true' | 'false' | '')}>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
            <option value="">Todos</option>
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
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
          </div>
        ) : clientes.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No hay clientes"
              description="No se encontraron clientes con los filtros seleccionados."
              action={canManage ? <Button onClick={onCreate}>Crear cliente</Button> : undefined}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Teléfono</th>
                    <th className="px-4 py-3 font-medium">Ciudad</th>
                    <th className="px-4 py-3 font-medium">Puntos</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="text-neutral-700 dark:text-neutral-300">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900 dark:text-white">{cliente.nombre} {cliente.apellido}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{cliente.email}</p>
                      </td>
                      <td className="px-4 py-3">{cliente.telefono || '—'}</td>
                      <td className="px-4 py-3">{cliente.ciudadResidencia || '—'}</td>
                      <td className="px-4 py-3">{cliente.puntosFidelidad}</td>
                      <td className="px-4 py-3">
                        <EstadoBadge cliente={cliente} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => onEdit(cliente)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4">
              {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />}
            </div>
          </>
        )}
      </section>

      <Modal open={!!modal} title={modal ? 'Gestionar cliente' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}

function EstadoBadge({ cliente }: { cliente: Cliente }) {
  if (!cliente.activo) return <Badge tone="neutral">Inactivo</Badge>
  const tone = cliente.estadoAcceso === 'HABILITADO' ? 'success' : cliente.estadoAcceso === 'BLOQUEADO' ? 'danger' : 'warning'
  return <Badge tone={tone}>{cliente.estadoAcceso === 'HABILITADO' ? 'Habilitado' : cliente.estadoAcceso === 'BLOQUEADO' ? 'Bloqueado' : 'Suspendido'}</Badge>
}
