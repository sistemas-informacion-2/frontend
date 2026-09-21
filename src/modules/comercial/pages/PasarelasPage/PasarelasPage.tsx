import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { PasarelaForm } from '@/modules/comercial/components/PasarelaForm'
import {
  actualizarPasarela,
  cambiarDisponibilidadPasarela,
  crearPasarela,
  listarPasarelas,
} from '@/modules/comercial/services/pasarelas.service'
import type { IntegracionPago, Pasarela, PasarelaFormValues } from '@/modules/comercial/types'
import { PasarelasPageView } from './PasarelasPage.view'

type CanalFiltro = '' | 'presencial' | 'linea'

const EMPTY_FORM: PasarelaFormValues = {
  codigo: '',
  metodo: '',
  descripcion: '',
  integracion: 'NINGUNA',
  comisionPorcentaje: '0',
  disponiblePresencial: false,
  disponibleLinea: false,
  apiKey: '',
  apiSecret: '',
}

export function PasarelasPage() {
  const canManage = useAuthStore((state) => state.hasPermission('comercial:pasarelas:gestionar'))
  const [search, setSearch] = useState('')
  const [integracion, setIntegracion] = useState<'' | IntegracionPago>('')
  const [canal, setCanal] = useState<CanalFiltro>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Pasarela | null>(null)
  const [form, setForm] = useState<PasarelaFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const query = {
    search: deferredSearch.trim() || undefined,
    integracion: integracion || undefined,
    disponiblePresencial: canal === 'presencial' ? true : undefined,
    disponibleLinea: canal === 'linea' ? true : undefined,
  }

  const { data: pasarelas = [], error: pasarelasError, isLoading, mutate } = useSWR(
    ['pasarelas', query.search, query.integracion, query.disponiblePresencial, query.disponibleLinea],
    () => listarPasarelas(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const updateForm = <K extends keyof PasarelaFormValues>(field: K, value: PasarelaFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (pasarela: Pasarela) => {
    setEditing(pasarela)
    setForm({
      codigo: pasarela.codigo,
      metodo: pasarela.metodo,
      descripcion: pasarela.descripcion ?? '',
      integracion: pasarela.integracion,
      comisionPorcentaje: String(pasarela.comisionPorcentaje),
      disponiblePresencial: pasarela.disponiblePresencial,
      disponibleLinea: pasarela.disponibleLinea,
      apiKey: '',
      apiSecret: '',
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
        await actualizarPasarela(editing.id, form)
      } else {
        await crearPasarela(form)
      }
      setModalOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCanal = async (pasarela: Pasarela, canalObjetivo: 'presencial' | 'linea') => {
    const actual = canalObjetivo === 'presencial' ? pasarela.disponiblePresencial : pasarela.disponibleLinea
    const nombreCanal = canalObjetivo === 'presencial' ? 'presencial' : 'en línea'
    const accion = actual ? 'deshabilitar' : 'habilitar'
    if (!window.confirm(`¿Deseas ${accion} ${pasarela.metodo} en ${nombreCanal}?`)) return
    setError(null)
    try {
      await cambiarDisponibilidadPasarela(pasarela.id, { [canalObjetivo]: !actual })
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  return (
    <PasarelasPageView
      pasarelas={pasarelas}
      loading={isLoading}
      error={error || (pasarelasError ? extraerMensajeError(pasarelasError) : null)}
      search={search}
      integracion={integracion}
      canal={canal}
      canManage={canManage}
      onSearch={setSearch}
      onIntegracion={setIntegracion}
      onCanal={setCanal}
      onCreate={openCreate}
      onEdit={openEdit}
      onToggleCanal={handleToggleCanal}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <PasarelaForm
            values={form}
            editing={!!editing}
            tieneApiKey={editing?.tieneApiKey ?? false}
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
