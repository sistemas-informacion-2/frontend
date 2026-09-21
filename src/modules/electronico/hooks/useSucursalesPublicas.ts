import useSWR from 'swr'
import { fetchSucursalesPublicas } from '../api'
import type { SucursalPublica } from '../types'

export function useSucursalesPublicas() {
  const { data, isLoading } = useSWR<SucursalPublica[]>('electronico/sucursales', fetchSucursalesPublicas, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return { sucursales: data ?? [], isLoading }
}
