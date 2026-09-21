import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { VarianteCombobox } from '@/modules/inventario/components/VarianteCombobox'
import type { Cliente } from '@/modules/operaciones/types'
import type { InventarioItem } from '@/modules/inventario/types'
import type { Pasarela, VentaFormValues, VentaItemForm } from '../types'

interface VentaFormProps {
  values: VentaFormValues
  clientes: Cliente[]
  pasarelas: Pasarela[]
  /** Stock de la sucursal ya sumado por variante: no importa en qué almacén está, el servidor lo decide. */
  stock: InventarioItem[]
  sucursalNombre: string | null
  loading: boolean
  error: string | null
  onChange: <K extends keyof VentaFormValues>(field: K, value: VentaFormValues[K]) => void
  onItemChange: (index: number, field: keyof VentaItemForm, value: VentaItemForm[keyof VentaItemForm]) => void
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function VentaForm({
  values,
  clientes,
  pasarelas,
  stock,
  sucursalNombre,
  loading,
  error,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  onCancel,
}: VentaFormProps) {
  const stockPorVariante = new Map(stock.map((item) => [item.idVarianteProducto, item]))
  const lineas = values.items.map((item) => {
    const variante = item.idVarianteProducto === '' ? undefined : stockPorVariante.get(Number(item.idVarianteProducto))
    const precio = variante?.precio ?? 0
    const cantidad = Number(item.cantidad) || 0
    return { item, variante, subtotal: precio * cantidad }
  })
  const subtotal = lineas.reduce((total, linea) => total + linea.subtotal, 0)
  const total = subtotal - Number(values.descuento || 0) + Number(values.impuesto || 0)

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Cliente (opcional)"
          value={values.idCliente === '' ? '' : String(values.idCliente)}
          onChange={(event) => onChange('idCliente', event.target.value === '' ? '' : Number(event.target.value))}
        >
          <option value="">Consumidor final (sin registrar)</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre} {cliente.apellido}
            </option>
          ))}
        </Select>
        <Select
          label="Método de pago"
          required
          value={values.idPasarela === '' ? '' : String(values.idPasarela)}
          onChange={(event) => onChange('idPasarela', event.target.value === '' ? '' : Number(event.target.value))}
        >
          <option value="">Selecciona un método</option>
          {pasarelas.map((pasarela) => (
            <option key={pasarela.id} value={pasarela.id}>
              {pasarela.metodo}
            </option>
          ))}
        </Select>
        <Input
          label="NIT / Razón social (opcional)"
          maxLength={50}
          value={values.nitRazonSocial}
          onChange={(event) => onChange('nitRazonSocial', event.target.value)}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">Sucursal</p>
          <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            {sucursalNombre ?? 'Elige una sucursal en el selector del panel'}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Productos</p>
          <Button type="button" variant="secondary" onClick={onAddItem} disabled={stock.length === 0}>
            Agregar línea
          </Button>
        </div>

        {sucursalNombre === null ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Elige una sucursal para ver las prendas con stock.</p>
        ) : stock.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Esta sucursal no tiene prendas con stock disponible.</p>
        ) : (
          <div className="space-y-4">
            {lineas.map(({ item, variante, subtotal: subtotalLinea }, index) => (
              // Las columnas fijas y `minmax(0, 1fr)` en la variante evitan que un nombre largo empuje a "Quitar" fuera del cuadro.
              <div key={index} className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_6rem_auto]">
                <VarianteCombobox
                  label={`Variante ${index + 1}`}
                  opciones={stock}
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
                <p className="pb-2.5 text-sm text-neutral-600 sm:text-right dark:text-neutral-400">Bs {subtotalLinea.toFixed(2)}</p>
                <Button type="button" variant="secondary" onClick={() => onRemoveItem(index)} disabled={values.items.length === 1}>
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Descuento (Bs)"
          type="number"
          min={0}
          step="0.01"
          value={values.descuento}
          onChange={(event) => onChange('descuento', event.target.value)}
        />
        <Input
          label="Impuesto (Bs)"
          type="number"
          min={0}
          step="0.01"
          value={values.impuesto}
          onChange={(event) => onChange('impuesto', event.target.value)}
        />
      </div>

      <dl className="flex flex-col items-end gap-1 text-sm">
        <div className="flex gap-6">
          <dt className="text-neutral-500 dark:text-neutral-400">Subtotal</dt>
          <dd className="w-28 text-right font-medium text-neutral-900 dark:text-white">Bs {subtotal.toFixed(2)}</dd>
        </div>
        <div className="flex gap-6">
          <dt className="text-neutral-500 dark:text-neutral-400">Total</dt>
          <dd className="w-28 text-right text-base font-semibold text-neutral-900 dark:text-white">Bs {total.toFixed(2)}</dd>
        </div>
      </dl>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={sucursalNombre === null}>
          Registrar venta
        </Button>
      </div>
    </form>
  )
}
