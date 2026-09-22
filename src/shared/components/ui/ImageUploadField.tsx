import { useRef, useState } from 'react'
import { Button } from './Button'

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  /** Oculta el boton "Eliminar" (para paneles con su propia accion de borrado). */
  sinBotonEliminar?: boolean
}

export function ImageUploadField({ label, value, onChange, disabled = false, sinBotonEliminar = false }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const seleccionarArchivo = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5 MB.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const { subirImagen } = await import('@/modules/inventario/services/imagenes.service')
      onChange(await subirImagen(file))
    } catch {
      setError('No se pudo cargar la imagen.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => void seleccionarArchivo(event.target.files?.[0])}
        disabled={disabled || loading}
      />
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <div className="h-20 w-20 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
            <img src={value} alt="Vista previa" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-neutral-300 text-center text-xs text-neutral-500 dark:border-neutral-700">
            Sin imagen
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" loading={loading} disabled={disabled} onClick={() => inputRef.current?.click()}>
            {value ? 'Cambiar imagen' : 'Cargar imagen'}
          </Button>
          {value && !sinBotonEliminar && (
            <Button type="button" variant="secondary" disabled={disabled || loading} onClick={() => onChange('')}>
              Eliminar
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}