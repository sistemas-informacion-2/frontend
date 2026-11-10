import { Link } from 'react-router-dom'
import { NOMBRE_PLATAFORMA } from '@/modules/plataforma/marca'

/** Logo de la plataforma: monograma + nombre. */
export function MarcaDominatr({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label={`${NOMBRE_PLATAFORMA}, inicio`}>
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-black text-white shadow-sm dark:bg-white dark:text-neutral-900"
      >
        D
      </span>
      <span className="text-sm font-extrabold tracking-[0.22em] text-neutral-900 dark:text-white">{NOMBRE_PLATAFORMA}</span>
    </Link>
  )
}
