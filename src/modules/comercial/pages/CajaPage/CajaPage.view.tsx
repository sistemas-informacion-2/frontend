import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Sucursal } from '@/modules/operaciones/types'
import type { Caja, MovimientoCaja } from '@/modules/comercial/types'

interface CajaPageViewProps {
  sucursales: Sucursal[]
  idSucursal: number | ''
  cajaAbierta: Caja | null
  cajas: Caja[]
  loadingAbierta: boolean
  loadingCajas: boolean
  canManage: boolean
  error: string | null
  modalTitle: string
  modalContent: ReactNode
  onSucursalChange: (value: number | '') => void
  onAbrir: () => void
  onMovimiento: () => void
  onCerrar: () => void
  onCloseModal: () => void
}

export function CajaPageView({
  sucursales,
  idSucursal,
  cajaAbierta,
  cajas,
  loadingAbierta,
  loadingCajas,
  canManage,
  error,
  modalTitle,
  modalContent,
  onSucursalChange,
  onAbrir,
  onMovimiento,
  onCerrar,
  onCloseModal,
}: CajaPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Caja</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Abre el turno de caja, registra ingresos y egresos y ciérralo con el arqueo.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Select
          label="Sucursal"
          value={idSucursal === '' ? '' : String(idSucursal)}
          onChange={(event) => onSucursalChange(event.target.value === '' ? '' : Number(event.target.value))}
        >
          <option value="">Selecciona una sucursal</option>
          {sucursales.map((sucursal) => (
            <option key={sucursal.id} value={sucursal.id}>
              {sucursal.nombre}
            </option>
          ))}
        </Select>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {idSucursal === '' ? (
        <EmptyState title="Selecciona una sucursal" description="Elige la sucursal cuya caja deseas gestionar." />
      ) : loadingAbierta ? (
        <Skeleton className="h-48 w-full" />
      ) : cajaAbierta ? (
        <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Caja abierta</h2>
              <Badge tone="success">Abierta</Badge>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onMovimiento}>
                  Registrar movimiento
                </Button>
                <Button onClick={onCerrar}>Cerrar caja</Button>
              </div>
            )}
          </div>

          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Dato label="Cajero" value={cajaAbierta.cajeroNombre ?? 'Sin cajero asignado'} />
            <Dato label="Apertura" value={`${formatearFecha(cajaAbierta.fechaApertura)} · ${horaCorta(cajaAbierta.horaApertura)}`} />
            <Dato label="Monto inicial" value={formatearBs(cajaAbierta.montoInicial)} />
            <Dato label="Monto esperado" value={formatearBs(cajaAbierta.montoEsperado)} destacado />
            <Dato label="Ingresos" value={formatearBs(cajaAbierta.totalIngresos)} />
            <Dato label="Egresos" value={formatearBs(cajaAbierta.totalEgresos)} />
          </dl>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Concepto</th>
                  <th className="px-3 py-2 font-medium">Monto</th>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {cajaAbierta.movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-neutral-500 dark:text-neutral-400">
                      Sin movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  cajaAbierta.movimientos.map((movimiento) => <FilaMovimiento key={movimiento.id} movimiento={movimiento} />)
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No hay una caja abierta"
          description="Abre una caja para esta sucursal para empezar a registrar movimientos."
          action={canManage ? <Button onClick={onAbrir}>Abrir caja</Button> : undefined}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Historial de cajas</h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          {loadingCajas ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : cajas.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Sin cajas registradas" description="Todavía no hay turnos de caja para esta sucursal." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Cajero</th>
                    <th className="px-4 py-3 font-medium">Apertura</th>
                    <th className="px-4 py-3 font-medium">Cierre</th>
                    <th className="px-4 py-3 font-medium">Monto inicial</th>
                    <th className="px-4 py-3 font-medium">Monto final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {cajas.map((caja) => (
                    <tr key={caja.id} className="text-neutral-700 dark:text-neutral-300">
                      <td className="px-4 py-3">
                        <Badge tone={caja.estado === 'Abierta' ? 'success' : 'neutral'}>{caja.estado}</Badge>
                      </td>
                      <td className="px-4 py-3">{caja.cajeroNombre ?? '—'}</td>
                      <td className="px-4 py-3">{`${formatearFecha(caja.fechaApertura)} · ${horaCorta(caja.horaApertura)}`}</td>
                      <td className="px-4 py-3">
                        {caja.fechaCierre ? `${formatearFecha(caja.fechaCierre)} · ${horaCorta(caja.horaCierre ?? '')}` : '—'}
                      </td>
                      <td className="px-4 py-3">{formatearBs(caja.montoInicial)}</td>
                      <td className="px-4 py-3">{caja.montoFinal === null ? '—' : formatearBs(caja.montoFinal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Modal open={!!modalContent} title={modalTitle} onClose={onCloseModal}>
        {modalContent}
      </Modal>
    </div>
  )
}

interface DatoProps {
  label: string
  value: string
  destacado?: boolean
}

function Dato({ label, value, destacado }: DatoProps) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className={`mt-1 font-medium ${destacado ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
        {value}
      </dd>
    </div>
  )
}

function FilaMovimiento({ movimiento }: { movimiento: MovimientoCaja }) {
  return (
    <tr className="text-neutral-700 dark:text-neutral-300">
      <td className="px-3 py-2">
        <Badge tone={movimiento.tipo === 'INGRESO' ? 'success' : 'danger'}>
          {movimiento.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
        </Badge>
      </td>
      <td className="px-3 py-2">{movimiento.concepto}</td>
      <td className="px-3 py-2">{formatearBs(movimiento.monto)}</td>
      <td className="px-3 py-2">{formatearFecha(movimiento.fechaHora)}</td>
      <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">{movimiento.observaciones ?? '—'}</td>
    </tr>
  )
}

function formatearBs(valor: number): string {
  return `Bs ${valor.toFixed(2)}`
}

function formatearFecha(valor: string): string {
  return new Date(valor).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function horaCorta(valor: string): string {
  return valor ? valor.slice(0, 5) : ''
}
