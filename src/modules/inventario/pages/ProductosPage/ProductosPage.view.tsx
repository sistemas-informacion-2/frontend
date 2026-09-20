import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { CategoriaPlana, Producto } from '@/modules/inventario/types'

interface ProductosPageViewProps {
  productos: Producto[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  loading: boolean
  error: string | null
  search: string
  idCategoria: number | ''
  activo: 'true' | 'false' | ''
  categoriasPlanas: CategoriaPlana[]
  sucursales: { id: number; nombre: string }[]
  idSucursal: number | ''
  onSucursal: (value: number | '') => void
  canManage: boolean
  modal: ReactNode
  onSearch: (value: string) => void
  onCategoria: (value: number | '') => void
  onActivo: (value: 'true' | 'false' | '') => void
  onPageChange: (page: number) => void
  onCreate: () => void
  onEdit: (producto: Producto) => void
  onDeactivate: (producto: Producto) => void
  onCloseModal: () => void
}

export function ProductosPageView({
  productos,
  meta,
  loading,
  error,
  search,
  idCategoria,
  activo,
  categoriasPlanas,
  sucursales,
  idSucursal,
  onSucursal,
  canManage,
  modal,
  onSearch,
  onCategoria,
  onActivo,
  onPageChange,
  onCreate,
  onEdit,
  onDeactivate,
  onCloseModal,
}: ProductosPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Productos</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Catálogo maestro: cabecera, galería de imágenes y variantes (talla, color, corte).</p>
        </div>
        {canManage && <Button onClick={onCreate}>Nuevo producto</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-4">
          <Input label="Buscar" placeholder="Nombre o descripción" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Categoría" value={idCategoria} onChange={(event) => onCategoria(event.target.value ? Number(event.target.value) : '')}>
            <option value="">Todas</option>
            {categoriasPlanas.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {'—'.repeat(categoria.nivel)} {categoria.nombre}
              </option>
            ))}
          </Select>
          <Select label="Sucursal" value={idSucursal} onChange={(event) => onSucursal(event.target.value ? Number(event.target.value) : '')}>
            <option value="">Todas (vista general)</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
            ))}
          </Select>
          <Select label="Estado" value={activo} onChange={(event) => onActivo(event.target.value as 'true' | 'false' | '')}>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
            <option value="">Todos</option>
          </Select>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        ) : productos.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay productos" description="No se encontraron productos con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Crear producto</Button> : undefined} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Precio</th>
                    <th className="px-4 py-3 font-medium">Variantes</th>
                    <th className="px-4 py-3 font-medium">Sucursales</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {productos.map((producto) => {
                    const imagenPrincipal = producto.imagenes.find((imagen) => imagen.esPrincipal) ?? producto.imagenes[0]
                    const variantesActivas = producto.variantes.filter((variante) => variante.activo).length
                    const sucursalesActivas = producto.sucursales.filter((sucursal) => sucursal.activo).length
                    return (
                      <tr key={producto.id} className="text-neutral-700 dark:text-neutral-300">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                              {imagenPrincipal && <img src={imagenPrincipal.url} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <p className="font-medium text-neutral-900 dark:text-white">{producto.nombre}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{producto.categoriaNombre}</td>
                        <td className="px-4 py-3">Bs {producto.precio.toFixed(2)}</td>
                        <td className="px-4 py-3">{variantesActivas} / {producto.variantes.length}</td>
                        <td className="px-4 py-3">
                          {sucursalesActivas === 0 ? (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">Sin activar</span>
                          ) : (
                            `${sucursalesActivas} sucursal${sucursalesActivas === 1 ? '' : 'es'}`
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={producto.activo ? 'success' : 'neutral'}>{producto.activo ? 'Activo' : 'Inactivo'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManage && (
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => onEdit(producto)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Editar</button>
                              {producto.activo && (
                                <button type="button" onClick={() => onDeactivate(producto)} className="text-sm font-medium text-red-600 underline hover:text-red-800 dark:text-red-400">Desactivar</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4">
              {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />}
            </div>
          </>
        )}
      </section>

      <Modal open={!!modal} title={modal ? 'Gestionar producto' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}
