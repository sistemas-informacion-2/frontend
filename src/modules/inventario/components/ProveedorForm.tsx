import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { ProveedorFormValues } from '../types'

interface ProveedorFormProps {
  values: ProveedorFormValues
  editing: boolean
  loading: boolean
  error: string | null
  onChange: <K extends keyof ProveedorFormValues>(field: K, value: ProveedorFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function ProveedorForm({ values, editing, loading, error, onChange, onSubmit, onCancel }: ProveedorFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Razón social / Empresa"
          required
          maxLength={150}
          value={values.empresa}
          onChange={(event) => onChange('empresa', event.target.value)}
        />
        <Input
          label="NIT"
          required
          maxLength={50}
          value={values.nit}
          onChange={(event) => onChange('nit', event.target.value)}
        />
        <Input
          label="Nombre de contacto"
          maxLength={100}
          value={values.nombreContacto}
          onChange={(event) => onChange('nombreContacto', event.target.value)}
        />
        <Input
          label="Teléfono de contacto"
          maxLength={20}
          value={values.telefonoContacto}
          onChange={(event) => onChange('telefonoContacto', event.target.value)}
        />
        <Input
          label="Correo de contacto"
          type="email"
          maxLength={150}
          value={values.correoContacto}
          onChange={(event) => onChange('correoContacto', event.target.value)}
        />
        {editing && (
          <Select label="Estado" value={values.activo ? 'true' : 'false'} onChange={(event) => onChange('activo', event.target.value === 'true')}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Select>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {editing ? 'Guardar cambios' : 'Crear proveedor'}
        </Button>
      </div>
    </form>
  )
}
