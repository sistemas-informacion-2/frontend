import type { ReactNode } from 'react'
import { useEstadoOffline } from '@/core/offline/estadoOffline'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  // Sin red y sin copia guardada no se sabe si hay datos: decir "No hay..." y ofrecer crear seria falso.
  const sinCopia = useEstadoOffline((estado) => estado.rutasSinCopia.includes(window.location.pathname))
  if (sinCopia) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 px-4 py-12 text-center sm:px-6 sm:py-16 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Estos datos no están disponibles sin conexión</h3>
        <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">Abre esta pantalla una vez con red para guardarlos en este dispositivo.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 px-4 py-12 text-center sm:px-6 sm:py-16 dark:border-neutral-700">
      {icon && <div className="text-neutral-400 dark:text-neutral-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
      {action}
    </div>
  )
}
