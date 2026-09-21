export type EstadoTemporadaPublica = 'PROXIMA' | 'VIGENTE' | 'FINALIZADA'

export interface CategoriaTemporadaPublica {
  id: number
  nombre: string
}

export interface TemporadaPublica {
  id: number
  nombre: string
  fechaInicio: string
  fechaFin: string
  descripcion: string | null
  estado: EstadoTemporadaPublica
  categorias: CategoriaTemporadaPublica[]
}

export interface SucursalPublica {
  id: number
  nombre: string
  ubicacion: string
  telefono: string | null
  correo: string | null
  horarioApertura: string | null
  horarioCierre: string | null
  ciudadNombre: string
  departamentoNombre: string
}
