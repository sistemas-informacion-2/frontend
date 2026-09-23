import { isAxiosError } from 'axios'
import { useDeferredValue, useMemo, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { listarClientes } from '@/modules/operaciones/services/clientes.service'
import { listarStock } from '@/modules/inventario/services/inventario.service'
import { agruparStockPorVariante } from '@/modules/inventario/utils/stock'
import { listarPasarelasPresencial } from '@/modules/comercial/services/pasarelas.service'
import { crearVenta, listarVentas, obtenerVenta } from '@/modules/comercial/services/ventas.service'
import { VentaDetalle } from '@/modules/comercial/components/VentaDetalle'
import { VentaForm } from '@/modules/comercial/components/VentaForm'
import type { VentaFormValues, VentaItemForm } from '@/modules/comercial/types'
import { VentasPageView } from './VentasPage.view'

const PAGE_SIZE = 10
const OPCIONES_LIMIT = 100

const EMPTY_VENTA: VentaFormValues = {
  idCliente: '',
  idSucursal: '',
  idPasarela: '',
  descuento: '0',
  impuesto: '0',
  nitRazonSocial: '',
  items: [{ idVarianteProducto: '', cantidad: '1' }],
}

export function VentasPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const canManage = useAuthStore((state) => state.hasPermission('comercial:ventas:gestionar'))
  const canSelectSucursal = useAuthStore((state) => state.hasPermission('operaciones:sucursales:gestionar'))

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  // Parte de la sucursal elegida en el selector global del panel; un empleado siempre opera la suya.
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const setSucursalActiva = useAppStore((state) => state.setSucursalActiva)
  const [idSucursal, setIdSucursal] = useState<number | ''>(perfil?.sucursalId ?? sucursalActivaId ?? '')
  const [crearOpen, setCrearOpen] = useState(false)
  const [ventaId, setVentaId] = useState<number | null>(null)
  const [form, setForm] = useState<VentaFormValues>(EMPTY_VENTA)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const sucursalEfectiva = typeof idSucursal === 'number' ? idSucursal : (perfil?.sucursalId ?? null)

  const { data, error: fetchError, isLoading, mutate } = useSWR(
    ['ventas', page, deferredSearch.trim(), sucursalEfectiva],
    () => listarVentas({ page, limit: PAGE_SIZE, search: deferredSearch.trim() || undefined, idSucursal: sucursalEfectiva ?? undefined }),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const { data: sucursales = [] } = useSWR(canSelectSucursal ? 'sucursales-ventas' : null, listarSucursales, {
    revalidateOnFocus: false,
  })
  const sucursalNombre = sucursalEfectiva
    ? (sucursales.find((sucursal) => sucursal.id === sucursalEfectiva)?.nombre ?? perfil?.sucursalNombre ?? `Sucursal ${sucursalEfectiva}`)
    : null
  const { data: clientesData } = useSWR(crearOpen ? ['clientes-ventas', OPCIONES_LIMIT] : null, () =>
    listarClientes({ page: 1, limit: OPCIONES_LIMIT, activo: true }),
  )
  const clientes = clientesData?.items ?? []
  const { data: pasarelas = [] } = useSWR(crearOpen ? 'pasarelas-presencial-ventas' : null, listarPasarelasPresencial)
  // El stock se ofrece por sucursal (sumado entre sus almacenes): el servidor decide de qué almacén sale.
  const { data: stockData } = useSWR(crearOpen && sucursalEfectiva ? ['stock-venta', sucursalEfectiva] : null, () =>
    listarStock({ page: 1, limit: OPCIONES_LIMIT, idSucursal: sucursalEfectiva ?? undefined }),
  )
  const stock = useMemo(() => agruparStockPorVariante(stockData?.items ?? []), [stockData])

  const { data: ventaDetalle, isLoading: loadingDetalle } = useSWR(
    ventaId ? ['venta', ventaId] : null,
    () => obtenerVenta(ventaId as number),
  )

  const openCrear = () => {
    setForm({ ...EMPTY_VENTA, idSucursal: sucursalEfectiva ?? '', items: [{ idVarianteProducto: '', cantidad: '1' }] })
    setError(null)
    setCrearOpen(true)
  }

  const updateForm = <K extends keyof VentaFormValues>(field: K, value: VentaFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateItem = (index: number, field: keyof VentaItemForm, value: VentaItemForm[keyof VentaItemForm]) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const addItem = () => setForm((current) => ({ ...current, items: [...current.items, { idVarianteProducto: '', cantidad: '1' }] }))
  const removeItem = (index: number) =>
    setForm((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (form.idPasarela === '') {
      setError('Selecciona el método de pago')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await crearVenta(form)
      setCrearOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const closeModal = () => {
    if (saving) return
    setCrearOpen(false)
    setVentaId(null)
    setError(null)
  }

  return (
    <VentasPageView
      ventas={data?.items ?? []}
      meta={data?.meta}
      loading={isLoading}
      error={error || (fetchError ? extraerMensajeError(fetchError) : null)}
      search={search}
      sucursales={sucursales}
      idSucursal={idSucursal}
      canSelectSucursal={canSelectSucursal}
      canManage={canManage}
      modal={crearOpen ? 'crear' : ventaId ? 'detalle' : null}
      modalContent={
        crearOpen ? (
          <VentaForm
            values={form}
            clientes={clientes}
            sucursalNombre={sucursalNombre}
            pasarelas={pasarelas}
            stock={stock}
            loading={saving}
            error={error}
            onChange={updateForm}
            onItemChange={updateItem}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        ) : ventaId ? (
          loadingDetalle || !ventaDetalle ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando detalle…</p>
          ) : (
            <VentaDetalle venta={ventaDetalle} />
          )
        ) : null
      }
      onSearch={(value) => {
        setSearch(value)
        setPage(1)
      }}
      onSucursal={(value) => {
        setIdSucursal(value)
        setSucursalActiva(value === '' ? null : value)
        setPage(1)
      }}
      onCreate={openCrear}
      onVerDetalle={(id) => setVentaId(id)}
      onPageChange={setPage}
      onCloseModal={closeModal}
    />
  )
}

function extraerMensajeError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message[0] ?? 'La solicitud no es válida.'
    if (typeof message === 'string') return message
  }
  return 'No se pudo completar la operación.'
}
