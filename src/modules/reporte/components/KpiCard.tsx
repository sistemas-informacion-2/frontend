import type { ReactNode } from 'react'

interface KpiCardProps {
  titulo: string
  valor: ReactNode
  detalle?: string
  /** `alerta` resalta el indicador cuando requiere atención (ej. stock crítico > 0). */
  tono?: 'normal' | 'alerta'
  /** Ícono del indicador (ver IconosKpi en iconosKpi.tsx). */
  icono?: ReactNode
  /** Serie de valores para una mini gráfica de tendencia bajo el valor. */
  tendencia?: number[]
}

export function KpiCard({ titulo, valor, detalle, tono = 'normal', icono, tendencia }: KpiCardProps) {
  const alerta = tono === 'alerta'
  return (
    <div
      className={`animate-aparecer rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:bg-neutral-950 ${
        alerta ? 'border-red-300 dark:border-red-900' : 'border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{titulo}</p>
          <p className={`mt-1 text-2xl font-semibold ${alerta ? 'text-red-700 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>{valor}</p>
        </div>
        {icono && (
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              alerta ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            {icono}
          </span>
        )}
      </div>
      {tendencia && tendencia.length > 1 && <MiniTendencia valores={tendencia} />}
      {detalle && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{detalle}</p>}
    </div>
  )
}

const ANCHO = 120
const ALTO = 28

/** Línea mínima en SVG (sin librería), con el área suavemente rellena; toma el color del texto. */
function MiniTendencia({ valores }: { valores: number[] }) {
  const maximo = Math.max(...valores, 1)
  const x = (i: number) => (i / (valores.length - 1)) * ANCHO
  const y = (v: number) => ALTO - 2 - (v / maximo) * (ALTO - 4)
  const linea = valores.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" aria-hidden="true" className="mt-3 h-7 w-full text-neutral-900 dark:text-white">
      <path d={`${linea} L${ANCHO},${ALTO} L0,${ALTO} Z`} fill="currentColor" opacity={0.08} />
      <path d={linea} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}
