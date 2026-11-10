import type { EstadoEmpresa } from '@/core/tenant/empresaStore'

export type { EstadoEmpresa }

export interface Empresa {
  id: number
  slug: string
  nombre: string
  razonSocial: string | null
  nit: string | null
  logoUrl: string | null
  colorPrimario: string | null
  estado: EstadoEmpresa
  fechaCreacion: string
}

export interface CrearEmpresaPayload {
  slug: string
  nombre: string
  razonSocial?: string
  nit?: string
  admin: { nombre: string; apellido: string; email: string; password: string }
}

export interface ActualizarEmpresaPayload {
  nombre?: string
  razonSocial?: string
  nit?: string
  logoUrl?: string
  colorPrimario?: string
}
