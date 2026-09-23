import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { Sucursal } from '@/modules/operaciones/types'
import type { AlmacenFormValues } from '../types'

interface AlmacenFormProps {
  values: AlmacenFormValues
  editing: boolean
  sucursales: Sucursal[]
  loading: boolean
  error: string | null
  onChange: <K extends keyof AlmacenFormValues>(field: K, value: AlmacenFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function AlmacenForm({ values, editing, sucursales, loading, error, onChange, onSubmit, onCancel }: AlmacenFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Sucursal"
          required
          value={values.idSucursal === '' ? '' : String(values.idSucursal)}
          onChange={(event) => onChange('idSucursal', event.target.value ? Number(event.target.value) : '')}
        >
          <option value="">Selecciona una sucursal…</option>
          {sucursales.map((sucursal) => (
            <option key={sucursal.id} value={String(sucursal.id)}>
              {sucursal.nombre}
            </option>
          ))}
        </Select>
        <Input
          label="Nombre del almacén"
          required
          maxLength={100}
          value={values.nombre}
          onChange={(event) => onChange('nombre', event.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Ubicación física"
            maxLength={255}
            value={values.ubicacionFisica}
            onChange={(event) => onChange('ubicacionFisica', event.target.value)}
          />
        </div>
        {editing && (
          <Select
            label="Estado"
            value={values.activo ? 'true' : 'false'}
            onChange={(event) => onChange('activo', event.target.value === 'true')}
          >
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
          {editing ? 'Guardar cambios' : 'Crear almacén'}
        </Button>
      </div>
    </form>
  )
}
