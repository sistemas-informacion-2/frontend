import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { CampoReporte, FiltroReporte, OrdenReporte, ReportRunRequest, ReporteDefinicion, TipoCampo } from '../../reportes.types'

const OPERADORES_LABEL: Record<string, string> = {
  eq: 'es igual a',
  ne: 'es distinto de',
  contains: 'contiene',
  startsWith: 'comienza con',
  endsWith: 'termina en',
  gt: 'mayor que',
  gte: 'mayor o igual que',
  lt: 'menor que',
  lte: 'menor o igual que',
}

const TIPO_CAMPO_LABEL: Record<TipoCampo, string> = {
  STRING: 'TEXTO',
  NUMBER: 'NÚMERO',
  DATE: 'FECHA',
  BOOLEAN: 'SÍ/NO',
}

const LIMITES = [25, 50, 100, 500]

interface FilterBuilderProps {
  catalogo?: ReporteDefinicion[]
  tipoActivo?: ReporteDefinicion
  request: ReportRunRequest
  ejecutando: boolean
  etiquetaBoton?: string
  /** false en el Constructor: ahí el botón de ejecutar vive en el paso 3 (Resultado), junto con exportar y guardar plantilla. */
  mostrarBoton?: boolean
  onCambiarTipo: (tipo: string) => void
  onCombinar: (parche: Partial<ReportRunRequest>) => void
  onFiltroAgregar: (filtro: FiltroReporte) => void
  onFiltroPatch: (indice: number, parche: Partial<FiltroReporte>) => void
  onFiltroBorrar: (indice: number) => void
  onOrdenChange: (orden?: OrdenReporte) => void
  onFechasChange: (desde?: string, hasta?: string) => void
  onLimiteChange: (limite: number) => void
  onAplicar: () => void
}

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          {numero}
        </span>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{titulo}</h2>
      </div>
      {children}
    </section>
  )
}

