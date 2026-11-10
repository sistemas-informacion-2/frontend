import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PuntoFuturo } from '../bi.types'
import { compacto, etiquetaPeriodo } from '../utils/formato'
import { TooltipBi } from './TooltipBi'

interface GraficoPronosticoProps {
  historia: Array<{ periodo: string; valor: number }>
  futuro: PuntoFuturo[]
  diario?: boolean
}

const COLUMNAS_TOOLTIP = { Ventas: 'ventas', Pronóstico: 'valor', 'Rango del 80 %': 'valor' }

/** Lo ocurrido en linea continua; lo pronosticado en punteada, con su rango como banda. Un solo eje. */
export function GraficoPronostico({ historia, futuro, diario = false }: GraficoPronosticoProps) {
  const ultimo = historia.at(-1)
  const datos = [
    ...historia.map((punto) => ({
      periodo: punto.periodo,
      real: punto.valor,
      // El ultimo dato real une las dos lineas.
      ...(punto === ultimo && futuro.length ? { previsto: punto.valor, rango: [punto.valor, punto.valor] as [number, number] } : {}),
    })),
    ...futuro.map((punto) => ({ periodo: punto.periodo, previsto: punto.valor, rango: [punto.bajo, punto.alto] as [number, number] })),
  ]

  return (
    <div>
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
        {historia.length > 0 && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-4" style={{ background: 'var(--viz-tinta)' }} />
            Ventas
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="w-4 border-t-2 border-dashed" style={{ borderColor: 'var(--viz-tinta)' }} />
          Pronóstico
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-4 rounded-sm" style={{ background: 'var(--viz-banda)' }} />
          Rango del 80 %
        </li>
      </ul>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={datos} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--viz-grilla)" />
            <XAxis dataKey="periodo" tickFormatter={(v: string) => etiquetaPeriodo(v, diario)} tick={{ fill: 'var(--viz-eje)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--viz-grilla)' }} minTickGap={28} />
            <YAxis tickFormatter={(v: number) => compacto(v)} tick={{ fill: 'var(--viz-eje)', fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip content={(props) => <TooltipBi active={props.active} payload={props.payload} label={props.label} diario={diario} columnas={COLUMNAS_TOOLTIP} />} />
            <Area dataKey="rango" name="Rango del 80 %" stroke="none" fill="var(--viz-banda)" fillOpacity={1} isAnimationActive={false} activeDot={false} connectNulls={false} />
            <Line dataKey="real" name="Ventas" stroke="var(--viz-tinta)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            <Line dataKey="previsto" name="Pronóstico" stroke="var(--viz-tinta)" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
