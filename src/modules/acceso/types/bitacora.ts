export type OperacionBitacora = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface BitacoraUsuario {
  id: number
  nombre: string
  apellido: string
  email: string
}

export interface BitacoraRegistro {
  id: string
  usuarioId: number | null
  usuario: BitacoraUsuario | null
  accion: string
  operacion: OperacionBitacora | string
  tablaAfectada: string
  ipOrigen: string | null
  userAgent: string | null
  datosAnteriores: Record<string, unknown> | null
  datosNuevos: Record<string, unknown> | null
  fechaHora: string
}

export interface BitacoraQuery {
  page: number
  limit: number
  usuarioId?: number
  tablaAfectada?: string
  operacion?: OperacionBitacora
  fechaDesde?: string
  fechaHasta?: string
}

export interface BitacoraPaginatedResponse {
  items: BitacoraRegistro[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}