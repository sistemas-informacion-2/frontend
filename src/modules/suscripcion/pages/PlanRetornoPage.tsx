import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { getApiErrorMessage } from '@/core/http/errors'
import { formatoFecha } from '@/modules/portal/utils/formato'
import { confirmarPagoDePlan } from '../api/suscripcion.api'
import { CLAVE_MI_PLAN } from '../hooks/useMiPlan'

/** Vuelta de Stripe tras renovar o cambiar el plan: confirma el pago y vuelve a Mi plan. */
export function PlanRetornoPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const navigate = useNavigate()
  const { mutate } = useSWRConfig()
  const [error, setError] = useState<string | null>(sessionId ? null : 'Falta la referencia del pago.')

  useEffect(() => {
    if (!sessionId) return
    let vigente = true
    // Idempotente en el backend: recargar esta pagina no cobra ni extiende el plan dos veces.
    confirmarPagoDePlan(sessionId)
      .then(async (confirmado) => {
        await mutate(CLAVE_MI_PLAN)
        if (!vigente) return
        const hasta = confirmado.venceEl ? ` hasta el ${formatoFecha(confirmado.venceEl)}` : ''
        navigate('/admin/plan', { replace: true, state: { confirmado: `Pago confirmado: tu plan ${confirmado.planNombre} está vigente${hasta}.` } })
      })
      .catch((err) => {
        if (vigente) setError(getApiErrorMessage(err, 'No se pudo confirmar el pago.'))
      })
    return () => {
      vigente = false
    }
  }, [sessionId, mutate, navigate])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      {error ? (
        <>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">No se pudo confirmar el pago</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300" role="alert">
            {error}
          </p>
          <Link to="/admin/plan" className="mt-6 text-sm font-medium underline">
            Volver a Mi plan
          </Link>
        </>
      ) : (
        <>
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" aria-hidden="true" />
          <h1 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-white">Confirmando tu pago…</h1>
        </>
      )}
    </div>
  )
}
