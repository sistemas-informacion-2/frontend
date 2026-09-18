import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { TemporadaForm } from '@/modules/inventario/components/TemporadaForm'
import { actualizarTemporada, crearTemporada, eliminarTemporada, listarTemporadas } from '@/modules/inventario/services/temporadas.service'
import type { Temporada, TemporadaFormValues } from '@/modules/inventario/types'
import { TemporadasPageView } from './TemporadasPage.view'

const EMPTY_FORM: TemporadaFormValues = {
  nombre: '',
  fechaInicio: '',
  fechaFin: '',
  descripcion: '',
}

export function TemporadasPage() {
  const canManage = useAuthStore((state) => state.hasPermission('inventario:temporadas:gestionar'))
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Temporada | null>(null)
  const [form, setForm] = useState<TemporadaFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: temporadas = [], error: temporadasError, isLoading, mutate } = useSWR(
    'temporadas',
    listarTemporadas,
    { revalidateOnFocus: false },
  )

  const updateForm = <K extends keyof TemporadaFormValues>(field: K, value: TemporadaFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (temporada: Temporada) => {
    setEditing(temporada)
    setForm({
      nombre: temporada.nombre,
      fechaInicio: temporada.fechaInicio,
      fechaFin: temporada.fechaFin,
      descripcion: temporada.descripcion ?? '',
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
    if (form.fechaFin < form.fechaInicio) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await actualizarTemporada(editing.id, form)
      } else {
        await crearTemporada(form)
      }
      setModalOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (temporada: Temporada) => {
    if (!window.confirm(`¿Eliminar la temporada ${temporada.nombre}?`)) return
    setError(null)
    try {
      await eliminarTemporada(temporada.id)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  return (
    <TemporadasPageView
      temporadas={temporadas}
      loading={isLoading}
      error={error || (temporadasError ? extraerMensajeError(temporadasError) : null)}
      canManage={canManage}
      onCreate={openCreate}
      onEdit={openEdit}
      onDelete={handleDelete}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <TemporadaForm
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
