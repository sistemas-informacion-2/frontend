import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Select } from '@/shared/components/ui/Select'
import { ReportFiltersBuilder } from '../../components/reportes/ReportFiltersBuilder'
import { ReportPreviewTable } from '../../components/reportes/ReportPreviewTable'
import { SaveTemplateModal } from '../../components/reportes/SaveTemplateModal'
import type {
  FiltroReporte,
  FormatoExportacion,
  OrdenReporte,
  PlantillaReporte,
  ReporteDefinicion,
  ReportRunRequest,
  ResultadoReporte,
} from '../../reportes.types'

interface ReportesConstructorPageViewProps {
  nombre: string
  subtitulo: string
  puedeGestionar: boolean
  catalogo?: ReporteDefinicion[]
  tipoActivo?: ReporteDefinicion
  request: ReportRunRequest
  resultado: ResultadoReporte | null
  ejecutando: boolean
  error: string | null
  plantillas: PlantillaReporte[]
  plantillaActivaId: number | null
  exportando: FormatoExportacion | null
  guardandoPlantilla: boolean
  onCombinar: (parche: Partial<ReportRunRequest>) => void
  onAplicar: () => void
  onCambiarTipo: (tipo: string) => void
  onCambiarPagina: (pagina: number) => void
  onFiltroPatch: (indice: number, parche: Partial<FiltroReporte>) => void
  onFiltroAgregar: (filtro: FiltroReporte) => void
  onFiltroBorrar: (indice: number) => void
  onOrdenChange: (orden?: OrdenReporte) => void
  onFechasChange: (desde?: string, hasta?: string) => void
  onLimiteChange: (limite: number) => void
  onExportar: (formato: FormatoExportacion) => void
  onGuardarPlantilla: (nombre: string) => void
  onCargarPlantilla: (id: number) => void
  onEliminarPlantilla: (id: number) => void
  onLimpiarError: () => void
}

const FORMATOS: { formato: FormatoExportacion; etiqueta: string }[] = [
  { formato: 'pdf', etiqueta: 'PDF' },
  { formato: 'excel', etiqueta: 'Excel' },
  { formato: 'html', etiqueta: 'HTML' },
]

export function ReportesConstructorPageView({
  nombre,
  subtitulo,
  puedeGestionar,
  catalogo,
  tipoActivo,
  request,
  resultado,
  ejecutando,
  error,
  plantillas,
  plantillaActivaId,
  exportando,
  guardandoPlantilla,
  onCombinar,
  onAplicar,
  onCambiarTipo,
  onCambiarPagina,
  onFiltroPatch,
  onFiltroAgregar,
  onFiltroBorrar,
  onOrdenChange,
  onFechasChange,
  onLimiteChange,
  onLimpiarError,
  onExportar,
  onGuardarPlantilla,
  onCargarPlantilla,
  onEliminarPlantilla,
}: ReportesConstructorPageViewProps) {
  const [guardarAbierto, setGuardarAbierto] = useState(false)
  const puedeExportar = request.selectedFields.length > 0 && !ejecutando && !exportando

  const pagina = Math.floor((request.offset ?? 0) / (request.limit ?? 50)) + 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Constructor de reportes</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {nombre} · {subtitulo}
          </p>
        </div>
        {puedeGestionar && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Exportar:</span>
            {FORMATOS.map(({ formato, etiqueta }) => (
              <Button
                key={formato}
                variant="secondary"
                disabled={!puedeExportar}
                loading={exportando === formato}
                onClick={() => onExportar(formato)}
              >
                {etiqueta}
              </Button>
            ))}
          </div>
        )}
      </div>

      {!puedeGestionar ? (
        <EmptyState
          icon={<span className="text-4xl">📊</span>}
          title="No tienes acceso a la gestión de reportes"
          description="Contacta a un administrador si crees que deberías poder generar reportes."
        />
      ) : (
        <>
          {error && (
            <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <span>{error}</span>
              <button type="button" onClick={onLimpiarError} aria-label="Cerrar aviso" className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-4">
              <PanelPlantillas
                plantillas={plantillas}
                plantillaActivaId={plantillaActivaId}
                onCargar={onCargarPlantilla}
                onGuardarNueva={() => setGuardarAbierto(true)}
                onEliminar={() => {
                  if (plantillaActivaId !== null) onEliminarPlantilla(plantillaActivaId)
                }}
              />
            </div>

            <div className="space-y-6 lg:col-span-8">
              <ReportFiltersBuilder
                catalogo={catalogo}
                tipoActivo={tipoActivo}
                request={request}
                ejecutando={ejecutando}
                onCambiarTipo={onCambiarTipo}
                onCombinar={onCombinar}
                onFiltroAgregar={onFiltroAgregar}
                onFiltroPatch={onFiltroPatch}
                onFiltroBorrar={onFiltroBorrar}
                onOrdenChange={onOrdenChange}
                onFechasChange={onFechasChange}
                onLimiteChange={onLimiteChange}
                onAplicar={onAplicar}
              />

              <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Resultado</h2>
                  {resultado && (
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{resultado.total} registros</span>
                  )}
                </div>
                {resultado && resultado.rows.length > 0 ? (
                  <ReportPreviewTable resultado={resultado} pagina={pagina} porPagina={request.limit ?? 50} onCambiarPagina={onCambiarPagina} />
                ) : resultado ? (
                  <EmptyState
                    icon={<span className="text-4xl">🔍</span>}
                    title="Sin registros"
                    description="Ninguna fila coincide con los criterios actuales; prueba ampliar el rango de fechas o quitar filtros."
                  />
                ) : (
                  <EmptyState
                    icon={<span className="text-4xl">📊</span>}
                    title="Aún no hay resultados"
                    description="Elegí columnas y filtros y pulsá «Generar reporte»."
                  />
                )}
              </section>
            </div>
          </div>

          <SaveTemplateModal
            key={String(guardarAbierto)}
            open={guardarAbierto}
            esActualizacion={plantillaActivaId !== null}
            guardando={guardandoPlantilla}
            onClose={() => setGuardarAbierto(false)}
            onGuardar={(nombrePlantilla) => {
              setGuardarAbierto(false)
              onGuardarPlantilla(nombrePlantilla)
            }}
          />
        </>
      )}
    </div>
  )
}

function PanelPlantillas({
  plantillas,
  plantillaActivaId,
  onCargar,
  onGuardarNueva,
  onEliminar,
}: {
  plantillas: PlantillaReporte[]
  plantillaActivaId: number | null
  onCargar: (id: number) => void
  onGuardarNueva: () => void
  onEliminar: () => void
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Plantillas</h2>
      <div className="mt-3 space-y-3">
        <Select
          label="Plantilla guardada"
          value={plantillaActivaId !== null ? String(plantillaActivaId) : ''}
          onChange={(event) => {
            if (event.target.value !== '') onCargar(Number(event.target.value))
          }}
        >
          <option value="">— Elegir plantilla —</option>
          {plantillas.map((plantilla) => (
            <option key={plantilla.id} value={plantilla.id}>
              {plantilla.nombre}
            </option>
          ))}
        </Select>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onGuardarNueva}>
            Guardar configuración actual
          </Button>
          <Button
            variant="secondary"
            disabled={plantillaActivaId === null}
            onClick={() => {
              if (plantillaActivaId !== null) onEliminar()
            }}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </section>
  )
}
