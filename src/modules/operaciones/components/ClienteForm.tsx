import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { ClienteFormValues } from '../types'

interface ClienteFormProps {
  values: ClienteFormValues
  editing: boolean
  loading: boolean
  error: string | null
  onChange: <K extends keyof ClienteFormValues>(field: K, value: ClienteFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function ClienteForm({ values, editing, loading, error, onChange, onSubmit, onCancel }: ClienteFormProps) {
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
          label="Correo electrónico"
          type="email"
          required
          value={values.email}
          onChange={(event) => onChange('email', event.target.value)}
        />
        <Input
          label="Teléfono"
          value={values.telefono}
          onChange={(event) => onChange('telefono', event.target.value)}
        />
        <Input
          label="Ciudad de residencia"
          value={values.ciudadResidencia}
          onChange={(event) => onChange('ciudadResidencia', event.target.value)}
        />
        <Select label="Sexo" value={values.sexo} onChange={(event) => onChange('sexo', event.target.value)}>
          <option value="">Seleccionar</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="O">Otro</option>
        </Select>
        <Input
          label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          type="password"
          required={!editing}
          minLength={6}
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => onChange('password', event.target.value)}
        />
        <Input
          label="Dirección principal"
          value={values.direccionPrincipal}
          onChange={(event) => onChange('direccionPrincipal', event.target.value)}
        />
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {editing ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  )
}
