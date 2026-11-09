import { Badge } from '@/shared/components/ui/Badge'
import type { Fila } from '../bi.types'
import { etiquetaColumna, formatearValor } from '../utils/formato'

interface TablaResultadoProps {
  filas: Fila[]
  /** Columnas y orden; por defecto, todas las de la primera fila. */
  columnas?: string[]
}

const TONOS: Record<string, 'danger' | 'warning' | 'success' | 'neutral'> = { ALTO: 'danger', ALTA: 'danger', MEDIO: 'warning', MEDIA: 'warning', BAJO: 'success' }

function Celda({ columna, valor }: { columna: string; valor: unknown }) {
  if ((columna === 'nivel' || columna === 'gravedad') && typeof valor === 'string') {
    return <Badge tone={TONOS[valor] ?? 'neutral'}>{valor.charAt(0) + valor.slice(1).toLowerCase()}</Badge>
  }
  // Texto largo: con ancho fijo se parte en lineas en vez de estirar la tabla.
  if (columna === 'factores') return <span className="block w-80 whitespace-normal">{formatearValor(columna, valor)}</span>
  return <>{formatearValor(columna, valor)}</>
}

export function TablaResultado({ filas, columnas }: TablaResultadoProps) {
  if (filas.length === 0) return null
  const visibles = columnas ?? Object.keys(filas[0])
  const esNumerica = (columna: string) => filas.some((fila) => typeof fila[columna] === 'number')

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            {visibles.map((columna) => (
              <th key={columna} scope="col" className={`whitespace-nowrap px-3 py-2 font-medium ${esNumerica(columna) ? 'text-right' : ''}`}>
                {etiquetaColumna(columna)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 text-neutral-700 dark:divide-neutral-800 dark:text-neutral-300">
          {filas.map((fila, indice) => (
            <tr key={indice}>
              {visibles.map((columna) => (
                <td key={columna} className={`px-3 py-2 ${esNumerica(columna) ? 'whitespace-nowrap text-right tabular-nums' : ''}`}>
                  <Celda columna={columna} valor={fila[columna]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
