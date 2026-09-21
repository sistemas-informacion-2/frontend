import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { MovimientoCajaFormValues } from '../types'

interface MovimientoCajaFormProps {
  values: MovimientoCajaFormValues
  loading: boolean
  error: string | null
  onChange: <K extends keyof MovimientoCajaFormValues>(field: K, value: MovimientoCajaFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function MovimientoCajaForm({
  values,
  loading,
  error,
  onChange,
  onSubmit,
  onCancel,
}: MovimientoCajaFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Tipo"
          value={values.tipo}
          onChange={(event) => onChange('tipo', event.target.value as MovimientoCajaFormValues['tipo'])}
        >
          <option value="INGRESO">Ingreso</option>
          <option value="EGRESO">Egreso</option>
        </Select>
        <Input
          label="Monto (Bs)"
          type="number"
          min={0.01}
          step="0.01"
          required
          value={values.monto}
          onChange={(event) => onChange('monto', event.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Concepto"
            required
            maxLength={150}
            value={values.concepto}
            onChange={(event) => onChange('concepto', event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Observaciones"
            maxLength={500}
            value={values.observaciones}
            onChange={(event) => onChange('observaciones', event.target.value)}
          />
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Registrar movimiento
        </Button>
      </div>
    </form>
  )
}
