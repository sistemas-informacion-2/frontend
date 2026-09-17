interface BadgeProps {
  children: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}

const TONE_CLASSES = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>{children}</span>
}
