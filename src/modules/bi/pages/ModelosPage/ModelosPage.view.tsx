import { Link } from 'react-router-dom'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Sucursal } from '@/modules/operaciones/types'
import type { Frecuencia, Grafico, PronosticoModelo, ResultadoHerramienta, ResumenModelos } from '../../bi.types'
import { GraficoBi } from '../../components/GraficoBi'
import { GraficoPronostico } from '../../components/GraficoPronostico'
import { MetricasModelo } from '../../components/MetricasModelo'
import { TablaResultado } from '../../components/TablaResultado'
import { fechaHora } from '../../utils/formato'

export type PestanaModelo = 'pronostico' | 'abandono' | 'segmentacion' | 'canasta' | 'anomalias' | 'reposicion'

interface ModelosPageViewProps {
  pestana: PestanaModelo
  resumen?: ResumenModelos
  sucursales: Sucursal[]
  frecuencia: Frecuencia
  sucursal: string
  nivel: string
  pronostico?: PronosticoModelo
  resultado?: ResultadoHerramienta
  cargando: boolean
  error: string | null
  onPestana: (pestana: PestanaModelo) => void
  onFrecuencia: (frecuencia: Frecuencia) => void
  onSucursal: (sucursal: string) => void
  onNivel: (nivel: string) => void
}

const PESTANAS: Array<[PestanaModelo, string]> = [
  ['pronostico', 'Pronóstico'],
  ['abandono', 'Clientes en riesgo'],
  ['segmentacion', 'Segmentos'],
  ['canasta', 'Canasta'],
  ['anomalias', 'Anomalías'],
  ['reposicion', 'Sugerencia de compra'],
]

const COLUMNAS: Partial<Record<PestanaModelo, string[]>> = {
  abandono: ['id_cliente', 'nombre', 'ciudad', 'probabilidad', 'nivel', 'factores'],
  segmentacion: ['segmento', 'clientes', 'recencia_dias_promedio', 'compras_promedio', 'monto_promedio'],
  canasta: ['producto_a', 'producto_b', 'confianza', 'lift', 'notas'],
  anomalias: ['fecha', 'nombre_dia', 'sucursal', 'valor_real', 'valor_esperado', 'gravedad', 'nombre_feriado'],
  reposicion: ['producto', 'talla', 'color', 'sucursal', 'demanda_esperada', 'stock_actual', 'stock_seguridad', 'cantidad_sugerida'],
}

const GRAFICO_SEGMENTOS: Grafico = { titulo: 'Clientes por segmento', tipo: 'torta', x: 'segmento', series: ['clientes'], herramienta: 'segmentos_de_clientes', parametros: {} }

function SinResultados({ entrenado }: { entrenado: boolean }) {
  return entrenado ? (
    <EmptyState ilustracion="busqueda" title="Sin resultados" description="No hay datos para este filtro o todavía no hay historia suficiente." />
  ) : (
    <EmptyState
      ilustracion="grafico"
      title="Los modelos todavía no se entrenaron"
      description="Se entrenan después de cargar los datos."
      action={<Link to="/admin/bi/estado" className="text-sm font-medium underline">Ir a Estado de los datos</Link>}
    />
  )
}

export function ModelosPageView(props: ModelosPageViewProps) {
  const { pestana, resumen, pronostico, resultado, cargando, error } = props
  const modelo = resumen?.modelos.find((m) => m.clave === pestana)
  const entrenado = Boolean(resumen?.ultimaEjecucion)
  const muestraSucursal = pestana === 'pronostico' || pestana === 'anomalias' || pestana === 'reposicion'
  const resumenNiveles = pestana === 'abandono' ? (resultado?.resumen?.por_nivel as Array<{ nivel: string; clientes: number }> | undefined) : undefined

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Modelos</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Resultados del machine learning{resumen?.ultimaEjecucion?.fin ? ` · Última corrida: ${fechaHora(resumen.ultimaEjecucion.fin)}` : ''}
        </p>
      </div>

      <div role="tablist" aria-label="Modelos" className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800">
        {PESTANAS.map(([clave, etiqueta]) => (
          <button
            key={clave}
            type="button"
            role="tab"
            aria-selected={pestana === clave}
            onClick={() => props.onPestana(clave)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              pestana === clave ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white' : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {modelo && (
        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <MetricasModelo modelo={modelo} />
        </section>
      )}

      {(muestraSucursal || pestana === 'abandono') && (
        <div className="flex flex-wrap gap-3">
          {pestana === 'pronostico' && (
            <div className="w-40">
              <Select label="Frecuencia" value={props.frecuencia} onChange={(evento) => props.onFrecuencia(evento.target.value as Frecuencia)}>
                <option value="MENSUAL">Mensual</option>
                <option value="SEMANAL">Semanal</option>
              </Select>
            </div>
          )}
          {muestraSucursal && (
            <div className="w-56">
              <Select label="Sucursal" value={props.sucursal} onChange={(evento) => props.onSucursal(evento.target.value)}>
                <option value="">Todas</option>
                {props.sucursales.map((s) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
              </Select>
            </div>
          )}
          {pestana === 'abandono' && (
            <div className="w-40">
              <Select label="Riesgo" value={props.nivel} onChange={(evento) => props.onNivel(evento.target.value)}>
                <option value="">Todos</option>
                <option value="ALTO">Alto</option>
                <option value="MEDIO">Medio</option>
                <option value="BAJO">Bajo</option>
              </Select>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      {cargando ? (
        <Skeleton className="h-72 w-full" />
      ) : pestana === 'pronostico' ? (
        pronostico?.disponible ? (
          <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Ventas y pronóstico (Bs){pronostico.modelo ? ` · ${pronostico.modelo.replace(/_/g, ' ').toLowerCase()}` : ''}</h2>
            <GraficoPronostico historia={pronostico.historia} futuro={pronostico.futuro} diario={pronostico.frecuencia === 'SEMANAL'} />
          </section>
        ) : (
          <SinResultados entrenado={entrenado} />
        )
      ) : !resultado?.filas.length ? (
        <SinResultados entrenado={entrenado && resultado?.disponible !== false} />
      ) : (
        <div className="space-y-4">
          {resumenNiveles && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {['ALTO', 'MEDIO', 'BAJO'].flatMap((nivel) => resumenNiveles.filter((n) => n.nivel === nivel)).map((n) => `${n.clientes} en riesgo ${n.nivel.toLowerCase()}`).join(' · ')}
            </p>
          )}
          {pestana === 'segmentacion' && <GraficoBi grafico={GRAFICO_SEGMENTOS} filas={resultado.filas} />}
          <TablaResultado filas={resultado.filas} columnas={COLUMNAS[pestana]} />
        </div>
      )}
    </div>
  )
}
