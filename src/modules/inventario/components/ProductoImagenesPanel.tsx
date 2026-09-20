import { useState } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { ImageUploadField } from '@/shared/components/ui/ImageUploadField'
import { agregarImagen, actualizarImagen, eliminarImagen } from '@/modules/inventario/services/productos.service'
import type { ImagenProducto, ImagenProductoFormValues, Producto } from '../types'

interface ProductoImagenesPanelProps {
  producto: Producto
  onActualizado: (producto: Producto) => void
}

const EMPTY: ImagenProductoFormValues = { url: '', esPrincipal: false, orden: '' }

export function ProductoImagenesPanel({ producto, onActualizado }: ProductoImagenesPanelProps) {
  const [nueva, setNueva] = useState<ImagenProductoFormValues>({ ...EMPTY })
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imagenesOrdenadas = [...producto.imagenes].sort((a, b) => a.orden - b.orden)

  const handleCrear = async () => {
    if (!nueva.url.trim()) {
      setError('Indica la URL de la imagen.')
      return
    }
    setError(null)
    setCreando(true)
    try {
      const actualizado = await agregarImagen(producto.id, nueva)
      onActualizado(actualizado)
      setNueva({ ...EMPTY })
    } catch {
      setError('No se pudo agregar la imagen.')
    } finally {
      setCreando(false)
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-neutral-900 dark:text-white">Galería de imágenes</legend>

      <div className="grid gap-3 sm:grid-cols-2">
        {imagenesOrdenadas.map((imagen) => (
          <ImagenCard key={imagen.id} idProducto={producto.id} imagen={imagen} onActualizado={onActualizado} />
        ))}
      </div>

      <div className="rounded-md border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
        <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">Agregar nueva imagen</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <ImageUploadField label="Archivo de imagen" value={nueva.url} onChange={(url) => setNueva((c) => ({ ...c, url }))} disabled={creando} />
          </div>
          <Input
            label="Orden"
            type="number"
            min="1"
            value={nueva.orden}
            onChange={(event) => setNueva((c) => ({ ...c, orden: event.target.value ? Number(event.target.value) : '' }))}
          />
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input type="checkbox" checked={nueva.esPrincipal} onChange={(event) => setNueva((c) => ({ ...c, esPrincipal: event.target.checked }))} />
          Imagen principal
        </label>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-2 flex justify-end">
          <Button type="button" variant="secondary" loading={creando} onClick={handleCrear}>
            Agregar imagen
          </Button>
        </div>
      </div>
    </fieldset>
  )
}

function ImagenCard({
  idProducto,
  imagen,
  onActualizado,
}: {
  idProducto: number
  imagen: ImagenProducto
  onActualizado: (producto: Producto) => void
}) {
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMarcarPrincipal = async () => {
    setError(null)
    setProcesando(true)
    try {
      const actualizado = await actualizarImagen(idProducto, imagen.id, { esPrincipal: true })
      onActualizado(actualizado)
    } catch {
      setError('No se pudo marcar como principal.')
    } finally {
      setProcesando(false)
    }
  }

  const handleCambiarImagen = async (url: string) => {
    if (!url || url === imagen.url) return
    setError(null)
    setProcesando(true)
    try {
      const actualizado = await actualizarImagen(idProducto, imagen.id, { url })
      onActualizado(actualizado)
    } catch {
      setError('No se pudo cambiar la imagen.')
    } finally {
      setProcesando(false)
    }
  }

  const handleEliminar = async () => {
    if (!window.confirm('¿Eliminar esta imagen?')) return
    setError(null)
    setProcesando(true)
    try {
      const actualizado = await eliminarImagen(idProducto, imagen.id)
      onActualizado(actualizado)
    } catch {
      setError('No se pudo eliminar la imagen.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
      <div className="aspect-video w-full bg-neutral-100 dark:bg-neutral-900">
        <img src={imagen.url} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="space-y-1 p-2">
        <ImageUploadField label="Imagen" value={imagen.url} onChange={(url) => void handleCambiarImagen(url)} disabled={procesando} />
        <div className="flex items-center justify-between">
          {imagen.esPrincipal ? (
            <Badge tone="success">Principal</Badge>
          ) : (
            <button type="button" onClick={handleMarcarPrincipal} disabled={procesando} className="text-xs font-medium text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
              Marcar principal
            </button>
          )}
          <button type="button" onClick={handleEliminar} disabled={procesando} className="text-xs font-medium text-red-600 underline hover:text-red-800 dark:text-red-400">
            Eliminar
          </button>
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  )
}
