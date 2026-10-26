import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { ReportPreviewTable } from '../../components/reportes/ReportPreviewTable'
import type { FormatoExportacion, ReportePredefinido, ReportePredefinidoEjecutado } from '../../reportes.types'

interface ReportesPredefinidosPageViewProps {
  puedeGestionar: boolean
  predefinidos: ReportePredefinido[]
  cargandoCatalogo: boolean
  /** Código del predefinido que está corriendo ahora mismo, o null si ninguno. */
  ejecutando: string | null
  activo: ReportePredefinidoEjecutado | null
  error: string | null
  exportando: FormatoExportacion | null
  onEjecutar: (codigo: string) => void
  onExportar: (formato: FormatoExportacion) => void
  onLimpiarError: () => void
}

const FORMATOS: { formato: FormatoExportacion; etiqueta: string }[] = [
  { formato: 'pdf', etiqueta: 'PDF' },
  { formato: 'excel', etiqueta: 'Excel' },
  { formato: 'html', etiqueta: 'HTML' },
]

/** Agrupa el catálogo por categoría, conservando el orden en que llega del backend. */
function agruparPorCategoria(predefinidos: ReportePredefinido[]): Array<{ categoria: string; items: ReportePredefinido[] }> {
  const grupos: Array<{ categoria: string; items: ReportePredefinido[] }> = []
  for (const predefinido of predefinidos) {
    const grupo = grupos.find((g) => g.categoria === predefinido.categoria)
    if (grupo) grupo.items.push(predefinido)
    else grupos.push({ categoria: predefinido.categoria, items: [predefinido] })
  }
  return grupos
}

export function ReportesPredefinidosPageView({
  puedeGestionar,
  predefinidos,
  cargandoCatalogo,
  ejecutando,
  activo,
  error,
  exportando,
  onEjecutar,
  onExportar,
  onLimpiarError,
}: ReportesPredefinidosPageViewProps) {
  const puedeExportar = !!activo && !exportando

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Reportes predefinidos</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Consultas ya armadas para las preguntas más comunes del negocio. Ejecútalas con un clic, sin configurar nada.
        </p>
      </div>

      {!puedeGestionar ? (
        <EmptyState
          icon={<span className="text-4xl">📊</span>}
          title="No tienes acceso a los reportes"
          description="Contacta a un administrador si crees que deberías poder consultarlos."
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

          {cargandoCatalogo ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((indice) => (
                <Skeleton key={indice} className="h-32 w-full" />
              ))}
            </div>
          ) : predefinidos.length === 0 ? (
            <EmptyState
              icon={<span className="text-4xl">🗂️</span>}
              title="Todavía no hay reportes predefinidos"
              description="Esta funcionalidad está pendiente de configuración."
            />
          ) : (
            agruparPorCategoria(predefinidos).map((grupo) => (
              <section key={grupo.categoria} className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{grupo.categoria}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grupo.items.map((predefinido) => (
                    <div
                      key={predefinido.codigo}
                      className={`rounded-lg border p-4 ${
                        activo?.codigo === predefinido.codigo
                          ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900'
                          : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950'
                      }`}
                    >
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{predefinido.nombre}</h3>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{predefinido.descripcion}</p>
                      <Button
                        variant="secondary"
                        loading={ejecutando === predefinido.codigo}
                        disabled={ejecutando !== null && ejecutando !== predefinido.codigo}
                        onClick={() => onEjecutar(predefinido.codigo)}
                        className="mt-3 w-full"
                      >
                        Ejecutar
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}

          <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Resultado</h2>
                {activo && <p className="text-xs text-neutral-500 dark:text-neutral-400">{activo.nombre}</p>}
              </div>
              {activo && (
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

            {activo && activo.result.rows.length > 0 ? (
              <ReportPreviewTable resultado={activo.result} pagina={1} porPagina={activo.request.limit ?? 50} onCambiarPagina={() => {}} />
            ) : activo ? (
              <EmptyState
                icon={<span className="text-4xl">🔍</span>}
                title="Sin registros"
                description="Este reporte no encontró datos para el período configurado."
              />
            ) : (
              <EmptyState
                icon={<span className="text-4xl">📊</span>}
                title="Elige un reporte de arriba"
                description="El resultado de la última ejecución aparece aquí."
              />
            )}
          </section>
        </>
      )}
    </div>
  )
}
