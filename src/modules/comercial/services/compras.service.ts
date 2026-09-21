import { httpClient } from '@/core/http/httpClient'
import { unwrap, type Envelope } from '@/core/http/envelope'
import type { Compra, CompraFormValues, ComprasPaginatedResponse, ComprasQuery } from '../types'

export async function listarCompras(query: ComprasQuery): Promise<ComprasPaginatedResponse> {
  const response = await httpClient.get<Envelope<ComprasPaginatedResponse>>('/comercial/compras', { params: query })
  return unwrap(response)
}

export async function obtenerCompra(id: number): Promise<Compra> {
  const response = await httpClient.get<Envelope<Compra>>(`/comercial/compras/${id}`)
  return unwrap(response)
}

export async function registrarCompra(values: CompraFormValues): Promise<Compra> {
  const response = await httpClient.post<Envelope<Compra>>('/comercial/compras', {
    idProveedor: values.idProveedor,
    idSucursal: values.idSucursal,
    nroFactura: values.nroFactura.trim() || undefined,
    fechaEntregaProgramada: values.fechaEntregaProgramada || undefined,
    pagarEnCaja: values.pagarEnCaja,
    // Cada variante marcada es una línea del backend, con el almacén de su producto.
    detalles: values.productos.flatMap((producto) =>
      producto.variantes.map((variante) => ({
        idVarianteProducto: variante.idVarianteProducto,
        idAlmacen: producto.idAlmacen,
        cantidad: Number(variante.cantidad),
        precioUnitario: Number(variante.precioUnitario),
        nroLote: variante.nroLote.trim() || undefined,
      })),
    ),
  })
  return unwrap(response)
}
