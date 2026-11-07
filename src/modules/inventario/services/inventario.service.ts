import { httpClient } from '@/core/http/httpClient'
import type {
  AjusteStockFormValues,
  InventarioItem,
  InventarioPaginatedResponse,
  InventarioQuery,
  StockFormValues,
  Transferencia,
  TransferenciaStockFormValues,
} from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

function toQueryString(query: InventarioQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  })
  if (query.idAlmacen !== undefined) params.set('idAlmacen', String(query.idAlmacen))
  if (query.idSucursal !== undefined) params.set('idSucursal', String(query.idSucursal))
  if (query.search) params.set('search', query.search)
  if (query.bajoMinimo !== undefined) params.set('bajoMinimo', String(query.bajoMinimo))
  return params.toString()
}

export async function listarStock(query: InventarioQuery): Promise<InventarioPaginatedResponse> {
  const response = await httpClient.get<Envelope<InventarioPaginatedResponse>>(
    `/inventario/stock?${toQueryString(query)}`,
  )
  return response.data.data
}

export async function registrarStock(values: StockFormValues): Promise<InventarioItem> {
  const response = await httpClient.post<Envelope<InventarioItem>>('/inventario/stock', {
    idAlmacen: Number(values.idAlmacen),
    idVarianteProducto: Number(values.idVarianteProducto),
    stockDisponible: Number(values.stockDisponible || 0),
    stockMinimo: Number(values.stockMinimo || 0),
    stockMaximo: Number(values.stockMaximo || 0),
  })
  return response.data.data
}

export async function actualizarStock(
  id: number,
  values: { stockMinimo: number; stockMaximo: number },
): Promise<InventarioItem> {
  const response = await httpClient.put<Envelope<InventarioItem>>(`/inventario/stock/${id}`, values)
  return response.data.data
}

export async function ajustarStock(id: number, values: AjusteStockFormValues): Promise<InventarioItem> {
  const response = await httpClient.patch<Envelope<InventarioItem>>(`/inventario/stock/${id}/ajuste`, {
    tipo: values.tipo,
    cantidad: Number(values.cantidad || 0),
    motivo: values.motivo || undefined,
  })
  return response.data.data
}

/** Mueve unidades disponibles de la fila `item` (su almacen) a otro almacen; queda en el kardex de los dos. */
export async function transferirStock(
  item: Pick<InventarioItem, 'idAlmacen' | 'idVarianteProducto'>,
  values: TransferenciaStockFormValues,
): Promise<Transferencia> {
  const response = await httpClient.post<Envelope<Transferencia>>('/inventario/transferencias', {
    idAlmacenOrigen: item.idAlmacen,
    idAlmacenDestino: Number(values.idAlmacenDestino),
    idVarianteProducto: item.idVarianteProducto,
    cantidad: Number(values.cantidad || 0),
    motivo: values.motivo.trim() || undefined,
  })
  return response.data.data
}
