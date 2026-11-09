import { etiquetaPeriodo, formatearValor } from '../utils/formato'

interface EntradaTooltip {
  name?: unknown
  value?: unknown
  color?: string
  dataKey?: unknown
}

interface TooltipBiProps {
  active?: boolean
  payload?: ReadonlyArray<EntradaTooltip>
  label?: unknown
  /** Columna que decide el formato cuando la serie es calculada (por ejemplo, el rango). */
  diario?: boolean
  columnas?: Record<string, string>
}

export function TooltipBi({ active, payload, label, diario = false, columnas }: TooltipBiProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      {label !== undefined && <p className="mb-1 font-medium text-neutral-900 dark:text-white">{etiquetaPeriodo(String(label), diario)}</p>}
      <ul className="space-y-0.5">
        {payload.map((entrada) => {
          const clave = String(entrada.dataKey ?? entrada.name)
          const nombre = String(entrada.name ?? clave)
          const columna = columnas?.[nombre] ?? clave
          const valor = Array.isArray(entrada.value)
            ? entrada.value.map((parte) => formatearValor(columna, parte)).join(' – ')
            : formatearValor(columna, entrada.value)
          return (
            <li key={nombre} className="flex items-center justify-between gap-4 text-neutral-600 dark:text-neutral-300">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: entrada.color }} />
                {nombre}
              </span>
              <span className="font-medium text-neutral-900 dark:text-white">{valor}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
