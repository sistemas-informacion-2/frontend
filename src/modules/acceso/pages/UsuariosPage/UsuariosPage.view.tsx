import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import {
  ESTADO_ACCESO_LABEL,
  TIPO_USUARIO_LABEL,
} from '@/modules/acceso/services/usuarios.service'
import type { EstadoAcceso, TipoUsuario, Usuario } from '@/modules/acceso/types'

interface UsuariosPageViewProps {
  usuarios: Usuario[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  rolesError: string | null
  loading: boolean
  error: string | null
  search: string
  tipoUsuario: TipoUsuario | ''
  estadoAcceso: EstadoAcceso | ''
  activo: 'true' | 'false' | ''
  canManage: boolean
  modal: ReactNode
  onCloseModal: () => void
  onSearch: (value: string) => void
  onTipoUsuario: (value: TipoUsuario | '') => void
  onEstadoAcceso: (value: EstadoAcceso | '') => void
  onActivo: (value: 'true' | 'false' | '') => void
  onClearFilters: () => void
  onCreate: () => void
  onEdit: (usuario: Usuario) => void
  onDeactivate: (usuario: Usuario) => void
  onPageChange: (page: number) => void
}

export function UsuariosPageView({
  usuarios,
  meta,
  rolesError,
  loading,
  error,
  search,
  tipoUsuario,
  estadoAcceso,
  activo,
  canManage,
  modal,
  onCloseModal,
  onSearch,
  onTipoUsuario,
  onEstadoAcceso,
  onActivo,
  onClearFilters,
  onCreate,
  onEdit,
  onDeactivate,
  onPageChange,
}: UsuariosPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Usuarios</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Administra cuentas, estados de acceso y roles.</p>
        </div>
        {canManage && <Button onClick={onCreate}>Nuevo usuario</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-4">
          <Input label="Buscar" placeholder="Nombre, apellido o email" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Tipo" value={tipoUsuario} onChange={(event) => onTipoUsuario(event.target.value as TipoUsuario | '')}>
            <option value="">Todos</option>
            <option value="A">Administrador</option>
            <option value="E">Empleado</option>
            <option value="C">Cliente</option>
          </Select>
          <Select label="Estado" value={estadoAcceso} onChange={(event) => onEstadoAcceso(event.target.value as EstadoAcceso | '')}>
            <option value="">Todos</option>
            <option value="HABILITADO">Habilitado</option>
            <option value="BLOQUEADO">Bloqueado</option>
            <option value="SUSPENDIDO">Suspendido</option>
          </Select>
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

      {rolesError && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{rolesError}</p>}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay usuarios" description="No se encontraron usuarios con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Crear usuario</Button> : undefined} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Roles</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="text-neutral-700 dark:text-neutral-300">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900 dark:text-white">{usuario.nombre} {usuario.apellido}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{usuario.email}</p>
                      </td>
                      <td className="px-4 py-3">{TIPO_USUARIO_LABEL[usuario.tipoUsuario]}</td>
                      <td className="px-4 py-3">{usuario.roles.length ? usuario.roles.map((role) => role.nombre).join(', ') : 'Sin roles'}</td>
                      <td className="px-4 py-3"><EstadoBadge usuario={usuario} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => onEdit(usuario)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Editar</button>
                          {usuario.activo && <button type="button" onClick={() => onDeactivate(usuario)} className="text-sm font-medium text-red-600 underline hover:text-red-800 dark:text-red-400">Desactivar</button>}
                        </div>
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

      <Modal open={!!modal} title={modal ? 'Gestionar usuario' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}

function EstadoBadge({ usuario }: { usuario: Usuario }) {
  if (!usuario.activo) return <Badge tone="neutral">Inactivo</Badge>
  const tone = usuario.estadoAcceso === 'HABILITADO' ? 'success' : usuario.estadoAcceso === 'BLOQUEADO' ? 'danger' : 'warning'
  return <Badge tone={tone}>{ESTADO_ACCESO_LABEL[usuario.estadoAcceso]}</Badge>
}
