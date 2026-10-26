import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { ReportPreviewTable } from '../../components/reportes/ReportPreviewTable'
import type { FormatoExportacion, ResultadoReporte } from '../../reportes.types'

interface ReportesGenerativoPageViewProps {
  puedeGestionar: boolean
  prompt: string
  generando: boolean
  error: string | null
  interpretacion: string
  /** Qué intérprete respondió la última vez: IA (Gemini) o REGEX (traductor por palabras clave, modo básico sin IA). */
  fuenteInterpretacion: 'IA' | 'REGEX' | null
  resultado: ResultadoReporte | null
  exportando: FormatoExportacion | null
  escuchandoVoz: boolean
  vozSoportada: boolean
  errorVoz: string | null
  onPrompt: (prompt: string) => void
  onIniciarVoz: () => void
  onDetenerVoz: () => void
  onGenerar: () => void
  onExportar: (formato: FormatoExportacion) => void
  onAjustarEnConstructor: () => void
  onLimpiarError: () => void
}

const FORMATOS: { formato: FormatoExportacion; etiqueta: string }[] = [
  { formato: 'pdf', etiqueta: 'PDF' },
  { formato: 'excel', etiqueta: 'Excel' },
  { formato: 'html', etiqueta: 'HTML' },
]

const EJEMPLOS = [
  'las 10 prendas más vendidas en Santa Cruz la última semana',
  'stock crítico de las últimas 2 semanas',
  'compras a proveedores del mes pasado',
]

export function ReportesGenerativoPageView({
  puedeGestionar,
  prompt,
  generando,
  error,
  interpretacion,
  fuenteInterpretacion,
  resultado,
  exportando,
  escuchandoVoz,
  vozSoportada,
  errorVoz,
  onPrompt,
  onIniciarVoz,
  onDetenerVoz,
  onGenerar,
  onExportar,
  onAjustarEnConstructor,
  onLimpiarError,
}: ReportesGenerativoPageViewProps) {
  const puedeExportar = !!resultado && !exportando

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Reportes por voz / generativos</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Describí el reporte en lenguaje natural, dictándolo con el micrófono o escribiéndolo.
        </p>
      </div>

      {!puedeGestionar ? (
        <EmptyState
          icon={<span className="text-4xl">📊</span>}
          title="No tienes acceso a los reportes"
          description="Contacta a un administrador si crees que deberías poder generarlos."
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
              <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Pedido</h2>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Por ejemplo: «{EJEMPLOS[0]}».
                </p>

                <div className="mt-3 flex items-start gap-2">
                  <textarea
                    value={prompt}
                    onChange={(event) => onPrompt(event.target.value)}
                    rows={4}
                    placeholder="Ej: stock crítico en las últimas 2 semanas…"
                    className="flex-1 resize-none rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
                  />
                  {vozSoportada && (
                    <button
                      type="button"
                      onClick={escuchandoVoz ? onDetenerVoz : onIniciarVoz}
                      title={escuchandoVoz ? 'Detener dictado' : 'Dictar por voz'}
                      className={`mt-1 rounded-full border p-3 text-lg transition-colors ${
                        escuchandoVoz
                          ? 'border-red-400 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-950/40 dark:text-red-400'
                          : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {escuchandoVoz ? '⏹' : '🎤'}
                    </button>
                  )}
                </div>

                {!vozSoportada && (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Tu navegador no soporta dictado por voz; escribí el pedido.</p>
                )}
                {errorVoz && (
                  <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    {errorVoz}
                  </p>
                )}

                <Button onClick={onGenerar} loading={generando} disabled={!prompt.trim()} className="mt-3 w-full">
                  Generar con IA
                </Button>

                {interpretacion && (
                  <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Interpretación</p>
                      {fuenteInterpretacion === 'IA' ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          ✨ Gemini
                        </span>
                      ) : fuenteInterpretacion === 'REGEX' ? (
                        <span
                          className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          title="Gemini no está configurado o no respondió; se usó el traductor por palabras clave."
                        >
                          ⚙️ Modo básico
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-neutral-800 dark:text-neutral-200">{interpretacion}</p>
                  </div>
                )}
              </section>

              <div className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                <p className="font-semibold uppercase tracking-wide">Otros ejemplos</p>
                {EJEMPLOS.slice(1).map((ejemplo) => (
                  <p key={ejemplo}>«{ejemplo}»</p>
                ))}
              </div>
            </div>

            <div className="space-y-6 lg:col-span-8">
              <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Resultado</h2>
                    {resultado && (
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">{resultado.total} registros</span>
                    )}
                  </div>
                  {resultado && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="secondary" onClick={onAjustarEnConstructor}>
                        Ajustar en el Constructor
                      </Button>
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

                {resultado && resultado.rows.length > 0 ? (
                  <ReportPreviewTable resultado={resultado} pagina={1} porPagina={resultado.rows.length || 50} onCambiarPagina={() => {}} />
                ) : resultado ? (
                  <EmptyState
                    icon={<span className="text-4xl">🔍</span>}
                    title="Sin registros"
                    description="Ninguna fila coincide con lo que entendimos de tu pedido; probá reformularlo."
                  />
                ) : (
                  <EmptyState
                    icon={<span className="text-4xl">📊</span>}
                    title="Aún no hay resultados"
                    description="Escribí o dictá tu pedido y pulsá «Generar con IA»."
                  />
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
