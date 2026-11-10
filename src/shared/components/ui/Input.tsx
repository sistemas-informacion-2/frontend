import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Texto de ayuda bajo el campo; el error lo reemplaza. */
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const ESTILO_CAMPO =
  'w-full rounded-md border bg-white py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-900 dark:text-neutral-100'

export function Input({ label, error, hint, leftIcon, rightIcon, id, className = '', type, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const isPassword = type === 'password'
  const [visible, setVisible] = useState(false)
  const detalleId = inputId ? `${inputId}-detalle` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-neutral-400">{leftIcon}</span>}
        <input
          id={inputId}
          type={isPassword ? (visible ? 'text' : 'password') : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? detalleId : undefined}
          className={`${ESTILO_CAMPO} ${error ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'} ${leftIcon ? 'pl-10' : 'pl-3'} ${isPassword || rightIcon ? 'pr-10' : 'pr-3'} ${className}`}
          {...rest}
        />
        {rightIcon && !isPassword && <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-400">{rightIcon}</span>}
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            {visible ? <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>
        )}
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
