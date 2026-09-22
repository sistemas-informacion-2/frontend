import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { CampoReporte, CategoriaCampo, FiltroReporte, OrdenReporte, ReportRunRequest, ReporteDefinicion } from '../../reportes.types'

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

const GRUPOS_CAMPOS: { categoria: CategoriaCampo; titulo: string }[] = [
  { categoria: 'DIMENSION', titulo: 'Dimensiones' },
  { categoria: 'MEASURE', titulo: 'Métricas' },
  { categoria: 'PLAIN', titulo: 'Identificadores' },
]

const LIMITES = [25, 50, 100, 500]

interface FilterBuilderProps {
  catalogo?: ReporteDefinicion[]
  tipoActivo?: ReporteDefinicion
  request: ReportRunRequest
  ejecutando: boolean
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

function alternar(lista: string[], valor: string): string[] {
  return lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor]
}

/** Editor visual del Report Builder: columnas, filtros, orden y límite. */
export function ReportFiltersBuilder({
  catalogo,
  tipoActivo,
  request,
  ejecutando,
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

  return (
    <section className="space-y-5 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Report Builder</h2>

      <Select label="Tipo de reporte" value={request.reportType} onChange={(event) => onCambiarTipo(event.target.value)}>
        {catalogo.map((tipos) => (
          <option key={tipos.id} value={tipos.id}>
            {tipos.nombre}
          </option>
        ))}
      </Select>

      {tipoActivo && (
        <>
          <fieldset>
            <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Columnas</legend>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{tipoActivo.descripcion}</p>
            <div className="mt-3 space-y-4">
              {GRUPOS_CAMPOS.map((grupo) => {
                const delGrupo = tipoActivo.campos.filter((c) => c.categoria === grupo.categoria)
                if (delGrupo.length === 0) return null
                return (
                  <div key={grupo.categoria}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{grupo.titulo}</p>
                    <div className="mt-1.5 grid gap-1.5">
                      {delGrupo.map((campo) => (
                        <label key={campo.name} className="flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-neutral-300"
                            checked={seleccionados.includes(campo.name)}
                            onChange={() => onCombinar({ selectedFields: alternar(seleccionados, campo.name) })}
                          />
                          {campo.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {tieneMedidas && tieneDimensiones && (
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                Las métricas se suman agrupando por las demás columnas; combinar el total de la nota con detalles del producto puede sobrecontar.
              </p>
            )}
          </fieldset>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filtros</p>
              {(request.filters?.length ?? 0) === 0 && camposFiltrables.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onFiltroAgregar({
                      campo: camposFiltrables[0].name,
                      operador: camposFiltrables[0].operadores[0],
                      valor: '',
                    })
                  }
                  className="text-sm font-medium text-neutral-900 hover:underline dark:text-white"
                >
                  + Agregar
                </button>
              )}
            </div>

            {(request.filters ?? []).map((filtro, indice) => {
              const campo = camposFiltrables.find((c) => c.name === filtro.campo)
              return (
                <div key={`${filtro.campo ?? ''}-${indice}`} className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                  <div className="flex items-start gap-2">
                    <Select
                      label="Campo"
                      value={filtro.campo}
                      onChange={(event) => onFiltroPatch(indice, { campo: event.target.value, operador: primerOperador(event.target.value) })}
                      className="flex-1"
                    >
                      <option value="">— Elegir —</option>
                      {camposFiltrables.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => onFiltroBorrar(indice)}
                      aria-label="Quitar filtro"
                      className="mt-6 rounded-md border border-neutral-300 px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      ✕
                    </button>
                  </div>

                  {campo ? (
                    <NombreCampo
                      campo={campo}
                      filtro={filtro}
                      indice={indice}
                      onPatch={onFiltroPatch}
                    />
                  ) : (
                    <p className="text-xs text-amber-600">Este campo ya no existe en el catálogo; quita el filtro o elige otro.</p>
                  )}
                </div>
              )
            })}

            {(request.filters?.length ?? 0) > 0 && camposFiltrables.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onFiltroAgregar({
                    campo: camposFiltrables[0].name,
                    operador: camposFiltrables[0].operadores[0],
                    valor: '',
                  })
                }
                className="text-sm font-medium text-neutral-900 hover:underline dark:text-white"
              >
                + Agregar filtro
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              onChange={(event) =>
                onOrdenChange(request.sort ? { ...request.sort, direccion: event.target.value as 'asc' | 'desc' } : undefined)
              }
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

          <Button onClick={onAplicar} loading={ejecutando} disabled={seleccionados.length === 0} className="w-full">
            Generar reporte
          </Button>
        </>
      )}
    </section>
  )
}

function NombreCampo({
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
      <Select label="Condición" value={filtro.operador} onChange={(event) => onPatch(indice, { operador: event.target.value })}>
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
          label="Valor"
          type={campo.tipo === 'NUMBER' ? 'number' : 'text'}
          value={String(filtro.valor ?? '')}
          onChange={(event) => onPatch(indice, { valor: event.target.value })}
          placeholder="Valor a filtrar"
        />
      )}
    </>
  )
}