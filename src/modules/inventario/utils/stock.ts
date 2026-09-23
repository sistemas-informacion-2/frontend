import type { InventarioItem } from '../types'

/**
 * Suma el stock disponible de una misma variante repartido en varios almacenes de una sucursal y deja solo las
 * que tienen unidades. Sirve para ofrecer variantes al vender o reservar sin que la persona tenga que saber en
 * qué almacén está cada una: el servidor decide de dónde sale.
 */
export function agruparStockPorVariante(items: InventarioItem[]): InventarioItem[] {
  const porVariante = new Map<number, InventarioItem>()
  for (const item of items) {
    const acumulado = porVariante.get(item.idVarianteProducto)
    porVariante.set(
      item.idVarianteProducto,
      acumulado ? { ...acumulado, stockDisponible: acumulado.stockDisponible + item.stockDisponible } : item,
    )
  }
  return [...porVariante.values()].filter((item) => item.stockDisponible > 0)
}
