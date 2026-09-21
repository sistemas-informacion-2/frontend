import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { VarianteCombobox } from '@/modules/inventario/components/VarianteCombobox'
import type { Cliente } from '@/modules/operaciones/types'
import type { InventarioItem } from '@/modules/inventario/types'
import { PORCENTAJE_ANTICIPO_MINIMO, bs } from '../utils/reservas'

export interface LineaReservaForm {
  idVarianteProducto: number | ''
  cantidad: string
}

export interface ReservaFormValues {
  idCliente: number | ''
  montoAnticipo: string
  horasLimite: string
  observaciones: string
  items: LineaReservaForm[]
}

interface ReservaFormProps {
  values: ReservaFormValues
  clientes: Cliente[]
  /** Stock de la sucursal ya sumado por variante. */
  variantes: InventarioItem[]
  sucursalNombre: string | null
  loading: boolean
  error: string | null
  onChange: <K extends keyof ReservaFormValues>(field: K, value: ReservaFormValues[K]) => void
  onItemChange: (index: number, field: keyof LineaReservaForm, value: LineaReservaForm[keyof LineaReservaForm]) => void
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function ReservaForm({
  values,
  clientes,
  variantes,
  sucursalNombre,
  loading,
  error,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  onCancel,
}: ReservaFormProps) {
  const porVariante = new Map(variantes.map((variante) => [variante.idVarianteProducto, variante]))
  const total = values.items.reduce((suma, item) => {
    const variante = item.idVarianteProducto === '' ? undefined : porVariante.get(Number(item.idVarianteProducto))
    return suma + (variante?.precio ?? 0) * (Number(item.cantidad) || 0)
  }, 0)
  const anticipoMinimo = Math.round(total * PORCENTAJE_ANTICIPO_MINIMO) / 100

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Cliente"
          required
          value={values.idCliente === '' ? '' : String(values.idCliente)}
          onChange={(event) => onChange('idCliente', event.target.value === '' ? '' : Number(event.target.value))}
        >
          <option value="">Selecciona un cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre} {cliente.apellido}
            </option>
          ))}
        </Select>
        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">Sucursal</p>
          <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            {sucursalNombre ?? 'Elige una sucursal en el selector del panel'}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Prendas a apartar</p>
          <Button type="button" variant="secondary" onClick={onAddItem} disabled={variantes.length === 0}>
            Agregar línea
          </Button>
        </div>

        {variantes.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Esta sucursal no tiene prendas con stock disponible.</p>
        ) : (
          <div className="space-y-3">
            {values.items.map((item, index) => {
              const variante = item.idVarianteProducto === '' ? undefined : porVariante.get(Number(item.idVarianteProducto))
              return (
                <div key={index} className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_6rem_auto]">
                  <VarianteCombobox
                    label={`Variante ${index + 1}`}
                    opciones={variantes}
                    value={item.idVarianteProducto}
                    onChange={(idVariante) => onItemChange(index, 'idVarianteProducto', idVariante)}
                  />
                  <Input
                    label="Cantidad"
                    type="number"
                    min={1}
                    max={variante?.stockDisponible ?? undefined}
                    value={item.cantidad}
                    onChange={(event) => onItemChange(index, 'cantidad', event.target.value)}
                  />
                  <div className="pb-2.5 text-sm text-neutral-600 dark:text-neutral-400">{bs((variante?.precio ?? 0) * (Number(item.cantidad) || 0))}</div>
                  <Button type="button" variant="secondary" onClick={() => onRemoveItem(index)} disabled={values.items.length === 1}>
                    Quitar
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={`Anticipo en Bs (mínimo ${PORCENTAJE_ANTICIPO_MINIMO}%: ${bs(anticipoMinimo)})`}
          type="number"
          min={0}
          step="0.01"
          placeholder={anticipoMinimo.toFixed(2)}
          value={values.montoAnticipo}
          onChange={(event) => onChange('montoAnticipo', event.target.value)}
        />
        <Input
          label="Horas para retirar (por defecto 48)"
          type="number"
          min={1}
          max={168}
          value={values.horasLimite}
          onChange={(event) => onChange('horasLimite', event.target.value)}
        />
      </div>
      <Input label="Observaciones (opcional)" maxLength={500} value={values.observaciones} onChange={(event) => onChange('observaciones', event.target.value)} />

      <p className="text-right text-sm text-neutral-500 dark:text-neutral-400">
        Total estimado <span className="ml-2 text-base font-semibold text-neutral-900 dark:text-white">{bs(total)}</span>
        <span className="mt-1 block text-xs">El total final aplica el descuento de promoción vigente de cada producto.</span>
      </p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={sucursalNombre === null}>
          Crear reserva
        </Button>
      </div>
    </form>
  )
}
