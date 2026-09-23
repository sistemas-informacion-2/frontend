import type { ReactNode } from 'react'
import type { Devolucion } from '@/modules/comercial/types'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { bs } from '../../utils/reservas'

interface MisDevolucionesPageViewProps {
  esCliente: boolean
  devoluciones: Devolucion[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  cargando: boolean
  error: string | null
  abierta: boolean
  detalle: ReactNode
  onVer: (id: number) => void
  onCerrar: () => void
  onPageChange: (page: number) => void
}

export function MisDevolucionesPageView({
  esCliente,
  devoluciones,
  meta,
  cargando,
  error,
  abierta,
  detalle,
  onVer,
  onCerrar,
  onPageChange,
}: MisDevolucionesPageViewProps) {
  if (!esCliente) {
    return <EmptyState icon={<span className="text-4xl">↩️</span>} title="Las devoluciones son solo para clientes" description="Entraste con una cuenta del personal." />
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Mis devoluciones</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Las devoluciones se registran en la sucursal. Si necesitas devolver una prenda, acércate con tu código de compra.
      </p>

      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <div className="mt-5">
        {cargando ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, indice) => (
              <Skeleton key={indice} className="h-20 w-full" />
            ))}
          </div>
        ) : devoluciones.length === 0 ? (
          <EmptyState icon={<span className="text-4xl">↩️</span>} title="No tienes devoluciones" description="Aquí verás las devoluciones y reembolsos que se registren a tu nombre." />
        ) : (
          <ul className="space-y-3">
            {devoluciones.map((devolucion) => (
              <li key={devolucion.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div>
                  <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">{devolucion.codigoDevolucion}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(devolucion.fechaEmision).toLocaleDateString('es-BO')} · de {devolucion.codigoNota ? `la compra ${devolucion.codigoNota}` : `la reserva ${devolucion.codigoReserva}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-base font-semibold text-neutral-900 dark:text-white">{bs(devolucion.montoTotalReembolsado)}</p>
                  <button
                    type="button"
                    onClick={() => onVer(devolucion.id)}
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

      <Modal open={abierta} title="Detalle de devolución" onClose={onCerrar}>
        {detalle}
      </Modal>
    </div>
  )
}
