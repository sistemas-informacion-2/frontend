import type { VentasSucursal } from '../types'
import { formatearMonto } from '../utils/format'

interface BarrasSucursalesProps {
  sucursales: VentasSucursal[]
  /** Sucursal seleccionada en la Vista por Sucursal; se resalta frente al resto. */
  idResaltada: number | null
}

export function BarrasSucursales({ sucursales, idResaltada }: BarrasSucursalesProps) {
  const maximo = Math.max(...sucursales.map((sucursal) => sucursal.total), 1)

  return (
    <ul className="space-y-3">
      {sucursales.map((sucursal) => {
        const resaltada = idResaltada === null || idResaltada === sucursal.idSucursal
        return (
          <li key={sucursal.idSucursal}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">{sucursal.sucursal}</span>
              <span className="shrink-0 text-neutral-600 dark:text-neutral-400">{formatearMonto(sucursal.total)}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className={`h-full rounded-full bg-neutral-900 dark:bg-white ${resaltada ? '' : 'opacity-30'}`}
                style={{ width: `${(sucursal.total / maximo) * 100}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
