import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { DashboardQuery, DashboardResumen } from '../dashboard.types'

export async function obtenerResumenDashboard(query: DashboardQuery = {}): Promise<DashboardResumen> {
  const response = await httpClient.get<Envelope<DashboardResumen>>('/analitica/dashboard/resumen', { params: query })
  return unwrap(response)
}
