import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 px-4 py-12 text-center sm:px-6 sm:py-16 dark:border-neutral-700">
      {icon && <div className="text-neutral-400 dark:text-neutral-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
      {action}
    </div>
  )
}
