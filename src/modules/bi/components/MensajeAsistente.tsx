import { useState } from 'react'
import type { Grafico, HerramientaEjecutada, MensajeChat, ResultadoHerramienta } from '../bi.types'
import { nombreHerramienta } from '../utils/formato'
import { GraficoBi } from './GraficoBi'
import { TextoAsistente } from './TextoAsistente'

interface MensajeAsistenteProps {
  mensaje: MensajeChat
  onGuardarGrafico: (grafico: Grafico) => Promise<void>
}

const MAX_GRAFICOS = 2

function conDatos(herramienta: MensajeChat['herramientas'][number]): herramienta is HerramientaEjecutada & { resultado: ResultadoHerramienta; grafico: Grafico } {
  return 'grafico' in herramienta && herramienta.grafico !== null && 'filas' in herramienta.resultado
}

/** Los graficos aportan lo que el texto no muestra; las tablas solo si no hay graficos. */
function graficosAMostrar(mensaje: MensajeChat) {
  const disponibles = mensaje.herramientas.filter(conDatos)
  const dibujados = disponibles.filter((herramienta) => herramienta.grafico.tipo !== 'tabla')
  return (dibujados.length ? dibujados : disponibles).slice(0, MAX_GRAFICOS)
}

function textoParametros(parametros: Record<string, unknown>): string {
  const partes = Object.entries(parametros).map(([clave, valor]) => `${clave.replace(/_/g, ' ')}: ${String(valor)}`)
  return partes.length ? partes.join(' · ') : 'sin filtros'
}

export function MensajeAsistente({ mensaje, onGuardarGrafico }: MensajeAsistenteProps) {
  const [guardados, setGuardados] = useState<string[]>([])
  const [guardando, setGuardando] = useState<string | null>(null)

  if (mensaje.rol === 'USUARIO') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900">{mensaje.texto}</p>
      </div>
    )
  }

  const guardar = async (clave: string, grafico: Grafico) => {
    setGuardando(clave)
    try {
      await onGuardarGrafico(grafico)
      setGuardados((actuales) => [...actuales, clave])
    } finally {
      setGuardando(null)
    }
  }

  return (
    <div className="space-y-3">
      <TextoAsistente texto={mensaje.texto} />
      {graficosAMostrar(mensaje).map((herramienta, indice) => {
        const clave = `${mensaje.id}-${indice}`
        const yaGuardado = guardados.includes(clave)
        return (
          <GraficoBi
            key={clave}
            grafico={herramienta.grafico}
            filas={herramienta.resultado.filas}
            acciones={
              <button
                type="button"
                disabled={yaGuardado || guardando === clave}
                onClick={() => void guardar(clave, herramienta.grafico)}
                className="font-medium text-neutral-600 underline hover:text-neutral-950 disabled:text-neutral-400 disabled:no-underline dark:text-neutral-300 dark:hover:text-white"
              >
                {yaGuardado ? 'Guardado' : guardando === clave ? 'Guardando…' : 'Guardar'}
              </button>
            }
          />
        )
      })}
      {mensaje.herramientas.length > 0 && (
        <details className="text-xs text-neutral-500 dark:text-neutral-400">
          <summary className="cursor-pointer font-medium">Cómo se calculó</summary>
          <ul className="mt-2 space-y-1">
            {mensaje.herramientas.map((herramienta, indice) => (
              <li key={indice}>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{nombreHerramienta(herramienta.nombre)}</span>
                {herramienta.ok ? '' : ' (no se pudo consultar)'} — {textoParametros(herramienta.parametros)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
