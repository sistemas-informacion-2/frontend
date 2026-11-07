import { useSyncExternalStore } from 'react'

function suscribir(avisar: () => void) {
  window.addEventListener('scroll', avisar, { passive: true })
  return () => window.removeEventListener('scroll', avisar)
}

/** true cuando la pagina ya se desplazo mas de `umbral` px (p. ej. para darle sombra a un encabezado fijo). */
export function useScrollado(umbral = 8): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.scrollY > umbral,
    () => false,
  )
}
