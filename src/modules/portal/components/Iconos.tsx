import type { ReactNode, SVGProps } from 'react'

/** Iconos de trazo del portal (24x24, currentColor). */
function Icono({ children, ...rest }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="24"
      height="24"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconoCheck = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icono>
)

export const IconoTienda = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M3 9.5 4.5 4h15L21 9.5" />
    <path d="M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M5 12.5V20h14v-7.5" />
    <path d="M10 20v-5h4v5" />
  </Icono>
)

export const IconoCaja = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M7 7V4h10v3" />
    <path d="M3 12h18" />
    <path d="M10 15h4" />
  </Icono>
)

export const IconoInventario = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5" />
    <path d="M12 12v9" />
  </Icono>
)

export const IconoCompras = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M3 4h2l2.4 11h11.2L21 8H6.2" />
    <circle cx="9" cy="19.5" r="1.5" />
    <circle cx="17" cy="19.5" r="1.5" />
  </Icono>
)

export const IconoReportes = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </Icono>
)

export const IconoIA = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <path d="m6.3 6.3 2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1" />
    <circle cx="12" cy="12" r="3" />
  </Icono>
)

export const IconoEscudo = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icono>
)

export const IconoFlecha = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Icono>
)
