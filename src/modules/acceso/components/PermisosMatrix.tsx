import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { PermisoGrupo } from '../types'

interface PermisosMatrixProps {
  grupos: PermisoGrupo[]
  seleccionados: number[]
  loading: boolean
  saving: boolean
  error: string | null
  onSubmit: (event: FormEvent<HTMLFormElement>, permisos: number[]) => void
  onCancel: () => void
}

export function PermisosMatrix({ grupos, seleccionados, loading, saving, error, onSubmit, onCancel }: PermisosMatrixProps) {
  const [checked, setChecked] = useState(() => new Set(seleccionados))

  const togglePermission = (id: number) => {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleGroup = (grupo: PermisoGrupo) => {
    setChecked((current) => {
      const next = new Set(current)
      const allSelected = grupo.permisos.every((permiso) => next.has(permiso.id))
      grupo.permisos.forEach((permiso) => (allSelected ? next.delete(permiso.id) : next.add(permiso.id)))
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}
      </div>
    )
  }

  return (
    <form onSubmit={(event) => onSubmit(event, Array.from(checked))} className="space-y-5">
      {grupos.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay permisos activos disponibles.</p>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => {
            const allSelected = grupo.permisos.every((permiso) => checked.has(permiso.id))
            return (
              <fieldset key={grupo.modulo} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <legend className="text-sm font-semibold capitalize text-neutral-900 dark:text-white">{grupo.modulo}</legend>
                  <button type="button" onClick={() => toggleGroup(grupo)} className="text-xs font-medium text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                    {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {grupo.permisos.map((permiso) => (
                    <label key={permiso.id} className="flex items-start gap-2 rounded-md border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                      <input type="checkbox" checked={checked.has(permiso.id)} onChange={() => togglePermission(permiso.id)} className="mt-0.5" />
                      <span>
                        <span className="block text-sm text-neutral-800 dark:text-neutral-200">{permiso.descripcion || permiso.accion}</span>
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400">{permiso.accion}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )
          })}
        </div>
      )}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button type="submit" loading={saving}>Guardar permisos</Button>
      </div>
    </form>
  )
}
