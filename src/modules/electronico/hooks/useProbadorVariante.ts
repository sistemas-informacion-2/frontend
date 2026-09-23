import useSWR from 'swr'
import { fetchProbadorVariante } from '../api'
import type { ProbadorVariante } from '../types'

/** Assets de la variante para el probador virtual (CU19). Se conserva en caché por variante. */
export function useProbadorVariante(id: number) {
  const { data, error, isLoading } = useSWR<ProbadorVariante>(
    Number.isInteger(id) && id > 0 ? ['electronico/probador/variante', id] : null,
    () => fetchProbadorVariante(id),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  )
  return { variante: data, error, isLoading }
}