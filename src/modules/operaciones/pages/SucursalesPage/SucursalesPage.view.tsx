import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Sucursal } from '@/modules/operaciones/types'

interface SucursalesPageViewProps {
  sucursales: Sucursal[]
  ciudadesError: string | null
  loading: boolean
  error: string | null
  search: string
  activo: 'true' | 'false' | ''
  canManage: boolean
  modal: ReactNode
  onSearch: (value: string) => void
  onActivo: (value: 'true' | 'false' | '') => void
  onClearFilters: () => void
  onCreate: () => void
  onEdit: (sucursal: Sucursal) => void
  onToggleActivo: (sucursal: Sucursal) => void
  onCloseModal: () => void
}

export function SucursalesPageView({
  sucursales,
  ciudadesError,
  loading,
  error,
  search,
  activo,
  canManage,
  modal,
  onSearch,
  onActivo,
  onClearFilters,
  onCreate,
  onEdit,
  onToggleActivo,
  onCloseModal,
}: SucursalesPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Sucursales</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Administra las sedes físicas y almacenes operativos.</p>
        </div>
        {canManage && <Button onClick={onCreate}>Nueva sucursal</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Buscar" placeholder="Nombre, ciudad o dirección" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Estado" value={activo} onChange={(event) => onActivo(event.target.value as 'true' | 'false' | '')}>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
            <option value="">Todas</option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClearFilters} className="text-sm text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
            Limpiar filtros
          </button>
        </div>
      </section>

      {ciudadesError && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{ciudadesError}</p>}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        ) : sucursales.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay sucursales" description="No se encontraron sucursales con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Crear sucursal</Button> : undefined} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Ubicación</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Horario</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {sucursales.map((sucursal) => (
                  <tr key={sucursal.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900 dark:text-white">{sucursal.nombre}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{sucursal.ciudadNombre}, {sucursal.departamentoNombre}</p>
                    </td>
                    <td className="px-4 py-3">{sucursal.ubicacion}</td>
                    <td className="px-4 py-3">
                      <p>{sucursal.telefono || '—'}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{sucursal.correo || 'Sin correo'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {sucursal.horarioApertura && sucursal.horarioCierre
                        ? `${sucursal.horarioApertura} - ${sucursal.horarioCierre}`
                        : 'No definido'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={sucursal.activo ? 'success' : 'neutral'}>{sucursal.activo ? 'Activa' : 'Inactiva'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => onEdit(sucursal)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Editar</button>
                          <button
                            type="button"
                            onClick={() => onToggleActivo(sucursal)}
                            className={`text-sm font-medium underline ${sucursal.activo ? 'text-red-600 hover:text-red-800 dark:text-red-400' : 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400'}`}
                          >
                            {sucursal.activo ? 'Deshabilitar' : 'Habilitar'}
                          </button>
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

      <Modal open={!!modal} title={modal ? 'Gestionar sucursal' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}
