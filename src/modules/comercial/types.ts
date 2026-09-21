export type IntegracionPago = 'NINGUNA' | 'API'
export type OrigenCredenciales = 'PANEL' | 'NINGUNA'

export interface Pasarela {
  id: number
  codigo: string
  metodo: string
  descripcion: string | null
  integracion: IntegracionPago
  comisionPorcentaje: number
  disponiblePresencial: boolean
  disponibleLinea: boolean
  tieneApiKey: boolean
  origenCredenciales: OrigenCredenciales
}

export interface PasarelasQuery {
  search?: string
  integracion?: IntegracionPago
  disponiblePresencial?: boolean
  disponibleLinea?: boolean
}

export interface PasarelaFormValues {
  codigo: string
  metodo: string
  descripcion: string
  integracion: IntegracionPago
  comisionPorcentaje: string
  disponiblePresencial: boolean
  disponibleLinea: boolean
  apiKey: string
  apiSecret: string
}

export type EstadoCaja = 'Abierta' | 'Cerrada'
export type TipoMovimientoCaja = 'INGRESO' | 'EGRESO'

export interface MovimientoCaja {
  id: number
  idCaja: number
  tipo: TipoMovimientoCaja
  concepto: string
  monto: number
  observaciones: string | null
  fechaHora: string
}

export interface Caja {
  id: number
  idSucursal: number
  sucursalNombre: string
  idCajero: number | null
  cajeroNombre: string | null
  fechaApertura: string
  fechaCierre: string | null
  horaApertura: string
  horaCierre: string | null
  montoInicial: number
  montoFinal: number | null
  estado: EstadoCaja
  totalIngresos: number
  totalEgresos: number
  montoEsperado: number
  movimientos: MovimientoCaja[]
}

export interface CajasQuery {
  idSucursal?: number
  estado?: EstadoCaja
  fechaDesde?: string
  fechaHasta?: string
}

export interface AbrirCajaFormValues {
  idSucursal: number | ''
  montoInicial: string
}

export interface MovimientoCajaFormValues {
  tipo: TipoMovimientoCaja
  concepto: string
  monto: string
  observaciones: string
}
