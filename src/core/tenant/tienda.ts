/**
 * Multiempresa (SaaS): cada tienda vive bajo /t/:slug/... y el panel del
 * superadmin bajo /plataforma/... La tienda se lee una sola vez, al cargar la
 * app, desde la URL: el router usa `/t/:slug` como basename, asi que el resto
 * de la app sigue navegando a '/producto/5' o '/admin/ventas' sin saber en que
 * tienda esta. Cambiar de tienda es cargar otra URL (recarga completa).
 *
 * El portal de DOMINATR (landing, planes, registro e ingreso) ocupa la raiz:
 * '/', '/ingresar' y '/registro'.
 */

const PATRON_TIENDA = /^\/t\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/|$)/

/** Tienda a la que se redirige una URL sin /t/:slug (enlaces anteriores al SaaS). */
export const SLUG_TIENDA_POR_DEFECTO = (import.meta.env.VITE_TIENDA_POR_DEFECTO ?? 'fashionstore').trim()

export function slugDeRuta(pathname: string): string | null {
  return PATRON_TIENDA.exec(pathname)?.[1] ?? null
}

export function esRutaPlataforma(pathname: string): boolean {
  return /^\/plataforma(\/|$)/.test(pathname)
}

/** Paginas del portal publico de DOMINATR. */
export function esRutaPortal(pathname: string): boolean {
  return pathname === '/' || /^\/(ingresar|registro)(\/|$)/.test(pathname)
}

/** Tienda de esta pestana; null en el portal y en el panel de plataforma. */
export const slugTienda: string | null = slugDeRuta(window.location.pathname)

/** Basename del router de la tienda ('' fuera de una tienda). */
export const basenameTienda = slugTienda ? `/t/${slugTienda}` : ''

/** Clave de localStorage de una tienda cualquiera (o del panel de plataforma con null). */
export function claveDeTienda(slug: string | null, nombre: string): string {
  return `${slug ?? 'plataforma'}:${nombre}`
}

/**
 * Clave de localStorage propia de la tienda (o del panel de plataforma): la
 * sesion y la sucursal elegida de una tienda no se mezclan con las de otra.
 */
export function claveAlmacenamiento(nombre: string): string {
  return claveDeTienda(slugTienda, nombre)
}
