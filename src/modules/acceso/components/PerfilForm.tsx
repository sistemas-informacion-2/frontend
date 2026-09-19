import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import type { PerfilFormValues } from '../types'

interface PerfilFormProps {
  values: PerfilFormValues
  showDireccion: boolean
  loading: boolean
  error: string | null
  success: string | null
  onChange: <K extends keyof PerfilFormValues>(field: K, value: PerfilFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function PerfilForm({ values, showDireccion, loading, error, success, onChange, onSubmit, onCancel }: PerfilFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          required
          value={values.nombre}
          onChange={(event) => onChange('nombre', event.target.value)}
        />
        <Input
          label="Apellido"
          required
          value={values.apellido}
          onChange={(event) => onChange('apellido', event.target.value)}
        />
        <Input
          label="Teléfono"
          value={values.telefono}
          onChange={(event) => onChange('telefono', event.target.value)}
        />
        {showDireccion && (
          <Input
            label="Dirección principal"
            value={values.direccion}
            onChange={(event) => onChange('direccion', event.target.value)}
          />
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
      {success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{success}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
