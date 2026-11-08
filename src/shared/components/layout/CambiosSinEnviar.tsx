import { useState } from 'react'
import { descartarEscritura, reintentarEscritura, type EscrituraOffline } from '@/core/offline/colaEscrituras'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { useEscriturasPendientes } from './useEscriturasOffline'

const ESTADOS: Record<EscrituraOffline['estado'], { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Por enviar', clase: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200' },
  CONFLICTO: { texto: 'Conflicto', clase: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  RECHAZADA: { texto: 'Rechazado', clase: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' },
}

function Fila({ escritura }: { escritura: EscrituraOffline }) {
  const estado = ESTADOS[escritura.estado]
  const descartar = () => {
    if (window.confirm(`¿Descartar este cambio? "${escritura.descripcion}" no se enviará.`)) void descartarEscritura(escritura.idLocal)
  }

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-white">{escritura.descripcion}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(escritura.creadaEn).toLocaleString()}</p>
        {escritura.mensaje && <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{escritura.mensaje}</p>}
        {escritura.camposEnConflicto && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Campos: {escritura.camposEnConflicto.join(', ')}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}>{estado.texto}</span>
        {escritura.estado !== 'PENDIENTE' && (
          <Button variant="secondary" onClick={() => void reintentarEscritura(escritura.idLocal)}>
            {escritura.estado === 'CONFLICTO' ? 'Aplicar mi cambio' : 'Reintentar'}
          </Button>
        )}
        <Button variant="secondary" onClick={descartar}>
          Descartar
        </Button>
      </div>
    </li>
  )
}

/** Muestra en la cabecera lo guardado en este dispositivo: se oculta cuando no queda nada por enviar. */
export function CambiosSinEnviar() {
  const escrituras = useEscriturasPendientes()
  const [abierto, setAbierto] = useState(false)
  if (escrituras.length === 0) return null

  const conProblemas = escrituras.some((escritura) => escritura.estado !== 'PENDIENTE')
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
          conProblemas ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
        }`}
      >
        {escrituras.length} sin enviar
      </button>
      <Modal open={abierto} title="Cambios sin enviar" onClose={() => setAbierto(false)}>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Están guardados en este dispositivo y se envían solos, en orden, cuando hay conexión y este panel está abierto.</p>
        <ul className="mt-2 divide-y divide-neutral-200 dark:divide-neutral-800">
          {escrituras.map((escritura) => (
            <Fila key={escritura.idLocal} escritura={escritura} />
          ))}
        </ul>
      </Modal>
    </>
  )
}
