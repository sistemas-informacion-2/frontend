import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { ReportFiltersBuilder } from '../../components/reportes/ReportFiltersBuilder'
import { ReportPreviewTable } from '../../components/reportes/ReportPreviewTable'
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
  onNuevoReporte: () => void
  onCargarPlantilla: (id: number) => void
  onEliminarPlantilla: (id: number) => void
  onLimpiarError: () => void
}

const FORMATOS: { formato: FormatoExportacion; etiqueta: string }[] = [
  { formato: 'pdf', etiqueta: 'Exportar PDF' },
  { formato: 'excel', etiqueta: 'Exportar Excel' },
  { formato: 'html', etiqueta: 'Exportar HTML' },
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
  onNuevoReporte,
  onCargarPlantilla,
  onEliminarPlantilla,
}: ReportesConstructorPageViewProps) {
  const [nombrePlantilla, setNombrePlantilla] = useState('')
  const puedeExportar = request.selectedFields.length > 0 && !ejecutando && !exportando

  const pagina = Math.floor((request.offset ?? 0) / (request.limit ?? 50)) + 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Constructor de reportes QBE</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {nombre} · {subtitulo} · Arma reportes a medida eligiendo la entidad, los campos, los filtros y los totales, sin escribir SQL.
        </p>
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

          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <Select
              label="Plantilla guardada"
              value={plantillaActivaId !== null ? String(plantillaActivaId) : ''}
              onChange={(event) => {
                if (event.target.value !== '') onCargarPlantilla(Number(event.target.value))
              }}
              className="min-w-64 flex-1"
            >
              <option value="">— Reporte nuevo —</option>
              {plantillas.map((plantilla) => (
                <option key={plantilla.id} value={plantilla.id}>
                  {plantilla.nombre}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={onNuevoReporte}>
              Nuevo reporte
            </Button>
            {plantillaActivaId !== null && (
              <Button variant="secondary" onClick={() => onEliminarPlantilla(plantillaActivaId)}>
                Eliminar plantilla
              </Button>
            )}
          </div>

          <ReportFiltersBuilder
            catalogo={catalogo}
            tipoActivo={tipoActivo}
            request={request}
            ejecutando={ejecutando}
            mostrarBoton={false}
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

          {tipoActivo && (
            <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  3
                </span>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Resultado</h2>
                {resultado && <span className="text-sm text-neutral-500 dark:text-neutral-400">{resultado.total} registros</span>}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={onAplicar} loading={ejecutando} disabled={request.selectedFields.length === 0}>
                  Ejecutar vista previa
                </Button>
                {FORMATOS.map(({ formato, etiqueta }) => (
                  <Button key={formato} variant="secondary" disabled={!puedeExportar} loading={exportando === formato} onClick={() => onExportar(formato)}>
                    {etiqueta}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <Input
                  label="Nombre de la plantilla"
                  value={nombrePlantilla}
                  onChange={(event) => setNombrePlantilla(event.target.value)}
                  placeholder="Ej.: Ventas por sucursal del mes"
                  className="min-w-64 flex-1"
                />
                <Button
                  variant="secondary"
                  loading={guardandoPlantilla}
                  disabled={nombrePlantilla.trim().length === 0}
                  onClick={() => {
                    onGuardarPlantilla(nombrePlantilla.trim())
                    setNombrePlantilla('')
                  }}
                >
                  Guardar plantilla
                </Button>
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
                <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Ejecuta la vista previa para ver el resultado del reporte.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
