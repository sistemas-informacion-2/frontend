import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { Pasarela } from '@/modules/comercial/types'
import type { LiquidarReservaInput } from '../api'
import type { Reserva } from '../types'
import { bs, estaActiva, formatearFechaHora, tiempoRestante } from '../utils/reservas'
import { ReservaEstadoBadge } from './ReservaEstadoBadge'

interface ReservaDetalleProps {
  reserva: Reserva
  pasarelas: Pasarela[]
  ocupado: boolean
  error: string | null
  onCobrarAnticipo: (idPasarela: number) => void
  onLiquidar: (input: LiquidarReservaInput) => void
  onCancelar: (motivo: string) => void
}

/** Ficha de una reserva con las acciones del personal: cobrar anticipo, liquidar y cancelar. */
export function ReservaDetalle({ reserva, pasarelas, ocupado, error, onCobrarAnticipo, onLiquidar, onCancelar }: ReservaDetalleProps) {
  const [idPasarela, setIdPasarela] = useState<number | ''>('')
  const [nit, setNit] = useState('')
  const [factura, setFactura] = useState('')
  const [motivo, setMotivo] = useState('')
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)

  const activa = estaActiva(reserva.estado)
  const necesitaMetodo = reserva.saldoPendiente > 0

  return (
    <div className="space-y-5 text-sm">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Dato label="Código" value={reserva.codigoReserva} />
        <Dato label="Estado" value={<ReservaEstadoBadge estado={reserva.estado} />} />
        <Dato label="Cliente" value={reserva.clienteNombre} />
        <Dato label="Sucursal" value={reserva.sucursalNombre} />
        <Dato label="Reservada" value={formatearFechaHora(reserva.fechaReserva)} />
        <Dato
          label="Retirar hasta"
          value={`${formatearFechaHora(reserva.fechaLimite)}${activa ? ` · ${tiempoRestante(reserva.fechaLimite)}` : ''}`}
        />
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-medium">Prenda</th>
              <th className="px-3 py-2 font-medium">P. unitario</th>
              <th className="px-3 py-2 font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {reserva.detalles.map((detalle) => (
              <tr key={detalle.id}>
                <td className="px-3 py-2">
                  {detalle.productoNombre}
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                    Talla {detalle.talla} · {detalle.color} · {detalle.sku}
                  </span>
                </td>
                <td className="px-3 py-2">{bs(detalle.precioUnitario)}</td>
                <td className="px-3 py-2">{detalle.cantidad}</td>
                <td className="px-3 py-2">{bs(detalle.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="flex flex-col items-end gap-1">
        <Fila label="Total" value={bs(reserva.montoTotal)} destacado />
        <Fila label={`Anticipo pactado`} value={bs(reserva.montoAnticipo)} />
        <Fila label="Anticipo cobrado" value={bs(reserva.anticipoPagado)} />
        {activa && <Fila label="Saldo por cobrar" value={bs(reserva.saldoPendiente)} destacado />}
      </dl>

      {reserva.pagos.length > 0 && (
        <div>
          <p className="mb-2 font-medium text-neutral-700 dark:text-neutral-300">Pagos</p>
          <ul className="space-y-1 text-neutral-600 dark:text-neutral-400">
            {reserva.pagos.map((pago) => (
              <li key={pago.id}>
                {pago.pasarelaMetodo ?? 'Método'} · {pago.concepto === 'ANTICIPO_RESERVA' ? 'Anticipo' : pago.concepto === 'SALDO_LIQUIDACION' ? 'Saldo' : pago.concepto} · {bs(pago.monto)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {reserva.observaciones && <p className="text-neutral-600 dark:text-neutral-400">Notas: {reserva.observaciones}</p>}
      {reserva.codigoNotaVenta && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Se entregó y facturó con la nota de venta {reserva.codigoNotaVenta}.
        </p>
      )}

      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      {activa && (
        <div className="space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          {(necesitaMetodo || reserva.estado === 'PENDIENTE') && (
            <Select
              label="Método de pago en caja"
              value={idPasarela === '' ? '' : String(idPasarela)}
              onChange={(event) => setIdPasarela(event.target.value === '' ? '' : Number(event.target.value))}
            >
              <option value="">Selecciona un método</option>
              {pasarelas.map((pasarela) => (
                <option key={pasarela.id} value={pasarela.id}>
                  {pasarela.metodo}
                </option>
              ))}
            </Select>
          )}

          {reserva.estado === 'PENDIENTE' && (
            <Button
              type="button"
              variant="secondary"
              loading={ocupado}
              disabled={idPasarela === ''}
              onClick={() => onCobrarAnticipo(Number(idPasarela))}
            >
              Cobrar anticipo ({bs(reserva.montoAnticipo)})
            </Button>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="NIT / Razón social (opcional)" maxLength={50} value={nit} onChange={(event) => setNit(event.target.value)} />
            <Input label="Nro. de factura (opcional)" maxLength={50} value={factura} onChange={(event) => setFactura(event.target.value)} />
          </div>
          <Button
            type="button"
            loading={ocupado}
            disabled={necesitaMetodo && idPasarela === ''}
            onClick={() =>
              onLiquidar({
                idPasarela: idPasarela === '' ? undefined : idPasarela,
                nitRazonSocial: nit.trim() || undefined,
                nroFactura: factura.trim() || undefined,
              })
            }
          >
            {necesitaMetodo ? `Cobrar saldo (${bs(reserva.saldoPendiente)}) y entregar` : 'Entregar prendas'}
          </Button>

          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            {confirmandoCancelar ? (
              <div className="space-y-3">
                <Input label="Motivo de la cancelación (opcional)" maxLength={300} value={motivo} onChange={(event) => setMotivo(event.target.value)} />
                {reserva.anticipoPagado > 0 && (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    El anticipo de {bs(reserva.anticipoPagado)} no se devuelve automáticamente. Si corresponde reembolsarlo, regístralo como devolución.
                  </p>
                )}
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setConfirmandoCancelar(false)} disabled={ocupado}>
                    Volver
                  </Button>
                  <Button type="button" loading={ocupado} onClick={() => onCancelar(motivo.trim())} className="bg-red-700 hover:bg-red-600">
                    Confirmar cancelación
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoCancelar(true)}
                className="text-sm font-medium text-red-700 underline hover:text-red-600 dark:text-red-400"
              >
                Cancelar reserva y liberar stock
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-neutral-900 dark:text-white">{value}</dd>
    </div>
  )
}

function Fila({ label, value, destacado }: { label: string; value: string; destacado?: boolean }) {
  return (
    <div className="flex gap-6">
      <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className={`w-28 text-right ${destacado ? 'text-base font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>{value}</dd>
    </div>
  )
}
