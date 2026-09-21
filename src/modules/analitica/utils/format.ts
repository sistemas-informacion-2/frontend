const FORMATO_MONTO = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatearMonto(valor: number): string {
  return `Bs ${FORMATO_MONTO.format(valor)}`
}

/** `2026-09-21` → `21/09` (la fecha llega como texto para no depender de la zona horaria). */
export function formatearDiaMes(fecha: string): string {
  const [, mes, dia] = fecha.split('-')
  return `${dia}/${mes}`
}
