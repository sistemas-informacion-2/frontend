import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { Almacen, Producto, StockFormValues } from '../types'

interface StockFormProps {
  values: StockFormValues
  almacenes: Almacen[]
  productos: Producto[]
  loading: boolean
  error: string | null
  onChange: <K extends keyof StockFormValues>(field: K, value: StockFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function StockForm({ values, almacenes, productos, loading, error, onChange, onSubmit, onCancel }: StockFormProps) {
  const productoSeleccionado = productos.find((producto) => producto.id === values.idProducto)
  const variantes = productoSeleccionado?.variantes ?? []

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Almacén"
          required
          value={values.idAlmacen === '' ? '' : String(values.idAlmacen)}
          onChange={(event) => onChange('idAlmacen', event.target.value ? Number(event.target.value) : '')}
        >
          <option value="">Selecciona un almacén…</option>
          {almacenes.map((almacen) => (
            <option key={almacen.id} value={String(almacen.id)}>
              {almacen.nombre} — {almacen.sucursalNombre}
            </option>
          ))}
        </Select>

        <Select
          label="Producto"
          required
          value={values.idProducto === '' ? '' : String(values.idProducto)}
          onChange={(event) => {
            onChange('idProducto', event.target.value ? Number(event.target.value) : '')
            onChange('idVarianteProducto', '')
          }}
        >
          <option value="">Selecciona un producto…</option>
          {productos.map((producto) => (
            <option key={producto.id} value={String(producto.id)}>
              {producto.nombre}
            </option>
          ))}
        </Select>

        <Select
          label="Variante (SKU)"
          required
          disabled={!productoSeleccionado}
          value={values.idVarianteProducto === '' ? '' : String(values.idVarianteProducto)}
          onChange={(event) => onChange('idVarianteProducto', event.target.value ? Number(event.target.value) : '')}
        >
          <option value="">Selecciona una variante…</option>
          {variantes.map((variante) => (
            <option key={variante.id} value={String(variante.id)}>
              {variante.sku} · {variante.talla}/{variante.color}
            </option>
          ))}
        </Select>

        <Input
          label="Stock inicial"
          type="number"
          min={0}
          value={values.stockDisponible}
          onChange={(event) => onChange('stockDisponible', event.target.value)}
        />
        <Input
          label="Stock mínimo"
          type="number"
          min={0}
          value={values.stockMinimo}
          onChange={(event) => onChange('stockMinimo', event.target.value)}
        />
        <Input
          label="Stock máximo"
          type="number"
          min={0}
          value={values.stockMaximo}
          onChange={(event) => onChange('stockMaximo', event.target.value)}
        />
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Registrar stock
        </Button>
      </div>
    </form>
  )
}
