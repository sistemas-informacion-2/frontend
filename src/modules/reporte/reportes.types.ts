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

export interface OrdenReporte {
  campo: string
  direccion: 'asc' | 'desc'
}

/** Forma que entiende el backend: ver ReportRunRequestDto. */
export interface ReportRunRequest {
  reportType: string
  selectedFields: string[]
  filters?: FiltroReporte[]
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