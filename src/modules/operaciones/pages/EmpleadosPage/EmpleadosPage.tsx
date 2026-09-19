import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { EmpleadoForm } from '@/modules/operaciones/components/EmpleadoForm'
import { actualizarEmpleado, crearEmpleado, listarEmpleados } from '@/modules/operaciones/services/empleados.service'
import type { Empleado, EmpleadoFormValues } from '@/modules/operaciones/types'
import { EmpleadosPageView } from './EmpleadosPage.view'

const PAGE_SIZE = 10

const EMPTY_FORM: EmpleadoFormValues = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  sexo: '',
  password: '',
  salario: '',
  fechaContratacion: '',
  fechaFinalizacion: '',
}

export function EmpleadosPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activo, setActivo] = useState<'true' | 'false' | ''>('true')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null)
  const [form, setForm] = useState<EmpleadoFormValues>(EMPTY_FORM)
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
    ['empleados', query.page, query.limit, query.search, query.activo],
    () => listarEmpleados(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const updateForm = <K extends keyof EmpleadoFormValues>(field: K, value: EmpleadoFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditingEmpleado(null)
    setForm({ ...EMPTY_FORM })
    setActionError(null)
    setModalOpen(true)
  }

  const openEdit = (empleado: Empleado) => {
    setEditingEmpleado(empleado)
    setForm({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      email: empleado.email,
      telefono: empleado.telefono ?? '',
      sexo: empleado.sexo ?? '',
      password: '',
      salario: String(empleado.salario),
      fechaContratacion: empleado.fechaContratacion,
      fechaFinalizacion: empleado.fechaFinalizacion ?? '',
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
      if (editingEmpleado) {
        await actualizarEmpleado(editingEmpleado.id, form)
      } else {
        await crearEmpleado(form)
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
    <EmpleadosPageView
      empleados={data?.items ?? []}
      meta={data?.meta}
      loading={isLoading}
      error={error ? extraerMensajeError(error) : actionError}
      search={search}
      activo={activo}
      canManage={hasPermission('operaciones:empleados:gestionar')}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <EmpleadoForm
            values={form}
            codigoEmpleado={editingEmpleado?.codigoEmpleado}
            editing={!!editingEmpleado}
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
