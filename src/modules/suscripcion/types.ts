import type { CodigoPlan, Plan } from '@/modules/portal/types'

export type EstadoVigencia = 'SIN_VENCIMIENTO' | 'VIGENTE' | 'POR_VENCER' | 'EN_GRACIA' | 'VENCIDO'
export type TipoPagoPlan = 'ALTA' | 'RENOVACION' | 'CAMBIO_PLAN'
export type EstadoPagoPlan = 'PENDIENTE' | 'PAGADO' | 'FALLIDO'

export interface PagoPlan {
  id: number
  tipo: TipoPagoPlan
  estado: EstadoPagoPlan
  monto: number
  planNombre: string
  periodoDesde: string | null
  periodoHasta: string | null
  fechaCreacion: string
  fechaPago: string | null
}

/** GET /suscripcion: el plan de la tienda, su vigencia y su uso. */
export interface MiPlan {
  plan: Plan
  venceEl: string | null
  vigencia: EstadoVigencia
  finDeGracia: string | null
  diasRestantes: number | null
  uso: { usuarios: number; sucursales: number; almacenes: number }
  puedeGestionar: boolean
  pagos: PagoPlan[]
}

export interface PagoIniciado {
  urlPago: string
  montoBob: number
  montoCobrado: number
  monedaCobro: string
}

export interface PagoConfirmado {
  codigoPlan: CodigoPlan
  planNombre: string
  venceEl: string | null
}
