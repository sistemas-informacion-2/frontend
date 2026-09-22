import { type ChangeEvent } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modelo3DView } from '@/shared/components/Modelo3D/Modelo3DView'
import type { ProbadorVarianteAdmin } from '../../api/probador.api'

interface ProbadorAdminPageViewProps {
  variantes: ProbadorVarianteAdmin[]
  loading: boolean
  busqueda: string
  seleccionada: ProbadorVarianteAdmin | null
  seleccionadaId: number | null
  vistaPreviaUrl: string | null
  archivo: File | null
  guardando: boolean
  error: string | null
  onBusqueda: (value: string) => void
  onSeleccionar: (variante: ProbadorVarianteAdmin) => void
  onArchivo: (file: File | null) => void
  onGuardar: () => void
  onQuitar: () => void
}

export function ProbadorAdminPageView({
  variantes,
  loading,
  busqueda,
  seleccionada,
  seleccionadaId,
  vistaPreviaUrl,
  archivo,
  guardando,
  error,
  onBusqueda,
  onSeleccionar,
  onArchivo,
  onGuardar,
  onQuitar,
}: ProbadorAdminPageViewProps) {
  const urlPrevia = vistaPreviaUrl ?? seleccionada?.modelo3dUrl ?? null
  const hayModeloAsignado = Boolean(seleccionada?.modelo3dUrl)

  const onArchivoInput = (event: ChangeEvent<HTMLInputElement>) => {
    onArchivo(event.target.files?.[0] ?? null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Probador Virtual</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Asigna a cada variante su modelo 3D (.glb, exportado desde Blender). El cliente lo verá en el probador al
          visitar la prenda.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <Input
            label="Buscar variante"
            placeholder="Producto, SKU, talla o color"
            value={busqueda}
            onChange={(event) => onBusqueda(event.target.value)}
          />

          <div className="max-h-[28rem] divide-y divide-neutral-100 overflow-y-auto rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {loading ? (
              <p className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">Cargando variantes…</p>
            ) : variantes.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">Sin variantes activas con este filtro.</p>
            ) : (
              variantes.map((variante) => (
                <button
                  key={variante.id}
                  type="button"
                  onClick={() => onSeleccionar(variante)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                    variante.id === seleccionadaId
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : 'bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {variante.producto.nombre}
                    </span>
                    <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {variante.sku} · Talla {variante.talla} · {variante.color} · {variante.corte}
                    </span>
                  </span>
                  <Badge tone={variante.modelo3dUrl ? 'success' : 'neutral'}>
                    {variante.modelo3dUrl ? 'Modelo 3D' : 'Sin modelo'}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          {seleccionada ? (
            <>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{seleccionada.producto.nombre}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {seleccionada.sku} · Talla {seleccionada.talla} · {seleccionada.color} · {seleccionada.corte}
                </p>
              </div>

              <div className="aspect-4/3 w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800">
                {urlPrevia ? (
                  <Modelo3DView url={urlPrevia} className="h-full w-full" ariaLabel="Vista previa del modelo 3D" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-sm text-neutral-500 dark:text-neutral-400">
                    Sin modelo 3D todavía. Carga un archivo .glb para asignarlo.
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Modelo 3D (.glb)</span>
                <input
                  type="file"
                  accept=".glb,model/gltf-binary"
                  onChange={onArchivoInput}
                  className="block w-full text-sm text-neutral-500 file:mr-3 file:rounded-md file:border-none file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 dark:text-neutral-400 dark:file:bg-neutral-800 dark:file:text-neutral-200 dark:hover:file:bg-neutral-700"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {archivo
                    ? `Preparado: ${archivo.name} (${formatUnidades(archivo.size)})`
                    : 'Exporta la prenda desde Blender como glTF binario (.glb) y súbela aquí. Máximo 100 MB.'}
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                {hayModeloAsignado && (
                  <Button variant="secondary" onClick={onQuitar} disabled={guardando} className="mr-auto">
                    Quitar modelo
                  </Button>
                )}
                <Button onClick={onGuardar} disabled={!archivo} loading={guardando}>
                  Guardar modelo
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon="🧥"
              title="Selecciona una variante"
              description="Elige una variante de la lista para ver y asignar su modelo 3D."
            />
          )}
        </section>
      </div>
    </div>
  )
}

function formatUnidades(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}
