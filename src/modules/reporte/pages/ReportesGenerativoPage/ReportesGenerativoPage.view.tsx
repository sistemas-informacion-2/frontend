import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { KpiCard } from '../../components/KpiCard'
import { ReportFiltersBuilder } from '../../components/reportes/ReportFiltersBuilder'
import { ReportPreviewTable } from '../../components/reportes/ReportPreviewTable'
import type {
  FiltroReporte,
  FormatoExportacion,
  OrdenReporte,
  ReporteDefinicion,
  ReportRunRequest,
  ResultadoReporte,
} from '../../reportes.types'
import type { MensajeConversacion } from './ReportesGenerativoPage'

interface ReportesGenerativoPageViewProps {
  puedeGestionar: boolean
  prompt: string
  generando: boolean
  error: string | null
  historial: MensajeConversacion[]
  promptOrigen: string | null
  catalogo?: ReporteDefinicion[]
  tipoActivo?: ReporteDefinicion
  request: ReportRunRequest | null
  resultado: ResultadoReporte | null
  exportando: FormatoExportacion | null
  vozActivada: boolean
  escuchandoVoz: boolean
  vozSoportada: boolean
  errorVoz: string | null
  refinando: boolean
  aplicandoRefinar: boolean
  onPrompt: (prompt: string) => void
  onIniciarVoz: () => void
  onDetenerVoz: () => void
  onGenerar: () => void
  onNuevaConversacion: () => void
  onAlternarVoz: () => void
  onEscuchar: (texto: string) => void
  onAbrirRefinar: () => void
  onCancelarRefinar: () => void
  onAplicarRefinar: () => void
  onCambiarTipo: (tipo: string) => void
  onCombinar: (parche: Partial<ReportRunRequest>) => void
  onFiltroPatch: (indice: number, parche: Partial<FiltroReporte>) => void
  onFiltroAgregar: (filtro: FiltroReporte) => void
  onFiltroBorrar: (indice: number) => void
  onOrdenChange: (orden?: OrdenReporte) => void
  onFechasChange: (desde?: string, hasta?: string) => void
  onLimiteChange: (limite: number) => void
  onExportar: (formato: FormatoExportacion) => void
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
  'ventas de hoy por sucursal',
]

function FuenteBadge({ fuente }: { fuente: 'IA' | 'REGEX' }) {
  return fuente === 'IA' ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
      ✨ Gemini
    </span>
  ) : (
    <span
      className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      title="Gemini no está configurado o no respondió; se usó el traductor por palabras clave."
    >
      ⚙️ Modo básico
    </span>
  )
}

/** "Ventas · columnas: fecha, sucursal, monto total · sucursal: La Paz · del 2026-09-01 al 2026-09-30". */
function resumenRequest(request: ReportRunRequest, tipoActivo?: ReporteDefinicion): string {
  const partes = [tipoActivo?.nombre ?? request.reportType]

  const etiquetaCampo = (nombre: string) => tipoActivo?.campos.find((c) => c.name === nombre)?.label ?? nombre
  if (request.selectedFields.length > 0) {
    partes.push(`columnas: ${request.selectedFields.map(etiquetaCampo).join(', ')}`)
  }

  const filtroSucursal = request.filters?.find((f) => f.campo === 'sucursal')
  if (filtroSucursal) partes.push(`sucursal: ${filtroSucursal.valor}`)

  if (request.dateFrom || request.dateTo) {
    partes.push(`del ${request.dateFrom ?? '…'} al ${request.dateTo ?? '…'}`)
  }

  return partes.join(' · ')
}

