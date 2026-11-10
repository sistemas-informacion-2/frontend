import type { EstadoEmpresa } from '@/core/tenant/empresaStore'
import type { CodigoPlan } from '@/modules/plataforma/portal/types'
import type { EstadoVigencia } from '@/modules/suscripcion/types'

export type { EstadoEmpresa }

export interface Empresa {
  id: number
  slug: string
  nombre: string
  razonSocial: string | null
  nit: string | null
  pais: string
  ciudad: string | null
  direccion: string | null
  telefono: string | null
  logoUrl: string | null
  colorPrimario: string | null
  estado: EstadoEmpresa
  plan: { codigo: CodigoPlan; nombre: string }
  planVenceEl: string | null
  vigencia: EstadoVigencia
  fechaCreacion: string
}

export interface CrearEmpresaPayload {
  slug: string
  nombre: string
  razonSocial?: string
  nit?: string
  ciudad?: string
  codigoPlan?: CodigoPlan
  sinVencimiento?: boolean
  admin: { nombre: string; apellido: string; email: string; password: string }
}

export interface ActualizarEmpresaPayload {
  nombre?: string
  razonSocial?: string
  nit?: string
  ciudad?: string
  logoUrl?: string
  colorPrimario?: string
}

/** venceEl: AAAA-MM-DD (vale hasta el final de ese dia) o null = no vence. */
export interface CambiarPlanPayload {
  codigoPlan: CodigoPlan
  venceEl: string | null
}
