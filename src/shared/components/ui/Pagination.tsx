import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Con `total` y `limit` se muestra el recuento de registros. */
  total?: number
  limit?: number
}

/** Páginas visibles: primera, última y las vecinas de la actual; `null` marca un salto. */
function paginasVisibles(page: number, totalPages: number): Array<number | null> {
  const numeros = [...new Set([1, page - 1, page, page + 1, totalPages])].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  return numeros.flatMap((numero, indice) => (indice > 0 && numero - numeros[indice - 1] > 1 ? [null, numero] : [numero]))
}

const BOTON = 'flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40'
const INACTIVO = 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'

export function Pagination({ page, totalPages, onPageChange, total, limit }: PaginationProps) {
  const conRecuento = total !== undefined && limit !== undefined && total > 0
  if (totalPages <= 1 && !conRecuento) return null

  return (
    <nav aria-label="Paginación" className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200 px-1 pt-4 sm:flex-row dark:border-neutral-800">
      {conRecuento ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total} resultados
        </p>
      ) : (
        <span />
      )}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Página anterior" className={`${BOTON} ${INACTIVO}`}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          {paginasVisibles(page, totalPages).map((numero, indice) =>
            numero === null ? (
              <span key={`salto-${indice}`} className="px-1 text-neutral-400" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={numero}
                type="button"
                onClick={() => onPageChange(numero)}
                aria-current={numero === page ? 'page' : undefined}
                aria-label={`Página ${numero}`}
                className={`${BOTON} ${numero === page ? 'bg-brand-solid text-brand-on' : INACTIVO}`}
              >
                {numero}
              </button>
            ),
          )}
          <button type="button" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} aria-label="Página siguiente" className={`${BOTON} ${INACTIVO}`}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  )
}
