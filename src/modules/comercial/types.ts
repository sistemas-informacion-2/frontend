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

export type TipoNotaVenta = 'DIRECTA_PRESENCIAL' | 'ANTICIPO_RESERVA' | 'PRESENCIAL_LIQUIDACION' | 'E_COMMERCE'
export type ConceptoPago = 'PAGO_TOTAL' | 'ANTICIPO_RESERVA' | 'SALDO_LIQUIDACION' | 'REEMBOLSO'

export interface VentaDetalle {
  id: number
  idVarianteProducto: number | null
  sku: string | null
  productoNombre: string
  descripcion: string
  precioUnitario: number
  cantidad: number
  subtotal: number
}

export interface VentaPago {
  id: number
  idPasarela: number | null
  pasarelaMetodo: string | null
  monto: number
  concepto: ConceptoPago
  fechaPago: string
  horaPago: string
}

export interface Venta {
  id: number
  codigoNota: string
  idCliente: number
  clienteNombre: string
  idCajero: number | null
  cajeroNombre: string | null
  idSucursal: number
  sucursalNombre: string
  idPasarela: number | null
  idMovimientoCaja: number | null
  tipoVenta: TipoNotaVenta
  nroFactura: string | null
  nitRazonSocial: string | null
  fechaEmision: string
  horaEmision: string
  subtotal: number
  descuento: number
  impuesto: number
  montoTotal: number
  estadoPago: string
  detalles: VentaDetalle[]
  pagos: VentaPago[]
}

export interface VentasQuery {
  page: number
  limit: number
  search?: string
  idSucursal?: number
  idCajero?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface VentasPaginatedResponse {
  items: Venta[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface VentaItemForm {
  idVarianteProducto: number | ''
  cantidad: string
}

export interface VentaFormValues {
  idCliente: number | ''
  idSucursal: number | ''
  idAlmacen: number | ''
  idPasarela: number | ''
  descuento: string
  impuesto: string
  nitRazonSocial: string
  items: VentaItemForm[]
}
