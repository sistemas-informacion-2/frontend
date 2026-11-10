import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-solid text-brand-on shadow-sm hover:bg-brand-solid-hover',
  secondary: 'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800',
  outline: 'border border-brand text-brand hover:bg-brand-light',
  ghost: 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
}

export function Button({ variant = 'primary', loading, disabled, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:focus-visible:ring-offset-neutral-950 ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
