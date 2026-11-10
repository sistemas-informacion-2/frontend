interface BadgeProps {
  children: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}

const TONE_CLASSES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>{children}</span>
}
