import { ChevronDown } from 'lucide-react'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import { ESTILO_CAMPO } from './Input'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
}

export function Select({ label, error, hint, leftIcon, id, className = '', children, ...rest }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const detalleId = selectId ? `${selectId}-detalle` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-neutral-400">{leftIcon}</span>}
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? detalleId : undefined}
          className={`${ESTILO_CAMPO} appearance-none pr-9 ${error ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'} ${leftIcon ? 'pl-10' : 'pl-3'} ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
      </div>
      {error ? (
        <span id={detalleId} className="animate-fade-in text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : (
        hint && (
          <span id={detalleId} className="text-xs text-neutral-500 dark:text-neutral-400">
            {hint}
          </span>
        )
      )}
    </div>
  )
}
