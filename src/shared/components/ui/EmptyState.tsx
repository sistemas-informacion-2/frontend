import type { ReactNode } from 'react'
import { Ilustracion, type NombreIlustracion } from './Ilustracion'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  /** Ilustracion de linea; tiene prioridad sobre `icon`. */
  ilustracion?: NombreIlustracion
  action?: ReactNode
}

export function EmptyState({ title, description, icon, ilustracion, action }: EmptyStateProps) {
  return (
    <div className="flex animate-aparecer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 px-4 py-12 text-center sm:px-6 sm:py-16 dark:border-neutral-700">
      {ilustracion ? (
        <div className="mb-1 flex h-28 w-28 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          <Ilustracion nombre={ilustracion} />
        </div>
      ) : (
        icon && <div className="text-neutral-400 dark:text-neutral-500">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
      {action}
    </div>
  )
}
