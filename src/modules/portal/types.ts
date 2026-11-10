export type CodigoPlan = 'PRUEBA' | 'EMPRENDEDOR' | 'PROFESIONAL' | 'EMPRESARIAL'

/** Un plan de DOMINATR (GET /plataforma/planes). Los limites en null son "sin limite". */
export interface Plan {
  codigo: CodigoPlan
  nombre: string
  descripcion: string
  /** En Bs por periodo. */
  precio: number
  duracionDias: number
  maxUsuarios: number | null
  maxSucursales: number | null
  maxAlmacenes: number | null
  reportesAvanzados: boolean
  bi: boolean
  esPrueba: boolean
  destacado: boolean
  capacidades: string[]
}

/** Paso 2 del registro. */
export interface EmpresaRegistro {
  razonSocial: string
  nombreComercial: string
  nit: string
  pais: string
  ciudad: string
  direccion: string
  telefono: string
  slug: string
}

/** Paso 3 del registro. */
export interface AdministradorRegistro {
  nombre: string
  apellido: string
  email: string
  telefono: string
  password: string
}

export interface RegistroPayload {
  codigoPlan: CodigoPlan
  empresa: {
    razonSocial: string
    nombreComercial?: string
    nit: string
    pais: string
    ciudad: string
    direccion?: string
    telefono?: string
    slug: string
  }
  admin: { nombre: string; apellido: string; email: string; telefono?: string; password: string }
}

export interface TiendaCreada {
  slug: string
  nombre: string
  adminEmail: string
  codigoPlan: CodigoPlan
  planNombre: string
  venceEl: string | null
}

/** Con la prueba gratuita viene `tienda`; con un plan de pago, `urlPago` (Stripe). */
export interface RegistroResponse {
  urlPago: string | null
  tienda: TiendaCreada | null
}

export interface SlugDisponible {
  slug: string
  disponible: boolean
  motivo: string | null
}

export interface TiendaDeUsuario {
  slug: string
  nombre: string
  logoUrl: string | null
  tipoUsuario: 'A' | 'E'
}
