import useSWR from 'swr'
import { fetchTemporadasPublicas } from '../api'
import type { TemporadaPublica } from '../types'

export function useTemporadasPublicas() {
  const { data, isLoading } = useSWR<TemporadaPublica[]>('electronico/temporadas', fetchTemporadasPublicas, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return { temporadas: data ?? [], isLoading }
}
