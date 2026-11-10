import type { Plan } from '../types'

const FORMATO_BS = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

export function formatoBs(monto: number): string {
  return `Bs ${FORMATO_BS.format(monto)}`
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })

export function formatoFecha(fecha: string | Date): string {
  return FORMATO_FECHA.format(new Date(fecha))
}

/** "Bs 149 / mes" o "Bs 0 / 7 días". */
export function periodoDelPlan(plan: Pick<Plan, 'duracionDias'>): string {
  return plan.duracionDias === 30 ? 'mes' : `${plan.duracionDias} días`
}

function limite(valor: number | null, singular: string, plural: string): string {
  if (valor === null) return `${plural.charAt(0).toUpperCase()}${plural.slice(1)} ilimitados`
  return `${valor} ${valor === 1 ? singular : plural}`
}

/** Los tres limites del plan, para mostrarlos destacados en la tarjeta. */
export function limitesDelPlan(plan: Pick<Plan, 'maxUsuarios' | 'maxSucursales' | 'maxAlmacenes'>): string[] {
  return [
    limite(plan.maxUsuarios, 'usuario', 'usuarios'),
    plan.maxSucursales === null ? 'Sucursales ilimitadas' : `${plan.maxSucursales} ${plan.maxSucursales === 1 ? 'sucursal' : 'sucursales'}`,
    limite(plan.maxAlmacenes, 'almacén', 'almacenes'),
  ]
}

/** Propuesta de direccion de tienda a partir del nombre comercial: "Moda Andiña S.R.L." -> "moda-andina-srl". */
export function sugerirSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

/** Los mensajes de validacion de objetos anidados llegan como "empresa.El NIT..." : se quita el prefijo. */
export function limpiarMensaje(mensaje: string): string {
  return mensaje.replace(/^(empresa|admin)\./, '')
}
