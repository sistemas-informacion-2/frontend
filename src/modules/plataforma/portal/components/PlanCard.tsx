import type { ReactNode } from 'react'
import type { Plan } from '../types'
import { formatoBs, limitesDelPlan, periodoDelPlan } from '../utils/formato'
import { IconoCheck } from './Iconos'

interface PlanCardProps {
  plan: Plan
  /** Boton o enlace de la tarjeta (contratar, elegir, plan actual). */
  accion: ReactNode
  /** Resalta la tarjeta como la elegida (registro, cambio de plan). */
  seleccionado?: boolean
}

/** Tarjeta de un plan: precio, limites destacados y capacidades del sistema. */
export function PlanCard({ plan, accion, seleccionado = false }: PlanCardProps) {
  const resaltada = seleccionado || plan.destacado
  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-shadow dark:bg-neutral-900 ${
        resaltada
          ? 'border-neutral-900 shadow-xl shadow-neutral-900/10 ring-1 ring-neutral-900 dark:border-white dark:ring-white dark:shadow-black/40'
          : 'border-neutral-200 hover:shadow-lg dark:border-neutral-800'
      }`}
    >
      {plan.destacado && (
        <span className="absolute -top-3 left-6 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
          Más elegido
        </span>
      )}

      <h3 className="text-lg font-semibold">{plan.nombre}</h3>
      <p className="mt-1 min-h-10 text-sm text-neutral-500 dark:text-neutral-400">{plan.descripcion}</p>

      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight">{formatoBs(plan.precio)}</span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">/ {periodoDelPlan(plan)}</span>
      </p>
      <p className="mt-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {plan.esPrueba ? '100% gratis · sin tarjeta' : 'Pago mensual con tarjeta'}
      </p>

      <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Límites del plan">
        {limitesDelPlan(plan).map((limite) => (
          <li key={limite} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            {limite}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Capacidades del sistema</p>
      <ul className="mt-3 flex flex-1 flex-col gap-2.5 text-sm">
        {plan.capacidades.map((capacidad) => (
          <li key={capacidad} className="flex gap-2.5">
            <IconoCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-neutral-700 dark:text-neutral-300">{capacidad}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">{accion}</div>
    </article>
  )
}
