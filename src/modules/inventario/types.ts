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
  modelo3dUrl: string | null
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
  modelo3dUrl: string
  activo: boolean
}

export interface ProductoFormValues {
  idCategoria: number | ''
  nombre: string
  descripcion: string
  precio: string
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
  stockDisponible: number
  stockReservado: number
  stockMinimo: number
  stockMaximo: number
  bajoMinimo: boolean
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
