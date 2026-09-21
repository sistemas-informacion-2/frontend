import type { Venta } from '../types'

interface VentaDetalleProps {
  venta: Venta
}

export function VentaDetalle({ venta }: VentaDetalleProps) {
  return (
    <div className="space-y-5 text-sm">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Dato label="Código" value={venta.codigoNota} />
        <Dato label="Fecha" value={`${venta.fechaEmision} · ${venta.horaEmision.slice(0, 5)}`} />
        <Dato label="Cliente" value={venta.clienteNombre} />
        {venta.tipoVenta === 'E_COMMERCE' ? (
          <Dato label="Canal" value="Tienda en línea" />
        ) : (
          <Dato label="Cajero" value={venta.cajeroNombre ?? 'Sin cajero'} />
        )}
        {venta.pasarelaMetodo && <Dato label="Método de pago" value={venta.pasarelaMetodo} />}
        <Dato label="Sucursal" value={venta.sucursalNombre} />
        <Dato label="Estado" value={venta.estadoPago} />
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">P. unitario</th>
              <th className="px-3 py-2 font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {venta.detalles.map((detalle) => (
              <tr key={detalle.id}>
                <td className="px-3 py-2">{detalle.descripcion}</td>
                <td className="px-3 py-2">Bs {detalle.precioUnitario.toFixed(2)}</td>
                <td className="px-3 py-2">{detalle.cantidad}</td>
                <td className="px-3 py-2">Bs {detalle.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="flex flex-col items-end gap-1">
        <Fila label="Subtotal" value={venta.subtotal} />
        <Fila label="Descuento" value={-venta.descuento} />
        <Fila label="Impuesto" value={venta.impuesto} />
        <Fila label="Total" value={venta.montoTotal} destacado />
      </dl>

      <div>
        <p className="mb-2 font-medium text-neutral-700 dark:text-neutral-300">Pagos</p>
        <ul className="space-y-1 text-neutral-600 dark:text-neutral-400">
          {venta.pagos.map((pago) => (
            <li key={pago.id}>
              {pago.pasarelaMetodo ?? 'Método'} · {pago.concepto} · Bs {pago.monto.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-neutral-900 dark:text-white">{value}</dd>
    </div>
  )
}

function Fila({ label, value, destacado }: { label: string; value: number; destacado?: boolean }) {
  return (
    <div className="flex gap-6">
      <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className={`w-28 text-right ${destacado ? 'text-base font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
        Bs {value.toFixed(2)}
      </dd>
    </div>
  )
}
