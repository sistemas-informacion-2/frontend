import type { CategoriaMovimientoCaja, SubcategoriaGasto, TipoMovimientoCaja } from './types'

export const CATEGORIA_CAJA_LABEL: Record<CategoriaMovimientoCaja, string> = {
  VENTA: 'Venta',
  ANTICIPO_RESERVA: 'Anticipo de reserva',
  SALDO_RESERVA: 'Saldo de reserva',
  COMPRA: 'Compra',
  REEMBOLSO: 'Reembolso',
  GASTO_OPERATIVO: 'Gasto operativo',
  RETIRO: 'Retiro',
  APORTE: 'Aporte',
  OTRO_INGRESO: 'Otro ingreso',
  OTRO_EGRESO: 'Otro egreso',
}

export const SUBCATEGORIA_GASTO_LABEL: Record<SubcategoriaGasto, string> = {
  ALQUILER: 'Alquiler',
  SUELDOS: 'Sueldos',
  SERVICIOS: 'Servicios (luz, agua, internet)',
  MARKETING: 'Marketing',
  TRANSPORTE: 'Transporte',
  MANTENIMIENTO: 'Mantenimiento',
  OTROS: 'Otros',
}

/**
 * Las que el cajero puede elegir a mano, segun el tipo; ventas, reservas, compras y reembolsos las asigna el sistema.
 * Debe coincidir con CATEGORIAS_MANUALES del backend.
 */
export const CATEGORIAS_MANUALES: Record<TipoMovimientoCaja, CategoriaMovimientoCaja[]> = {
  INGRESO: ['APORTE', 'OTRO_INGRESO'],
  EGRESO: ['GASTO_OPERATIVO', 'RETIRO', 'OTRO_EGRESO'],
}

/** Etiqueta corta para el listado: "Gasto operativo · Alquiler". */
export function etiquetaCategoria(categoria: CategoriaMovimientoCaja, subcategoria: SubcategoriaGasto | null): string {
  const base = CATEGORIA_CAJA_LABEL[categoria]
  return subcategoria ? `${base} · ${SUBCATEGORIA_GASTO_LABEL[subcategoria].split(' (')[0]}` : base
}
