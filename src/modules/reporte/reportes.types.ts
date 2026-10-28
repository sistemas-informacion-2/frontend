export type ReporteTipo = 'VENTAS' | 'INVENTARIO' | 'COMPRAS'

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
}

export interface ResultadoReporte {
  columns: string[]
  columnLabels: string[]
  rows: Array<Array<string | number | boolean | null>>
  total: number
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
}