import type { TendenciaVenta } from '../types'
import { formatearDiaMes, formatearMonto } from '../utils/format'

interface LineaTendenciaProps {
  puntos: TendenciaVenta[]
}

const ANCHO = 600
const ALTO = 200
const MARGEN = { arriba: 12, derecha: 12, abajo: 26, izquierda: 12 }

/** Gráfico de líneas en SVG puro: la tendencia de ventas no justifica sumar una librería de gráficos. */
export function LineaTendencia({ puntos }: LineaTendenciaProps) {
  if (puntos.length === 0) return null

  const maximo = Math.max(...puntos.map((punto) => punto.total), 1)
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo
  const x = (indice: number) => MARGEN.izquierda + (puntos.length === 1 ? anchoUtil / 2 : (indice / (puntos.length - 1)) * anchoUtil)
  const y = (valor: number) => MARGEN.arriba + altoUtil - (valor / maximo) * altoUtil

  const linea = puntos.map((punto, indice) => `${indice === 0 ? 'M' : 'L'}${x(indice)},${y(punto.total)}`).join(' ')
  const area = `${linea} L${x(puntos.length - 1)},${MARGEN.arriba + altoUtil} L${x(0)},${MARGEN.arriba + altoUtil} Z`
  // Con muchos días solo se rotulan algunos para que las fechas no se encimen.
  const salto = Math.ceil(puntos.length / 7)

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      role="img"
      aria-label="Tendencia de ventas por día"
      className="h-auto w-full text-neutral-900 dark:text-white"
    >
      <line
        x1={MARGEN.izquierda}
        x2={ANCHO - MARGEN.derecha}
        y1={MARGEN.arriba + altoUtil}
        y2={MARGEN.arriba + altoUtil}
        stroke="currentColor"
        strokeOpacity="0.15"
      />
      <path d={area} fill="currentColor" fillOpacity="0.07" />
      <path d={linea} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {puntos.map((punto, indice) => (
        <g key={punto.fecha}>
          <circle cx={x(indice)} cy={y(punto.total)} r="3.5" fill="currentColor">
            <title>{`${formatearDiaMes(punto.fecha)}: ${formatearMonto(punto.total)}`}</title>
          </circle>
          {(indice % salto === 0 || indice === puntos.length - 1) && (
            <text
              x={x(indice)}
              y={ALTO - 8}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              fillOpacity="0.55"
            >
              {formatearDiaMes(punto.fecha)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
