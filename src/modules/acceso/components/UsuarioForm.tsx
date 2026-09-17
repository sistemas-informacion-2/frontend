import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { RolResumen, UsuarioFormValues } from '../types'

interface UsuarioFormProps {
  values: UsuarioFormValues
  roles: RolResumen[]
  editing: boolean
  loading: boolean
  error: string | null
  onChange: <K extends keyof UsuarioFormValues>(field: K, value: UsuarioFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function UsuarioForm({ values, roles, editing, loading, error, onChange, onSubmit, onCancel }: UsuarioFormProps) {
  const toggleRole = (id: number) => {
    const selected = values.roles.includes(id)
    onChange('roles', selected ? values.roles.filter((roleId) => roleId !== id) : [...values.roles, id])
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
        <Select label="Tipo de usuario" value={values.tipoUsuario} onChange={(event) => onChange('tipoUsuario', event.target.value as UsuarioFormValues['tipoUsuario'])}>
          <option value="A">Administrador</option>
          <option value="E">Empleado</option>
          <option value="C">Cliente</option>
        </Select>
        <Select label="Estado de acceso" value={values.estadoAcceso} onChange={(event) => onChange('estadoAcceso', event.target.value as UsuarioFormValues['estadoAcceso'])}>
          <option value="HABILITADO">Habilitado</option>
          <option value="BLOQUEADO">Bloqueado</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </Select>
        <Input
          label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          type="password"
          required={!editing}
          minLength={6}
          autoComplete={editing ? 'new-password' : 'new-password'}
          value={values.password}
          onChange={(event) => onChange('password', event.target.value)}
        />
        <Select label="Sexo" value={values.sexo} onChange={(event) => onChange('sexo', event.target.value)}>
          <option value="">Seleccionar</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="O">Otro</option>
        </Select>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Roles</legend>
        {roles.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay roles activos disponibles.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                <input type="checkbox" checked={values.roles.includes(role.id)} onChange={() => toggleRole(role.id)} />
                <span className="dark:text-neutral-200">{role.nombre}</span>
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
          {editing ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}
