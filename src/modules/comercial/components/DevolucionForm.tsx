import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { Empleado } from '@/modules/operaciones/types'
import type { Almacen } from '@/modules/inventario/types'
import type { MotivoDevolucion, OrigenDevolucion, Pasarela, TipoDevolucion } from '../types'

export interface LineaDevolucionForm {
  cantidad: string
  estadoProducto: 'REINGRESO_INVENTARIO' | 'MERMA_DEFECTUOSO'
  idAlmacen: number | ''
}

export interface DevolucionFormValues {
  tipo: TipoDevolucion
  codigo: string
  motivo: MotivoDevolucion
  idPasarela: number | ''
  idCajero: number | ''
  observaciones: string
  autorizarFueraDePlazo: boolean
  /** Por idVarianteProducto de la nota. */
  lineas: Record<number, LineaDevolucionForm>
}

interface DevolucionFormProps {
  values: DevolucionFormValues
  origen: OrigenDevolucion | null
  buscando: boolean
  almacenes: Almacen[]
  pasarelas: Pasarela[]
  /** Empleados de la sucursal; el administrador elige el cajero responsable. */
  cajeros: Empleado[]
  esAdmin: boolean
  sucursalNombre: string | null
  loading: boolean
  error: string | null
  onChange: <K extends keyof DevolucionFormValues>(field: K, value: DevolucionFormValues[K]) => void
  onLinea: <K extends keyof LineaDevolucionForm>(idVariante: number, field: K, value: LineaDevolucionForm[K]) => void
  onBuscar: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

const MOTIVOS_PRODUCTO: Array<{ value: MotivoDevolucion; label: string }> = [
  { value: 'FALLA_FABRICA', label: 'Falla de fábrica' },
  { value: 'TALLA_INCORRECTA', label: 'Talla incorrecta' },
  { value: 'ARREPENTIMIENTO', label: 'Arrepentimiento' },
]

function bs(valor: number): string {
  return `Bs ${valor.toFixed(2)}`
}

function calcularReembolso(origen: OrigenDevolucion | null, lineas: Record<number, LineaDevolucionForm>): number {
  if (!origen) return 0
  if (origen.tipoDevolucion === 'CANCELACION_RESERVA') return origen.montoReembolsable
  const total = origen.lineas.reduce((suma, linea) => suma + linea.precioReembolsable * (Number(lineas[linea.idVarianteProducto]?.cantidad) || 0), 0)
  return Math.round(total * 100) / 100
}

export function DevolucionForm({
  values,
  origen,
  buscando,
  almacenes,
  pasarelas,
  cajeros,
  esAdmin,
  sucursalNombre,
  loading,
  error,
  onChange,
  onLinea,
  onBuscar,
  onSubmit,
  onCancel,
}: DevolucionFormProps) {
  const esReserva = values.tipo === 'CANCELACION_RESERVA'
  const reembolso = calcularReembolso(origen, values.lineas)
  const fueraDePlazo = !!origen && !origen.dentroDePlazo
  const sinNadaQueDevolver = !!origen && (esReserva ? origen.montoReembolsable <= 0 : origen.lineas.every((linea) => linea.cantidadDisponible === 0))

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
        <Select
          label="Devolver de"
          value={values.tipo}
          onChange={(event) => onChange('tipo', event.target.value as TipoDevolucion)}
        >
          <option value="PRODUCTO_ENTREGADO">Nota de venta</option>
          <option value="CANCELACION_RESERVA">Reserva cancelada</option>
        </Select>
        <Input
          label={esReserva ? 'Código de la reserva' : 'Código de la nota de venta'}
          placeholder={esReserva ? 'RS-000001' : 'NV-000001'}
          value={values.codigo}
          onChange={(event) => onChange('codigo', event.target.value)}
        />
        <Button type="button" variant="secondary" onClick={onBuscar} loading={buscando} disabled={values.codigo.trim() === ''}>
          Buscar
        </Button>
      </div>

      {origen && (
        <>
          <dl className="grid gap-3 rounded-lg border border-neutral-200 p-4 text-sm sm:grid-cols-3 dark:border-neutral-800">
            <div>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">Cliente</dt>
              <dd className="font-medium text-neutral-900 dark:text-white">{origen.clienteNombre}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{esReserva ? 'Reserva' : 'Nota de venta'}</dt>
              <dd className="font-medium text-neutral-900 dark:text-white">
                {origen.codigo} · {origen.sucursalNombre}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{esReserva ? 'Anticipo por devolver' : 'Fecha de la venta'}</dt>
              <dd className="font-medium text-neutral-900 dark:text-white">
                {esReserva ? bs(origen.montoReembolsable) : new Date(origen.fecha).toLocaleDateString('es-BO')}
              </dd>
            </div>
          </dl>

          {fueraDePlazo && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <p>Pasaron más de {origen.plazoDias} días desde la venta: la devolución está fuera de plazo.</p>
              {esAdmin ? (
                <label className="mt-2 flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={values.autorizarFueraDePlazo}
                    onChange={(event) => onChange('autorizarFueraDePlazo', event.target.checked)}
                  />
                  Autorizar como excepción
                </label>
              ) : (
                <p className="mt-1 font-medium">Necesita la autorización de un administrador.</p>
              )}
            </div>
          )}

          {sinNadaQueDevolver && (
            <p className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
              {esReserva ? 'Esta reserva no tiene anticipo pendiente de devolver.' : 'Ya se devolvieron todas las prendas de esta nota.'}
            </p>
          )}

          {!esReserva && !sinNadaQueDevolver && (
            <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Prendas que regresan</p>
              {origen.lineas.map((linea) => {
                const valor = values.lineas[linea.idVarianteProducto]
                const reingresa = valor?.estadoProducto === 'REINGRESO_INVENTARIO'
                return (
                  <div key={linea.idVarianteProducto} className="grid items-end gap-3 border-t border-neutral-100 pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[1fr_90px_180px_170px] dark:border-neutral-900">
                    <div className="text-sm">
                      <p className="font-medium text-neutral-900 dark:text-white">{linea.descripcion}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {linea.sku} · {bs(linea.precioReembolsable)} c/u · comprada {linea.cantidadComprada}, devuelta {linea.cantidadDevuelta}
                      </p>
                    </div>
                    <Input
                      label="Cantidad"
                      type="number"
                      min={0}
                      max={linea.cantidadDisponible}
                      disabled={linea.cantidadDisponible === 0}
                      value={valor?.cantidad ?? '0'}
                      onChange={(event) => onLinea(linea.idVarianteProducto, 'cantidad', event.target.value)}
                    />
                    <Select
                      label="Estado de la prenda"
                      value={valor?.estadoProducto ?? 'REINGRESO_INVENTARIO'}
                      disabled={linea.cantidadDisponible === 0}
                      onChange={(event) => onLinea(linea.idVarianteProducto, 'estadoProducto', event.target.value as LineaDevolucionForm['estadoProducto'])}
                    >
                      <option value="REINGRESO_INVENTARIO">Apta para la venta</option>
                      <option value="MERMA_DEFECTUOSO">Defectuosa (merma)</option>
                    </Select>
                    <Select
                      label="Almacén destino"
                      value={valor?.idAlmacen === '' || valor?.idAlmacen === undefined ? '' : String(valor.idAlmacen)}
                      disabled={linea.cantidadDisponible === 0 || !reingresa}
                      onChange={(event) => onLinea(linea.idVarianteProducto, 'idAlmacen', event.target.value === '' ? '' : Number(event.target.value))}
                    >
                      <option value="">{reingresa ? 'Selecciona' : 'No aplica'}</option>
                      {almacenes.map((almacen) => (
                        <option key={almacen.id} value={almacen.id}>
                          {almacen.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                )
              })}
            </div>
          )}

          {!sinNadaQueDevolver && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {esReserva ? (
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">Motivo</p>
                    <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                      Cancelación de la reserva
                    </p>
                  </div>
                ) : (
                  <Select label="Motivo" value={values.motivo} onChange={(event) => onChange('motivo', event.target.value as MotivoDevolucion)}>
                    {MOTIVOS_PRODUCTO.map((motivo) => (
                      <option key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </option>
                    ))}
                  </Select>
                )}
                <Select
                  label="Método de reembolso (opcional)"
                  value={values.idPasarela === '' ? '' : String(values.idPasarela)}
                  onChange={(event) => onChange('idPasarela', event.target.value === '' ? '' : Number(event.target.value))}
                >
                  <option value="">Efectivo / sin especificar</option>
                  {pasarelas.map((pasarela) => (
                    <option key={pasarela.id} value={pasarela.id}>
                      {pasarela.metodo}
                    </option>
                  ))}
                </Select>
                {esAdmin && (
                  <Select
                    label="Cajero responsable"
                    required
                    value={values.idCajero === '' ? '' : String(values.idCajero)}
                    onChange={(event) => onChange('idCajero', event.target.value === '' ? '' : Number(event.target.value))}
                  >
                    <option value="">Selecciona un cajero</option>
                    {cajeros.map((cajero) => (
                      <option key={cajero.id} value={cajero.id}>
                        {cajero.nombre} {cajero.apellido}
                      </option>
                    ))}
                  </Select>
                )}
                <Input label="Observaciones (opcional)" maxLength={500} value={values.observaciones} onChange={(event) => onChange('observaciones', event.target.value)} />
              </div>

              <p className="text-right text-sm text-neutral-500 dark:text-neutral-400">
                Se reembolsa <span className="ml-2 text-base font-semibold text-neutral-900 dark:text-white">{bs(reembolso)}</span>
                <span className="mt-1 block text-xs">Sale como egreso de la caja abierta de {sucursalNombre ?? 'la sucursal'}.</span>
              </p>
            </>
          )}
        </>
      )}

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={!origen || sinNadaQueDevolver || sucursalNombre === null || reembolso < 0}>
          Registrar devolución
        </Button>
      </div>
    </form>
  )
}
