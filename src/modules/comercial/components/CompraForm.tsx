import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { Almacen, Producto, Proveedor } from '@/modules/inventario/types'
import type { Sucursal } from '@/modules/operaciones/types'
import type { CompraFormValues, CompraProductoFormValues, CompraVarianteFormValues } from '../types'

interface CompraFormProps {
  values: CompraFormValues
  proveedores: Proveedor[]
  sucursales: Sucursal[]
  /** Almacenes de la sucursal elegida. */
  almacenes: Almacen[]
  /** Productos activos en la sucursal elegida. */
  productos: Producto[]
  loading: boolean
  error: string | null
  onChange: <K extends keyof CompraFormValues>(field: K, value: CompraFormValues[K]) => void
  onChangeProducto: (indice: number, cambios: Partial<CompraProductoFormValues>) => void
  /** Marca o desmarca varias variantes de un producto a la vez. */
  onToggleVariantes: (indice: number, idsVariante: number[], marcadas: boolean) => void
  onChangeVariante: (indice: number, idVariante: number, cambios: Partial<CompraVarianteFormValues>) => void
  onAddProducto: () => void
  onRemoveProducto: (indice: number) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

function subtotalVariante(variante: CompraVarianteFormValues): number {
  return (Number(variante.cantidad) || 0) * (Number(variante.precioUnitario) || 0)
}

function subtotalProducto(producto: CompraProductoFormValues): number {
  return producto.variantes.reduce((suma, variante) => suma + subtotalVariante(variante), 0)
}

function calcularTotalCompra(productos: CompraProductoFormValues[]): number {
  return productos.reduce((suma, producto) => suma + subtotalProducto(producto), 0)
}

export function CompraForm({
  values,
  proveedores,
  sucursales,
  almacenes,
  productos,
  loading,
  error,
  onChange,
  onChangeProducto,
  onToggleVariantes,
  onChangeVariante,
  onAddProducto,
  onRemoveProducto,
  onSubmit,
  onCancel,
}: CompraFormProps) {
  const sucursalElegida = values.idSucursal !== ''

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Proveedor"
          required
          value={values.idProveedor === '' ? '' : String(values.idProveedor)}
          onChange={(event) => onChange('idProveedor', event.target.value ? Number(event.target.value) : '')}
        >
          <option value="">Selecciona un proveedor…</option>
          {proveedores.map((proveedor) => (
            <option key={proveedor.id} value={String(proveedor.id)}>
              {proveedor.empresa}
            </option>
          ))}
        </Select>

        <Select
          label="Sucursal"
          required
          value={values.idSucursal === '' ? '' : String(values.idSucursal)}
          onChange={(event) => onChange('idSucursal', event.target.value ? Number(event.target.value) : '')}
        >
          <option value="">Selecciona una sucursal…</option>
          {sucursales.map((sucursal) => (
            <option key={sucursal.id} value={String(sucursal.id)}>
              {sucursal.nombre}
            </option>
          ))}
        </Select>

        <Input
          label="Nº de factura"
          maxLength={50}
          value={values.nroFactura}
          onChange={(event) => onChange('nroFactura', event.target.value)}
        />
        <Input
          label="Entrega programada"
          type="date"
          value={values.fechaEntregaProgramada}
          onChange={(event) => onChange('fechaEntregaProgramada', event.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
          checked={values.pagarEnCaja}
          onChange={(event) => onChange('pagarEnCaja', event.target.checked)}
        />
        Pagar en efectivo desde la caja abierta de la sucursal (registra un egreso)
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Productos comprados</h3>
          <Button type="button" variant="secondary" onClick={onAddProducto} disabled={!sucursalElegida}>
            Agregar producto
          </Button>
        </div>

        {!sucursalElegida && (
          <p className="rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            Elige primero la sucursal: los almacenes y productos disponibles dependen de ella.
          </p>
        )}

        {values.productos.map((bloque, indice) => {
          const producto = productos.find((candidato) => candidato.id === bloque.idProducto)
          const variantesActivas = (producto?.variantes ?? []).filter((variante) => variante.activo)
          const todasMarcadas =
            variantesActivas.length > 0 &&
            variantesActivas.every((variante) => bloque.variantes.some((marcada) => marcada.idVarianteProducto === variante.id))

          return (
            <div key={indice} className="space-y-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Producto"
                  id={`compra-producto-${indice}`}
                  required
                  value={bloque.idProducto === '' ? '' : String(bloque.idProducto)}
                  // Cambiar de producto descarta las variantes marcadas: pertenecian al anterior.
                  onChange={(event) =>
                    onChangeProducto(indice, { idProducto: event.target.value ? Number(event.target.value) : '', variantes: [] })
                  }
                >
                  <option value="">Selecciona un producto…</option>
                  {productos.map((candidato) => (
                    <option key={candidato.id} value={String(candidato.id)}>
                      {candidato.nombre}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Almacén de destino"
                  id={`compra-almacen-${indice}`}
                  required
                  value={bloque.idAlmacen === '' ? '' : String(bloque.idAlmacen)}
                  onChange={(event) => onChangeProducto(indice, { idAlmacen: event.target.value ? Number(event.target.value) : '' })}
                >
                  <option value="">Selecciona un almacén…</option>
                  {almacenes.map((almacen) => (
                    <option key={almacen.id} value={String(almacen.id)}>
                      {almacen.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              {producto && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Variantes (puedes marcar varias)</p>
                    {variantesActivas.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleVariantes(
                            indice,
                            variantesActivas.map((variante) => variante.id),
                            !todasMarcadas,
                          )
                        }
                        className="text-xs font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                      >
                        {todasMarcadas ? 'Quitar todas' : 'Marcar todas'}
                      </button>
                    )}
                  </div>

                  {variantesActivas.length === 0 && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Este producto no tiene variantes activas.</p>
                  )}

                  {variantesActivas.map((variante) => {
                    const marcada = bloque.variantes.find((candidata) => candidata.idVarianteProducto === variante.id)
                    const base = `compra-${indice}-variante-${variante.id}`
                    return (
                      <div
                        key={variante.id}
                        className={`rounded-md border p-2.5 ${marcada ? 'border-neutral-900 dark:border-white' : 'border-neutral-200 dark:border-neutral-800'}`}
                      >
                        <label className="flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
                            checked={!!marcada}
                            onChange={(event) => onToggleVariantes(indice, [variante.id], event.target.checked)}
                          />
                          <span className="font-medium">
                            {variante.talla} / {variante.color}
                          </span>
                          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{variante.sku}</span>
                        </label>

                        {marcada && (
                          <div className="mt-2 grid gap-3 sm:grid-cols-3">
                            <Input
                              label="Cantidad"
                              id={`${base}-cantidad`}
                              type="number"
                              min={1}
                              step={1}
                              required
                              value={marcada.cantidad}
                              onChange={(event) => onChangeVariante(indice, variante.id, { cantidad: event.target.value })}
                            />
                            <Input
                              label="Precio unit. (Bs)"
                              id={`${base}-precio`}
                              type="number"
                              min={0}
                              step="0.01"
                              required
                              value={marcada.precioUnitario}
                              onChange={(event) => onChangeVariante(indice, variante.id, { precioUnitario: event.target.value })}
                            />
                            <Input
                              label="Nº de lote"
                              id={`${base}-lote`}
                              maxLength={50}
                              value={marcada.nroLote}
                              onChange={(event) => onChangeVariante(indice, variante.id, { nroLote: event.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {bloque.variantes.length} {bloque.variantes.length === 1 ? 'variante' : 'variantes'} · Subtotal: Bs{' '}
                  {subtotalProducto(bloque).toFixed(2)}
                </span>
                {values.productos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveProducto(indice)}
                    className="font-medium text-red-700 underline hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Quitar producto
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-right text-base font-semibold text-neutral-900 dark:text-white">
        Total: Bs {calcularTotalCompra(values.productos).toFixed(2)}
      </p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Registrar compra
        </Button>
      </div>
    </form>
  )
}
