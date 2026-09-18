import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { generarSlug } from '@/modules/inventario/services/categorias.service'
import type { CategoriaFormValues, CategoriaPlana, Temporada } from '../types'

interface CategoriaFormProps {
  values: CategoriaFormValues
  padresDisponibles: CategoriaPlana[]
  temporadas: Temporada[]
  editing: boolean
  loading: boolean
  error: string | null
  onChange: <K extends keyof CategoriaFormValues>(field: K, value: CategoriaFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function CategoriaForm({
  values,
  padresDisponibles,
  temporadas,
  editing,
  loading,
  error,
  onChange,
  onSubmit,
  onCancel,
}: CategoriaFormProps) {
  const handleNombreChange = (nombre: string) => {
    onChange('nombre', nombre)
    if (!editing) onChange('slug', generarSlug(nombre))
  }

  const toggleTemporada = (id: number) => {
    const seleccionada = values.temporadaIds.includes(id)
    onChange('temporadaIds', seleccionada ? values.temporadaIds.filter((tid) => tid !== id) : [...values.temporadaIds, id])
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          required
          maxLength={100}
          value={values.nombre}
          onChange={(event) => handleNombreChange(event.target.value)}
        />
        <Input
          label="Slug"
          required
          maxLength={120}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          title="Solo minúsculas, números y guiones (ej. ropa-mujer)"
          value={values.slug}
          onChange={(event) => onChange('slug', event.target.value)}
        />
        <Select
          label="Categoría padre"
          value={values.categoriaPadreId}
          onChange={(event) => onChange('categoriaPadreId', event.target.value ? Number(event.target.value) : '')}
        >
          <option value="">Sin categoría padre (raíz)</option>
          {padresDisponibles.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {'—'.repeat(categoria.nivel)} {categoria.nombre}
            </option>
          ))}
        </Select>
        <Input
          label="Imagen (URL)"
          maxLength={500}
          value={values.imagenUrl}
          onChange={(event) => onChange('imagenUrl', event.target.value)}
        />
        {editing && (
          <Select label="Estado" value={values.activo ? 'true' : 'false'} onChange={(event) => onChange('activo', event.target.value === 'true')}>
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoria-descripcion" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Descripción
        </label>
        <textarea
          id="categoria-descripcion"
          rows={3}
          value={values.descripcion}
          onChange={(event) => onChange('descripcion', event.target.value)}
          className="resize-y rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Temporadas</legend>
        {temporadas.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay temporadas registradas.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {temporadas.map((temporada) => (
              <label key={temporada.id} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                <input type="checkbox" checked={values.temporadaIds.includes(temporada.id)} onChange={() => toggleTemporada(temporada.id)} />
                <span className="dark:text-neutral-200">{temporada.nombre}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {editing ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  )
}
