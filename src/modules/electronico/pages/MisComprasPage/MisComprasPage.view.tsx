import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Venta } from '@/modules/comercial/types'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { bs } from '../../utils/reservas'

interface MisComprasPageViewProps {
  esCliente: boolean
  compras: Venta[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  cargando: boolean
  error: string | null
  abierta: boolean
  detalle: ReactNode
  onVer: (id: number) => void
  onCerrar: () => void
  onPageChange: (page: number) => void
}

const TIPO: Record<Venta['tipoVenta'], string> = {
  DIRECTA_PRESENCIAL: 'En tienda',
  ANTICIPO_RESERVA: 'Anticipo de reserva',
  PRESENCIAL_LIQUIDACION: 'Reserva retirada',
  E_COMMERCE: 'En línea',
}

export function MisComprasPageView({ esCliente, compras, meta, cargando, error, abierta, detalle, onVer, onCerrar, onPageChange }: MisComprasPageViewProps) {
  if (!esCliente) {
    return <EmptyState icon={<span className="text-4xl">🧾</span>} title="Las compras son solo para clientes" description="Entraste con una cuenta del personal." />
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Mis compras</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Tus notas de venta, de la más reciente a la más antigua.</p>

      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <div className="mt-5">
        {cargando ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, indice) => (
              <Skeleton key={indice} className="h-20 w-full" />
            ))}
          </div>
        ) : compras.length === 0 ? (
          <EmptyState
            icon={<span className="text-4xl">🧾</span>}
            title="Aún no tienes compras"
            description="Cuando compres en la tienda o retires una reserva, la nota de venta aparecerá aquí."
            action={
              <Link to="/" className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900">
                Ir al catálogo
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {compras.map((compra) => (
              <li key={compra.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div>
                  <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">{compra.codigoNota}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {compra.fechaEmision} · {compra.sucursalNombre} · {TIPO[compra.tipoVenta]}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-base font-semibold text-neutral-900 dark:text-white">{bs(compra.montoTotal)}</p>
                  <button
                    type="button"
                    onClick={() => onVer(compra.id)}
                    className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                  >
                    Ver detalle
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="mt-4">
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />
          </div>
        )}
      </div>

      <Modal open={abierta} title="Detalle de compra" onClose={onCerrar}>
        {detalle}
      </Modal>
    </div>
  )
}
