import { useState, type ReactNode } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { getApiErrorMessage } from '@/core/http/errors'
import { listarPlanes } from '@/modules/portal/api/portal.api'
import { PlanCard } from '@/modules/portal/components/PlanCard'
import { clasesBotonPlan } from '@/modules/portal/utils/estilos'
import type { CodigoPlan } from '@/modules/portal/types'
import { formatoBs, formatoFecha, periodoDelPlan } from '@/modules/portal/utils/formato'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { pagarPlan } from '../api/suscripcion.api'
import { useMiPlan } from '../hooks/useMiPlan'
import type { MiPlan } from '../types'
import { ETIQUETA_VIGENCIA, TIPO_PAGO, textoVencimiento } from '../utils/vigencia'

const NOMBRE_FUNCION: Record<string, string> = {
  bi: 'El BI con inteligencia artificial',
  reportesAvanzados: 'El constructor de reportes y los reportes generativos',
}

/** Mi plan: el plan de la tienda en DOMINATR, su uso, renovar o cambiar de plan, y los pagos. */
export function MiPlanPage() {
  const { data: miPlan, error, isLoading } = useMiPlan()
  const { data: planes } = useSWR('portal/planes', listarPlanes, { revalidateOnFocus: false })
  const [params] = useSearchParams()
  const { state } = useLocation() as { state: { confirmado?: string } | null }
  const [viendoPlanes, setViendoPlanes] = useState(false)
  const [pagando, setPagando] = useState<CodigoPlan | null>(null)
  const [errorPago, setErrorPago] = useState<string | null>(null)

  const funcionPedida = params.get('funcion')

  const pagar = async (codigo: CodigoPlan) => {
    setPagando(codigo)
    setErrorPago(null)
    try {
      window.location.assign((await pagarPlan(codigo)).urlPago)
    } catch (err) {
      setErrorPago(getApiErrorMessage(err, 'No se pudo abrir el pago.'))
      setPagando(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }
  if (error || !miPlan) {
    return <p className="text-sm text-red-600 dark:text-red-400">{getApiErrorMessage(error, 'No se pudo cargar tu plan.')}</p>
  }

  const { plan } = miPlan
  const vigencia = ETIQUETA_VIGENCIA[miPlan.vigencia]
  const planesDePago = (planes ?? []).filter((candidato) => !candidato.esPrueba)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Mi plan</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Tu suscripción a DOMINATR: lo que incluye, lo que ya usas y tus pagos.</p>
      </div>

      {state?.confirmado && <Aviso tono="exito">{state.confirmado}</Aviso>}
      {params.get('pago') === 'cancelado' && <Aviso tono="atencion">Cancelaste el pago. No se cobró nada y tu plan sigue igual.</Aviso>}
      {funcionPedida && NOMBRE_FUNCION[funcionPedida] && (
        <Aviso tono="atencion">
          {NOMBRE_FUNCION[funcionPedida]} no está en tu plan {plan.nombre}. Puedes cambiar a un plan que lo incluya.
        </Aviso>
      )}
      {miPlan.vigencia === 'VENCIDO' && (
        <Aviso tono="error">
          Tu plan venció y la tienda está detenida: tus clientes no la ven y el panel solo abre esta página. Renueva para volver a operar. No se borró ningún dato.
        </Aviso>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Plan {plan.nombre}</h2>
              <Badge tone={vigencia.tono}>{vigencia.texto}</Badge>
            </div>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{textoVencimiento(miPlan)}</p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {plan.esPrueba ? 'Prueba gratuita' : `${formatoBs(plan.precio)} / ${periodoDelPlan(plan)}`}
            </p>
          </div>
          {miPlan.puedeGestionar && (
            <div className="flex flex-col gap-2 sm:items-end">
              {!plan.esPrueba && (
                <button type="button" disabled={pagando !== null} onClick={() => void pagar(plan.codigo)} className={clasesBotonPlan(true)}>
                  {pagando === plan.codigo ? 'Abriendo el pago…' : `Renovar ${formatoBs(plan.precio)}`}
                </button>
              )}
              <button type="button" onClick={() => setViendoPlanes((actual) => !actual)} className={clasesBotonPlan(plan.esPrueba)}>
                {viendoPlanes ? 'Ocultar planes' : plan.esPrueba ? 'Elegir un plan de pago' : 'Cambiar de plan'}
              </button>
            </div>
          )}
        </div>

        {errorPago && <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">{errorPago}</p>}
        {!miPlan.puedeGestionar && (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">Solo el administrador de la tienda puede renovar o cambiar el plan.</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Medidor titulo="Usuarios activos" usados={miPlan.uso.usuarios} maximo={plan.maxUsuarios} />
          <Medidor titulo="Sucursales activas" usados={miPlan.uso.sucursales} maximo={plan.maxSucursales} />
          <Medidor titulo="Almacenes activos" usados={miPlan.uso.almacenes} maximo={plan.maxAlmacenes} />
        </div>
        <ul className="mt-5 flex flex-wrap gap-2 text-sm">
          <Funcion incluida={plan.reportesAvanzados}>Constructor de reportes y reportes con IA</Funcion>
          <Funcion incluida={plan.bi}>BI con inteligencia artificial</Funcion>
        </ul>
      </section>

      {viendoPlanes && miPlan.puedeGestionar && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Planes disponibles</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Un cambio de plan empieza el día del pago y dura 30 días. Una renovación del mismo plan se suma al final de tu periodo actual.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {planesDePago.map((candidato) => {
              const esActual = candidato.codigo === plan.codigo
              return (
                <PlanCard
                  key={candidato.codigo}
                  plan={candidato}
                  seleccionado={esActual}
                  accion={
                    <button type="button" disabled={pagando !== null} onClick={() => void pagar(candidato.codigo)} className={clasesBotonPlan(candidato.destacado || esActual)}>
                      {pagando === candidato.codigo ? 'Abriendo el pago…' : esActual ? `Renovar ${formatoBs(candidato.precio)}` : `Cambiar a ${candidato.nombre}`}
                    </button>
                  }
                />
              )
            })}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            El pago es con tarjeta a través de Stripe, que cobra el equivalente en dólares. Si bajas de plan no se borra nada, pero no podrás crear más
            sucursales, almacenes o usuarios hasta estar dentro del nuevo límite.
          </p>
        </section>
      )}

      <Pagos pagos={miPlan.pagos} />
    </div>
  )
}

function Medidor({ titulo, usados, maximo }: { titulo: string; usados: number; maximo: number | null }) {
  const proporcion = maximo ? Math.min(usados / maximo, 1) : 0
  const lleno = maximo !== null && usados >= maximo
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{titulo}</p>
      <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
        {usados} <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">{maximo === null ? '· sin límite' : `de ${maximo}`}</span>
      </p>
      {maximo !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800" role="progressbar" aria-valuenow={usados} aria-valuemin={0} aria-valuemax={maximo} aria-label={titulo}>
          <div className={`h-full rounded-full ${lleno ? 'bg-amber-500' : 'bg-neutral-900 dark:bg-white'}`} style={{ width: `${proporcion * 100}%` }} />
        </div>
      )}
      {lleno && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Llegaste al límite de tu plan.</p>}
    </div>
  )
}

function Funcion({ incluida, children }: { incluida: boolean; children: string }) {
  return (
    <li
      className={`rounded-full px-3 py-1 font-medium ${
        incluida ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-neutral-100 text-neutral-500 line-through dark:bg-neutral-800 dark:text-neutral-400'
      }`}
    >
      {incluida ? '✓' : '✕'} {children}
    </li>
  )
}

function Pagos({ pagos }: { pagos: MiPlan['pagos'] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-900 dark:border-neutral-800 dark:text-white">Pagos del plan</h2>
      {pagos.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">Todavía no hay pagos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
                <th className="px-4 py-2.5 font-medium">Concepto</th>
                <th className="px-4 py-2.5 font-medium">Periodo</th>
                <th className="px-4 py-2.5 font-medium text-right">Monto</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {pagos.map((pago) => (
                <tr key={pago.id} className="text-neutral-700 dark:text-neutral-300">
                  <td className="px-4 py-3">{formatoFecha(pago.fechaPago ?? pago.fechaCreacion)}</td>
                  <td className="px-4 py-3">
                    {TIPO_PAGO[pago.tipo]} · {pago.planNombre}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {pago.periodoDesde && pago.periodoHasta ? `${formatoFecha(pago.periodoDesde)} – ${formatoFecha(pago.periodoHasta)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatoBs(pago.monto)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={pago.estado === 'PAGADO' ? 'success' : pago.estado === 'FALLIDO' ? 'danger' : 'neutral'}>
                      {pago.estado === 'PAGADO' ? 'Pagado' : pago.estado === 'FALLIDO' ? 'Fallido' : 'Pendiente'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Aviso({ tono, children }: { tono: 'exito' | 'atencion' | 'error'; children: ReactNode }) {
  const clases = {
    exito: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    atencion: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
  }[tono]
  return (
    <p className={`rounded-lg border px-4 py-3 text-sm ${clases}`} role={tono === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}
