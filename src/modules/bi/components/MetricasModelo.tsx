import { Badge } from '@/shared/components/ui/Badge'
import type { ModeloResumen, TipoModelo } from '../bi.types'

const TIPOS: Record<TipoModelo, string> = { SUPERVISADO: 'Supervisado', NO_SUPERVISADO: 'No supervisado', PRESCRIPTIVO: 'Prescriptivo' }

const porcentaje = (valor: unknown) => (typeof valor === 'number' ? `${(valor * 100).toLocaleString('es-BO', { maximumFractionDigits: 1 })} %` : '—')
const numero = (valor: unknown) => (typeof valor === 'number' ? valor.toLocaleString('es-BO', { maximumFractionDigits: 2 }) : '—')

function indicadores(modelo: ModeloResumen): Array<[string, string]> {
  const m = modelo.metricas
  if (!m) return []
  switch (modelo.clave) {
    case 'pronostico':
      return [['Error (MAPE)', porcentaje(m.mape_total_mensual)], ['Error del modelo ingenuo', porcentaje(m.mape_ingenuo_total_mensual)]]
    case 'abandono':
      return [['Modelo', String(m.modelo ?? '—').replace(/_/g, ' ').toLowerCase()], ['AUC', numero(m.auc)], ['Precisión', porcentaje(m.precision)], ['Exhaustividad', porcentaje(m.exhaustividad)]]
    case 'segmentacion':
      return [['Grupos', numero(m.k)], ['Silueta', numero(m.silueta)], ['Clientes', numero(m.clientes)]]
    case 'canasta':
      return [['Reglas', numero(m.reglas)], ['Notas analizadas', numero(m.notas)]]
    case 'anomalias':
      return [['Anomalías', numero(m.anomalias)], ['Sucursales', numero(m.sucursales)]]
    case 'reposicion':
      return [['Sugerencias', numero(m.filas)], ['Unidades', numero(m.unidades)]]
    default:
      return []
  }
}

export function MetricasModelo({ modelo }: { modelo: ModeloResumen }) {
  const omitido = typeof modelo.metricas?.omitido === 'string'
  const fallo = modelo.metricas?.error !== undefined
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{modelo.titulo}</h3>
        <Badge>{TIPOS[modelo.tipo]}</Badge>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{modelo.tecnica}</p>
      {omitido && <p className="text-xs text-neutral-500 dark:text-neutral-400">Sin historia suficiente para este modelo.</p>}
      {fallo && <p className="text-xs text-red-700 dark:text-red-300">La última corrida de este modelo falló.</p>}
      {!omitido && !fallo && (
        <dl className="flex flex-wrap gap-x-6 gap-y-1">
          {indicadores(modelo).map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{etiqueta}</dt>
              <dd className="text-sm font-medium capitalize tabular-nums text-neutral-900 dark:text-white">{valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
