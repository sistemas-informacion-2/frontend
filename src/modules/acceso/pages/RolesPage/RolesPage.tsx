import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { PermisosMatrix } from '@/modules/acceso/components/PermisosMatrix'
import { RolForm, type RolFormValues } from '@/modules/acceso/components/RolForm'
import {
  actualizarRol,
  crearRol,
  desactivarRol,
  gestionarPermisos,
  listarPermisosAgrupados,
  listarPermisosDeRol,
  listarRoles,
} from '@/modules/acceso/services/roles.service'
import type { PermisoGrupo, Rol, RolesQuery } from '@/modules/acceso/types'
import { RolesPageView } from './RolesPage.view'

const EMPTY_FORM: RolFormValues = { nombre: '', descripcion: '', activo: true }

export function RolesPage() {
  const canManage = useAuthStore((state) => state.hasPermission('acceso:roles:gestionar'))
  const [search, setSearch] = useState('')
  const [activo, setActivo] = useState<'true' | 'false' | ''>('true')
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Rol | null>(null)
  const [permissionRole, setPermissionRole] = useState<Rol | null>(null)
  const [permissionIds, setPermissionIds] = useState<number[]>([])
  const [permissionLoading, setPermissionLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<RolFormValues>(EMPTY_FORM)

  const deferredSearch = useDeferredValue(search)
  const query: RolesQuery = {
    search: deferredSearch.trim() || undefined,
    activo: activo === '' ? undefined : activo === 'true',
  }

  const { data: roles = [], error: rolesError, isLoading, mutate } = useSWR(
    ['roles', query.search, query.activo],
    () => listarRoles(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )
  const { data: grupos = [], error: permisosError, isLoading: catalogLoading } = useSWR<PermisoGrupo[]>(
    'permisos-catalogo',
    listarPermisosAgrupados,
    { revalidateOnFocus: false },
  )

  const updateForm = <K extends keyof RolFormValues>(field: K, value: RolFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditingRole(null)
    setForm({ ...EMPTY_FORM })
    setError(null)
    setRoleModalOpen(true)
  }

  const openEdit = (role: Rol) => {
    setEditingRole(role)
    setForm({ nombre: role.nombre, descripcion: role.descripcion ?? '', activo: role.activo })
    setError(null)
    setRoleModalOpen(true)
  }

  const closeModals = () => {
    if (saving) return
    setRoleModalOpen(false)
    setPermissionModalOpen(false)
  }

  const handleRoleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editingRole) {
        await actualizarRol(editingRole.id, form)
      } else {
        await crearRol({ nombre: form.nombre, descripcion: form.descripcion })
      }
      setRoleModalOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const openPermissions = async (role: Rol) => {
    setPermissionRole(role)
    setPermissionIds([])
    setPermissionLoading(true)
    setError(null)
    setPermissionModalOpen(true)
    try {
      const permisos = await listarPermisosDeRol(role.id)
      setPermissionIds(permisos.map((permiso) => permiso.id))
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setPermissionLoading(false)
    }
  }

  const handlePermissionsSubmit = async (event: FormEvent<HTMLFormElement>, permisos: number[]) => {
    event.preventDefault()
    if (!permissionRole) return
    setSaving(true)
    setError(null)
    try {
      await gestionarPermisos(permissionRole.id, permisos)
      setPermissionModalOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (role: Rol) => {
    if (!window.confirm(`¿Desactivar el rol ${role.nombre}?`)) return
    setError(null)
    try {
      await desactivarRol(role.id)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  return (
    <RolesPageView
      roles={roles}
      loading={isLoading}
      error={error || (rolesError ? extraerMensajeError(rolesError) : null)}
      search={search}
      activo={activo}
      canManage={canManage}
      onSearch={(value) => setSearch(value)}
      onActivo={setActivo}
      onCreate={openCreate}
      onEdit={openEdit}
      onPermissions={openPermissions}
      onDeactivate={handleDeactivate}
      roleModal={
        roleModalOpen ? (
          <RolForm
            values={form}
            editing={!!editingRole}
            loading={saving}
            error={error}
            onChange={updateForm}
            onSubmit={handleRoleSubmit}
            onCancel={closeModals}
          />
        ) : null
      }
      permissionModal={
        permissionModalOpen ? (
          <PermisosMatrix
            grupos={grupos}
            seleccionados={permissionIds}
            loading={permissionLoading || catalogLoading}
            saving={saving}
            error={error || (permisosError ? extraerMensajeError(permisosError) : null)}
            onSubmit={handlePermissionsSubmit}
            onCancel={closeModals}
          />
        ) : null
      }
      permissionRoleName={permissionRole?.nombre ?? ''}
      onCloseRoleModal={() => setRoleModalOpen(false)}
      onClosePermissionModal={() => setPermissionModalOpen(false)}
    />
  )
}

function extraerMensajeError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message[0] ?? 'La solicitud no es válida.'
    if (typeof message === 'string') return message
  }
  return 'No se pudo completar la operación.'
}
