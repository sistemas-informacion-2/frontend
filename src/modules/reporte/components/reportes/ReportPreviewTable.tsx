import { Pagination } from '@/shared/components/ui/Pagination'
import type { ResultadoReporte } from '../../reportes.types'

interface ReportPreviewTableProps {
  resultado: ResultadoReporte
  pagina: number
  porPagina: number
  onCambiarPagina: (pagina: number) => void
}

function formatearCelda(valor: unknown): string {
  if (valor === null || valor === undefined) return '—'
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  if (typeof valor === 'number') {
    return valor.toLocaleString('es-BO', { maximumFractionDigits: 2 })
  }
  return String(valor)
}

/** Vista previa paginada del resultado del Report Builder. */
export function ReportPreviewTable({ resultado, pagina, porPagina, onCambiarPagina }: ReportPreviewTableProps) {
  const totalPaginas = Math.max(1, Math.ceil(resultado.total / porPagina))

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th className="py-3 pl-4 pr-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                #
              </th>
              {resultado.columnLabels.map((columna, indice) => (
                <th
                  key={`${columna}-${indice}`}
                  className="whitespace-nowrap py-3 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
                >
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {resultado.rows.map((fila, indice) => (
              <tr key={indice} className="text-neutral-800 dark:text-neutral-200">
                <td className="py-2.5 pl-4 pr-2 text-neutral-400 dark:text-neutral-500">
                  {(pagina - 1) * porPagina + indice + 1}
                </td>
                {fila.map((celda, columna) => (
                  <td key={`${columna}-${indice}`} className="whitespace-nowrap py-2.5 px-4">
                    {formatearCelda(celda)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Mostrando {resultado.rows.length} de {resultado.total} registros.
      </p>

      <Pagination page={pagina} totalPages={totalPaginas} onPageChange={onCambiarPagina} />
    </div>
  )
}