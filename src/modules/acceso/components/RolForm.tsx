import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { ActualizarRolPayload, CrearRolPayload } from '../types'

type RolFormValues = CrearRolPayload & { activo: boolean }

interface RolFormProps {
  values: RolFormValues
  editing: boolean
  loading: boolean
  error: string | null
  onChange: <K extends keyof RolFormValues>(field: K, value: RolFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function RolForm({ values, editing, loading, error, onChange, onSubmit, onCancel }: RolFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Input
        label="Nombre del rol"
        required
        maxLength={50}
        value={values.nombre}
        onChange={(event) => onChange('nombre', event.target.value)}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rol-descripcion" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Descripción
        </label>
        <textarea
          id="rol-descripcion"
          rows={4}
          value={values.descripcion}
          onChange={(event) => onChange('descripcion', event.target.value)}
          className="resize-y rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
        />
      </div>
      {editing && (
        <Select label="Estado" value={values.activo ? 'true' : 'false'} onChange={(event) => onChange('activo', event.target.value === 'true')}>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </Select>
      )}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {editing ? 'Guardar cambios' : 'Crear rol'}
        </Button>
      </div>
    </form>
  )
}

export type { RolFormValues }
export type RolUpdatePayload = ActualizarRolPayload
