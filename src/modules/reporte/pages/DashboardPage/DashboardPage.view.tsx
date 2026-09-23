import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { BarrasSucursales } from '../../components/BarrasSucursales'
import { KpiCard } from '../../components/KpiCard'
import { LineaTendencia } from '../../components/LineaTendencia'
import type { DashboardResumen } from '../../dashboard.types'
import { formatearMonto } from '../../utils/format'

interface DashboardPageViewProps {
  nombre: string
  subtitulo: string
  puedeVerIndicadores: boolean
  resumen?: DashboardResumen
  cargando: boolean
  hayError: boolean
  /** Texto de la vista activa: "Vista General" o el nombre de la sucursal. */
  vista: string
  idSucursal: number | null
  dias: number
  onDias: (dias: number) => void
  onReintentar: () => void
}

const PERIODOS = [7, 15, 30]

function Tarjeta({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{titulo}</h2>
      {descripcion && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function TextoVacio({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">{children}</p>
}

export function DashboardPageView({
  nombre,
  subtitulo,
  puedeVerIndicadores,
  resumen,
  cargando,
  hayError,
  vista,
  idSucursal,
  dias,
  onDias,
  onReintentar,
}: DashboardPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Bienvenido, {nombre}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitulo}</p>
        </div>
        {puedeVerIndicadores && (
          <div className="flex items-end gap-3">
            <span className="pb-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">{vista}</span>
            <div className="w-40">
              <Select label="Período" value={String(dias)} onChange={(event) => onDias(Number(event.target.value))}>
                {PERIODOS.map((periodo) => (
                  <option key={periodo} value={periodo}>
                    Últimos {periodo} días
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </div>

      {puedeVerIndicadores && <Indicadores resumen={resumen} cargando={cargando} hayError={hayError} idSucursal={idSucursal} dias={dias} onReintentar={onReintentar} />}
    </div>
  )
}

function Indicadores({
  resumen,
  cargando,
  hayError,
  idSucursal,
  dias,
  onReintentar,
}: Pick<DashboardPageViewProps, 'resumen' | 'cargando' | 'hayError' | 'idSucursal' | 'dias' | 'onReintentar'>) {
  if (hayError) {
    return (
      <EmptyState
        icon={<span className="text-4xl">📉</span>}
        title="No se pudo cargar el dashboard"
        description="Revisa tu conexión o inténtalo de nuevo en unos segundos."
        action={<Button onClick={onReintentar}>Reintentar</Button>}
      />
    )
  }

  if (cargando || !resumen) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, indice) => (
            <Skeleton key={indice} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { ventasDia, stockCritico } = resumen

  return (
    <>
      {!resumen.ventasDisponibles && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Las ventas aún no están habilitadas (CU13 Ventas Presenciales), por eso las métricas de ventas aparecen en cero.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard titulo="Ventas de hoy" valor={formatearMonto(ventasDia.total)} detalle={`${ventasDia.cantidadNotas} notas de venta`} />
        <KpiCard titulo="Ticket promedio" valor={formatearMonto(ventasDia.ticketPromedio)} detalle="Ventas de hoy" />
        <KpiCard titulo="Cajas abiertas" valor={resumen.cajasAbiertas} detalle={idSucursal === null ? 'En todas las sucursales' : 'En esta sucursal'} />
        <KpiCard
          titulo="Stock crítico"
          valor={stockCritico.total}
          detalle="Variantes en o bajo su stock mínimo"
          tono={stockCritico.total > 0 ? 'alerta' : 'normal'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Tendencia de ventas" descripcion={`Ingresos por día, últimos ${dias} días`}>
          {resumen.tendenciaVentas.length > 0 ? <LineaTendencia puntos={resumen.tendenciaVentas} /> : <TextoVacio>Sin datos de ventas.</TextoVacio>}
        </Tarjeta>

        <Tarjeta titulo="Ingresos por sucursal" descripcion={`Comparativo de los últimos ${dias} días`}>
          {resumen.ventasPorSucursal.length > 0 ? (
            <BarrasSucursales sucursales={resumen.ventasPorSucursal} idResaltada={idSucursal} />
          ) : (
            <TextoVacio>Sin datos de ventas.</TextoVacio>
          )}
        </Tarjeta>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Variantes más vendidas" descripcion={`Top 5 por unidades, últimos ${dias} días`}>
          {resumen.topVariantes.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-neutral-500 dark:text-neutral-400">
                <tr>
                  <th className="pb-2 font-medium">Producto</th>
                  <th className="pb-2 font-medium">Variante</th>
                  <th className="pb-2 text-right font-medium">Unidades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {resumen.topVariantes.map((variante) => (
                  <tr key={variante.idVariante} className="text-neutral-800 dark:text-neutral-200">
                    <td className="py-2 pr-2">
                      <p className="font-medium">{variante.producto}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{variante.sku}</p>
                    </td>
                    <td className="py-2 pr-2">
                      {variante.talla} · {variante.color}
                    </td>
                    <td className="py-2 text-right font-semibold">{variante.cantidadVendida}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <TextoVacio>Aún no hay ventas en este período.</TextoVacio>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Alertas de inventario"
          descripcion={
            stockCritico.total > stockCritico.items.length
              ? `Mostrando ${stockCritico.items.length} de ${stockCritico.total}, las más urgentes`
              : 'Variantes en o bajo su stock mínimo'
          }
        >
          {stockCritico.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-neutral-500 dark:text-neutral-400">
                  <tr>
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium">Almacén</th>
                    <th className="pb-2 text-right font-medium">Stock / Mín.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {stockCritico.items.map((item) => (
                    <tr key={item.idInventario} className="text-neutral-800 dark:text-neutral-200">
                      <td className="py-2 pr-2">
                        <p className="font-medium">{item.producto}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {item.sku} · {item.talla} · {item.color}
                        </p>
                      </td>
                      <td className="py-2 pr-2">
                        <p>{item.almacen}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.sucursal}</p>
                      </td>
                      <td className="py-2 text-right font-semibold text-red-700 dark:text-red-400">
                        {item.stockDisponible} / {item.stockMinimo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <TextoVacio>Todo el inventario está sobre su stock mínimo.</TextoVacio>
          )}
        </Tarjeta>
      </div>
    </>
  )
}
