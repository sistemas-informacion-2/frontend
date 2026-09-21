export interface VentasDia {
  total: number
  cantidadNotas: number
  ticketPromedio: number
}

export interface StockCriticoItem {
  idInventario: number
  idSucursal: number
  sucursal: string
  almacen: string
  producto: string
  sku: string
  talla: string
  color: string
  stockDisponible: number
  stockMinimo: number
}

export interface TopVariante {
  idVariante: number
  sku: string
  producto: string
  talla: string
  color: string
  cantidadVendida: number
}

export interface VentasSucursal {
  idSucursal: number
  sucursal: string
  total: number
  cantidadNotas: number
}

export interface TendenciaVenta {
  fecha: string
  total: number
}

export interface DashboardResumen {
  fecha: string
  idSucursal: number | null
  dias: number
  /** false cuando las tablas de ventas (CU13) aun no existen en la base de datos. */
  ventasDisponibles: boolean
  ventasDia: VentasDia
  cajasAbiertas: number
  stockCritico: { total: number; items: StockCriticoItem[] }
  topVariantes: TopVariante[]
  ventasPorSucursal: VentasSucursal[]
  tendenciaVentas: TendenciaVenta[]
}

export interface DashboardQuery {
  /** Sin valor = Vista General (todas las sucursales). */
  idSucursal?: number
  dias?: number
}
