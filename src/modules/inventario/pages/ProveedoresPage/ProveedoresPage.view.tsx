import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Proveedor } from '@/modules/inventario/types'

interface ProveedoresPageViewProps {
  proveedores: Proveedor[]
  loading: boolean
  error: string | null
  search: string
  activo: 'true' | 'false' | ''
  canManage: boolean
  modal: ReactNode
  onSearch: (value: string) => void
  onActivo: (value: 'true' | 'false' | '') => void
  onCreate: () => void
  onEdit: (proveedor: Proveedor) => void
  onToggleActivo: (proveedor: Proveedor) => void
  onCloseModal: () => void
}

export function ProveedoresPageView({
  proveedores,
  loading,
  error,
  search,
  activo,
  canManage,
  modal,
  onSearch,
  onActivo,
  onCreate,
  onEdit,
  onToggleActivo,
  onCloseModal,
}: ProveedoresPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Proveedores</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Registro de empresas proveedoras para órdenes de compra.</p>
        </div>
        {canManage && <Button onClick={onCreate}>Nuevo proveedor</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Buscar" placeholder="NIT, razón social o contacto" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Estado" value={activo} onChange={(event) => onActivo(event.target.value as 'true' | 'false' | '')}>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
            <option value="">Todos</option>
          </Select>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        ) : proveedores.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay proveedores" description="No se encontraron proveedores con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Crear proveedor</Button> : undefined} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">NIT</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {proveedores.map((proveedor) => (
                  <tr key={proveedor.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{proveedor.empresa}</td>
                    <td className="px-4 py-3">{proveedor.nit}</td>
                    <td className="px-4 py-3">
                      <p>{proveedor.nombreContacto || '—'}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{proveedor.telefonoContacto || proveedor.correoContacto || 'Sin datos de contacto'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={proveedor.activo ? 'success' : 'neutral'}>{proveedor.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => onEdit(proveedor)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Editar</button>
                          <button
                            type="button"
                            onClick={() => onToggleActivo(proveedor)}
                            className={`text-sm font-medium underline ${proveedor.activo ? 'text-red-600 hover:text-red-800 dark:text-red-400' : 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400'}`}
                          >
                            {proveedor.activo ? 'Desactivar' : 'Activar'}
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

      <Modal open={!!modal} title={modal ? 'Gestionar proveedor' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}
