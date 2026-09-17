import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Rol } from '@/modules/acceso/types'

interface RolesPageViewProps {
  roles: Rol[]
  loading: boolean
  error: string | null
  search: string
  activo: 'true' | 'false' | ''
  canManage: boolean
  roleModal: ReactNode
  permissionModal: ReactNode
  permissionRoleName: string
  onSearch: (value: string) => void
  onActivo: (value: 'true' | 'false' | '') => void
  onCreate: () => void
  onEdit: (role: Rol) => void
  onPermissions: (role: Rol) => void
  onDeactivate: (role: Rol) => void
  onCloseRoleModal: () => void
  onClosePermissionModal: () => void
}

export function RolesPageView({
  roles,
  loading,
  error,
  search,
  activo,
  canManage,
  roleModal,
  permissionModal,
  permissionRoleName,
  onSearch,
  onActivo,
  onCreate,
  onEdit,
  onPermissions,
  onDeactivate,
  onCloseRoleModal,
  onClosePermissionModal,
}: RolesPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Roles y permisos</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Define los accesos disponibles para cada rol del sistema.</p>
        </div>
        {canManage && <Button onClick={onCreate}>Nuevo rol</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Buscar" placeholder="Nombre del rol" value={search} onChange={(event) => onSearch(event.target.value)} />
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
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        ) : roles.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay roles" description="No se encontraron roles con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Crear rol</Button> : undefined} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Usuarios</th>
                  <th className="px-4 py-3 font-medium">Permisos</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {roles.map((role) => (
                  <tr key={role.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900 dark:text-white">{role.nombre}</p>
                      <p className="max-w-sm truncate text-xs text-neutral-500 dark:text-neutral-400">{role.descripcion || 'Sin descripción'}</p>
                    </td>
                    <td className="px-4 py-3">{role.cantidadUsuarios}</td>
                    <td className="px-4 py-3">{role.permisos.length}</td>
                    <td className="px-4 py-3">
                      <Badge tone={role.activo ? 'success' : 'neutral'}>{role.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => onPermissions(role)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Permisos</button>
                        <button type="button" onClick={() => onEdit(role)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Editar</button>
                        {role.activo && <button type="button" onClick={() => onDeactivate(role)} className="text-sm font-medium text-red-600 underline hover:text-red-800 dark:text-red-400">Desactivar</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={!!roleModal} title={roleModal ? 'Gestionar rol' : ''} onClose={onCloseRoleModal}>
        {roleModal}
      </Modal>
      <Modal open={!!permissionModal} title={`Permisos: ${permissionRoleName}`} onClose={onClosePermissionModal}>
        {permissionModal}
      </Modal>
    </div>
  )
}
