import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { BitacoraRegistro, OperacionBitacora } from '../../types/bitacora'

interface BitacoraPageViewProps {
  registros: BitacoraRegistro[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
  loading: boolean
  error: string | null
  tablaAfectada: string
  operacion: OperacionBitacora | ''
  fechaDesde: string
  fechaHasta: string
  usuarioId: string
  detalle: BitacoraRegistro | null
  onTablaAfectada: (value: string) => void
  onOperacion: (value: OperacionBitacora | '') => void
  onFechaDesde: (value: string) => void
  onFechaHasta: (value: string) => void
  onUsuarioId: (value: string) => void
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onDetalle: (registro: BitacoraRegistro) => void
  onCloseDetalle: () => void
}

export function BitacoraPageView({
  registros, meta, loading, error, tablaAfectada, operacion, fechaDesde, fechaHasta, usuarioId, detalle,
  onTablaAfectada, onOperacion, onFechaDesde, onFechaHasta, onUsuarioId, onClearFilters, onPageChange, onDetalle, onCloseDetalle,
}: BitacoraPageViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Bitácora</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Consulta la trazabilidad de las operaciones realizadas en el sistema.</p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Input label="Usuario ID" type="number" min="1" value={usuarioId} onChange={(event) => onUsuarioId(event.target.value)} />
          <Input label="Tabla afectada" placeholder="usuarios, productos..." value={tablaAfectada} onChange={(event) => onTablaAfectada(event.target.value)} />
          <Select label="Operación" value={operacion} onChange={(event) => onOperacion(event.target.value as OperacionBitacora | '')}>
            <option value="">Todas</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option><option value="DELETE">DELETE</option>
          </Select>
          <Input label="Desde" type="date" value={fechaDesde} onChange={(event) => onFechaDesde(event.target.value)} />
          <Input label="Hasta" type="date" value={fechaHasta} onChange={(event) => onFechaHasta(event.target.value)} />
        </div>
        <div className="mt-4 flex justify-end"><button type="button" onClick={onClearFilters} className="text-sm text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Limpiar filtros</button></div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : registros.length === 0 ? <div className="p-4"><EmptyState title="No hay registros" description="No se encontraron eventos con los filtros seleccionados." /></div> : <>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"><tr><th className="px-4 py-3 font-medium">Fecha</th><th className="px-4 py-3 font-medium">Usuario</th><th className="px-4 py-3 font-medium">Operación</th><th className="px-4 py-3 font-medium">Tabla</th><th className="px-4 py-3 font-medium">IP</th><th className="px-4 py-3 text-right font-medium">Acción</th></tr></thead><tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">{registros.map((registro) => <tr key={registro.id} className="text-neutral-700 dark:text-neutral-300"><td className="px-4 py-3 whitespace-nowrap">{new Date(registro.fechaHora).toLocaleString('es-BO')}</td><td className="px-4 py-3">{registro.usuario ? `${registro.usuario.nombre} ${registro.usuario.apellido}` : 'Sistema'}</td><td className="px-4 py-3"><OperacionBadge operacion={registro.operacion} /></td><td className="px-4 py-3">{registro.tablaAfectada}</td><td className="px-4 py-3">{registro.ipOrigen ?? '—'}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => onDetalle(registro)} className="font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Ver detalle</button></td></tr>)}</tbody></table></div>
          <div className="p-4">{meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />}</div>
        </>}
      </section>
      <Modal open={!!detalle} title="Detalle de auditoría" onClose={onCloseDetalle}>{detalle && <Detalle registro={detalle} />}</Modal>
    </div>
  )
}

function OperacionBadge({ operacion }: { operacion: string }) { const tone = operacion === 'DELETE' ? 'danger' : operacion === 'POST' ? 'success' : 'neutral'; return <Badge tone={tone}>{operacion}</Badge> }
function Detalle({ registro }: { registro: BitacoraRegistro }) {
  const json = (value: Record<string, unknown> | null) => value ? JSON.stringify(value, null, 2) : 'Sin datos'
  return <div className="space-y-4 text-sm"><div className="grid gap-3 sm:grid-cols-2"><div><p className="font-medium text-neutral-500">Acción</p><p className="break-all text-neutral-900 dark:text-white">{registro.accion}</p></div><div><p className="font-medium text-neutral-500">Agente de usuario</p><p className="break-all text-neutral-900 dark:text-white">{registro.userAgent ?? 'No registrado'}</p></div></div><div><p className="mb-1 font-medium text-neutral-500">Datos anteriores</p><pre className="max-h-56 overflow-auto rounded-md bg-neutral-100 p-3 text-xs dark:bg-neutral-900 dark:text-neutral-200">{json(registro.datosAnteriores)}</pre></div><div><p className="mb-1 font-medium text-neutral-500">Datos nuevos</p><pre className="max-h-56 overflow-auto rounded-md bg-neutral-100 p-3 text-xs dark:bg-neutral-900 dark:text-neutral-200">{json(registro.datosNuevos)}</pre></div></div>
}