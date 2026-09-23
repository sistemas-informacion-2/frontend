import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { Ciudad, Departamento, SucursalFormValues } from '../types'

interface SucursalFormProps {
  values: SucursalFormValues
  ciudades: Ciudad[]
  departamentos: Departamento[]
  editing: boolean
  loading: boolean
  error: string | null
  creandoCiudad: boolean
  onChange: <K extends keyof SucursalFormValues>(field: K, value: SucursalFormValues[K]) => void
  onCrearCiudad: (datos: { idDepartamento: number; nombre: string }) => Promise<void>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function SucursalForm({
  values,
  ciudades,
  departamentos,
  editing,
  loading,
  error,
  creandoCiudad,
  onChange,
  onCrearCiudad,
  onSubmit,
  onCancel,
}: SucursalFormProps) {
  const [mostrarNuevaCiudad, setMostrarNuevaCiudad] = useState(false)
  const [nuevaCiudadNombre, setNuevaCiudadNombre] = useState('')
  const [nuevaCiudadDepartamento, setNuevaCiudadDepartamento] = useState<number | ''>('')
  const [errorCiudad, setErrorCiudad] = useState<string | null>(null)

  const handleCrearCiudad = async () => {
    if (!nuevaCiudadDepartamento || !nuevaCiudadNombre.trim()) {
      setErrorCiudad('Indica el departamento y el nombre de la ciudad.')
      return
    }
    setErrorCiudad(null)
    try {
      await onCrearCiudad({ idDepartamento: nuevaCiudadDepartamento, nombre: nuevaCiudadNombre.trim() })
      setNuevaCiudadNombre('')
      setNuevaCiudadDepartamento('')
      setMostrarNuevaCiudad(false)
    } catch {
      setErrorCiudad('No se pudo crear la ciudad.')
    }
  }

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
        <div className="space-y-2">
          <Select
            label="Ciudad"
            required
            value={values.idCiudad}
            onChange={(event) => onChange('idCiudad', event.target.value ? Number(event.target.value) : '')}
          >
            <option value="">Seleccionar</option>
            {ciudades.map((ciudad) => (
              <option key={ciudad.id} value={ciudad.id}>
                {ciudad.nombre} ({ciudad.departamentoNombre})
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => setMostrarNuevaCiudad((current) => !current)}
            className="text-xs font-medium text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            {mostrarNuevaCiudad ? 'Cancelar' : '+ Agregar ciudad'}
          </button>
        </div>
        <Input
          label="Dirección"
          required
          maxLength={100}
          value={values.ubicacion}
          onChange={(event) => onChange('ubicacion', event.target.value)}
        />
        <Input
          label="Teléfono"
          value={values.telefono}
          onChange={(event) => onChange('telefono', event.target.value)}
        />
        <Input
          label="Correo"
          type="email"
          value={values.correo}
          onChange={(event) => onChange('correo', event.target.value)}
        />
        <Input
          label="Horario de apertura"
          type="time"
          value={values.horarioApertura}
          onChange={(event) => onChange('horarioApertura', event.target.value)}
        />
        <Input
          label="Horario de cierre"
          type="time"
          value={values.horarioCierre}
          onChange={(event) => onChange('horarioCierre', event.target.value)}
        />
        {editing && (
          <Select label="Estado" value={values.activo ? 'true' : 'false'} onChange={(event) => onChange('activo', event.target.value === 'true')}>
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </Select>
        )}
      </div>

      {mostrarNuevaCiudad && (
        <div className="space-y-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nueva ciudad</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Departamento"
              value={nuevaCiudadDepartamento}
              onChange={(event) => setNuevaCiudadDepartamento(event.target.value ? Number(event.target.value) : '')}
            >
              <option value="">Seleccionar</option>
              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.nombre}
                </option>
              ))}
            </Select>
            <Input
              label="Nombre de la ciudad"
              value={nuevaCiudadNombre}
              onChange={(event) => setNuevaCiudadNombre(event.target.value)}
            />
          </div>
          {errorCiudad && <p className="text-xs text-red-600 dark:text-red-400">{errorCiudad}</p>}
          <div className="flex justify-end">
            <Button type="button" variant="secondary" loading={creandoCiudad} onClick={handleCrearCiudad}>
              Guardar ciudad
            </Button>
          </div>
        </div>
      )}

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {editing ? 'Guardar cambios' : 'Crear sucursal'}
        </Button>
      </div>
    </form>
  )
}