export function ReportesGenerativoPageView({
  puedeGestionar,
  prompt,
  generando,
  error,
  historial,
  promptOrigen,
  catalogo,
  tipoActivo,
  request,
  resultado,
  exportando,
  vozActivada,
  escuchandoVoz,
  vozSoportada,
  errorVoz,
  refinando,
  aplicandoRefinar,
  onPrompt,
  onIniciarVoz,
  onDetenerVoz,
  onGenerar,
  onNuevaConversacion,
  onAlternarVoz,
  onEscuchar,
  onAbrirRefinar,
  onCancelarRefinar,
  onAplicarRefinar,
  onCambiarTipo,
  onCombinar,
  onFiltroPatch,
  onFiltroAgregar,
  onFiltroBorrar,
  onOrdenChange,
  onFechasChange,
  onLimiteChange,
  onExportar,
  onLimpiarError,
}: ReportesGenerativoPageViewProps) {
  const puedeExportar = !!resultado && !exportando
  const fuenteActual = historial[historial.length - 1]?.fuente ?? null
  const hayConversacion = historial.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Reportes por voz / generativos</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Preguntale al asistente en voz alta o por texto: te responde, lee la respuesta y te muestra el reporte.
          </p>
        </div>
        {puedeGestionar && (
          <div className="flex flex-wrap items-center gap-2">
            {fuenteActual && <FuenteBadge fuente={fuenteActual} />}
            <Button variant="secondary" onClick={onAlternarVoz}>
              {vozActivada ? '🔊 Voz activada' : '🔇 Voz desactivada'}
            </Button>
            {hayConversacion && (
              <Button variant="secondary" onClick={onNuevaConversacion}>
                Nueva conversación
              </Button>
            )}
          </div>
        )}
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

          {hayConversacion && (
            <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
                <span className="text-base">💬</span>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Conversación</p>
              </div>
              <div className="max-h-[480px] space-y-3 overflow-y-auto bg-neutral-50/60 p-4 dark:bg-neutral-900/40">
                {historial.map((mensaje) => (
                  <div key={mensaje.id} className="space-y-2">
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-xl bg-neutral-900 px-4 py-2.5 text-sm text-white dark:bg-emerald-700">{mensaje.prompt}</p>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                        <p>{mensaje.interpretacion}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <FuenteBadge fuente={mensaje.fuente} />
                          <span>· reporte abajo</span>
                          <button type="button" onClick={() => onEscuchar(mensaje.interpretacion)} className="font-medium text-neutral-700 hover:underline dark:text-neutral-300">
                            🔊 Escuchar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {hayConversacion ? 'Seguí preguntando (podés referirte a lo anterior)' : 'Texto transcrito (revísalo o corrígelo antes de enviarlo)'}
            </p>
            <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={escuchandoVoz ? onDetenerVoz : onIniciarVoz}
                  disabled={!vozSoportada}
                  title={escuchandoVoz ? 'Detener dictado' : 'Dictar por voz'}
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    escuchandoVoz ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {escuchandoVoz ? '⏹' : '🎤'}
                </button>
                <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                  {vozSoportada ? 'Presiona el micrófono y dicta tu consulta' : 'Tu navegador no soporta dictado por voz'}
                </p>
              </div>

              <div className="w-full flex-1 space-y-2">
                <textarea
                  value={prompt}
                  onChange={(event) => onPrompt(event.target.value)}
                  rows={3}
                  placeholder={hayConversacion ? 'Ej.: ¿y en La Paz?' : `Ej.: ${EJEMPLOS[0]}`}
                  className="w-full resize-none rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
                />
                <Button onClick={onGenerar} loading={generando} disabled={!prompt.trim()}>
                  Enviar
                </Button>
              </div>
            </div>

            {errorVoz && (
              <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {errorVoz}
              </p>
            )}

            {!hayConversacion && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Prueba con:</p>
                <div className="flex flex-wrap gap-2">
                  {EJEMPLOS.map((ejemplo) => (
                    <button
                      key={ejemplo}
                      type="button"
                      onClick={() => onPrompt(ejemplo)}
                      className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      {ejemplo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {!hayConversacion && (
            <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              Aún no hiciste ninguna consulta. Presiona el micrófono y pregunta, o elige uno de los ejemplos.
            </div>
          )}

          {request && resultado && (
            <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{tipoActivo?.nombre ?? request.reportType}</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{resumenRequest(request, tipoActivo)}</p>
                  {promptOrigen && <p className="mt-1 text-xs italic text-neutral-500 dark:text-neutral-400">"{promptOrigen}"</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {fuenteActual && <FuenteBadge fuente={fuenteActual} />}
                  {!refinando && (
                    <Button variant="secondary" onClick={onAbrirRefinar}>
                      Refinar
                    </Button>
                  )}
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
              </div>

              {refinando && (
                <div className="space-y-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-900">
                  <ReportFiltersBuilder
                    catalogo={catalogo}
                    tipoActivo={tipoActivo}
                    request={request}
                    ejecutando={aplicandoRefinar}
                    onCambiarTipo={onCambiarTipo}
                    onCombinar={onCombinar}
                    onFiltroAgregar={onFiltroAgregar}
                    onFiltroPatch={onFiltroPatch}
                    onFiltroBorrar={onFiltroBorrar}
                    onOrdenChange={onOrdenChange}
                    onFechasChange={onFechasChange}
                    onLimiteChange={onLimiteChange}
                    onAplicar={onAplicarRefinar}
                  />
                  <Button variant="secondary" onClick={onCancelarRefinar} disabled={aplicandoRefinar} className="w-full">
                    Cancelar
                  </Button>
                </div>
              )}

              {resultado.rows.length === 1 ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {resultado.columnLabels.map((etiqueta, indice) => (
                    <KpiCard key={etiqueta} titulo={etiqueta.toUpperCase()} valor={formatearValorKpi(resultado.rows[0][indice])} />
                  ))}
                </div>
              ) : resultado.rows.length > 0 ? (
                <ReportPreviewTable resultado={resultado} pagina={1} porPagina={resultado.rows.length} onCambiarPagina={() => {}} />
              ) : (
                <EmptyState
                  icon={<span className="text-4xl">🔍</span>}
                  title="Sin registros"
                  description="Ninguna fila coincide con lo que entendimos de tu pedido; probá reformularlo o usar «Refinar»."
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function formatearValorKpi(valor: string | number | boolean | null): string {
  if (valor === null || valor === undefined) return '—'
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  if (typeof valor === 'number') return valor.toLocaleString('es-BO', { maximumFractionDigits: 2 })
  return String(valor)
}
