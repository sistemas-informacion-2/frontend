import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { ReportPreviewTable } from '../../components/reportes/ReportPreviewTable'
import type { FormatoExportacion, ReportePredefinido, ReportePredefinidoEjecutado } from '../../reportes.types'

interface ReportesPredefinidosPageViewProps {
  puedeGestionar: boolean
  predefinidos: ReportePredefinido[]
  cargandoCatalogo: boolean
  seleccionado: ReportePredefinido | null
  ejecutando: boolean
  activo: ReportePredefinidoEjecutado | null
  error: string | null
  exportando: FormatoExportacion | null
  onSeleccionar: (codigo: string) => void
  onGenerar: () => void
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
  seleccionado,
  ejecutando,
  activo,
  error,
  exportando,
  onSeleccionar,
  onGenerar,
  onExportar,
  onLimpiarError,
}: ReportesPredefinidosPageViewProps) {
  const puedeExportar = !!activo && !exportando
  const resultadoDelSeleccionado = activo && seleccionado && activo.codigo === seleccionado.codigo ? activo : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Reportes predefinidos</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Elige un reporte de la lista y generálo. Son consultas ya armadas por el negocio, sin necesidad de configurar nada.
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
            <div className="grid gap-6 lg:grid-cols-12">
              <Skeleton className="h-64 w-full lg:col-span-3" />
              <Skeleton className="h-64 w-full lg:col-span-9" />
            </div>
          ) : predefinidos.length === 0 ? (
            <EmptyState
              icon={<span className="text-4xl">🗂️</span>}
              title="Todavía no hay reportes predefinidos"
              description="Esta funcionalidad está pendiente de configuración."
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Lista: solo selecciona, no ejecuta nada todavía. */}
              <nav aria-label="Reportes predefinidos" className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 lg:col-span-3 dark:border-neutral-800 dark:bg-neutral-950">
                {agruparPorCategoria(predefinidos).map((grupo) => (
                  <div key={grupo.categoria}>
                    <p className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      {grupo.categoria}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {grupo.items.map((predefinido) => {
                        const activoEnLista = seleccionado?.codigo === predefinido.codigo
                        return (
                          <li key={predefinido.codigo}>
                            <button
                              type="button"
                              onClick={() => onSeleccionar(predefinido.codigo)}
                              aria-current={activoEnLista}
                              className={`w-full rounded-md px-2 py-2 text-left text-sm transition-colors ${
                                activoEnLista
                                  ? 'bg-neutral-900 font-medium text-white dark:bg-white dark:text-neutral-900'
                                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
                              }`}
                            >
                              {predefinido.nombre}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </nav>

              {/* Detalle: nombre + descripción del elegido, "Generar" y el resultado de la última ejecución. */}
              <div className="space-y-6 lg:col-span-9">
                {seleccionado && (
                  <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{seleccionado.nombre}</h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{seleccionado.descripcion}</p>
                    <Button onClick={onGenerar} loading={ejecutando} className="mt-4">
                      Generar
                    </Button>
                  </section>
                )}

                <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Resultado</h2>
                      {resultadoDelSeleccionado && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{resultadoDelSeleccionado.result.total} registros</p>
                      )}
                    </div>
                    {resultadoDelSeleccionado && (
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

                  {resultadoDelSeleccionado && resultadoDelSeleccionado.result.rows.length > 0 ? (
                    <ReportPreviewTable
                      resultado={resultadoDelSeleccionado.result}
                      pagina={1}
                      porPagina={resultadoDelSeleccionado.request.limit ?? 50}
                      onCambiarPagina={() => {}}
                    />
                  ) : resultadoDelSeleccionado ? (
                    <EmptyState
                      icon={<span className="text-4xl">🔍</span>}
                      title="Sin registros"
                      description="Este reporte no encontró datos para el período configurado."
                    />
                  ) : (
                    <EmptyState
                      icon={<span className="text-4xl">📊</span>}
                      title="Todavía no generaste este reporte"
                      description="Pulsá «Generar» arriba para ejecutarlo."
                    />
                  )}
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
