export type ReporteTipo = 'VENTAS' | 'INVENTARIO' | 'COMPRAS'

/** Los mismos topes que valida el backend (reporte-builder.dto.ts). */
export const LARGO_MAXIMO_PEDIDO = 1000
export const LARGO_MAXIMO_NOMBRE_PLANTILLA = 100

export type CategoriaCampo = 'DIMENSION' | 'MEASURE' | 'PLAIN'

export type TipoCampo = 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN'

export type OperadorFiltro = 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte'

export interface CampoReporte {
  name: string
  label: string
  categoria: CategoriaCampo
  tipo: TipoCampo
  permiteFiltro: boolean
  permiteOrden: boolean
  operadores: OperadorFiltro[]
  /** Importe en bolivianos (se muestra como "Bs"). */
  moneda?: boolean
}

export interface ReporteDefinicion {
  id: ReporteTipo
  nombre: string
  descripcion: string
  campos: CampoReporte[]
}

export interface FiltroReporte {
  campo: string
  operador: string
  valor: string | number | boolean | null
}

/** Cómo se combinan los filtros entre sí: todos (AND, por defecto) o alguno (OR). No afecta el rango de fechas, que siempre es AND. */
export type MatchTypeFiltro = 'AND' | 'OR'

export interface OrdenReporte {
  campo: string
  direccion: 'asc' | 'desc'
}

/** Forma que entiende el backend: ver ReportRunRequestDto. */
export interface ReportRunRequest {
  reportType: string
  selectedFields: string[]
  filters?: FiltroReporte[]
  matchType?: MatchTypeFiltro
  sort?: OrdenReporte
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
  /** "Los 20 clientes...": tope de filas del reporte (no el tamaño de página). Lo pone el generativo. */
  top?: number
}

/** Del generativo: el pedido y lo que entendió la IA, para el encabezado del PDF y del Excel. */
export interface ContextoExportacion {
  prompt: string
  interpretacion: string
}

/** Cómo se muestra una columna: ver FormatoColumna en reporte-builder.dto.ts del backend. */
export type FormatoColumna = 'TEXTO' | 'NUMERO' | 'MONEDA' | 'FECHA' | 'BOOLEANO'

export interface ResultadoReporte {
  columns: string[]
  columnLabels: string[]
  /** Opcional: un resultado guardado sin conexión antes de este campo no lo trae. */
  columnFormats?: FormatoColumna[]
  rows: Array<Array<string | number | boolean | null>>
  total: number
  /** Solo sin conexion: cuando se guardo este resultado. */
  guardadoEn?: string
}

export interface RespuestaGenerativo {
  prompt: string
  interpretacion: string
  request: ReportRunRequest
  result: ResultadoReporte
  /** Qué intérprete respondió: IA (Gemini) o REGEX (traductor por palabras clave, usado si Gemini no está configurado o falló). */
  fuente: 'IA' | 'REGEX'
}

export interface PlantillaReporte {
  id: number
  idUsuario: number
  nombre: string
  config: ReportRunRequest
  fechaCreacion: string
  fechaActualizacion: string
}

export type FormatoExportacion = 'pdf' | 'excel' | 'html'

/** Entrada del catálogo de reportes predefinidos (listos para ejecutar con un clic). */
export interface ReportePredefinido {
  codigo: string
  nombre: string
  descripcion: string
  categoria: string
}

export interface ReportePredefinidoEjecutado {
  codigo: string
  nombre: string
  request: ReportRunRequest
  result: ResultadoReporte
  /** Solo sin conexion: cuando se guardo este resultado. */
  guardadoEn?: string
}