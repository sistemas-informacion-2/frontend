import { httpClient } from '@/core/http/httpClient'
import type {
  AbrirCajaFormValues,
  Caja,
  CajasQuery,
  MovimientoCaja,
  MovimientoCajaFormValues,
} from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: CajasQuery = {}): string {
  const params = new URLSearchParams()
  if (query.idSucursal !== undefined) params.set('idSucursal', String(query.idSucursal))
  if (query.estado) params.set('estado', query.estado)
  if (query.fechaDesde) params.set('fechaDesde', query.fechaDesde)
  if (query.fechaHasta) params.set('fechaHasta', query.fechaHasta)
  const result = params.toString()
  return result ? `?${result}` : ''
}

export async function listarCajas(query: CajasQuery = {}): Promise<Caja[]> {
  const response = await httpClient.get<Envelope<Caja[]>>(`/comercial/cajas${toQueryString(query)}`)
  return response.data.data
}

export async function obtenerCajaAbierta(idSucursal: number): Promise<Caja | null> {
  const response = await httpClient.get<Envelope<Caja | null>>('/comercial/cajas/abierta', {
    params: { idSucursal },
  })
  return response.data.data
}

export async function abrirCaja(values: AbrirCajaFormValues): Promise<Caja> {
  const response = await httpClient.post<Envelope<Caja>>('/comercial/cajas', {
    idSucursal: Number(values.idSucursal),
    montoInicial: Number(values.montoInicial || 0),
  })
  return response.data.data
}

export async function cerrarCaja(id: number, montoFinal?: number): Promise<Caja> {
  const response = await httpClient.patch<Envelope<Caja>>(`/comercial/cajas/${id}/cerrar`, {
    ...(montoFinal !== undefined ? { montoFinal } : {}),
  })
  return response.data.data
}

export async function listarMovimientosCaja(idCaja: number): Promise<MovimientoCaja[]> {
  const response = await httpClient.get<Envelope<MovimientoCaja[]>>(`/comercial/cajas/${idCaja}/movimientos`)
  return response.data.data
}

export async function registrarMovimientoCaja(
  idCaja: number,
  values: MovimientoCajaFormValues,
): Promise<MovimientoCaja> {
  const response = await httpClient.post<Envelope<MovimientoCaja>>(`/comercial/cajas/${idCaja}/movimientos`, {
    tipo: values.tipo,
    concepto: values.concepto,
    monto: Number(values.monto || 0),
    observaciones: values.observaciones || undefined,
  })
  return response.data.data
}
