import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { EmpleadoFormValues } from '../types'

interface SucursalOpcion {
  id: number
  nombre: string
}

interface EmpleadoFormProps {
  values: EmpleadoFormValues
  codigoEmpleado?: string
  sucursales: SucursalOpcion[]
  editing: boolean
  loading: boolean
  error: string | null
  onChange: <K extends keyof EmpleadoFormValues>(field: K, value: EmpleadoFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function EmpleadoForm({ values, codigoEmpleado, sucursales, editing, loading, error, onChange, onSubmit, onCancel }: EmpleadoFormProps) {
  const toggleSucursal = (id: number) => {
    const seleccionada = values.sucursalIds.includes(id)
    onChange('sucursalIds', seleccionada ? values.sucursalIds.filter((sid) => sid !== id) : [...values.sucursalIds, id])
  }

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
        <Select label="Sexo" value={values.sexo} onChange={(event) => onChange('sexo', event.target.value)}>
          <option value="">Seleccionar</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="O">Otro</option>
        </Select>
        <Input
          label="Código de empleado"
          value={editing && codigoEmpleado ? codigoEmpleado : 'Se generará automáticamente'}
          readOnly
          disabled
        />
        <Input
          label="Salario"
          type="number"
          min={0}
          step="0.01"
          required
          value={values.salario}
          onChange={(event) => onChange('salario', event.target.value)}
        />
        <Input
          label="Fecha de contratación"
          type="date"
          required
          value={values.fechaContratacion}
          onChange={(event) => onChange('fechaContratacion', event.target.value)}
        />
        <Input
          label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          type="password"
          required={!editing}
          minLength={6}
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => onChange('password', event.target.value)}
        />
        {editing && (
          <Input
            label="Fecha de finalización"
            type="date"
            value={values.fechaFinalizacion}
            onChange={(event) => onChange('fechaFinalizacion', event.target.value)}
          />
        )}
      </div>

      <fieldset>
          <legend className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Sucursales asignadas <span className="font-normal text-neutral-500">— opcional</span>
          </legend>
          {sucursales.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay sucursales registradas.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {sucursales.map((sucursal) => (
                <label key={sucursal.id} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                  <input type="checkbox" checked={values.sucursalIds.includes(sucursal.id)} onChange={() => toggleSucursal(sucursal.id)} />
                  <span className="dark:text-neutral-200">{sucursal.nombre}</span>
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
          {editing ? 'Guardar cambios' : 'Crear empleado'}
        </Button>
      </div>
    </form>
  )
}
