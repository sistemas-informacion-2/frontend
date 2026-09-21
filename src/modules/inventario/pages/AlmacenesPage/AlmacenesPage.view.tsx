import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Sucursal } from '@/modules/operaciones/types'
import type { Almacen } from '@/modules/inventario/types'

interface AlmacenesPageViewProps {
  almacenes: Almacen[]
  sucursales: Sucursal[]
  loading: boolean
  error: string | null
  search: string
  idSucursal: number | ''
  activo: 'true' | 'false' | ''
  canManage: boolean
  modal: ReactNode
  onSearch: (value: string) => void
  onSucursal: (value: number | '') => void
  onActivo: (value: 'true' | 'false' | '') => void
  onCreate: () => void
  onEdit: (almacen: Almacen) => void
  onToggleActivo: (almacen: Almacen) => void
  onCloseModal: () => void
}

export function AlmacenesPageView({
  almacenes,
  sucursales,
  loading,
  error,
  search,
  idSucursal,
  activo,
  canManage,
  modal,
  onSearch,
  onSucursal,
  onActivo,
  onCreate,
  onEdit,
  onToggleActivo,
  onCloseModal,
}: AlmacenesPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Almacenes</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Depósitos por sucursal donde se guardan las existencias de cada variante.
          </p>
        </div>
        {canManage && <Button onClick={onCreate}>Nuevo almacén</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Buscar" placeholder="Nombre o ubicación" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select
            label="Sucursal"
            value={idSucursal === '' ? '' : String(idSucursal)}
            onChange={(event) => onSucursal(event.target.value ? Number(event.target.value) : '')}
          >
            <option value="">Todas</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={String(sucursal.id)}>{sucursal.nombre}</option>
            ))}
          </Select>
          <Select label="Estado" value={activo} onChange={(event) => onActivo(event.target.value as 'true' | 'false' | '')}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </Select>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        ) : almacenes.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay almacenes" description="No se encontraron almacenes con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Crear almacén</Button> : undefined} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Almacén</th>
                  <th className="px-4 py-3 font-medium">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Ubicación</th>
                  <th className="px-4 py-3 font-medium">Variantes</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {almacenes.map((almacen) => (
                  <tr key={almacen.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{almacen.nombre}</td>
                    <td className="px-4 py-3">{almacen.sucursalNombre || '—'}</td>
                    <td className="px-4 py-3">{almacen.ubicacionFisica || '—'}</td>
                    <td className="px-4 py-3">{almacen.cantidadVariantes}</td>
                    <td className="px-4 py-3">
                      <Badge tone={almacen.activo ? 'success' : 'neutral'}>{almacen.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => onEdit(almacen)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Editar</button>
                          <button
                            type="button"
                            onClick={() => onToggleActivo(almacen)}
                            className={`text-sm font-medium underline ${almacen.activo ? 'text-red-600 hover:text-red-800 dark:text-red-400' : 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400'}`}
                          >
                            {almacen.activo ? 'Desactivar' : 'Activar'}
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

      <Modal open={!!modal} title={modal ? 'Gestionar almacén' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}
