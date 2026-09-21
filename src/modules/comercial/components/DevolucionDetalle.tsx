import type { Devolucion, EstadoProductoDevolucion, MotivoDevolucion } from '../types'

const MOTIVOS: Record<MotivoDevolucion, string> = {
  FALLA_FABRICA: 'Falla de fábrica',
  TALLA_INCORRECTA: 'Talla incorrecta',
  ARREPENTIMIENTO: 'Arrepentimiento',
  CANCELACION: 'Cancelación de reserva',
}

const ESTADOS: Record<EstadoProductoDevolucion, string> = {
  REINGRESO_INVENTARIO: 'Vuelve al inventario',
  MERMA_DEFECTUOSO: 'Merma (defectuosa)',
  NO_APLICA: 'Solo reembolso',
}

function bs(valor: number): string {
  return `Bs ${valor.toFixed(2)}`
}

export function DevolucionDetalle({ devolucion }: { devolucion: Devolucion }) {
  const origen = devolucion.codigoNota ?? devolucion.codigoReserva ?? '—'
  return (
    <div className="space-y-5 text-sm">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Dato label="Código" value={devolucion.codigoDevolucion} />
        <Dato label="Fecha" value={new Date(devolucion.fechaEmision).toLocaleString('es-BO')} />
        <Dato label="Cliente" value={devolucion.clienteNombre} />
        <Dato label="Cajero" value={devolucion.cajeroNombre} />
        <Dato label="Sucursal" value={devolucion.sucursalNombre} />
        <Dato label={devolucion.codigoNota ? 'Nota de venta' : 'Reserva'} value={origen} />
        <Dato label="Motivo" value={MOTIVOS[devolucion.motivoDevolucion]} />
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-medium">Detalle</th>
              <th className="px-3 py-2 font-medium">Destino</th>
              <th className="px-3 py-2 font-medium">Cant.</th>
              <th className="px-3 py-2 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {devolucion.detalles.map((detalle) => (
              <tr key={detalle.id}>
                <td className="px-3 py-2">
                  {detalle.descripcion}
                  {detalle.sku && <span className="block text-xs text-neutral-500 dark:text-neutral-400">{detalle.sku}</span>}
                </td>
                <td className="px-3 py-2">
                  {ESTADOS[detalle.estadoProducto]}
                  {detalle.almacenNombre && <span className="block text-xs text-neutral-500 dark:text-neutral-400">{detalle.almacenNombre}</span>}
                </td>
                <td className="px-3 py-2">{detalle.cantidad}</td>
                <td className="px-3 py-2">{bs(detalle.montoSubtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-right text-base font-semibold text-neutral-900 dark:text-white">Reembolsado: {bs(devolucion.montoTotalReembolsado)}</p>
      {devolucion.observaciones && <p className="text-neutral-600 dark:text-neutral-400">Notas: {devolucion.observaciones}</p>}
    </div>
  )
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-neutral-900 dark:text-white">{value}</dd>
    </div>
  )
}
