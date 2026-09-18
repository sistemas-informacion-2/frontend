export interface Departamento {
  id: number
  nombre: string
}

export interface Ciudad {
  id: number
  nombre: string
  departamentoId: number
  departamentoNombre: string
}

export interface Sucursal {
  id: number
  nombre: string
  ubicacion: string
  telefono: string | null
  correo: string | null
  horarioApertura: string | null
  horarioCierre: string | null
  activo: boolean
  ciudadId: number
  ciudadNombre: string
  departamentoNombre: string
}

export interface SucursalFormValues {
  idCiudad: number | ''
  nombre: string
  ubicacion: string
  telefono: string
  correo: string
  horarioApertura: string
  horarioCierre: string
  activo: boolean
}
