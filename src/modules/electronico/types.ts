import type { ImagenProducto } from '@/modules/inventario/types'

export type EstadoTemporadaPublica = 'PROXIMA' | 'VIGENTE' | 'FINALIZADA'

export interface CategoriaTemporadaPublica {
  id: number
  nombre: string
}

export interface TemporadaPublica {
  id: number
  nombre: string
  fechaInicio: string
  fechaFin: string
  descripcion: string | null
  estado: EstadoTemporadaPublica
  categorias: CategoriaTemporadaPublica[]
}

export interface SucursalPublica {
  id: number
  nombre: string
  ubicacion: string
  telefono: string | null
  correo: string | null
  horarioApertura: string | null
  horarioCierre: string | null
  ciudadNombre: string
  departamentoNombre: string
}

export interface Notificacion {
  id: number
  idUsuario: number
  destinatario: string
  titulo: string
  mensaje: string
  leido: boolean
  fechaEnvio: string
}

export interface NotificacionesQuery {
  page?: number
  limit?: number
  idUsuario?: number
  leido?: boolean
  search?: string
  fechaDesde?: string
  fechaHasta?: string
}

export interface NotificacionesPaginatedResponse {
  items: Notificacion[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface EnvioNotificacionResponse {
  cantidadEnviada: number
}

export interface Destinatario {
  id: number
  nombre: string
  apellido: string
  email: string
  etiqueta: string
}

export type DestinatarioTipo = 'CLIENTES' | 'USUARIO'

export interface NotificacionFormValues {
  titulo: string
  mensaje: string
  destinatario: DestinatarioTipo
  idUsuario: string
}

export interface VarianteDetalle {
  id: number
  sku: string
  talla: string
  color: string
  corte: string
  /** Unidades que se pueden comprar en línea; 0 = agotado. */
  stockDisponible: number
}

export interface ProductoDetalle {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  descuentoPorcentaje: number
  /** Precio con el descuento ya aplicado. */
  precioFinal: number
  categoriaId: number
  categoriaNombre: string
  imagenes: ImagenProducto[]
  variantes: VarianteDetalle[]
}

export interface ItemCarrito {
  id: number
  idVarianteProducto: number
  idProducto: number
  productoNombre: string
  sku: string
  talla: string
  color: string
  corte: string
  imagenUrl: string | null
  precioUnitario: number
  cantidad: number
  subtotal: number
  notasEspeciales: string | null
  stockDisponible: number
  /** false si el stock ya no alcanza para la cantidad del carrito. */
  disponible: boolean
}

export interface Carrito {
  id: number | null
  /** Sucursal de la que sale el stock al pagar; null en el mismo caso que `id`. */
  idSucursal: number | null
  items: ItemCarrito[]
  cantidadTotal: number
  total: number
  fechaActualizacion: string | null
}

export type EstadoReserva = 'PENDIENTE' | 'PAGADA' | 'CANCELADA' | 'COMPLETADA'

export interface DetalleReserva {
  id: number
  idVarianteProducto: number
  idProducto: number
  productoNombre: string
  sku: string
  talla: string
  color: string
  corte: string
  precioUnitario: number
  cantidad: number
  subtotal: number
}

export interface PagoReserva {
  id: number
  concepto: 'PAGO_TOTAL' | 'ANTICIPO_RESERVA' | 'SALDO_LIQUIDACION' | 'REEMBOLSO'
  monto: number
  pasarelaMetodo: string | null
  fechaPago: string
  horaPago: string
}

export interface Reserva {
  id: number
  codigoReserva: string
  idCliente: number
  clienteNombre: string
  idSucursal: number
  sucursalNombre: string
  fechaReserva: string
  fechaLimite: string
  estado: EstadoReserva
  montoAnticipo: number
  montoTotal: number
  anticipoPagado: number
  saldoPendiente: number
  observaciones: string | null
  idNotaVenta: number | null
  codigoNotaVenta: string | null
  /** La lista del personal no trae las líneas; el detalle sí. */
  detalles: DetalleReserva[]
  pagos: PagoReserva[]
}

export interface ReservasQuery {
  page: number
  limit: number
  search?: string
  estado?: EstadoReserva
  idSucursal?: number
}

export interface ReservasPaginatedResponse {
  items: Reserva[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LineaReservaInput {
  idVarianteProducto: number
  cantidad: number
}

export interface CrearReservaInput {
  idCliente?: number
  idSucursal?: number
  items: LineaReservaInput[]
  montoAnticipo?: number
  horasLimite?: number
  observaciones?: string
}

// --- Checkout del carrito (CU14) ---

export type CodigoMetodoOnline = 'QR' | 'PAYPAL' | 'TARJETA'

export interface MetodoPagoOnline {
  id: number
  codigo: CodigoMetodoOnline
  metodo: string
  descripcion: string | null
  /** true cuando no hay pasarela real y el pago se aprueba en simulación (solo demostración). */
  simulado: boolean
}

export interface IniciarPaypalRespuesta {
  orderId: string
  urlAprobacion: string
  montoBob: number
  montoPaypal: number
  monedaPaypal: string
}

export interface IniciarQrRespuesta {
  referencia: string
  montoBob: number
  expiraEn: string
}

/** Resultado de un pago en línea: una compra del carrito o el anticipo de una reserva. */
export interface CompraOnline {
  tipo: 'COMPRA' | 'ANTICIPO_RESERVA'
  idNotaVenta: number | null
  codigoNota: string | null
  idReserva: number | null
  codigoReserva: string | null
  /** Lo que se cobró: el total de la compra o el anticipo. */
  montoTotal: number
  metodo: string
}

export interface DatosTarjeta {
  titular: string
  numero: string
  vencimiento: string
  cvv: string
}

// --- Probador virtual (CU19) ---

export interface ProbadorImagen {
  id: number
  url: string
  esPrincipal: boolean
  orden: number
}

/** Qué parte del cuerpo usa el probador virtual para anclar el modelo 3D (viene de la categoría del producto). */
export type ZonaProbador = 'SUPERIOR' | 'INFERIOR' | 'COMPLETO'

export interface ProbadorVariante {
  id: number
  sku: string
  talla: string
  color: string
  corte: string
  /** Enlace opcional al modelo 3D registrado en VARIANTE_PRODUCTO. */
  modelo3dUrl: string | null
  zonaProbador: ZonaProbador
  producto: {
    id: number
    nombre: string
    descripcion: string | null
  }
  imagenes: ProbadorImagen[]
}
