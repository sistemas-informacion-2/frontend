import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { CategoriaForm } from '@/modules/inventario/components/CategoriaForm'
import {
  actualizarCategoria,
  aplanarCategorias,
  crearCategoria,
  filtrarArbolCategorias,
  listarCategoriasTodas,
  obtenerDescendientesIds,
} from '@/modules/inventario/services/categorias.service'
import { listarTemporadas } from '@/modules/inventario/services/temporadas.service'
import type { Categoria, CategoriaFormValues } from '@/modules/inventario/types'
import { CategoriasPageView } from './CategoriasPage.view'

const EMPTY_FORM: CategoriaFormValues = {
  nombre: '',
  slug: '',
  descripcion: '',
  imagenUrl: '',
  categoriaPadreId: '',
  activo: true,
  temporadaIds: [],
}

export function CategoriasPage() {
  const canManage = useAuthStore((state) => state.hasPermission('inventario:categorias:gestionar'))
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Categoria | null>(null)
  const [form, setForm] = useState<CategoriaFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activo, setActivo] = useState<'true' | 'false' | ''>('')

  const { data: categorias = [], error: categoriasError, isLoading, mutate } = useSWR(
    'categorias-todas',
    listarCategoriasTodas,
    { revalidateOnFocus: false },
  )
  const { data: temporadas = [] } = useSWR('temporadas', listarTemporadas, { revalidateOnFocus: false })

  const todasPlanas = aplanarCategorias(categorias)
  const excluidos = editing ? obtenerDescendientesIds(editing) : new Set<number>()
  const padresDisponibles = todasPlanas.filter((categoria) => !excluidos.has(categoria.id))

  const deferredSearch = useDeferredValue(search)
  const categoriasFiltradas = filtrarArbolCategorias(categorias, {
    texto: deferredSearch,
    activo: activo === '' ? undefined : activo === 'true',
  })

  const updateForm = <K extends keyof CategoriaFormValues>(field: K, value: CategoriaFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (categoria: Categoria) => {
    setEditing(categoria)
    setForm({
      nombre: categoria.nombre,
      slug: categoria.slug,
      descripcion: categoria.descripcion ?? '',
      imagenUrl: categoria.imagenUrl ?? '',
      categoriaPadreId: categoria.categoriaPadreId ?? '',
      activo: categoria.activo,
      temporadaIds: categoria.temporadas.map((temporada) => temporada.id),
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
        await actualizarCategoria(editing.id, form)
      } else {
        await crearCategoria(form)
      }
      setModalOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (categoria: Categoria) => {
    const accion = categoria.activo ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Deseas ${accion} la categoría ${categoria.nombre}?`)) return
    setError(null)
    try {
      await actualizarCategoria(categoria.id, {
        nombre: categoria.nombre,
        slug: categoria.slug,
        descripcion: categoria.descripcion ?? '',
        imagenUrl: categoria.imagenUrl ?? '',
        categoriaPadreId: categoria.categoriaPadreId ?? '',
        activo: !categoria.activo,
        temporadaIds: categoria.temporadas.map((temporada) => temporada.id),
      })
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  const clearFilters = () => {
    setSearch('')
    setActivo('')
  }

  return (
    <CategoriasPageView
      categorias={categoriasFiltradas}
      loading={isLoading}
      error={error || (categoriasError ? extraerMensajeError(categoriasError) : null)}
      search={search}
      activo={activo}
      canManage={canManage}
      onSearch={setSearch}
      onActivo={setActivo}
      onClearFilters={clearFilters}
      onCreate={openCreate}
      onEdit={openEdit}
      onToggleActivo={handleToggleActivo}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <CategoriaForm
            values={form}
            padresDisponibles={padresDisponibles}
            temporadas={temporadas}
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
