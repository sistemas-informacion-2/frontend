import { useState } from 'react'
import useSWR from 'swr'
import { getApiErrorMessage, mensajeSinConexion } from '@/core/http/errors'
import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { listarMovimientos } from '../services/inventario.service'
import type { InventarioItem } from '../types'
import { TIPO_MOVIMIENTO, TOPE_CON_RANGO, TOPE_RECIENTES, claveKardex, conSigno, costoKardex, fechaHoraKardex } from '../utils/kardex'

interface KardexStockProps {
  item: InventarioItem
}

/**
 * Kardex de una fila de stock (una variante en un almacen): cada entrada y salida con el saldo que dejo, su
 * costo, el documento que la produjo y quien la hizo. Sin fechas muestra los ultimos movimientos.
 */
export function KardexStock({ item }: KardexStockProps) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const rangoInvalido = Boolean(desde && hasta && desde > hasta)

  const { data: movimientos, error, isLoading } = useSWR(
    rangoInvalido ? null : claveKardex(item.id, desde, hasta),
    () => listarMovimientos(item.id, { desde, hasta }),
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  const conRango = Boolean(desde || hasta)
  const tope = conRango ? TOPE_CON_RANGO : TOPE_RECIENTES
  const recortado = (movimientos?.length ?? 0) >= tope

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{item.productoNombre}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-mono">{item.sku}</span> · {item.talla}/{item.color} · {item.almacenNombre} ({item.sucursalNombre})
          </p>
        </div>
        <dl className="flex shrink-0 gap-5 text-sm">
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-400">Disponible</dt>
            <dd className="text-lg font-semibold text-neutral-900 dark:text-white">{item.stockDisponible}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-400">Reservado</dt>
            <dd className="text-lg font-semibold text-neutral-900 dark:text-white">{item.stockReservado}</dd>
          </div>
        </dl>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-44">
          <Input label="Desde" type="date" value={desde} max={hasta || undefined} onChange={(event) => setDesde(event.target.value)} />
        </div>
        <div className="sm:w-44">
          <Input label="Hasta" type="date" value={hasta} min={desde || undefined} onChange={(event) => setHasta(event.target.value)} />
        </div>
        {conRango && (
          <button
            type="button"
            onClick={() => {
              setDesde('')
              setHasta('')
            }}
            className="pb-2.5 text-sm font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Ver los últimos
          </button>
        )}
      </div>

      {rangoInvalido && <p className="text-sm text-red-600 dark:text-red-400">La fecha "desde" no puede ser posterior a "hasta".</p>}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
          {mensajeSinConexion(error) ?? getApiErrorMessage(error, 'No se pudo cargar el historial.')}
        </p>
      )}

      {isLoading && !movimientos ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, indice) => (
            <Skeleton key={indice} className="h-10 w-full" />
          ))}
        </div>
      ) : movimientos && movimientos.length === 0 ? (
        <EmptyState
          title="Sin movimientos"
          description={conRango ? 'No hubo movimientos de esta variante en este almacén en esas fechas.' : 'Esta variante todavía no tiene movimientos en este almacén.'}
        />
      ) : (
        movimientos && (
          <>
            <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                  <tr>
                    <th className="px-3 py-2.5">Fecha</th>
                    <th className="px-3 py-2.5">Tipo</th>
                    <th className="px-3 py-2.5 text-right">Entrada</th>
                    <th className="px-3 py-2.5 text-right">Salida</th>
                    <th className="px-3 py-2.5 text-right">Saldo</th>
                    <th className="px-3 py-2.5 text-right">Reservado</th>
                    <th className="px-3 py-2.5 text-right">Costo unit.</th>
                    <th className="px-3 py-2.5">Documento</th>
                    <th className="px-3 py-2.5">Usuario</th>
                    <th className="px-3 py-2.5">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {movimientos.map((movimiento) => {
                    const tipo = TIPO_MOVIMIENTO[movimiento.tipo] ?? { texto: movimiento.tipo, tono: 'neutral' as const }
                    return (
                      <tr key={movimiento.id} className="text-neutral-700 dark:text-neutral-300">
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs">{fechaHoraKardex(movimiento.fechaHora)}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={tipo.tono}>{tipo.texto}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-emerald-700 dark:text-emerald-400">{movimiento.cantidad > 0 ? conSigno(movimiento.cantidad) : ''}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-rose-700 dark:text-rose-400">{movimiento.cantidad < 0 ? conSigno(movimiento.cantidad) : ''}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-neutral-900 dark:text-white">{movimiento.stockResultante}</td>
                        <td className="px-3 py-2.5 text-right">
                          {movimiento.reservadoResultante}
                          {movimiento.deltaReservado !== 0 && <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">({conSigno(movimiento.deltaReservado)})</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">{costoKardex(movimiento.costoUnitario)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{movimiento.referenciaCodigo ?? '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2.5">{movimiento.usuarioNombre ?? <span className="text-neutral-400">Sistema</span>}</td>
                        <td className="max-w-56 truncate px-3 py-2.5 text-xs text-neutral-500 dark:text-neutral-400" title={movimiento.motivo ?? undefined}>
                          {movimiento.motivo ?? ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Del más reciente al más antiguo. El saldo es el stock disponible que quedó después de cada movimiento.
              {recortado && (conRango ? ` Se muestran los ${tope} más recientes del periodo: acorta las fechas para ver el resto.` : ` Se muestran los últimos ${tope}: filtra por fechas para ver los anteriores.`)}
            </p>
          </>
        )
      )}
    </div>
  )
}
