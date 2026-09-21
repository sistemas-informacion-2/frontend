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

/** Pago recibido por internet durante el turno; no pasa por el cajón, así que no suma al efectivo esperado. */
export interface CobroEnLinea {
  id: number
  concepto: string
  monto: number
  metodo: string | null
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
  totalCobrosEnLinea: number
  cobrosEnLinea: CobroEnLinea[]
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

export interface DetalleCompra {
  id: number
  idVarianteProducto: number
  sku: string
  productoNombre: string
  talla: string
  color: string
  idAlmacen: number
  almacenNombre: string
  precioUnitario: number
  cantidad: number
  subtotal: number
  nroLote: string | null
}

export interface Compra {
  id: number
  idProveedor: number
  proveedorNombre: string
  idSucursal: number
  sucursalNombre: string
  idMovimientoCaja: number | null
  nroFactura: string | null
  fechaEmision: string
  fechaEntregaProgramada: string | null
  fechaPago: string | null
  subtotal: number
  total: number
  estado: string
  cantidadLineas: number
  /** Vacío en los listados; solo el detalle de una compra trae sus líneas. */
  detalles: DetalleCompra[]
}

export interface ComprasPaginatedResponse {
  items: Compra[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface ComprasQuery {
  page: number
  limit: number
  idProveedor?: number
  idSucursal?: number
  nroFactura?: string
  fechaDesde?: string
  fechaHasta?: string
}

/** Una variante marcada dentro de un producto: cada una se guarda como una línea de la compra. */
export interface CompraVarianteFormValues {
  idVarianteProducto: number
  cantidad: string
  precioUnitario: string
  nroLote: string
}

/** Un producto con el almacén de destino y las variantes (tallas/colores) que se compran de él. */
export interface CompraProductoFormValues {
  idProducto: number | ''
  idAlmacen: number | ''
  variantes: CompraVarianteFormValues[]
}

export interface CompraFormValues {
  idProveedor: number | ''
  idSucursal: number | ''
  nroFactura: string
  fechaEntregaProgramada: string
  pagarEnCaja: boolean
  productos: CompraProductoFormValues[]
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
  /** Método con el que se pagó (PayPal, QR, Efectivo...). */
  pasarelaMetodo: string | null
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
  idPasarela: number | ''
  descuento: string
  impuesto: string
  nitRazonSocial: string
  items: VentaItemForm[]
}

// --- Devoluciones (CU24) ---

export type TipoDevolucion = 'PRODUCTO_ENTREGADO' | 'CANCELACION_RESERVA'
export type MotivoDevolucion = 'FALLA_FABRICA' | 'TALLA_INCORRECTA' | 'ARREPENTIMIENTO' | 'CANCELACION'
export type EstadoProductoDevolucion = 'REINGRESO_INVENTARIO' | 'MERMA_DEFECTUOSO' | 'NO_APLICA'

export interface LineaOrigenDevolucion {
  idVarianteProducto: number
  sku: string
  descripcion: string
  precioReembolsable: number
  cantidadComprada: number
  cantidadDevuelta: number
  cantidadDisponible: number
}

export interface OrigenDevolucion {
  tipoDevolucion: TipoDevolucion
  idNotaVenta: number | null
  idReserva: number | null
  codigo: string
  idCliente: number
  clienteNombre: string
  idSucursal: number
  sucursalNombre: string
  fecha: string
  plazoDias: number
  dentroDePlazo: boolean
  montoReembolsable: number
  lineas: LineaOrigenDevolucion[]
}

export interface DetalleDevolucion {
  id: number
  idVarianteProducto: number | null
  sku: string | null
  productoNombre: string | null
  descripcion: string
  idAlmacen: number | null
  almacenNombre: string | null
  precioUnitario: number
  cantidad: number
  montoSubtotal: number
  estadoProducto: EstadoProductoDevolucion
}

export interface Devolucion {
  id: number
  codigoDevolucion: string
  tipoDevolucion: TipoDevolucion
  motivoDevolucion: MotivoDevolucion
  idCliente: number
  clienteNombre: string
  idSucursal: number
  sucursalNombre: string
  idCajero: number
  cajeroNombre: string
  idNotaVenta: number | null
  codigoNota: string | null
  idReserva: number | null
  codigoReserva: string | null
  idMovimientoCaja: number | null
  montoTotalReembolsado: number
  observaciones: string | null
  fechaEmision: string
  detalles: DetalleDevolucion[]
}

export interface DevolucionesQuery {
  page: number
  limit: number
  search?: string
  tipoDevolucion?: TipoDevolucion
  idSucursal?: number
}

export interface DevolucionesPaginatedResponse {
  items: Devolucion[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface ItemDevolucionInput {
  idVarianteProducto: number
  cantidad: number
  idAlmacen?: number
  estadoProducto: Exclude<EstadoProductoDevolucion, 'NO_APLICA'>
}

export interface CrearDevolucionInput {
  codigoNota?: string
  codigoReserva?: string
  idSucursal?: number
  idCajero?: number
  idPasarela?: number
  motivoDevolucion: MotivoDevolucion
  observaciones?: string
  autorizarFueraDePlazo?: boolean
  items?: ItemDevolucionInput[]
}
