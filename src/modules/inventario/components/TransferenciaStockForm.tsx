import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { Almacen, InventarioItem, TransferenciaStockFormValues } from '../types'

interface TransferenciaStockFormProps {
  values: TransferenciaStockFormValues
  item: InventarioItem
  /** Almacenes activos de la empresa; el de origen se excluye aqui. */
  almacenes: Almacen[]
  loading: boolean
  error: string | null
  onChange: <K extends keyof TransferenciaStockFormValues>(field: K, value: TransferenciaStockFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function TransferenciaStockForm({ values, item, almacenes, loading, error, onChange, onSubmit, onCancel }: TransferenciaStockFormProps) {
  const destinos = almacenes
    .filter((almacen) => almacen.id !== item.idAlmacen)
    .sort((a, b) => a.sucursalNombre.localeCompare(b.sucursalNombre) || a.nombre.localeCompare(b.nombre))
  const sinStock = item.stockDisponible < 1

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
        <p className="font-medium text-neutral-900 dark:text-white">{item.productoNombre} · {item.sku}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Desde {item.almacenNombre} ({item.sucursalNombre}) · disponible: {item.stockDisponible}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Almacén destino"
          required
          value={values.idAlmacenDestino}
          onChange={(event) => onChange('idAlmacenDestino', event.target.value)}
        >
          <option value="">Selecciona un almacén</option>
          {destinos.map((almacen) => (
            <option key={almacen.id} value={almacen.id}>
              {almacen.nombre} ({almacen.sucursalNombre})
            </option>
          ))}
        </Select>
        <Input
          label="Cantidad"
          type="number"
          min={1}
          max={item.stockDisponible}
          required
          value={values.cantidad}
          onChange={(event) => onChange('cantidad', event.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Motivo (opcional)"
            maxLength={255}
            placeholder="Ej.: reponer la vitrina de otra sucursal"
            value={values.motivo}
            onChange={(event) => onChange('motivo', event.target.value)}
          />
        </div>
      </div>

      {destinos.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay otro almacén activo al que transferir.</p>
      )}
      {sinStock && <p className="text-sm text-neutral-500 dark:text-neutral-400">Este almacén no tiene unidades disponibles para transferir.</p>}
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Solo se mueve el stock disponible (no el reservado). El producto tiene que estar activo en la sucursal del almacén destino.
      </p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={sinStock || destinos.length === 0}>
          Transferir
        </Button>
      </div>
    </form>
  )
}
