import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { SucursalPublica, TemporadaPublica } from '../types'

export async function fetchTemporadasPublicas(): Promise<TemporadaPublica[]> {
  const response = await httpClient.get<Envelope<TemporadaPublica[]>>('/inventario/temporadas/publicas')
  return unwrap(response)
}

export async function fetchSucursalesPublicas(): Promise<SucursalPublica[]> {
  const response = await httpClient.get<Envelope<SucursalPublica[]>>('/operaciones/sucursales/publicas')
  return unwrap(response)
}
