const PROPS_ICONO = {
  viewBox: '0 0 24 24',
  className: 'h-5 w-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Íconos de línea para los indicadores del dashboard. */
export const IconosKpi = {
  ventas: (
    <svg {...PROPS_ICONO}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  ),
  ticket: (
    <svg {...PROPS_ICONO}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  caja: (
    <svg {...PROPS_ICONO}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M7 8V5h10v3M3 13h18" />
    </svg>
  ),
  stock: (
    <svg {...PROPS_ICONO}>
      <path d="M12 3 21 8v8l-9 5-9-5V8z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  ),
}
