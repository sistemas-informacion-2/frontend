import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { ConversacionResumen, DatosGrafico, Grafico, GraficoGuardado, MensajeChat } from '../../bi.types'
import { GraficoBi } from '../../components/GraficoBi'
import { MensajeAsistente } from '../../components/MensajeAsistente'

interface AsistentePageViewProps {
  conversaciones: ConversacionResumen[]
  graficos: GraficoGuardado[]
  idConversacion: number | null
  mensajes: MensajeChat[]
  pregunta: string
  enviando: boolean
  error: string | null
  graficoAbierto: DatosGrafico | null
  onPregunta: (texto: string) => void
  onEnviar: (texto: string) => void
  onNueva: () => void
  onAbrirConversacion: (id: number) => void
  onBorrarConversacion: (id: number) => void
  onGuardarGrafico: (grafico: Grafico) => Promise<void>
  onAbrirGrafico: (id: number) => void
  onBorrarGrafico: (id: number) => void
  onCerrarGrafico: () => void
}

const SUGERIDAS = ['¿Cuánto vendí por mes este año?', '¿Por qué bajaron las ventas el último mes?', '¿Qué debería comprar para los próximos meses?', '¿Qué clientes están por irse?', '¿Qué prendas se compran juntas?']

function Lista({ titulo, vacio, children }: { titulo: string; vacio: string; children: ReactNode[] }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{titulo}</h2>
      {children.length ? <ul className="space-y-0.5">{children}</ul> : <p className="text-xs text-neutral-500 dark:text-neutral-400">{vacio}</p>}
    </div>
  )
}

function Fila({ texto, activa, onAbrir, onBorrar }: { texto: string; activa?: boolean; onAbrir: () => void; onBorrar: () => void }) {
  return (
    <li className={`group flex items-center gap-1 rounded-md ${activa ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}>
      <button type="button" onClick={onAbrir} className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm text-neutral-700 dark:text-neutral-300">
        {texto}
      </button>
      <button type="button" onClick={onBorrar} aria-label={`Borrar ${texto}`} className="px-2 py-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
        ×
      </button>
    </li>
  )
}

export function AsistentePageView(props: AsistentePageViewProps) {
  const { conversaciones, graficos, idConversacion, mensajes, pregunta, enviando, error, graficoAbierto } = props
  const final = useRef<HTMLDivElement>(null)

  useEffect(() => {
    final.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes.length, enviando])

  const alEscribir = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()
      props.onEnviar(pregunta)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Asistente</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Pregunta sobre tu negocio. Los números salen de tus datos.</p>
        </div>
        <Button variant="secondary" onClick={props.onNueva}>Nueva conversación</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="order-2 space-y-5 rounded-lg border border-neutral-200 bg-white p-3 lg:sticky lg:top-0 lg:order-1 lg:self-start dark:border-neutral-800 dark:bg-neutral-950">
          <Lista titulo="Conversaciones" vacio="Todavía no hay conversaciones.">
            {conversaciones.map((c) => <Fila key={c.id} texto={c.titulo} activa={c.id === idConversacion} onAbrir={() => props.onAbrirConversacion(c.id)} onBorrar={() => props.onBorrarConversacion(c.id)} />)}
          </Lista>
          <Lista titulo="Gráficos guardados" vacio="Guarda un gráfico desde una respuesta.">
            {graficos.map((g) => <Fila key={g.id} texto={g.titulo} onAbrir={() => props.onAbrirGrafico(g.id)} onBorrar={() => props.onBorrarGrafico(g.id)} />)}
          </Lista>
        </aside>

        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          {mensajes.length === 0 && !enviando ? (
            <div className="space-y-4">
              <EmptyState ilustracion="grafico" title="¿Qué quieres saber de tu negocio?" description="Ventas, márgenes, inventario, clientes o qué va a pasar los próximos meses." />
              <div className="flex flex-wrap justify-center gap-2">
                {SUGERIDAS.map((sugerida) => (
                  <button key={sugerida} type="button" onClick={() => props.onEnviar(sugerida)} className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                    {sugerida}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5" aria-live="polite">
              {mensajes.map((mensaje) => <MensajeAsistente key={mensaje.id} mensaje={mensaje} onGuardarGrafico={props.onGuardarGrafico} />)}
              {enviando && (
                <div className="space-y-2" role="status" aria-label="El asistente está analizando">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
            </div>
          )}
          <div ref={final} />

          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

          <form
            className="sticky -bottom-4 z-10 -mb-4 flex items-end gap-2 bg-neutral-50 pb-4 pt-2 sm:-bottom-6 sm:-mb-6 sm:pb-6 lg:-bottom-8 lg:-mb-8 lg:pb-8 dark:bg-neutral-900"
            onSubmit={(evento) => {
              evento.preventDefault()
              props.onEnviar(pregunta)
            }}
          >
            <textarea
              aria-label="Tu pregunta"
              rows={2}
              maxLength={2000}
              value={pregunta}
              onChange={(evento) => props.onPregunta(evento.target.value)}
              onKeyDown={alEscribir}
              placeholder="Escribe tu pregunta…"
              className="min-w-0 flex-1 resize-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            <Button type="submit" loading={enviando} disabled={!pregunta.trim()}>Enviar</Button>
          </form>
        </div>
      </div>

      <Modal open={graficoAbierto !== null} title={graficoAbierto?.titulo ?? ''} onClose={props.onCerrarGrafico}>
        {graficoAbierto &&
          (graficoAbierto.grafico ? (
            <GraficoBi grafico={graficoAbierto.grafico} filas={graficoAbierto.resultado.filas} sinTitulo />
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Por ahora este gráfico no tiene datos para mostrar.</p>
          ))}
      </Modal>
    </div>
  )
}
