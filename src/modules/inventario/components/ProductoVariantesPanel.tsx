import { isAxiosError } from 'axios'
import { useState } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { agregarVariante, actualizarVariante, eliminarVariante } from '@/modules/inventario/services/productos.service'
import type { Producto, VarianteProducto, VarianteProductoFormValues } from '../types'

interface ProductoVariantesPanelProps {
  producto: Producto
  onActualizado: (producto: Producto) => void
}

const EMPTY: VarianteProductoFormValues = {
  sku: '',
  talla: '',
  color: '',
  corte: '',
  modelo3dUrl: '',
  activo: true,
}

function toFormValues(variante: VarianteProducto): VarianteProductoFormValues {
  return {
    sku: variante.sku,
    talla: variante.talla,
    color: variante.color,
    corte: variante.corte,
    modelo3dUrl: variante.modelo3dUrl ?? '',
    activo: variante.activo,
  }
}

export function ProductoVariantesPanel({ producto, onActualizado }: ProductoVariantesPanelProps) {
  const [nueva, setNueva] = useState<VarianteProductoFormValues>({ ...EMPTY })
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCrear = async () => {
    setError(null)
    setCreando(true)
    try {
      const actualizado = await agregarVariante(producto.id, nueva)
      onActualizado(actualizado)
      setNueva({ ...EMPTY })
    } catch {
      setError('No se pudo agregar la variante. Verifica que el SKU no esté repetido.')
    } finally {
      setCreando(false)
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-neutral-900 dark:text-white">Variantes</legend>

      <div className="space-y-3">
        {producto.variantes.map((variante) => (
          <VarianteRow
            key={variante.id}
            idProducto={producto.id}
            variante={variante}
            onActualizado={onActualizado}
          />
        ))}
      </div>

      <div className="rounded-md border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
        <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">Agregar nueva variante</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input label="SKU" value={nueva.sku} onChange={(event) => setNueva((c) => ({ ...c, sku: event.target.value }))} />
          <Input label="Talla" value={nueva.talla} onChange={(event) => setNueva((c) => ({ ...c, talla: event.target.value }))} />
          <Input label="Color" value={nueva.color} onChange={(event) => setNueva((c) => ({ ...c, color: event.target.value }))} />
          <Input label="Corte" value={nueva.corte} onChange={(event) => setNueva((c) => ({ ...c, corte: event.target.value }))} />
          <Input label="Modelo 3D URL" value={nueva.modelo3dUrl} onChange={(event) => setNueva((c) => ({ ...c, modelo3dUrl: event.target.value }))} />
        </div>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-2 flex justify-end">
          <Button type="button" variant="secondary" loading={creando} onClick={handleCrear}>
            Agregar variante
          </Button>
        </div>
      </div>
    </fieldset>
  )
}

function VarianteRow({
  idProducto,
  variante,
  onActualizado,
}: {
  idProducto: number
  variante: VarianteProducto
  onActualizado: (producto: Producto) => void
}) {
  const [valores, setValores] = useState<VarianteProductoFormValues>(toFormValues(variante))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGuardar = async () => {
    setError(null)
    setGuardando(true)
    try {
      const actualizado = await actualizarVariante(idProducto, variante.id, valores)
      onActualizado(actualizado)
    } catch {
      setError('No se pudo guardar la variante.')
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleActivo = async () => {
    setError(null)
    setGuardando(true)
    try {
      const actualizado = await actualizarVariante(idProducto, variante.id, { ...valores, activo: !variante.activo })
      onActualizado(actualizado)
    } catch {
      setError('No se pudo cambiar el estado de la variante.')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    if (!window.confirm('¿Eliminar esta variante? Esta acción no se puede deshacer.')) return
    setError(null)
    setGuardando(true)
    try {
      const actualizado = await eliminarVariante(idProducto, variante.id)
      onActualizado(actualizado)
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="mb-2 flex items-center gap-3">
        <Badge tone={variante.activo ? 'success' : 'neutral'}>{variante.activo ? 'Activa' : 'Inactiva'}</Badge>
        <span className="ml-auto flex items-center gap-3">
          <button type="button" onClick={handleToggleActivo} disabled={guardando} className="text-xs font-medium text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
            {variante.activo ? 'Desactivar' : 'Reactivar'}
          </button>
          <button type="button" onClick={handleEliminar} disabled={guardando} className="text-xs font-medium text-red-600 underline hover:text-red-800 dark:text-red-400">
            Eliminar
          </button>
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input label="SKU" value={valores.sku} onChange={(event) => setValores((c) => ({ ...c, sku: event.target.value }))} />
        <Input label="Talla" value={valores.talla} onChange={(event) => setValores((c) => ({ ...c, talla: event.target.value }))} />
        <Input label="Color" value={valores.color} onChange={(event) => setValores((c) => ({ ...c, color: event.target.value }))} />
        <Input label="Corte" value={valores.corte} onChange={(event) => setValores((c) => ({ ...c, corte: event.target.value }))} />
        <Input label="Modelo 3D URL" value={valores.modelo3dUrl} onChange={(event) => setValores((c) => ({ ...c, modelo3dUrl: event.target.value }))} />
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-2 flex justify-end">
        <Button type="button" variant="secondary" loading={guardando} onClick={handleGuardar}>
          Guardar
        </Button>
      </div>
    </div>
  )
}

function extraerMensajeError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message[0] ?? 'La solicitud no es válida.'
    if (typeof message === 'string') return message
  }
  return 'No se pudo eliminar la variante.'
}
