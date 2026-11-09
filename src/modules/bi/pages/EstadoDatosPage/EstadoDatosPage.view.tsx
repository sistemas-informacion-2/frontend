import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { EjecucionEtl, EstadoBi, ModeloResumen } from '../../bi.types'
import { MetricasModelo } from '../../components/MetricasModelo'
import { fechaHora } from '../../utils/formato'

interface EstadoDatosPageViewProps {
  estado?: EstadoBi
  historial: EjecucionEtl[]
  modelos: ModeloResumen[]
  cargando: boolean
  puedeActualizar: boolean
  actualizando: boolean
  mensaje: string | null
  error: string | null
  onActualizar: () => void
}

const NOMBRE_ESTADO: Record<string, string> = { OK: 'Correcto', PARCIAL: 'Parcial', ERROR: 'Con error', EN_CURSO: 'En curso' }
const TONO_ESTADO: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { OK: 'success', PARCIAL: 'warning', ERROR: 'danger', EN_CURSO: 'neutral' }
const NOMBRE_IA = { VERTEX: 'Vertex AI', API_KEY: 'Google AI Studio', SIN_CONFIGURAR: 'Sin configurar' }

function BadgeEstado({ estado }: { estado: string }) {
  return <Badge tone={TONO_ESTADO[estado] ?? 'neutral'}>{NOMBRE_ESTADO[estado] ?? estado}</Badge>
}

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{titulo}</h2>
      <div className="mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">{children}</div>
    </section>
  )
}

function totalFilas(filas: Record<string, number> | null): string {
  return filas ? Object.values(filas).reduce((suma, valor) => suma + valor, 0).toLocaleString('es-BO') : '—'
}

export function EstadoDatosPageView({ estado, historial, modelos, cargando, puedeActualizar, actualizando, mensaje, error, onActualizar }: EstadoDatosPageViewProps) {
  const etl = estado?.etl.ultimaEjecucion
  const ml = estado?.ml.ultimaEjecucion
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Estado de los datos</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{estado?.etl.programado ? 'Los datos se cargan solos cada noche.' : 'La carga nocturna está apagada.'}</p>
        </div>
        {puedeActualizar && <Button onClick={onActualizar} loading={actualizando}>Actualizar ahora</Button>}
      </div>

      {mensaje && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">{mensaje}</p>}
      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      {cargando ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        estado && (
          <div className="grid gap-4 md:grid-cols-3">
            <Tarjeta titulo="Última carga de datos">
              {etl ? (
                <>
                  <BadgeEstado estado={etl.estado} />
                  <p>{fechaHora(etl.fin ?? etl.inicio)}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{totalFilas(etl.filas)} filas</p>
                </>
              ) : (
                <p>Todavía no se cargaron datos.</p>
              )}
            </Tarjeta>
            <Tarjeta titulo="Modelos">
              {ml ? (
                <>
                  <BadgeEstado estado={ml.estado} />
                  <p>{fechaHora(ml.fin ?? ml.inicio)}</p>
                </>
              ) : (
                <p>{estado.ml.configurado ? 'Todavía no se entrenaron.' : 'El servicio de machine learning no está configurado.'}</p>
              )}
            </Tarjeta>
            <Tarjeta titulo="Asistente">
              <p className="font-medium text-neutral-900 dark:text-white">{NOMBRE_IA[estado.ia.modo]}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{estado.ia.modelo}</p>
            </Tarjeta>
          </div>
        )
      )}

      {modelos.some((modelo) => modelo.metricas) && (
        <section>
          <h2 className="mb-2 text-base font-semibold text-neutral-900 dark:text-white">Calidad de los modelos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {modelos.map((modelo) => (
              <div key={modelo.clave} className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <MetricasModelo modelo={modelo} />
              </div>
            ))}
          </div>
        </section>
      )}

      {historial.length > 0 && (
        <section>
          <h2 className="mb-2 text-base font-semibold text-neutral-900 dark:text-white">Últimas cargas</h2>
          <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Fecha</th>
                  <th scope="col" className="px-3 py-2 font-medium">Origen</th>
                  <th scope="col" className="px-3 py-2 font-medium">Estado</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Filas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700 dark:divide-neutral-800 dark:text-neutral-300">
                {historial.map((carga) => (
                  <tr key={carga.id}>
                    <td className="px-3 py-2">{fechaHora(carga.inicio)}</td>
                    <td className="px-3 py-2">{carga.origen === 'MANUAL' ? 'A pedido' : 'Nocturna'}</td>
                    <td className="px-3 py-2"><BadgeEstado estado={carga.estado} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{totalFilas(carga.filas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
