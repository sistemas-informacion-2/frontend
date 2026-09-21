import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { CrearReservaInput, Reserva, ReservasPaginatedResponse, ReservasQuery } from '../types'

// --- Personal (permiso electronico:reservas:gestionar) ---

export async function listarReservas(query: ReservasQuery): Promise<ReservasPaginatedResponse> {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) })
  if (query.search) params.set('search', query.search)
  if (query.estado) params.set('estado', query.estado)
  if (query.idSucursal !== undefined) params.set('idSucursal', String(query.idSucursal))
  return unwrap(await httpClient.get<Envelope<ReservasPaginatedResponse>>(`/electronico/reservas?${params.toString()}`))
}

export async function obtenerReserva(id: number): Promise<Reserva> {
  return unwrap(await httpClient.get<Envelope<Reserva>>(`/electronico/reservas/${id}`))
}

export async function crearReserva(input: CrearReservaInput): Promise<Reserva> {
  return unwrap(await httpClient.post<Envelope<Reserva>>('/electronico/reservas', input))
}

export async function cobrarAnticipoReserva(id: number, idPasarela: number): Promise<Reserva> {
  return unwrap(await httpClient.post<Envelope<Reserva>>(`/electronico/reservas/${id}/anticipo`, { idPasarela }))
}

export interface LiquidarReservaInput {
  idPasarela?: number
  nitRazonSocial?: string
  nroFactura?: string
}

export async function liquidarReserva(id: number, input: LiquidarReservaInput): Promise<Reserva> {
  return unwrap(await httpClient.post<Envelope<Reserva>>(`/electronico/reservas/${id}/liquidar`, input))
}

export async function cancelarReserva(id: number, motivo?: string): Promise<Reserva> {
  return unwrap(await httpClient.post<Envelope<Reserva>>(`/electronico/reservas/${id}/cancelar`, { motivo }))
}

// --- Cliente autenticado ---

export async function fetchMisReservas(): Promise<Reserva[]> {
  return unwrap(await httpClient.get<Envelope<Reserva[]>>('/electronico/reservas/mias'))
}

export async function fetchMiReserva(id: number): Promise<Reserva> {
  return unwrap(await httpClient.get<Envelope<Reserva>>(`/electronico/reservas/mias/${id}`))
}

export async function crearMiReserva(input: Omit<CrearReservaInput, 'idCliente'>): Promise<Reserva> {
  return unwrap(await httpClient.post<Envelope<Reserva>>('/electronico/reservas/mias', input))
}

export async function cancelarMiReserva(id: number, motivo?: string): Promise<Reserva> {
  return unwrap(await httpClient.post<Envelope<Reserva>>(`/electronico/reservas/mias/${id}/cancelar`, { motivo }))
}
