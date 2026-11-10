import { Link, useLocation } from 'react-router-dom'
import { useMiPlan } from '../hooks/useMiPlan'
import { textoVencimiento } from '../utils/vigencia'

/** Franja del panel cuando el plan esta por vencer o en sus dias de gracia. */
export function AvisoPlan() {
  const { data: miPlan } = useMiPlan()
  const { pathname } = useLocation()
  if (!miPlan || pathname.startsWith('/admin/plan')) return null
  if (miPlan.vigencia !== 'POR_VENCER' && miPlan.vigencia !== 'EN_GRACIA') return null

  const enGracia = miPlan.vigencia === 'EN_GRACIA'
  return (
    <div
      role="status"
      className={`flex flex-col gap-1 border-b px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
        enGracia
          ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200'
          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
      }`}
    >
      <span>
        Tu plan {miPlan.plan.nombre}: {textoVencimiento(miPlan)}
      </span>
      <Link to="/admin/plan" className="shrink-0 font-semibold underline">
        {miPlan.puedeGestionar ? 'Renovar ahora' : 'Ver mi plan'}
      </Link>
    </div>
  )
}
