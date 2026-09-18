import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { ProductoForm } from '@/modules/inventario/components/ProductoForm'
import { ProductoImagenesPanel } from '@/modules/inventario/components/ProductoImagenesPanel'
import { ProductoVariantesPanel } from '@/modules/inventario/components/ProductoVariantesPanel'
import { aplanarCategorias, listarCategoriasTodas } from '@/modules/inventario/services/categorias.service'
import {
  actualizarProducto,
  crearProducto,
  desactivarProducto,
  listarProductos,
} from '@/modules/inventario/services/productos.service'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import type { Producto, ProductoFormValues, ProductosQuery } from '@/modules/inventario/types'
import { ProductosPageView } from './ProductosPage.view'

const PAGE_SIZE = 12

const EMPTY_FORM: ProductoFormValues = {
  idCategoria: '',
  idSucursal: '',
  nombre: '',
  descripcion: '',
  precio: '',
  activo: true,
  imagenes: [],
  variantes: [{ sku: '', talla: '', color: '', corte: '', codigoHexColor: '', modelo3dUrl: '', activo: true }],
}

export function ProductosPage() {
  const canManage = useAuthStore((state) => state.hasPermission('inventario:productos:gestionar'))
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [idCategoria, setIdCategoria] = useState<number | ''>('')
  const [activo, setActivo] = useState<'true' | 'false' | ''>('true')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [form, setForm] = useState<ProductoFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const query: ProductosQuery = {
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
    idCategoria: idCategoria || undefined,
    activo: activo === '' ? undefined : activo === 'true',
  }

  const { data, error: productosError, isLoading, mutate } = useSWR(
    ['productos', query.page, query.search, query.idCategoria, query.activo],
    () => listarProductos(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )
  const { data: categoriasTodas = [] } = useSWR('categorias-todas', listarCategoriasTodas, { revalidateOnFocus: false })
  const { data: sucursales = [] } = useSWR('sucursales', listarSucursales, { revalidateOnFocus: false })

  const categoriasPlanas = aplanarCategorias(categoriasTodas)

  const updateForm = <K extends keyof ProductoFormValues>(field: K, value: ProductoFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditingProducto(null)
    setForm({ ...EMPTY_FORM, variantes: [{ ...EMPTY_FORM.variantes[0] }] })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (producto: Producto) => {
    setEditingProducto(producto)
    setForm({
      idCategoria: producto.categoriaId,
      idSucursal: producto.sucursalId ?? '',
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      precio: String(producto.precio),
      activo: producto.activo,
      imagenes: [],
      variantes: [],
    })
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingProducto(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editingProducto) {
        const actualizado = await actualizarProducto(editingProducto.id, form)
        setEditingProducto(actualizado)
        await mutate()
      } else {
        await crearProducto(form)
        setModalOpen(false)
        await mutate()
      }
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (producto: Producto) => {
    if (!window.confirm(`¿Desactivar el producto ${producto.nombre}?`)) return
    setError(null)
    try {
      await desactivarProducto(producto.id)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  const handleSubProductoActualizado = (producto: Producto) => {
    setEditingProducto(producto)
    void mutate()
  }

  return (
    <ProductosPageView
      productos={data?.items ?? []}
      meta={data?.meta}
      loading={isLoading}
      error={error || (productosError ? extraerMensajeError(productosError) : null)}
      search={search}
      idCategoria={idCategoria}
      activo={activo}
      categoriasPlanas={categoriasPlanas}
      canManage={canManage}
      onSearch={(value) => {
        setSearch(value)
        setPage(1)
      }}
      onCategoria={(value) => {
        setIdCategoria(value)
        setPage(1)
      }}
      onActivo={(value) => {
        setActivo(value)
        setPage(1)
      }}
      onPageChange={setPage}
      onCreate={openCreate}
      onEdit={openEdit}
      onDeactivate={handleDeactivate}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <div className="space-y-6">
            <ProductoForm
              values={form}
              categoriasPlanas={categoriasPlanas}
              sucursales={sucursales}
              editing={!!editingProducto}
              loading={saving}
              error={error}
              onChange={updateForm}
              onSubmit={handleSubmit}
              onCancel={closeModal}
            />
            {editingProducto && (
              <>
                <ProductoVariantesPanel producto={editingProducto} onActualizado={handleSubProductoActualizado} />
                <ProductoImagenesPanel producto={editingProducto} onActualizado={handleSubProductoActualizado} />
              </>
            )}
          </div>
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
