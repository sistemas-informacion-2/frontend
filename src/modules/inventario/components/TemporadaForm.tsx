import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import type { TemporadaFormValues } from '../types'

interface TemporadaFormProps {
  values: TemporadaFormValues
  editing: boolean
  loading: boolean
  error: string | null
  onChange: <K extends keyof TemporadaFormValues>(field: K, value: TemporadaFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function TemporadaForm({ values, editing, loading, error, onChange, onSubmit, onCancel }: TemporadaFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          required
          maxLength={100}
          value={values.nombre}
          onChange={(event) => onChange('nombre', event.target.value)}
        />
        <div />
        <Input
          label="Fecha de inicio"
          type="date"
          required
          value={values.fechaInicio}
          onChange={(event) => onChange('fechaInicio', event.target.value)}
        />
        <Input
          label="Fecha de fin"
          type="date"
          required
          value={values.fechaFin}
          onChange={(event) => onChange('fechaFin', event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="temporada-descripcion" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Descripción
        </label>
        <textarea
          id="temporada-descripcion"
          rows={3}
          value={values.descripcion}
          onChange={(event) => onChange('descripcion', event.target.value)}
          className="resize-y rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
        />
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {editing ? 'Guardar cambios' : 'Crear temporada'}
        </Button>
      </div>
    </form>
  )
}
