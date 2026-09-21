import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { Cliente } from '@/modules/operaciones/types'
import type { Almacen, InventarioItem } from '@/modules/inventario/types'
import type { Pasarela, VentaFormValues, VentaItemForm } from '../types'

interface VentaFormProps {
  values: VentaFormValues
  clientes: Cliente[]
  almacenes: Almacen[]
  pasarelas: Pasarela[]
  stock: InventarioItem[]
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
  almacenes,
  pasarelas,
  stock,
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
        <Select
          label="Almacén"
          required
          value={values.idAlmacen === '' ? '' : String(values.idAlmacen)}
          onChange={(event) => onChange('idAlmacen', event.target.value === '' ? '' : Number(event.target.value))}
        >
          <option value="">Selecciona un almacén</option>
          {almacenes.map((almacen) => (
            <option key={almacen.id} value={almacen.id}>
              {almacen.nombre}
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
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Productos</p>
          <Button type="button" variant="secondary" onClick={onAddItem} disabled={values.idAlmacen === ''}>
            Agregar línea
          </Button>
        </div>

        {values.idAlmacen === '' ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Selecciona un almacén para ver el stock disponible.</p>
        ) : (
          <div className="space-y-3">
            {lineas.map(({ item, variante, subtotal: subtotalLinea }, index) => (
              <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <Select
                  label={`Variante ${index + 1}`}
                  value={item.idVarianteProducto === '' ? '' : String(item.idVarianteProducto)}
                  onChange={(event) =>
                    onItemChange(index, 'idVarianteProducto', event.target.value === '' ? '' : Number(event.target.value))
                  }
                >
                  <option value="">Selecciona</option>
                  {stock.map((opcion) => (
                    <option key={opcion.idVarianteProducto} value={opcion.idVarianteProducto}>
                      {opcion.sku} · {opcion.productoNombre} ({opcion.talla}/{opcion.color}) · stock {opcion.stockDisponible}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Cantidad"
                  type="number"
                  min={1}
                  max={variante?.stockDisponible ?? undefined}
                  className="w-24"
                  value={item.cantidad}
                  onChange={(event) => onItemChange(index, 'cantidad', event.target.value)}
                />
                <div className="pb-2.5 text-sm text-neutral-600 dark:text-neutral-400">Bs {subtotalLinea.toFixed(2)}</div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onRemoveItem(index)}
                  disabled={values.items.length === 1}
                >
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
        <Button type="submit" loading={loading}>
          Registrar venta
        </Button>
      </div>
    </form>
  )
}
