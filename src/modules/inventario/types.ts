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
  codigoHexColor: string | null
  modelo3dUrl: string | null
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
  sucursalId: number | null
  sucursalNombre: string | null
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
  codigoHexColor: string
  modelo3dUrl: string
  activo: boolean
}

export interface ProductoFormValues {
  idCategoria: number | ''
  idSucursal: number | ''
  nombre: string
  descripcion: string
  precio: string
  activo: boolean
  imagenes: ImagenProductoFormValues[]
  variantes: VarianteProductoFormValues[]
}
