import { useDeferredValue, useMemo, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { listarClientes } from '@/modules/operaciones/services/clientes.service'
import { listarStock } from '@/modules/inventario/services/inventario.service'
import { agruparStockPorVariante } from '@/modules/inventario/utils/stock'
import { listarPasarelasPresencial } from '@/modules/comercial/services/pasarelas.service'
import {
  cancelarReserva,
  cobrarAnticipoReserva,
  crearReserva,
  liquidarReserva,
  listarReservas,
  obtenerReserva,
  type LiquidarReservaInput,
} from '../../api'
import { ReservaDetalle } from '../../components/ReservaDetalle'
import { ReservaForm, type LineaReservaForm, type ReservaFormValues } from '../../components/ReservaForm'
import type { EstadoReserva } from '../../types'
import { extraerMensajeError } from '../../utils/reservas'
import { ReservasPageView } from './ReservasPage.view'

const PAGE_SIZE = 10
const OPCIONES_LIMIT = 100

const LINEA_VACIA: LineaReservaForm = { idVarianteProducto: '', cantidad: '1' }
const FORM_VACIO: ReservaFormValues = { idCliente: '', montoAnticipo: '', horasLimite: '', observaciones: '', items: [LINEA_VACIA] }

export function ReservasPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const canManage = useAuthStore((state) => state.hasPermission('electronico:reservas:gestionar'))
  // Un empleado siempre opera su sucursal; el administrador sigue el selector global del panel.
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const sucursalEfectiva = perfil?.sucursalId ?? sucursalActivaId

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoReserva | ''>('')
  const [crearOpen, setCrearOpen] = useState(false)
  const [reservaId, setReservaId] = useState<number | null>(null)
  const [form, setForm] = useState<ReservaFormValues>(FORM_VACIO)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)

  const { data, error: fetchError, isLoading, mutate } = useSWR(
    ['reservas', page, deferredSearch.trim(), estado, sucursalEfectiva],
    () =>
      listarReservas({
        page,
        limit: PAGE_SIZE,
        search: deferredSearch.trim() || undefined,
        estado: estado || undefined,
        idSucursal: sucursalEfectiva ?? undefined,
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const { data: sucursales = [] } = useSWR('sucursales-reservas', listarSucursales, { revalidateOnFocus: false })
  const sucursalNombre = sucursalEfectiva ? (sucursales.find((sucursal) => sucursal.id === sucursalEfectiva)?.nombre ?? `Sucursal ${sucursalEfectiva}`) : null

  const { data: clientesData } = useSWR(crearOpen ? ['clientes-reservas', OPCIONES_LIMIT] : null, () =>
    listarClientes({ page: 1, limit: OPCIONES_LIMIT, activo: true }),
  )
  const { data: stockData } = useSWR(crearOpen && sucursalEfectiva ? ['stock-reservas', sucursalEfectiva] : null, () =>
    listarStock({ page: 1, limit: OPCIONES_LIMIT, idSucursal: sucursalEfectiva ?? undefined }),
  )
  const variantes = useMemo(() => agruparStockPorVariante(stockData?.items ?? []), [stockData])

  const { data: pasarelas = [] } = useSWR(reservaId ? 'pasarelas-presencial-reservas' : null, listarPasarelasPresencial)
  const { data: reserva, isLoading: cargandoDetalle, mutate: mutateDetalle } = useSWR(
    reservaId ? ['reserva', reservaId] : null,
    () => obtenerReserva(reservaId as number),
    { revalidateOnFocus: false },
  )

  const openCrear = () => {
    setForm({ ...FORM_VACIO, items: [{ ...LINEA_VACIA }] })
    setError(null)
    setCrearOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setCrearOpen(false)
    setReservaId(null)
    setError(null)
  }

  const updateForm = <K extends keyof ReservaFormValues>(field: K, value: ReservaFormValues[K]) =>
    setForm((current) => ({ ...current, [field]: value }))
  const updateItem = (index: number, field: keyof LineaReservaForm, value: LineaReservaForm[keyof LineaReservaForm]) =>
    setForm((current) => ({ ...current, items: current.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)) }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const items = form.items
      .filter((item) => item.idVarianteProducto !== '' && Number(item.cantidad) > 0)
      .map((item) => ({ idVarianteProducto: Number(item.idVarianteProducto), cantidad: Number(item.cantidad) }))
    if (form.idCliente === '' || items.length === 0) {
      setError('Selecciona un cliente y al menos una prenda')
      return
    }
    if (!sucursalEfectiva) {
      setError('Elige una sucursal en el selector del panel')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const creada = await crearReserva({
        idCliente: form.idCliente,
        idSucursal: sucursalEfectiva,
        items,
        montoAnticipo: form.montoAnticipo === '' ? undefined : Number(form.montoAnticipo),
        horasLimite: form.horasLimite === '' ? undefined : Number(form.horasLimite),
        observaciones: form.observaciones.trim() || undefined,
      })
      setCrearOpen(false)
      await mutate()
      // Lo siguiente que hace el personal es cobrar el anticipo: se abre directo la ficha.
      setReservaId(creada.id)
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const ejecutarAccion = async (accion: () => Promise<unknown>) => {
    setSaving(true)
    setError(null)
    try {
      await accion()
      await Promise.all([mutateDetalle(), mutate()])
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ReservasPageView
      reservas={data?.items ?? []}
      meta={data?.meta}
      loading={isLoading}
      error={!crearOpen && !reservaId ? (fetchError ? extraerMensajeError(fetchError) : null) : null}
      search={search}
      estado={estado}
      sucursalNombre={sucursalNombre}
      canManage={canManage}
      modal={crearOpen ? 'crear' : reservaId ? 'detalle' : null}
      modalContent={
        crearOpen ? (
          <ReservaForm
            values={form}
            clientes={clientesData?.items ?? []}
            variantes={variantes}
            sucursalNombre={sucursalNombre}
            loading={saving}
            error={error}
            onChange={updateForm}
            onItemChange={updateItem}
            onAddItem={() => setForm((current) => ({ ...current, items: [...current.items, { ...LINEA_VACIA }] }))}
            onRemoveItem={(index) => setForm((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }))}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        ) : reservaId ? (
          cargandoDetalle || !reserva ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando detalle…</p>
          ) : (
            <ReservaDetalle
              key={reserva.id}
              reserva={reserva}
              pasarelas={pasarelas}
              ocupado={saving}
              error={error}
              onCobrarAnticipo={(idPasarela) => ejecutarAccion(() => cobrarAnticipoReserva(reserva.id, idPasarela))}
              onLiquidar={(input: LiquidarReservaInput) => ejecutarAccion(() => liquidarReserva(reserva.id, input))}
              onCancelar={(motivo) => ejecutarAccion(() => cancelarReserva(reserva.id, motivo || undefined))}
            />
          )
        ) : null
      }
      onSearch={(value) => {
        setSearch(value)
        setPage(1)
      }}
      onEstado={(value) => {
        setEstado(value)
        setPage(1)
      }}
      onCreate={openCrear}
      onVerDetalle={(id) => {
        setError(null)
        setReservaId(id)
      }}
      onPageChange={setPage}
      onCloseModal={closeModal}
    />
  )
}
