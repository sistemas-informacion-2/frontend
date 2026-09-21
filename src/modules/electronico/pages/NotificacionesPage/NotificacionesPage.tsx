import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { NotificacionForm } from '@/modules/electronico/components/NotificacionForm'
import {
  eliminarNotificacion,
  enviarNotificacion,
  listarDestinatarios,
  listarNotificaciones,
} from '@/modules/electronico/services/notificaciones.service'
import type { Notificacion, NotificacionFormValues } from '@/modules/electronico/types'
import { NotificacionesPageView } from './NotificacionesPage.view'

const PAGE_SIZE = 10

const EMPTY_FORM: NotificacionFormValues = {
  titulo: '',
  mensaje: '',
  destinatario: 'CLIENTES',
  idUsuario: '',
}

export function NotificacionesPage() {
  const canManage = useAuthStore((state) => state.hasPermission('electronico:notificaciones:gestionar'))
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [leido, setLeido] = useState<'true' | 'false' | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<NotificacionFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const query = {
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
    leido: leido === '' ? undefined : leido === 'true',
  }

  const { data, error: fetchError, isLoading, mutate } = useSWR(
    ['notificaciones', page, query.search, query.leido],
    () => listarNotificaciones(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const { data: destinatarios = [] } = useSWR(
    canManage ? 'notificaciones/destinatarios' : null,
    listarDestinatarios,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  const updateForm = <K extends keyof NotificacionFormValues>(field: K, value: NotificacionFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (form.destinatario === 'USUARIO' && !form.idUsuario.trim()) {
      setError('Indica el ID del usuario destinatario')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await enviarNotificacion(form)
      setModalOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (notificacion: Notificacion) => {
    if (!window.confirm(`¿Eliminar la notificación "${notificacion.titulo}"?`)) return
    setError(null)
    try {
      await eliminarNotificacion(notificacion.id)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  return (
    <NotificacionesPageView
      notificaciones={data?.items ?? []}
      meta={data?.meta}
      loading={isLoading}
      error={error || (fetchError ? extraerMensajeError(fetchError) : null)}
      search={search}
      leido={leido}
      canManage={canManage}
      onSearch={(value) => {
        setSearch(value)
        setPage(1)
      }}
      onLeido={(value) => {
        setLeido(value)
        setPage(1)
      }}
      onCreate={openCreate}
      onEliminar={handleEliminar}
      onPageChange={setPage}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <NotificacionForm
            values={form}
            destinatarios={destinatarios}
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