/** Editor visual del Report Builder (CU18), en el formato "paso 1 / paso 2" de entidad+campos y filtros+orden. */
export function ReportFiltersBuilder({
  catalogo,
  tipoActivo,
  request,
  ejecutando,
  etiquetaBoton = 'Generar reporte',
  mostrarBoton = true,
  onCambiarTipo,
  onCombinar,
  onFiltroAgregar,
  onFiltroPatch,
  onFiltroBorrar,
  onOrdenChange,
  onFechasChange,
  onLimiteChange,
  onAplicar,
}: FilterBuilderProps) {
  if (!catalogo) {
    return (
      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </section>
    )
  }

  const camposFiltrables = tipoActivo?.campos.filter((c) => c.permiteFiltro) ?? []
  const camposOrdenables = tipoActivo?.campos.filter((c) => c.permiteOrden) ?? []
  const seleccionados = request.selectedFields
  const tieneMedidas = seleccionados.some((campo) => tipoActivo?.campos.find((c) => c.name === campo)?.categoria === 'MEASURE')
  const tieneDimensiones = seleccionados.some((campo) => tipoActivo?.campos.find((c) => c.name === campo)?.categoria === 'DIMENSION')
  // Con métricas activas, el orden solo puede ser por métrica o por columna incluida
  // (el GROUP BY no permite ordenar por columnas que no estén agregadas).
  const opcionesOrden = tieneMedidas
    ? camposOrdenables.filter((c) => c.categoria === 'MEASURE' || seleccionados.includes(c.name))
    : camposOrdenables

  const primerOperador = (nombreCampo: string) => camposFiltrables.find((c) => c.name === nombreCampo)?.operadores[0] ?? 'eq'
  const matchType = request.matchType ?? 'AND'
  const conectorFiltro = matchType === 'OR' ? 'o' : 'y'

  const moverCampo = (indice: number, delta: number) => {
    const destino = indice + delta
    if (destino < 0 || destino >= seleccionados.length) return
    const copia = [...seleccionados]
    ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
    onCombinar({ selectedFields: copia })
  }

  const agregarCampo = (nombre: string) => {
    if (seleccionados.includes(nombre)) return
    onCombinar({ selectedFields: [...seleccionados, nombre] })
  }

  const quitarCampo = (nombre: string) => {
    onCombinar({ selectedFields: seleccionados.filter((campo) => campo !== nombre) })
  }

  return (
    <div className="space-y-4">
      <Paso numero={1} titulo="Entidad y campos">
        <Select label="Entidad base" value={request.reportType} onChange={(event) => onCambiarTipo(event.target.value)}>
          {catalogo.map((tipos) => (
            <option key={tipos.id} value={tipos.id}>
              {tipos.nombre}
            </option>
          ))}
        </Select>

        {tipoActivo && (
          <>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{tipoActivo.descripcion}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Campos disponibles</p>
                <div className="mt-1.5 max-h-72 space-y-1 overflow-y-auto">
                  {tipoActivo.campos.map((campo) => {
                    const activo = seleccionados.includes(campo.name)
                    return (
                      <button
                        key={campo.name}
                        type="button"
                        onClick={() => agregarCampo(campo.name)}
                        disabled={activo}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          activo
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span>
                          {campo.label}
                          {campo.categoria === 'MEASURE' && <span className="ml-1 text-[10px] text-neutral-400">(suma)</span>}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                          {TIPO_CAMPO_LABEL[campo.tipo]}
                          {!activo && <span className="text-sm font-bold text-neutral-500">+</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Columnas del reporte <span className="font-normal normal-case text-neutral-400">(en este orden)</span>
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {seleccionados.length === 0 && (
                    <p className="rounded-md border border-dashed border-neutral-300 px-3 py-4 text-center text-xs text-neutral-400 dark:border-neutral-700">
                      Haz clic en los campos de la izquierda para agregarlos como columnas.
                    </p>
                  )}
                  {seleccionados.map((nombre, indice) => {
                    const campo = tipoActivo.campos.find((c) => c.name === nombre)
                    return (
                      <div
                        key={nombre}
                        className="flex items-center gap-2 rounded-md border border-neutral-200 px-2.5 py-1.5 dark:border-neutral-800"
                      >
                        <span className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">{campo?.label ?? nombre}</span>
                        <button
                          type="button"
                          onClick={() => moverCampo(indice, -1)}
                          disabled={indice === 0}
                          aria-label="Subir columna"
                          className="rounded border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500 disabled:opacity-30 dark:border-neutral-700"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moverCampo(indice, 1)}
                          disabled={indice === seleccionados.length - 1}
                          aria-label="Bajar columna"
                          className="rounded border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500 disabled:opacity-30 dark:border-neutral-700"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => quitarCampo(nombre)}
                          aria-label="Quitar columna"
                          className="rounded border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
                {tieneMedidas && tieneDimensiones && (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Las métricas (suma) se agrupan por las demás columnas elegidas.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </Paso>

      {tipoActivo && (
        <Paso numero={2} titulo="Filtros y orden">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Filtros</p>
            {camposFiltrables.length > 0 && (
              <div className="flex overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => onCombinar({ matchType: 'AND' })}
                  className={`px-2.5 py-1 text-xs font-medium ${
                    matchType === 'AND'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900'
                  }`}
                >
                  Cumplir todos (Y)
                </button>
                <button
                  type="button"
                  onClick={() => onCombinar({ matchType: 'OR' })}
                  className={`px-2.5 py-1 text-xs font-medium ${
                    matchType === 'OR'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900'
                  }`}
                >
                  Cumplir alguno (O)
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {(request.filters ?? []).map((filtro, indice) => {
              const campo = camposFiltrables.find((c) => c.name === filtro.campo)
              return (
                <div key={`${filtro.campo ?? ''}-${indice}`} className="flex flex-wrap items-start gap-2">
                  <span className="w-10 pt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {indice === 0 ? 'Donde' : conectorFiltro}
                  </span>
                  <Select
                    value={filtro.campo}
                    onChange={(event) => onFiltroPatch(indice, { campo: event.target.value, operador: primerOperador(event.target.value) })}
                    className="w-40"
                  >
                    <option value="">— Elegir —</option>
                    {camposFiltrables.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                  {campo ? (
                    <CondicionYValor campo={campo} filtro={filtro} indice={indice} onPatch={onFiltroPatch} />
                  ) : (
                    <p className="pt-2 text-xs text-amber-600">Este campo ya no existe; quita el filtro o elige otro.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onFiltroBorrar(indice)}
                    aria-label="Quitar filtro"
                    className="mt-0.5 rounded-md border border-neutral-300 px-2 py-1.5 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>

          {camposFiltrables.length > 0 && (
            <button
              type="button"
              onClick={() => onFiltroAgregar({ campo: camposFiltrables[0].name, operador: camposFiltrables[0].operadores[0], valor: '' })}
              className="text-sm font-medium text-neutral-900 hover:underline dark:text-white"
            >
              + Agregar filtro
            </button>
          )}

          <div className="grid gap-3 border-t border-neutral-100 pt-3 sm:grid-cols-2 dark:border-neutral-900">
            <Select
              label="Ordenar por"
              value={request.sort?.campo ?? ''}
              onChange={(event) =>
                onOrdenChange(event.target.value === '' ? undefined : { campo: event.target.value, direccion: request.sort?.direccion ?? 'asc' })
              }
            >
              <option value="">— Sin orden —</option>
              {opcionesOrden.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Select
              label="Dirección"
              value={request.sort?.direccion ?? 'asc'}
              onChange={(event) => onOrdenChange(request.sort ? { ...request.sort, direccion: event.target.value as 'asc' | 'desc' } : undefined)}
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </Select>
          </div>

          {tipoActivo.id !== 'INVENTARIO' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Desde"
                type="date"
                value={request.dateFrom ?? ''}
                onChange={(event) => onFechasChange(event.target.value || undefined, request.dateTo)}
              />
              <Input
                label="Hasta"
                type="date"
                value={request.dateTo ?? ''}
                onChange={(event) => onFechasChange(request.dateFrom, event.target.value || undefined)}
              />
            </div>
          )}

          <Select label="Límite de registros" value={String(request.limit ?? 50)} onChange={(event) => onLimiteChange(Number(event.target.value))}>
            {LIMITES.map((limite) => (
              <option key={limite} value={limite}>
                {limite}
              </option>
            ))}
          </Select>

          {mostrarBoton && (
            <Button onClick={onAplicar} loading={ejecutando} disabled={seleccionados.length === 0} className="w-full">
              {etiquetaBoton}
            </Button>
          )}
        </Paso>
      )}
    </div>
  )
}

function CondicionYValor({
  campo,
  filtro,
  indice,
  onPatch,
}: {
  campo: CampoReporte
  filtro: FiltroReporte
  indice: number
  onPatch: (indice: number, parche: Partial<FiltroReporte>) => void
}) {
  return (
    <>
      <Select value={filtro.operador} onChange={(event) => onPatch(indice, { operador: event.target.value })} className="w-40">
        {campo.operadores.map((operador) => (
          <option key={operador} value={operador}>
            {OPERADORES_LABEL[operador] ?? operador}
          </option>
        ))}
      </Select>

      {campo.tipo === 'BOOLEAN' ? (
        <label className="flex items-center gap-2 pt-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={Boolean(filtro.valor)}
            onChange={(event) => onPatch(indice, { valor: event.target.checked })}
            className="h-4 w-4 rounded border-neutral-300"
          />
          {filtro.valor ? 'Verdadero' : 'Falso'}
        </label>
      ) : (
        <Input
          type={campo.tipo === 'NUMBER' ? 'number' : 'text'}
          value={String(filtro.valor ?? '')}
          onChange={(event) => onPatch(indice, { valor: event.target.value })}
          placeholder="Valor"
          className="w-36"
        />
      )}
    </>
  )
}
