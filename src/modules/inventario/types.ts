export interface TemporadaResumen {
  id: number
  nombre: string
}

export interface Categoria {
  id: number
  nombre: string
  slug: string
  descripcion: string | null
  imagenUrl: string | null
  activo: boolean
  categoriaPadreId: number | null
  temporadas: TemporadaResumen[]
  hijos: Categoria[]
}

export interface CategoriaFormValues {
  nombre: string
  slug: string
  descripcion: string
  imagenUrl: string
  categoriaPadreId: number | ''
  activo: boolean
  temporadaIds: number[]
}

export interface CategoriaPlana {
  id: number
  nombre: string
  nivel: number
}

export interface Proveedor {
  id: number
  empresa: string
  nit: string
  nombreContacto: string | null
  telefonoContacto: string | null
  correoContacto: string | null
  activo: boolean
}

export interface ProveedorFormValues {
  empresa: string
  nit: string
  nombreContacto: string
  telefonoContacto: string
  correoContacto: string
  activo: boolean
}

export interface ProveedoresQuery {
  search?: string
  activo?: boolean
}

export type EstadoTemporada = 'PROXIMA' | 'VIGENTE' | 'FINALIZADA'

export interface Temporada {
  id: number
  nombre: string
  fechaInicio: string
  fechaFin: string
  descripcion: string | null
  estado: EstadoTemporada
}

export interface TemporadaFormValues {
  nombre: string
  fechaInicio: string
  fechaFin: string
  descripcion: string
}

export interface ImagenProducto {
  id: number
  url: string
  esPrincipal: boolean
  orden: number
}

export interface VarianteProducto {
  id: number
  sku: string
  talla: string
  color: string
  corte: string
  activo: boolean
}

export interface SucursalActiva {
  id: number
  nombre: string
  activo: boolean
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  descuentoPorcentaje: number
  activo: boolean
  categoriaId: number
  categoriaNombre: string
  sucursales: SucursalActiva[]
  imagenes: ImagenProducto[]
  variantes: VarianteProducto[]
}

export interface ProductosQuery {
  page: number
  limit: number
  search?: string
  idCategoria?: number
  idTemporada?: number
  idSucursal?: number
  activo?: boolean
}

export interface ProductosPaginatedResponse {
  items: Producto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ImagenProductoFormValues {
  url: string
  esPrincipal: boolean
  orden: number | ''
}

export interface VarianteProductoFormValues {
  sku: string
  talla: string
  color: string
  corte: string
  activo: boolean
}

export interface ProductoFormValues {
  idCategoria: number | ''
  nombre: string
  descripcion: string
  precio: string
  descuentoPorcentaje: string
  activo: boolean
  sucursalIds: number[]
  imagenes: ImagenProductoFormValues[]
  variantes: VarianteProductoFormValues[]
}

export interface Almacen {
  id: number
  idSucursal: number
  sucursalNombre: string
  nombre: string
  ubicacionFisica: string | null
  activo: boolean
  cantidadVariantes: number
}

export interface AlmacenesQuery {
  search?: string
  idSucursal?: number
  activo?: boolean
}

export interface AlmacenFormValues {
  idSucursal: number | ''
  nombre: string
  ubicacionFisica: string
  activo: boolean
}

export interface InventarioItem {
  id: number
  idAlmacen: number
  almacenNombre: string
  idSucursal: number
  sucursalNombre: string
  idVarianteProducto: number
  sku: string
  productoNombre: string
  talla: string
  color: string
  /** Precio de lista. */
  precio: number
  /** Precio que se cobra hoy, con el descuento del producto. */
  precioVenta: number
  stockDisponible: number
  stockReservado: number
  stockMinimo: number
  stockMaximo: number
  bajoMinimo: boolean
}

/** Tipos de movimiento del kardex (backend: movimiento-inventario.entity.ts). */
export type TipoMovimientoInventario =
  | 'SALDO_INICIAL'
  | 'ENTRADA_COMPRA'
  | 'SALIDA_VENTA'
  | 'RESERVA'
  | 'LIBERACION_RESERVA'
  | 'SALIDA_RESERVA'
  | 'DEVOLUCION_REINGRESO'
  | 'MERMA'
  | 'AJUSTE_ENTRADA'
  | 'AJUSTE_SALIDA'
  | 'TRANSFERENCIA_SALIDA'
  | 'TRANSFERENCIA_ENTRADA'

/** Una linea del kardex de una fila de stock (GET /inventario/stock/:id/movimientos). */
export interface MovimientoInventario {
  id: number
  tipo: TipoMovimientoInventario
  /** Cambio del stock disponible: positivo entra, negativo sale. */
  cantidad: number
  /** Cambio del stock reservado (reservas). */
  deltaReservado: number
  stockResultante: number
  reservadoResultante: number
  /** Costo por unidad: precio de compra en entradas, costo promedio en salidas. */
  costoUnitario: number | null
  referenciaTipo: string | null
  referenciaId: number | null
  /** NV-000123, NC-45 · Fact. 8812, TR-7...; null en ajustes y saldo inicial. */
  referenciaCodigo: string | null
  idUsuario: number | null
  /** null si lo hizo el sistema (p. ej. una reserva que vencio sola). */
  usuarioNombre: string | null
  motivo: string | null
  fechaHora: string
}

/** Rango opcional del kardex (AAAA-MM-DD, hora de Bolivia). Sin rango: los ultimos movimientos. */
export interface MovimientosQuery {
  desde?: string
  hasta?: string
}

export interface InventarioQuery {
  page: number
  limit: number
  idAlmacen?: number
  idSucursal?: number
  search?: string
  bajoMinimo?: boolean
}

export interface InventarioPaginatedResponse {
  items: InventarioItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface StockFormValues {
  idAlmacen: number | ''
  idProducto: number | ''
  idVarianteProducto: number | ''
  stockDisponible: string
  stockMinimo: string
  stockMaximo: string
}

export type TipoAjusteStock = 'ENTRADA' | 'SALIDA' | 'AJUSTE'

export interface AjusteStockFormValues {
  tipo: TipoAjusteStock
  cantidad: string
  motivo: string
}

export interface TransferenciaStockFormValues {
  idAlmacenDestino: string
  cantidad: string
  motivo: string
}

export interface Transferencia {
  id: number
  almacenOrigen: { id: number; nombre: string; sucursal: string }
  almacenDestino: { id: number; nombre: string; sucursal: string }
  idVarianteProducto: number
  sku: string
  productoNombre: string
  cantidad: number
  motivo: string | null
  idUsuario: number | null
  fechaHora: string
}
