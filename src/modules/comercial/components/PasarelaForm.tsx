import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { PasarelaFormValues } from '../types'

interface PasarelaFormProps {
  values: PasarelaFormValues
  editing: boolean
  tieneApiKey: boolean
  loading: boolean
  error: string | null
  onChange: <K extends keyof PasarelaFormValues>(field: K, value: PasarelaFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function PasarelaForm({ values, editing, tieneApiKey, loading, error, onChange, onSubmit, onCancel }: PasarelaFormProps) {
  const requiereCredenciales = values.integracion === 'API'

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Código"
          required
          maxLength={30}
          disabled={editing}
          placeholder="EFECTIVO, QR, TARJETA, PAYPAL"
          value={values.codigo}
          onChange={(event) => onChange('codigo', event.target.value.toUpperCase())}
        />
        <Input
          label="Nombre visible"
          required
          maxLength={50}
          value={values.metodo}
          onChange={(event) => onChange('metodo', event.target.value)}
        />
        <Select
          label="Integración"
          value={values.integracion}
          onChange={(event) => onChange('integracion', event.target.value as PasarelaFormValues['integracion'])}
        >
          <option value="NINGUNA">Ninguna</option>
          <option value="API">API / pasarela</option>
        </Select>
        <Input
          label="Comisión (%)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={values.comisionPorcentaje}
          onChange={(event) => onChange('comisionPorcentaje', event.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Descripción"
            maxLength={255}
            value={values.descripcion}
            onChange={(event) => onChange('descripcion', event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Habilitado para</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
              checked={values.disponiblePresencial}
              onChange={(event) => onChange('disponiblePresencial', event.target.checked)}
            />
            Presencial (caja)
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
              checked={values.disponibleLinea}
              onChange={(event) => onChange('disponibleLinea', event.target.checked)}
            />
            En línea (e-commerce)
          </label>
        </div>
      </div>

      {requiereCredenciales && (
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Credenciales de la pasarela</p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {editing && tieneApiKey
              ? 'Ya hay credenciales guardadas. Déjalas en blanco para conservarlas.'
              : 'Se guardan cifradas. Son obligatorias para habilitar cualquier canal.'}
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              label="API Key / Client ID"
              maxLength={255}
              value={values.apiKey}
              onChange={(event) => onChange('apiKey', event.target.value)}
            />
            <Input
              label="API Secret / Client Secret"
              type="password"
              maxLength={255}
              value={values.apiSecret}
              onChange={(event) => onChange('apiSecret', event.target.value)}
            />
          </div>
        </div>
      )}

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {editing ? 'Guardar cambios' : 'Crear método'}
        </Button>
      </div>
    </form>
  )
}
