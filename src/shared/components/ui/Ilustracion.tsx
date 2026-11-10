import type { ReactNode } from 'react'

export type NombreIlustracion =
  | 'carrito'
  | 'bolsa'
  | 'busqueda'
  | 'recibo'
  | 'grafico'
  | 'candado'
  | 'devolucion'
  | 'reserva'
  | 'alerta'
  | 'obras'
  | 'carpeta'

/** Relleno tenue de las ilustraciones: da volumen sin salirse del blanco y negro. */
const SOMBRA = { fill: 'currentColor', opacity: 0.08, stroke: 'none' } as const

const TRAZOS: Record<NombreIlustracion, ReactNode> = {
  carrito: (
    <>
      <path d="M22 66h48l6-30H28" {...SOMBRA} />
      <path d="M10 18h10l10 48h40l8-34H26" />
      <circle cx="36" cy="78" r="5" />
      <circle cx="66" cy="78" r="5" />
      <path d="M44 44h16M52 36v16" />
    </>
  ),
  bolsa: (
    <>
      <path d="M22 34h52l-4 46H26z" {...SOMBRA} />
      <path d="M22 34h52l-4 46H26z" />
      <path d="M36 40V30a12 12 0 0 1 24 0v10" />
      <path d="M38 58c4 6 16 6 20 0" />
    </>
  ),
  busqueda: (
    <>
      <circle cx="42" cy="42" r="22" {...SOMBRA} />
      <circle cx="42" cy="42" r="22" />
      <path d="m58 58 20 20" strokeWidth={5} />
      <path d="M32 38a12 12 0 0 1 10-8" />
    </>
  ),
  recibo: (
    <>
      <path d="M26 12h44v72l-7-5-7 5-7-5-7 5-7-5-7 5-2-1z" {...SOMBRA} />
      <path d="M26 12h44v72l-7-5-7 5-7-5-7 5-7-5-7 5-2-1z" />
      <path d="M36 30h24M36 42h24M36 54h14" />
      <path d="M54 66h6" strokeWidth={3} />
    </>
  ),
  grafico: (
    <>
      <path d="M18 78V60h12v18M42 78V44h12v34M66 78V30h12v48" {...SOMBRA} />
      <path d="M14 80h70M18 78V60h12v18M42 78V44h12v34M66 78V30h12v48" />
      <path d="m20 46 22-16 12 8 22-18" strokeDasharray="4 5" />
    </>
  ),
  candado: (
    <>
      <rect x="22" y="42" width="52" height="40" rx="8" {...SOMBRA} />
      <rect x="22" y="42" width="52" height="40" rx="8" />
      <path d="M34 42V30a14 14 0 0 1 28 0v12" />
      <circle cx="48" cy="60" r="4" />
      <path d="M48 64v6" />
    </>
  ),
  devolucion: (
    <>
      <path d="M24 36h40v40H24z" {...SOMBRA} />
      <path d="M24 36h40v40H24zM24 36l8-12h40l-8 12M64 36l8-12v40l-8 12" />
      <path d="M38 56h18M44 50l-6 6 6 6" />
    </>
  ),
  reserva: (
    <>
      <rect x="16" y="22" width="64" height="58" rx="8" {...SOMBRA} />
      <rect x="16" y="22" width="64" height="58" rx="8" />
      <path d="M16 38h64M32 14v14M64 14v14" />
      <path d="m38 58 7 7 14-14" />
    </>
  ),
  alerta: (
    <>
      <path d="M48 14 86 80H10z" {...SOMBRA} />
      <path d="M48 14 86 80H10z" strokeLinejoin="round" />
      <path d="M48 38v20" />
      <circle cx="48" cy="68" r="1.5" fill="currentColor" />
    </>
  ),
  obras: (
    <>
      <path d="M14 76h68" />
      <path d="M26 76 40 26h16l14 50" {...SOMBRA} />
      <path d="M26 76 40 26h16l14 50" />
      <path d="M34 54h28M37 42h22M30 66h36" />
    </>
  ),
  carpeta: (
    <>
      <path d="M12 30v44a6 6 0 0 0 6 6h60a6 6 0 0 0 6-6V38a6 6 0 0 0-6-6H46l-8-10H18a6 6 0 0 0-6 6z" {...SOMBRA} />
      <path d="M12 30v44a6 6 0 0 0 6 6h60a6 6 0 0 0 6-6V38a6 6 0 0 0-6-6H46l-8-10H18a6 6 0 0 0-6 6z" />
      <path d="M12 44h72" />
    </>
  ),
}

/** Ilustracion de linea minimalista para estados vacios; toma el color del texto (claro/oscuro). */
export function Ilustracion({ nombre, className = 'h-20 w-20' }: { nombre: NombreIlustracion; className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {TRAZOS[nombre]}
    </svg>
  )
}
