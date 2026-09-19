import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { ClienteForm } from '@/modules/operaciones/components/ClienteForm'
import { actualizarCliente, crearCliente, listarClientes } from '@/modules/operaciones/services/clientes.service'
import type { Cliente, ClienteFormValues } from '@/modules/operaciones/types'
import { ClientesPageView } from './ClientesPage.view'

const PAGE_SIZE = 10

const EMPTY_FORM: ClienteFormValues = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  sexo: '',
  password: '',
  ciudadResidencia: '',
  direccionPrincipal: '',
}

export function ClientesPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activo, setActivo] = useState<'true' | 'false' | ''>('true')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [form, setForm] = useState<ClienteFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const query = {
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
    activo: activo === '' ? undefined : activo === 'true',
  }

  const { data, error, isLoading, mutate } = useSWR(
    ['clientes', query.page, query.limit, query.search, query.activo],
    () => listarClientes(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const updateForm = <K extends keyof ClienteFormValues>(field: K, value: ClienteFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditingCliente(null)
    setForm({ ...EMPTY_FORM })
    setActionError(null)
    setModalOpen(true)
  }

  const openEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setForm({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono ?? '',
      sexo: cliente.sexo ?? '',
      password: '',
      ciudadResidencia: cliente.ciudadResidencia ?? '',
      direccionPrincipal: cliente.direccionPrincipal ?? '',
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
      if (editingCliente) {
        await actualizarCliente(editingCliente.id, form)
      } else {
        await crearCliente(form)
      }
      setModalOpen(false)
      await mutate()
    } catch (requestError) {
      setActionError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setActivo('true')
    setPage(1)
  }

  return (
    <ClientesPageView
      clientes={data?.items ?? []}
      meta={data?.meta}
      loading={isLoading}
      error={error ? extraerMensajeError(error) : actionError}
      search={search}
      activo={activo}
      canManage={hasPermission('acceso:clientes:gestionar')}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <ClienteForm
            values={form}
            editing={!!editingCliente}
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
      onActivo={(value) => {
        setActivo(value)
        setPage(1)
      }}
      onClearFilters={clearFilters}
      onCreate={openCreate}
      onEdit={openEdit}
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
