import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { ImageUploadField } from '@/shared/components/ui/ImageUploadField'
import type { CategoriaPlana, ImagenProductoFormValues, ProductoFormValues, VarianteProductoFormValues } from '../types'

interface SucursalOpcion {
  id: number
  nombre: string
}

interface ProductoFormProps {
  values: ProductoFormValues
  categoriasPlanas: CategoriaPlana[]
  sucursales: SucursalOpcion[]
  editing: boolean
  loading: boolean
  error: string | null
  onChange: <K extends keyof ProductoFormValues>(field: K, value: ProductoFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

const EMPTY_VARIANTE: VarianteProductoFormValues = {
  sku: '',
  talla: '',
  color: '',
  corte: '',
  modelo3dUrl: '',
  activo: true,
}

const EMPTY_IMAGEN: ImagenProductoFormValues = { url: '', esPrincipal: false, orden: '' }

export function ProductoForm({
  values,
  categoriasPlanas,
  sucursales,
  editing,
  loading,
  error,
  onChange,
  onSubmit,
  onCancel,
}: ProductoFormProps) {
  const updateVariante = <K extends keyof VarianteProductoFormValues>(index: number, field: K, value: VarianteProductoFormValues[K]) => {
    const siguiente = values.variantes.map((variante, i) => (i === index ? { ...variante, [field]: value } : variante))
    onChange('variantes', siguiente)
  }

  const updateImagen = <K extends keyof ImagenProductoFormValues>(index: number, field: K, value: ImagenProductoFormValues[K]) => {
    const siguiente = values.imagenes.map((imagen, i) => (i === index ? { ...imagen, [field]: value } : imagen))
    onChange('imagenes', siguiente)
  }

  const toggleSucursal = (id: number) => {
    const seleccionada = values.sucursalIds.includes(id)
    onChange('sucursalIds', seleccionada ? values.sucursalIds.filter((sid) => sid !== id) : [...values.sucursalIds, id])
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          required
          maxLength={150}
          value={values.nombre}
          onChange={(event) => onChange('nombre', event.target.value)}
        />
        <Input
          label="Precio (Bs)"
          type="number"
          step="0.01"
          min="0"
          required
          value={values.precio}
          onChange={(event) => onChange('precio', event.target.value)}
        />
        <Input
          label="Descuento (%, 0 = sin descuento)"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={values.descuentoPorcentaje}
          onChange={(event) => onChange('descuentoPorcentaje', event.target.value)}
        />
        <Select
          label="Categoría"
          required
          value={values.idCategoria}
          onChange={(event) => onChange('idCategoria', event.target.value ? Number(event.target.value) : '')}
        >
          <option value="">Seleccionar</option>
          {categoriasPlanas.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {'—'.repeat(categoria.nivel)} {categoria.nombre}
            </option>
          ))}
        </Select>
        {editing && (
          <Select label="Estado" value={values.activo ? 'true' : 'false'} onChange={(event) => onChange('activo', event.target.value === 'true')}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="producto-descripcion" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Descripción
        </label>
        <textarea
          id="producto-descripcion"
          rows={3}
          value={values.descripcion}
          onChange={(event) => onChange('descripcion', event.target.value)}
          className="resize-y rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
        />
      </div>

      {!editing && (
        <>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-neutral-900 dark:text-white">
              Sucursales activas <span className="font-normal text-neutral-500">— opcional, se puede definir después</span>
            </legend>
            {sucursales.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay sucursales registradas.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {sucursales.map((sucursal) => (
                  <label key={sucursal.id} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                    <input type="checkbox" checked={values.sucursalIds.includes(sucursal.id)} onChange={() => toggleSucursal(sucursal.id)} />
                    <span className="dark:text-neutral-200">{sucursal.nombre}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-semibold text-neutral-900 dark:text-white">
                Variantes (talla, color, corte) <span className="font-normal text-neutral-500">— al menos una</span>
              </legend>
              <button
                type="button"
                onClick={() => onChange('variantes', [...values.variantes, { ...EMPTY_VARIANTE }])}
                className="text-xs font-medium text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                + Agregar variante
              </button>
            </div>
            <div className="space-y-3">
              {values.variantes.map((variante, index) => (
                <div key={index} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input label="SKU" required value={variante.sku} onChange={(event) => updateVariante(index, 'sku', event.target.value)} />
                    <Input label="Talla" required value={variante.talla} onChange={(event) => updateVariante(index, 'talla', event.target.value)} />
                    <Input label="Color" required value={variante.color} onChange={(event) => updateVariante(index, 'color', event.target.value)} />
                    <Input label="Corte" required value={variante.corte} onChange={(event) => updateVariante(index, 'corte', event.target.value)} />
                    <Input label="Modelo 3D URL (opcional)" value={variante.modelo3dUrl} onChange={(event) => updateVariante(index, 'modelo3dUrl', event.target.value)} />
                  </div>
                  {values.variantes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onChange('variantes', values.variantes.filter((_, i) => i !== index))}
                      className="mt-2 text-xs font-medium text-red-600 underline hover:text-red-800 dark:text-red-400"
                    >
                      Quitar variante
                    </button>
                  )}
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-semibold text-neutral-900 dark:text-white">Galería de imágenes (opcional)</legend>
              <button
                type="button"
                onClick={() => onChange('imagenes', [...values.imagenes, { ...EMPTY_IMAGEN }])}
                className="text-xs font-medium text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                + Agregar imagen
              </button>
            </div>
            <div className="space-y-3">
              {values.imagenes.map((imagen, index) => (
                <div key={index} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <ImageUploadField label={`Imagen ${index + 1}`} value={imagen.url} onChange={(url) => updateImagen(index, 'url', url)} disabled={loading} />
                    </div>
                    <Input
                      label="Orden"
                      type="number"
                      min="1"
                      value={imagen.orden}
                      onChange={(event) => updateImagen(index, 'orden', event.target.value ? Number(event.target.value) : '')}
                    />
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <input type="checkbox" checked={imagen.esPrincipal} onChange={(event) => updateImagen(index, 'esPrincipal', event.target.checked)} />
                    Imagen principal
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange('imagenes', values.imagenes.filter((_, i) => i !== index))}
                    className="mt-2 text-xs font-medium text-red-600 underline hover:text-red-800 dark:text-red-400"
                  >
                    Quitar imagen
                  </button>
                </div>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {editing && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Sucursales activas</legend>
          {sucursales.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay sucursales registradas.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {sucursales.map((sucursal) => (
                <label key={sucursal.id} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                  <input
                    type="checkbox"
                    checked={values.sucursalIds.includes(sucursal.id)}
                    onChange={() => {
                      const seleccionada = values.sucursalIds.includes(sucursal.id)
                      onChange('sucursalIds', seleccionada ? values.sucursalIds.filter((id) => id !== sucursal.id) : [...values.sucursalIds, sucursal.id])
                    }}
                  />
                  <span className="dark:text-neutral-200">{sucursal.nombre}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {editing ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  )
}
