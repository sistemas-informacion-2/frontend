import { env } from '@/core/config/env'

export function StoreLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm text-white dark:bg-white dark:text-neutral-900">
        {env.appName.charAt(0)}
      </span>
      <span>{env.appName}</span>
    </span>
  )
}
