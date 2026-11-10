export type Fila = Record<string, unknown>

export interface ResultadoHerramienta {
  filas: Fila[]
  resumen?: Fila
  nota?: string
  disponible?: boolean
  columnasPrivadas?: string[]
}

export type TipoGrafico = 'linea' | 'barras' | 'torta' | 'tabla'

export interface Grafico {
  titulo: string
  tipo: TipoGrafico
  x?: string
  series?: string[]
  rango?: { bajo: string; alto: string }
  herramienta: string
  parametros: Record<string, unknown>
}

export interface HerramientaEjecutada {
  nombre: string
  parametros: Record<string, unknown>
  ok: boolean
  resultado: ResultadoHerramienta | { error: string }
  grafico: Grafico | null
}

export interface RespuestaAgente {
  idConversacion: number
  texto: string
  herramientas: HerramientaEjecutada[]
  tokens: { entrada: number; salida: number }
}

export interface ConversacionResumen {
  id: number
  titulo: string
  fechaCreacion: string
  fechaActualizacion: string
}

export interface HerramientaUsada {
  nombre: string
  parametros: Record<string, unknown>
  ok: boolean
}

export interface MensajeGuardado {
  id: number
  rol: 'USUARIO' | 'ASISTENTE'
  contenido: string
  herramientas: HerramientaUsada[] | null
  fecha: string
}

export interface ConversacionDetalle extends ConversacionResumen {
  mensajes: MensajeGuardado[]
}

/** Un mensaje en pantalla. Las respuestas recientes traen sus datos; las del historial solo que se consulto. */
export interface MensajeChat {
  id: number
  rol: 'USUARIO' | 'ASISTENTE'
  texto: string
  herramientas: Array<HerramientaUsada | HerramientaEjecutada>
}

export interface GraficoGuardado {
  id: number
  titulo: string
  herramienta: string
  parametros: Record<string, unknown>
  fechaCreacion: string
}

export interface DatosGrafico extends GraficoGuardado {
  grafico: Grafico | null
  resultado: ResultadoHerramienta
}

export type TipoModelo = 'SUPERVISADO' | 'NO_SUPERVISADO' | 'PRESCRIPTIVO'

export interface ModeloResumen {
  clave: string
  titulo: string
  tipo: TipoModelo
  tecnica: string
  metricas: Record<string, unknown> | null
}

export interface ResumenModelos {
  ultimaEjecucion: { estado: string; inicio: string; fin: string | null; error: string | null } | null
  modelos: ModeloResumen[]
}

export type Frecuencia = 'MENSUAL' | 'SEMANAL'

export interface PuntoFuturo {
  periodo: string
  valor: number
  bajo: number
  alto: number
  modelo?: string
}

export interface PronosticoModelo {
  frecuencia: Frecuencia
  historia: Array<{ periodo: string; valor: number }>
  futuro: PuntoFuturo[]
  disponible: boolean
  modelo: string | null
  nota: string | null
}

export interface EjecucionEtl {
  id: number
  origen: 'PROGRAMADO' | 'MANUAL'
  estado: 'EN_CURSO' | 'OK' | 'ERROR'
  inicio: string
  fin: string | null
  filas: Record<string, number> | null
  error: string | null
}

export interface ResumenEtl {
  segundos: number
  filas: Record<string, number>
}

export interface EstadoBi {
  ia: { modo: 'VERTEX' | 'API_KEY' | 'SIN_CONFIGURAR'; modelo: string }
  ml: { configurado: boolean; ultimaEjecucion: { estado: string; inicio: string; fin: string | null; error: string | null } | null }
  dw: { disponible: boolean; calendario: { desde: string; hasta: string } | null }
  etl: { programado: boolean; ultimaEjecucion: Omit<EjecucionEtl, 'id'> | null }
}
