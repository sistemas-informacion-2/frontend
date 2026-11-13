import type { FormatoColumna } from '../reportes.types'

const FORMATO_MONTO =new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatearMonto(valor: number): string {
  return `Bs ${FORMATO_MONTO.format(valor)}`
}

/** Una celda de reporte según el formato de su columna: el dinero como "Bs 1.234,56", los números con separador de miles. */
export function formatearCeldaReporte(valor: string | number | boolean | null | undefined, formato?: FormatoColumna): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  if (typeof valor === 'number') {
    return formato === 'MONEDA' ? formatearMonto(valor) : valor.toLocaleString('es-BO', { maximumFractionDigits: 2 })
  }
  return String(valor)
}

/** Los números y el dinero se alinean a la derecha, para comparar cifras de un vistazo. */
export function esColumnaNumerica(formato?: FormatoColumna): boolean {
  return formato === 'NUMERO' || formato === 'MONEDA'
}

/** `2026-09-21` → `21/09` (la fecha llega como texto para no depender de la zona horaria). */
export function formatearDiaMes(fecha: string): string {
  const [, mes, dia] = fecha.split('-')
  return `${dia}/${mes}`
}
