import { CloudOff, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEstadoOffline } from '@/core/offline/estadoOffline'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

const CONTENEDOR = 'flex animate-fade-in flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 px-4 py-12 text-center sm:px-6 sm:py-16 dark:border-neutral-700'
const ICONO = 'flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  // Sin red y sin copia guardada no se sabe si hay datos: decir "No hay..." y ofrecer crear seria falso.
  const sinCopia = useEstadoOffline((estado) => estado.rutasSinCopia.includes(window.location.pathname))
  if (sinCopia) {
    return (
      <div className={CONTENEDOR}>
        <div className={ICONO}>
          <CloudOff className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">Estos datos no están disponibles sin conexión</h3>
        <p className="max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">Abre esta pantalla una vez con red para guardarlos en este dispositivo.</p>
      </div>
    )
  }

  return (
    <div className={CONTENEDOR}>
      <div className={ICONO}>{icon ?? <Inbox className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />}</div>
      <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{description}</p>}
      {action}
    </div>
  )
}
