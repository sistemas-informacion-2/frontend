import { useEffect, useState } from 'react'
import { claveAlmacenamiento } from '@/core/tenant/tienda'

/** Mensajes de la franja superior: solo cosas que la tienda realmente ofrece. */
const ANUNCIOS = ['Nueva temporada disponible', 'Elige tu sucursal y retira tu compra', 'Reserva hoy y paga el saldo al retirar']

const INTERVALO_MS = 5000
const CLAVE_CERRADA = claveAlmacenamiento('anuncios-cerrados')

function leerCerrada(): boolean {
  try {
    return localStorage.getItem(CLAVE_CERRADA) === '1'
  } catch {
    return false
  }
}

/** Franja fina sobre el encabezado de la tienda con anuncios que rotan; se puede cerrar y se recuerda por tienda. */
export function BarraAnuncios() {
  const [cerrada, setCerrada] = useState(leerCerrada)
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (cerrada || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setIndice((actual) => (actual + 1) % ANUNCIOS.length), INTERVALO_MS)
    return () => window.clearInterval(id)
  }, [cerrada])

  if (cerrada) return null

  const cerrar = () => {
    setCerrada(true)
    try {
      localStorage.setItem(CLAVE_CERRADA, '1')
    } catch {
      // Sin almacenamiento disponible solo se cierra en esta visita.
    }
  }

  return (
    <div className="relative bg-neutral-900 px-10 py-2 text-center text-xs font-medium tracking-wide text-white dark:bg-white dark:text-neutral-900">
      <p key={indice} aria-live="polite" className="animate-aparecer">
        {ANUNCIOS[indice]}
      </p>
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar anuncios"
        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-base leading-none opacity-70 transition-opacity hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}
