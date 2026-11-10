import type { AdministradorRegistro, CodigoPlan, EmpresaRegistro } from '../types'

export const CIUDADES_BOLIVIA = ['Santa Cruz de la Sierra', 'La Paz', 'El Alto', 'Cochabamba', 'Sucre', 'Oruro', 'Potosí', 'Tarija', 'Trinidad', 'Cobija']

export const EMPRESA_VACIA: EmpresaRegistro = {
  razonSocial: '',
  nombreComercial: '',
  nit: '',
  pais: 'Bolivia',
  ciudad: '',
  direccion: '',
  telefono: '',
  slug: '',
}

export const ADMIN_VACIO: AdministradorRegistro = { nombre: '', apellido: '', email: '', telefono: '', password: '' }

const FORMATO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FORMATO_TELEFONO = /^[\d +()-]{6,20}$/
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type Errores<T> = Partial<Record<keyof T, string>>

/** Las mismas reglas que el backend (RegistroEmpresaDto), para avisar antes de enviar. */
export function validarEmpresa(empresa: EmpresaRegistro): Errores<EmpresaRegistro> {
  const errores: Errores<EmpresaRegistro> = {}
  if (!empresa.razonSocial.trim()) errores.razonSocial = 'La razón social es obligatoria.'
  if (!/^\d{5,15}$/.test(empresa.nit.trim())) errores.nit = 'El NIT solo admite números (entre 5 y 15 dígitos).'
  if (!empresa.ciudad.trim()) errores.ciudad = 'La ciudad es obligatoria.'
  if (empresa.telefono.trim() && !FORMATO_TELEFONO.test(empresa.telefono.trim())) errores.telefono = 'Solo números, espacios, + ( ) y -.'
  if (empresa.slug.length < 3 || empresa.slug.length > 60 || !FORMATO_SLUG.test(empresa.slug)) {
    errores.slug = 'Usa entre 3 y 60 minúsculas, números y guiones (ej. moda-andina).'
  }
  return errores
}

export function validarAdministrador(admin: AdministradorRegistro): Errores<AdministradorRegistro> {
  const errores: Errores<AdministradorRegistro> = {}
  if (!admin.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!admin.apellido.trim()) errores.apellido = 'El apellido es obligatorio.'
  if (!FORMATO_EMAIL.test(admin.email.trim())) errores.email = 'Escribe un correo válido.'
  if (admin.telefono.trim() && !FORMATO_TELEFONO.test(admin.telefono.trim())) errores.telefono = 'Solo números, espacios, + ( ) y -.'
  if (admin.password.length < 8) errores.password = 'Mínimo 8 caracteres.'
  else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(admin.password)) errores.password = 'Combina letras y números.'
  return errores
}

/** Lo que se guarda al ir a Stripe para no perder el formulario si se cancela el pago. Nunca la contrasena. */
interface Borrador {
  codigoPlan: CodigoPlan
  empresa: EmpresaRegistro
  admin: Omit<AdministradorRegistro, 'password'>
  slugEditado: boolean
}

const CLAVE_BORRADOR = 'dominatr:registro'

export function guardarBorrador(borrador: Borrador): void {
  try {
    window.sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador))
  } catch {
    // Sin almacenamiento: si cancela el pago, vuelve a llenar el formulario.
  }
}

export function leerBorrador(): Borrador | null {
  try {
    const texto = window.sessionStorage.getItem(CLAVE_BORRADOR)
    return texto ? (JSON.parse(texto) as Borrador) : null
  } catch {
    return null
  }
}

export function borrarBorrador(): void {
  try {
    window.sessionStorage.removeItem(CLAVE_BORRADOR)
  } catch {
    // Nada que borrar.
  }
}
