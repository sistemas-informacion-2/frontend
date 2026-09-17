interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md border border-neutral-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700"
      >
        Anterior
      </button>
      <span className="text-neutral-500 dark:text-neutral-400">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md border border-neutral-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700"
      >
        Siguiente
      </button>
    </div>
  )
}
