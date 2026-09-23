import { env } from '@/core/config/env'

/** Círculo con la inicial de la tienda; se usa solo o junto al nombre. */
export function StoreLogoMarca({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900 ${className}`}
    >
      {env.appName.charAt(0)}
    </span>
  )
}

export function StoreLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <StoreLogoMarca />
      <span>{env.appName}</span>
    </span>
  )
}
