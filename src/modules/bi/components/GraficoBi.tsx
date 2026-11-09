import { useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Fila, Grafico, PuntoFuturo, TipoGrafico } from '../bi.types'
import { COLORES_SERIE, compacto, esMonto, etiquetaColumna, etiquetaPeriodo, formatearValor } from '../utils/formato'
import { GraficoPronostico } from './GraficoPronostico'
import { TablaResultado } from './TablaResultado'
import { TooltipBi } from './TooltipBi'

interface GraficoBiProps {
  grafico: Grafico
  filas: Fila[]
  acciones?: ReactNode
  /** Dentro de un modal, que ya muestra el titulo. */
  sinTitulo?: boolean
}

const MAX_BARRAS = 15
const MAX_PARTES = 6
const EJE = { fill: 'var(--viz-eje)', fontSize: 12 }

/** Una torta solo sirve con pocas partes: con 2 o menos, o con muchas, se lee mejor en barras. */
function tipoReal(grafico: Grafico, filas: Fila[]): TipoGrafico {
  if (grafico.tipo === 'torta' && (filas.length <= 2 || filas.length > MAX_PARTES)) return 'barras'
  return grafico.tipo
}

function esDiario(grafico: Grafico): boolean {
  return grafico.parametros.agrupar_por === 'dia' || grafico.parametros.agrupar_por === 'semana' || grafico.parametros.frecuencia === 'SEMANAL'
}

function Leyenda({ series }: { series: string[] }) {
  if (series.length < 2) return null
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
      {series.map((serie, indice) => (
        <li key={serie} className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORES_SERIE[indice] }} />
          {etiquetaColumna(serie)}
        </li>
      ))}
    </ul>
  )
}

function colorDeSerie(series: string[], indice: number): string {
  return series.length === 1 ? 'var(--viz-tinta)' : COLORES_SERIE[indice]
}

function Lineas({ grafico, filas }: { grafico: Grafico; filas: Fila[] }) {
  const x = grafico.x ?? 'grupo'
  const series = grafico.series ?? []
  const diario = esDiario(grafico)
  const columnas = Object.fromEntries(series.map((serie) => [etiquetaColumna(serie), serie]))
  return (
    <div>
      <Leyenda series={series} />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filas} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--viz-grilla)" />
            <XAxis dataKey={x} tickFormatter={(v: string) => etiquetaPeriodo(String(v), diario)} tick={EJE} tickLine={false} axisLine={{ stroke: 'var(--viz-grilla)' }} minTickGap={28} />
            <YAxis tickFormatter={(v: number) => compacto(v)} tick={EJE} tickLine={false} axisLine={false} width={48} />
            <Tooltip content={(p) => <TooltipBi active={p.active} payload={p.payload} label={p.label} diario={diario} columnas={columnas} />} />
            {series.map((serie, indice) => (
              <Line key={serie} dataKey={serie} name={etiquetaColumna(serie)} stroke={colorDeSerie(series, indice)} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Barras({ grafico, filas }: { grafico: Grafico; filas: Fila[] }) {
  const x = grafico.x ?? 'grupo'
  const series = grafico.series ?? []
  const visibles = filas.slice(0, MAX_BARRAS)
  const hayNegativos = visibles.some((fila) => series.some((serie) => Number(fila[serie]) < 0))
  const columnas = Object.fromEntries(series.map((serie) => [etiquetaColumna(serie), serie]))
  return (
    <div>
      <Leyenda series={series} />
      <div style={{ height: Math.max(180, visibles.length * series.length * 26 + 44) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visibles} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} barGap={2} barCategoryGap="20%">
            <CartesianGrid horizontal={false} stroke="var(--viz-grilla)" />
            <XAxis type="number" tickFormatter={(v: number) => compacto(v)} tick={EJE} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey={x} tick={EJE} tickLine={false} axisLine={false} width={124} interval={0} />
            <Tooltip cursor={{ fill: 'var(--viz-grilla)', opacity: 0.4 }} content={(p) => <TooltipBi active={p.active} payload={p.payload} label={p.label} columnas={columnas} />} />
            {hayNegativos && <ReferenceLine x={0} stroke="var(--viz-eje)" />}
            {series.map((serie, indice) => (
              <Bar key={serie} dataKey={serie} name={etiquetaColumna(serie)} fill={colorDeSerie(series, indice)} maxBarSize={22} radius={hayNegativos ? 0 : [0, 4, 4, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {filas.length > MAX_BARRAS && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Se muestran {MAX_BARRAS} de {filas.length}. La tabla los trae todos.</p>}
    </div>
  )
}

function Torta({ grafico, filas }: { grafico: Grafico; filas: Fila[] }) {
  const x = grafico.x ?? 'grupo'
  const serie = grafico.series?.[0] ?? ''
  const total = filas.reduce((suma, fila) => suma + Number(fila[serie]), 0)
  // El color sigue a la categoria, no a su posicion: si cambia el ranking, no se repinta.
  const orden = filas.map((fila) => String(fila[x])).sort((a, b) => a.localeCompare(b))
  const datos = filas.map((fila) => ({ nombre: String(fila[x]), valor: Number(fila[serie]), fill: COLORES_SERIE[orden.indexOf(String(fila[x]))] }))
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={(p) => <TooltipBi active={p.active} payload={p.payload} columnas={Object.fromEntries(datos.map((d) => [d.nombre, serie]))} />} />
            <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius={58} outerRadius={92} stroke="var(--viz-superficie)" strokeWidth={2} isAnimationActive={false} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-1.5 text-sm">
        {datos.map((dato) => (
          <li key={dato.nombre} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: dato.fill }} />
              {dato.nombre}
            </span>
            <span className="whitespace-nowrap font-medium tabular-nums text-neutral-900 dark:text-white">
              {esMonto(serie) ? formatearValor(serie, dato.valor) : compacto(dato.valor)}
              <span className="ml-2 font-normal text-neutral-500 dark:text-neutral-400">{total > 0 ? Math.round((dato.valor / total) * 100) : 0} %</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Dibuja el resultado de una herramienta. Todo grafico tiene su vista de tabla. */
export function GraficoBi({ grafico, filas, acciones, sinTitulo = false }: GraficoBiProps) {
  const tipo = tipoReal(grafico, filas)
  const [verTabla, setVerTabla] = useState(false)
  const conGrafico = tipo !== 'tabla'
  const comoTabla = !conGrafico || verTabla

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {sinTitulo ? <span /> : <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{grafico.titulo}</h3>}
        <div className="flex items-center gap-3 text-xs">
          {conGrafico && (
            <button type="button" onClick={() => setVerTabla((actual) => !actual)} className="font-medium text-neutral-600 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">
              {verTabla ? 'Ver gráfico' : 'Ver tabla'}
            </button>
          )}
          {acciones}
        </div>
      </div>
      {comoTabla ? (
        <TablaResultado filas={filas} />
      ) : grafico.rango ? (
        <GraficoPronostico historia={[]} futuro={filas as unknown as PuntoFuturo[]} diario={esDiario(grafico)} />
      ) : tipo === 'linea' ? (
        <Lineas grafico={grafico} filas={filas} />
      ) : tipo === 'torta' ? (
        <Torta grafico={grafico} filas={filas} />
      ) : (
        <Barras grafico={grafico} filas={filas} />
      )}
    </section>
  )
}
