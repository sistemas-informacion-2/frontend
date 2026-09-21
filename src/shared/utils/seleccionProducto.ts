/**
 * Selección de prendas de un producto (idVariante -> unidades) guardada en el navegador, para que no se pierda
 * al iniciar sesión, al volver atrás o al recargar. El almacenamiento puede fallar o estar bloqueado (modo
 * privado): en ese caso simplemente no se persiste y todo sigue funcionando en memoria.
 */

const PREFIJO = 'fashionstore:seleccion:'
/** Una selección abandonada no debe reaparecer semanas después con cantidades que ya no tienen sentido. */
const VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000

export type SeleccionProducto = Record<number, number>

interface Registro {
  guardadoEn: number
  valor: SeleccionProducto
}

export function cargarSeleccion(idProducto: number): SeleccionProducto {
  try {
    const crudo = window.localStorage.getItem(`${PREFIJO}${idProducto}`)
    if (!crudo) return {}
    const registro = JSON.parse(crudo) as Registro
    if (Date.now() - registro.guardadoEn > VIGENCIA_MS) {
      window.localStorage.removeItem(`${PREFIJO}${idProducto}`)
      return {}
    }
    // Se descarta cualquier cosa que no sea idVariante -> entero positivo.
    return Object.fromEntries(
      Object.entries(registro.valor ?? {}).filter(([id, cantidad]) => Number.isInteger(Number(id)) && Number.isInteger(cantidad) && cantidad > 0),
    )
  } catch {
    return {}
  }
}

export function guardarSeleccion(idProducto: number, seleccion: SeleccionProducto): void {
  try {
    if (Object.keys(seleccion).length === 0) {
      window.localStorage.removeItem(`${PREFIJO}${idProducto}`)
      return
    }
    const registro: Registro = { guardadoEn: Date.now(), valor: seleccion }
    window.localStorage.setItem(`${PREFIJO}${idProducto}`, JSON.stringify(registro))
  } catch {
    // Sin almacenamiento disponible: la selección vive solo mientras la página siga abierta.
  }
}

/** Borra todas las selecciones guardadas; se usa al cerrar sesión para no dejar rastros en un equipo compartido. */
export function limpiarSelecciones(): void {
  try {
    const claves: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const clave = window.localStorage.key(i)
      if (clave?.startsWith(PREFIJO)) claves.push(clave)
    }
    claves.forEach((clave) => window.localStorage.removeItem(clave))
  } catch {
    // Nada que limpiar si no hay almacenamiento.
  }
}
