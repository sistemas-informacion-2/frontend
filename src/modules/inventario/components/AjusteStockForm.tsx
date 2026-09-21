import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { AjusteStockFormValues, InventarioItem } from '../types'

interface AjusteStockFormProps {
  values: AjusteStockFormValues
  item: InventarioItem
  loading: boolean
  error: string | null
  onChange: <K extends keyof AjusteStockFormValues>(field: K, value: AjusteStockFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function AjusteStockForm({ values, item, loading, error, onChange, onSubmit, onCancel }: AjusteStockFormProps) {
  const etiquetaCantidad = values.tipo === 'AJUSTE' ? 'Nuevo stock' : 'Cantidad'

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
        <p className="font-medium text-neutral-900 dark:text-white">{item.productoNombre} · {item.sku}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {item.almacenNombre} ({item.sucursalNombre}) · disponible actual: {item.stockDisponible}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Tipo de ajuste"
          value={values.tipo}
          onChange={(event) => onChange('tipo', event.target.value as AjusteStockFormValues['tipo'])}
        >
          <option value="ENTRADA">Entrada</option>
          <option value="SALIDA">Salida</option>
          <option value="AJUSTE">Ajuste (fijar valor)</option>
        </Select>
        <Input
          label={etiquetaCantidad}
          type="number"
          min={0}
          required
          value={values.cantidad}
          onChange={(event) => onChange('cantidad', event.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Motivo (opcional)"
            maxLength={255}
            value={values.motivo}
            onChange={(event) => onChange('motivo', event.target.value)}
          />
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Aplicar ajuste
        </Button>
      </div>
    </form>
  )
}
