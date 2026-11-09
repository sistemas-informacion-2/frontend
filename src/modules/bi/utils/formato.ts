const ETIQUETAS: Record<string, string> = {
  grupo: 'Grupo',
  ventas: 'Ventas',
  unidades: 'Unidades',
  tickets: 'Tickets',
  margen: 'Margen',
  margen_pct: 'Margen %',
  costo: 'Costo',
  ticket_promedio: 'Ticket promedio',
  lineas_sin_costo: 'Líneas sin costo',
  descuento_producto: 'Descuento de producto',
  descuento_nota: 'Descuento de nota',
  descuento_total: 'Descuento total',
  descuento_pct: 'Descuento %',
  ventas_a: 'Período A',
  ventas_b: 'Período B',
  diferencia: 'Diferencia',
  aporte_pct: 'Aporte %',
  metrica: 'Métrica',
  periodo_a: 'Período A',
  periodo_b: 'Período B',
  variacion_pct: 'Variación %',
  unidades_vendidas: 'Vendidas',
  unidades_devueltas: 'Devueltas',
  monto_reembolsado: 'Reembolsado',
  tasa_pct: 'Tasa %',
  stock_disponible: 'Disponible',
  stock_reservado: 'Reservado',
  valor_costo: 'Valor a costo',
  costo_ventas: 'Costo de ventas',
  inventario_promedio: 'Inventario promedio',
  rotacion: 'Rotación',
  dias_inventario: 'Días de inventario',
  dias_sin_stock: 'Días sin stock',
  vendidas_90_dias: 'Vendidas (90 días)',
  dias_cobertura: 'Días de cobertura',
  valor_inmovilizado: 'Valor inmovilizado',
  demanda_esperada: 'Demanda esperada',
  stock_actual: 'Stock',
  stock_seguridad: 'Stock de seguridad',
  cantidad_sugerida: 'Comprar',
  id_cliente: 'Id',
  probabilidad: 'Probabilidad',
  producto_a: 'Si lleva',
  producto_b: 'También lleva',
  soporte: 'Soporte',
  confianza: 'Confianza',
  notas: 'Notas de venta',
  fecha: 'Fecha',
  valor_real: 'Tickets reales',
  valor_esperado: 'Tickets esperados',
  desviacion: 'Desviación',
  nombre_dia: 'Día',
  nombre_feriado: 'Feriado',
  ingresos: 'Ingresos',
  gastos_operativos: 'Gastos operativos',
  saldo: 'Saldo',
  monto: 'Monto',
  movimientos: 'Movimientos',
  clientes: 'Clientes',
  clientes_que_compraron: 'Compraron',
  clientes_nuevos: 'Nuevos',
  clientes_recurrentes: 'Recurrentes',
  recurrencia_pct: 'Recurrencia %',
  recencia_dias_promedio: 'Días desde su última compra',
  compras_promedio: 'Compras promedio',
  monto_promedio: 'Gasto promedio',
  periodo: 'Período',
  valor: 'Pronóstico',
  bajo: 'Mínimo',
  alto: 'Máximo',
  modelo: 'Modelo',
}

const MONTOS = new Set([
  'ventas', 'margen', 'costo', 'ticket_promedio', 'descuento_producto', 'descuento_nota', 'descuento_total', 'ventas_a', 'ventas_b', 'diferencia', 'monto_reembolsado',
  'valor_costo', 'costo_ventas', 'inventario_promedio', 'valor_inmovilizado', 'ingresos', 'gastos_operativos', 'saldo', 'monto', 'monto_promedio', 'valor', 'bajo', 'alto',
])
const FRACCIONES = new Set(['probabilidad', 'confianza', 'soporte'])

const NUMERO = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 })
const MONTO = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const COMPACTO = new Intl.NumberFormat('es-BO', { notation: 'compact', maximumFractionDigits: 1 })
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function etiquetaColumna(columna: string): string {
  if (ETIQUETAS[columna]) return ETIQUETAS[columna]
  const texto = columna.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function esMonto(columna: string): boolean {
  return MONTOS.has(columna)
}

export function compacto(valor: number): string {
  return COMPACTO.format(valor)
}

/** Valor listo para leer. `columna` decide si es plata, porcentaje o un numero comun. */
export function formatearValor(columna: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (Array.isArray(valor)) {
    return valor
      .map((item) => {
        const factor = item as { variable?: unknown; valor?: unknown }
        return factor.variable ? `${String(factor.variable)}: ${NUMERO.format(Number(factor.valor))}` : String(item)
      })
      .join(' · ')
  }
  if (typeof valor !== 'number') return String(valor)
  if (MONTOS.has(columna)) return `Bs ${MONTO.format(valor)}`
  if (FRACCIONES.has(columna)) return `${NUMERO.format(valor * 100)} %`
  if (columna.endsWith('_pct')) return `${NUMERO.format(valor)} %`
  return NUMERO.format(valor)
}

/** Fecha o periodo de un eje: `2026-11` o `2026-11-01` -> `nov 26`; con `diario`, `2026-11-02` -> `02/11`. */
export function etiquetaPeriodo(texto: string, diario: boolean): string {
  const coincide = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(texto)
  if (!coincide) return texto
  const [, anio, mes, dia] = coincide
  if (dia && diario) return `${dia}/${mes}`
  return `${MESES[Number(mes) - 1]} ${anio.slice(2)}`
}

const TILDES: Record<string, string> = { periodo: 'período', periodos: 'períodos', variacion: 'variación', rotacion: 'rotación', dias: 'días', anomalias: 'anomalías', devolucion: 'devolución', catalogos: 'catálogos' }

export function nombreHerramienta(nombre: string): string {
  const texto = nombre.split('_').map((palabra) => TILDES[palabra] ?? palabra).join(' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function fechaHora(valor: string | null): string {
  if (!valor) return '—'
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
}

/** Series de varias identidades, en orden fijo: la paleta validada para fondos claro y oscuro (ver index.css). */
export const COLORES_SERIE = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)', 'var(--viz-6)']
