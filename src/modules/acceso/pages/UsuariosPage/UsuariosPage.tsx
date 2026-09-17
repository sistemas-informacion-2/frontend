import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { UsuarioForm } from '@/modules/acceso/components/UsuarioForm'
import {
  actualizarUsuario,
  crearUsuario,
  desactivarUsuario,
  listarRoles,
  listarUsuarios,
} from '@/modules/acceso/services/usuarios.service'
import type { EstadoAcceso, RolResumen, TipoUsuario, Usuario, UsuarioFormValues } from '@/modules/acceso/types'
import { UsuariosPageView } from './UsuariosPage.view'

const PAGE_SIZE = 10

const EMPTY_FORM: UsuarioFormValues = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  sexo: '',
  password: '',
  tipoUsuario: 'C',
  estadoAcceso: 'HABILITADO',
  roles: [],
}

export function UsuariosPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario | ''>('')
  const [estadoAcceso, setEstadoAcceso] = useState<EstadoAcceso | ''>('')
  const [activo, setActivo] = useState<'true' | 'false' | ''>('true')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [form, setForm] = useState<UsuarioFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const query = {
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
    tipoUsuario: tipoUsuario || undefined,
    estadoAcceso: estadoAcceso || undefined,
    activo: activo === '' ? undefined : activo === 'true',
  }

  const { data, error, isLoading, mutate } = useSWR(
    ['usuarios', query.page, query.limit, query.search, query.tipoUsuario, query.estadoAcceso, query.activo],
    () => listarUsuarios(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )
  const { data: roles = [], error: rolesError } = useSWR<RolResumen[]>('roles-activos', listarRoles, {
    revalidateOnFocus: false,
  })

  const updateForm = <K extends keyof UsuarioFormValues>(field: K, value: UsuarioFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditingUser(null)
    setForm({ ...EMPTY_FORM })
    setActionError(null)
    setModalOpen(true)
  }

  const openEdit = (usuario: Usuario) => {
    setEditingUser(usuario)
    setForm({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono ?? '',
      sexo: usuario.sexo ?? '',
      password: '',
      tipoUsuario: usuario.tipoUsuario,
      estadoAcceso: usuario.estadoAcceso,
      roles: usuario.roles.map((role) => role.id),
    })
    setActionError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setActionError(null)

    try {
      if (editingUser) {
        await actualizarUsuario(editingUser.id, form)
      } else {
        await crearUsuario(form)
      }
      setModalOpen(false)
      await mutate()
    } catch (requestError) {
      setActionError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (usuario: Usuario) => {
    if (!window.confirm(`¿Desactivar a ${usuario.nombre} ${usuario.apellido}?`)) return

    try {
      await desactivarUsuario(usuario.id)
      await mutate()
    } catch (requestError) {
      setActionError(extraerMensajeError(requestError))
    }
  }

  const clearFilters = () => {
    setSearch('')
    setTipoUsuario('')
    setEstadoAcceso('')
    setActivo('true')
    setPage(1)
  }

  return (
    <UsuariosPageView
      usuarios={data?.items ?? []}
      meta={data?.meta}
      rolesError={rolesError ? 'No se pudieron cargar los roles.' : null}
      loading={isLoading}
      error={error ? extraerMensajeError(error) : actionError}
      search={search}
      tipoUsuario={tipoUsuario}
      estadoAcceso={estadoAcceso}
      activo={activo}
      canManage={hasPermission('acceso:usuarios:gestionar')}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <UsuarioForm
            values={form}
            roles={roles}
            editing={!!editingUser}
            loading={saving}
            error={actionError}
            onChange={updateForm}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        ) : null
      }
      onSearch={(value) => {
        setSearch(value)
        setPage(1)
      }}
      onTipoUsuario={(value) => {
        setTipoUsuario(value)
        setPage(1)
      }}
      onEstadoAcceso={(value) => {
        setEstadoAcceso(value)
        setPage(1)
      }}
      onActivo={(value) => {
        setActivo(value)
        setPage(1)
      }}
      onClearFilters={clearFilters}
      onCreate={openCreate}
      onEdit={openEdit}
      onDeactivate={handleDeactivate}
      onPageChange={setPage}
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
