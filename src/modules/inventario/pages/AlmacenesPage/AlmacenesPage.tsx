import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { AlmacenForm } from '@/modules/inventario/components/AlmacenForm'
import {
  actualizarAlmacen,
  crearAlmacen,
  listarAlmacenes,
} from '@/modules/inventario/services/almacenes.service'
import type { Almacen, AlmacenFormValues } from '@/modules/inventario/types'
import { AlmacenesPageView } from './AlmacenesPage.view'

const EMPTY_FORM: AlmacenFormValues = {
  idSucursal: '',
  nombre: '',
  ubicacionFisica: '',
  activo: true,
}

export function AlmacenesPage() {
  const canManage = useAuthStore((state) => state.hasPermission('inventario:almacen:gestionar'))
  const [search, setSearch] = useState('')
  const [idSucursal, setIdSucursal] = useState<number | ''>('')
  const [activo, setActivo] = useState<'true' | 'false' | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Almacen | null>(null)
  const [form, setForm] = useState<AlmacenFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const query = {
    search: deferredSearch.trim() || undefined,
    idSucursal: idSucursal === '' ? undefined : idSucursal,
    activo: activo === '' ? undefined : activo === 'true',
  }

  const { data: almacenes = [], error: almacenesError, isLoading, mutate } = useSWR(
    ['almacenes', query.search, query.idSucursal, query.activo],
    () => listarAlmacenes(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const { data: sucursales = [] } = useSWR('sucursales', listarSucursales, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const updateForm = <K extends keyof AlmacenFormValues>(field: K, value: AlmacenFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (almacen: Almacen) => {
    setEditing(almacen)
    setForm({
      idSucursal: almacen.idSucursal,
      nombre: almacen.nombre,
      ubicacionFisica: almacen.ubicacionFisica ?? '',
      activo: almacen.activo,
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
        await actualizarAlmacen(editing.id, form)
      } else {
        await crearAlmacen(form)
      }
      setModalOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (almacen: Almacen) => {
    const accion = almacen.activo ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Deseas ${accion} el almacén ${almacen.nombre}?`)) return
    setError(null)
    try {
      await actualizarAlmacen(almacen.id, {
        idSucursal: almacen.idSucursal,
        nombre: almacen.nombre,
        ubicacionFisica: almacen.ubicacionFisica ?? '',
        activo: !almacen.activo,
      })
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  return (
    <AlmacenesPageView
      almacenes={almacenes}
      sucursales={sucursales}
      loading={isLoading}
      error={error || (almacenesError ? extraerMensajeError(almacenesError) : null)}
      search={search}
      idSucursal={idSucursal}
      activo={activo}
      canManage={canManage}
      onSearch={setSearch}
      onSucursal={setIdSucursal}
      onActivo={setActivo}
      onCreate={openCreate}
      onEdit={openEdit}
      onToggleActivo={handleToggleActivo}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <AlmacenForm
            values={form}
            editing={!!editing}
            sucursales={sucursales}
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
