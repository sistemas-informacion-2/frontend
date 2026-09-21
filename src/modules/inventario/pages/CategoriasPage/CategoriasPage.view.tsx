import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Categoria } from '@/modules/inventario/types'

interface CategoriasPageViewProps {
  categorias: Categoria[]
  loading: boolean
  error: string | null
  search: string
  activo: 'true' | 'false' | ''
  canManage: boolean
  modal: ReactNode
  onSearch: (value: string) => void
  onActivo: (value: 'true' | 'false' | '') => void
  onClearFilters: () => void
  onCreate: () => void
  onEdit: (categoria: Categoria) => void
  onToggleActivo: (categoria: Categoria) => void
  onCloseModal: () => void
}

export function CategoriasPageView({
  categorias,
  loading,
  error,
  search,
  activo,
  canManage,
  modal,
  onSearch,
  onActivo,
  onClearFilters,
  onCreate,
  onEdit,
  onToggleActivo,
  onCloseModal,
}: CategoriasPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Categorías</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Organiza la taxonomía del catálogo público.</p>
        </div>
        {canManage && <Button onClick={onCreate}>Nueva categoría</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Buscar" placeholder="Nombre o slug" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Estado" value={activo} onChange={(event) => onActivo(event.target.value as 'true' | 'false' | '')}>
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClearFilters} className="text-sm text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
            Limpiar filtros
          </button>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
          </div>
        ) : categorias.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay categorías" description="No se encontraron categorías con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Crear categoría</Button> : undefined} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Temporadas</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {categorias.map((categoria) => (
                  <CategoriaRows key={categoria.id} categoria={categoria} nivel={0} canManage={canManage} onEdit={onEdit} onToggleActivo={onToggleActivo} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={!!modal} title={modal ? 'Gestionar categoría' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}

function CategoriaRows({
  categoria,
  nivel,
  canManage,
  onEdit,
  onToggleActivo,
}: {
  categoria: Categoria
  nivel: number
  canManage: boolean
  onEdit: (categoria: Categoria) => void
  onToggleActivo: (categoria: Categoria) => void
}) {
  return (
    <>
      <tr className="text-neutral-700 dark:text-neutral-300">
        <td className="px-4 py-3" style={{ paddingLeft: `${16 + nivel * 20}px` }}>
          <p className="font-medium text-neutral-900 dark:text-white">{categoria.nombre}</p>
          <p className="max-w-sm truncate text-xs text-neutral-500 dark:text-neutral-400">{categoria.descripcion || 'Sin descripción'}</p>
        </td>
        <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{categoria.slug}</td>
        <td className="px-4 py-3">
          {categoria.temporadas.length === 0 ? (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Sin temporadas</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {categoria.temporadas.map((temporada) => (
                <Badge key={temporada.id} tone="neutral">{temporada.nombre}</Badge>
              ))}
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <Badge tone={categoria.activo ? 'success' : 'neutral'}>{categoria.activo ? 'Activa' : 'Inactiva'}</Badge>
        </td>
        <td className="px-4 py-3 text-right">
          {canManage && (
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => onEdit(categoria)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Editar</button>
              <button
                type="button"
                onClick={() => onToggleActivo(categoria)}
                className={`text-sm font-medium underline ${categoria.activo ? 'text-red-600 hover:text-red-800 dark:text-red-400' : 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400'}`}
              >
                {categoria.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          )}
        </td>
      </tr>
      {categoria.hijos.map((hijo) => (
        <CategoriaRows key={hijo.id} categoria={hijo} nivel={nivel + 1} canManage={canManage} onEdit={onEdit} onToggleActivo={onToggleActivo} />
      ))}
    </>
  )
}
