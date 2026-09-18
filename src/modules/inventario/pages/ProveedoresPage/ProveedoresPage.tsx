import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { ProveedorForm } from '@/modules/inventario/components/ProveedorForm'
import { actualizarProveedor, crearProveedor, listarProveedores } from '@/modules/inventario/services/proveedores.service'
import type { Proveedor, ProveedorFormValues, ProveedoresQuery } from '@/modules/inventario/types'
import { ProveedoresPageView } from './ProveedoresPage.view'

const EMPTY_FORM: ProveedorFormValues = {
  empresa: '',
  nit: '',
  nombreContacto: '',
  telefonoContacto: '',
  correoContacto: '',
  activo: true,
}

export function ProveedoresPage() {
  const canManage = useAuthStore((state) => state.hasPermission('inventario:proveedores:gestionar'))
  const [search, setSearch] = useState('')
  const [activo, setActivo] = useState<'true' | 'false' | ''>('true')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Proveedor | null>(null)
  const [form, setForm] = useState<ProveedorFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const query: ProveedoresQuery = {
    search: deferredSearch.trim() || undefined,
    activo: activo === '' ? undefined : activo === 'true',
  }

  const { data: proveedores = [], error: proveedoresError, isLoading, mutate } = useSWR(
    ['proveedores', query.search, query.activo],
    () => listarProveedores(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const updateForm = <K extends keyof ProveedorFormValues>(field: K, value: ProveedorFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (proveedor: Proveedor) => {
    setEditing(proveedor)
    setForm({
      empresa: proveedor.empresa,
      nit: proveedor.nit,
      nombreContacto: proveedor.nombreContacto ?? '',
      telefonoContacto: proveedor.telefonoContacto ?? '',
      correoContacto: proveedor.correoContacto ?? '',
      activo: proveedor.activo,
    })
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await actualizarProveedor(editing.id, form)
      } else {
        await crearProveedor(form)
      }
      setModalOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (proveedor: Proveedor) => {
    const accion = proveedor.activo ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Deseas ${accion} al proveedor ${proveedor.empresa}?`)) return
    setError(null)
    try {
      await actualizarProveedor(proveedor.id, {
        empresa: proveedor.empresa,
        nit: proveedor.nit,
        nombreContacto: proveedor.nombreContacto ?? '',
        telefonoContacto: proveedor.telefonoContacto ?? '',
        correoContacto: proveedor.correoContacto ?? '',
        activo: !proveedor.activo,
      })
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  return (
    <ProveedoresPageView
      proveedores={proveedores}
      loading={isLoading}
      error={error || (proveedoresError ? extraerMensajeError(proveedoresError) : null)}
      search={search}
      activo={activo}
      canManage={canManage}
      onSearch={setSearch}
      onActivo={setActivo}
      onCreate={openCreate}
      onEdit={openEdit}
      onToggleActivo={handleToggleActivo}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <ProveedorForm
            values={form}
            editing={!!editing}
            loading={saving}
            error={error}
            onChange={updateForm}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        ) : null
      }
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
