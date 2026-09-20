import { httpClient } from '@/core/http/httpClient'
import type {
  ImagenProductoFormValues,
  Producto,
  ProductoFormValues,
  ProductosPaginatedResponse,
  ProductosQuery,
  VarianteProductoFormValues,
} from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: ProductosQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  })

  if (query.search) params.set('search', query.search)
  if (query.idCategoria !== undefined) params.set('idCategoria', String(query.idCategoria))
  if (query.idTemporada !== undefined) params.set('idTemporada', String(query.idTemporada))
  if (query.idSucursal !== undefined) params.set('idSucursal', String(query.idSucursal))
  if (query.activo !== undefined) params.set('activo', String(query.activo))

  return params.toString()
}

function toVariantePayload(variante: VarianteProductoFormValues) {
  return {
    sku: variante.sku,
    talla: variante.talla,
    color: variante.color,
    corte: variante.corte,
    modelo3dUrl: variante.modelo3dUrl || undefined,
  }
}

function toImagenPayload(imagen: ImagenProductoFormValues) {
  return {
    url: imagen.url,
    esPrincipal: imagen.esPrincipal,
    orden: imagen.orden === '' ? undefined : imagen.orden,
  }
}

export async function listarProductos(query: ProductosQuery): Promise<ProductosPaginatedResponse> {
  const response = await httpClient.get<Envelope<ProductosPaginatedResponse>>(
    `/inventario/productos/todas?${toQueryString(query)}`,
  )
  return response.data.data
}

export async function obtenerProducto(id: number): Promise<Producto> {
  const response = await httpClient.get<Envelope<Producto>>(`/inventario/productos/${id}`)
  return response.data.data
}

export async function crearProducto(values: ProductoFormValues): Promise<Producto> {
  const response = await httpClient.post<Envelope<Producto>>('/inventario/productos', {
    idCategoria: values.idCategoria,
    nombre: values.nombre,
    descripcion: values.descripcion || undefined,
    precio: Number(values.precio),
    sucursalIds: values.sucursalIds,
    imagenes: values.imagenes.map(toImagenPayload),
    variantes: values.variantes.map(toVariantePayload),
  })
  return response.data.data
}

export async function actualizarProducto(id: number, values: ProductoFormValues): Promise<Producto> {
  const response = await httpClient.put<Envelope<Producto>>(`/inventario/productos/${id}`, {
    idCategoria: values.idCategoria,
    nombre: values.nombre,
    descripcion: values.descripcion || undefined,
    precio: Number(values.precio),
    activo: values.activo,
    sucursalIds: values.sucursalIds,
  })
  return response.data.data
}

export async function desactivarProducto(id: number): Promise<void> {
  await httpClient.delete(`/inventario/productos/${id}`)
}

export async function gestionarSucursalesProducto(idProducto: number, sucursalIds: number[]): Promise<Producto> {
  const response = await httpClient.put<Envelope<Producto>>(`/inventario/productos/${idProducto}/sucursales`, {
    sucursalIds,
  })
  return response.data.data
}

export async function agregarVariante(idProducto: number, variante: VarianteProductoFormValues): Promise<Producto> {
  const response = await httpClient.post<Envelope<Producto>>(
    `/inventario/productos/${idProducto}/variantes`,
    toVariantePayload(variante),
  )
  return response.data.data
}

export async function actualizarVariante(
  idProducto: number,
  idVariante: number,
  variante: VarianteProductoFormValues,
): Promise<Producto> {
  const response = await httpClient.put<Envelope<Producto>>(
    `/inventario/productos/${idProducto}/variantes/${idVariante}`,
    { ...toVariantePayload(variante), activo: variante.activo },
  )
  return response.data.data
}

export async function eliminarVariante(idProducto: number, idVariante: number): Promise<Producto> {
  const response = await httpClient.delete<Envelope<Producto>>(
    `/inventario/productos/${idProducto}/variantes/${idVariante}`,
  )
  return response.data.data
}

export async function agregarImagen(idProducto: number, imagen: ImagenProductoFormValues): Promise<Producto> {
  const response = await httpClient.post<Envelope<Producto>>(
    `/inventario/productos/${idProducto}/imagenes`,
    toImagenPayload(imagen),
  )
  return response.data.data
}

export async function actualizarImagen(
  idProducto: number,
  idImagen: number,
  imagen: Partial<ImagenProductoFormValues>,
): Promise<Producto> {
  const response = await httpClient.put<Envelope<Producto>>(`/inventario/productos/${idProducto}/imagenes/${idImagen}`, {
    ...(imagen.url !== undefined && { url: imagen.url }),
    ...(imagen.esPrincipal !== undefined && { esPrincipal: imagen.esPrincipal }),
    ...(imagen.orden !== undefined && imagen.orden !== '' && { orden: imagen.orden }),
  })
  return response.data.data
}

export async function eliminarImagen(idProducto: number, idImagen: number): Promise<Producto> {
  const response = await httpClient.delete<Envelope<Producto>>(`/inventario/productos/${idProducto}/imagenes/${idImagen}`)
  return response.data.data
}
