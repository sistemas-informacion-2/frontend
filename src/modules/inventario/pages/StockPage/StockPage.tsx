import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { listarProductos } from '@/modules/inventario/services/productos.service'
import { listarAlmacenes } from '@/modules/inventario/services/almacenes.service'
import { ajustarStock, listarStock, registrarStock } from '@/modules/inventario/services/inventario.service'
import { AjusteStockForm } from '@/modules/inventario/components/AjusteStockForm'
import { StockForm } from '@/modules/inventario/components/StockForm'
import type {
  AjusteStockFormValues,
  InventarioItem,
  StockFormValues,
} from '@/modules/inventario/types'
import { StockPageView } from './StockPage.view'

const PAGE_SIZE = 10
const PRODUCTOS_LIMIT = 100

const EMPTY_STOCK_FORM: StockFormValues = {
  idAlmacen: '',
  idProducto: '',
  idVarianteProducto: '',
  stockDisponible: '0',
  stockMinimo: '5',
  stockMaximo: '500',
}

const EMPTY_AJUSTE_FORM: AjusteStockFormValues = {
  tipo: 'ENTRADA',
  cantidad: '',
  motivo: '',
}

export function StockPage() {
  const canManage = useAuthStore((state) => state.hasPermission('inventario:almacen:gestionar'))
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [idAlmacen, setIdAlmacen] = useState<number | ''>('')
  // La sucursal es la del selector global del panel (Vista General / Vista por Sucursal).
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const setSucursalActiva = useAppStore((state) => state.setSucursalActiva)
  const idSucursal: number | '' = sucursalActivaId ?? ''
  const setIdSucursal = (value: number | '') => setSucursalActiva(value === '' ? null : value)
  const [bajoMinimo, setBajoMinimo] = useState(false)

  const [stockForm, setStockForm] = useState<StockFormValues>(EMPTY_STOCK_FORM)
  const [crearOpen, setCrearOpen] = useState(false)
  const [ajusteItem, setAjusteItem] = useState<InventarioItem | null>(null)
  const [ajusteForm, setAjusteForm] = useState<AjusteStockFormValues>(EMPTY_AJUSTE_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)
  const query = {
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
    idAlmacen: idAlmacen === '' ? undefined : idAlmacen,
    idSucursal: idSucursal === '' ? undefined : idSucursal,
    bajoMinimo: bajoMinimo || undefined,
  }

  const { data, error: fetchError, isLoading, mutate } = useSWR(
    ['stock', page, query.search, query.idAlmacen, query.idSucursal, query.bajoMinimo],
    () => listarStock(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const { data: almacenes = [] } = useSWR('almacenes-opciones', () => listarAlmacenes({ activo: true }), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  const { data: sucursales = [] } = useSWR('sucursales', listarSucursales, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  const { data: productosData } = useSWR(
    canManage ? ['productos-opciones', PRODUCTOS_LIMIT] : null,
    () => listarProductos({ page: 1, limit: PRODUCTOS_LIMIT }),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const productos = productosData?.items ?? []

  const openCrear = () => {
    setStockForm({ ...EMPTY_STOCK_FORM })
    setError(null)
    setCrearOpen(true)
  }

  const openAjuste = (item: InventarioItem) => {
    setAjusteItem(item)
    setAjusteForm({ ...EMPTY_AJUSTE_FORM })
    setError(null)
  }

  const handleSubmitCrear = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!stockForm.idAlmacen || !stockForm.idVarianteProducto) {
      setError('Selecciona almacén, producto y variante')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await registrarStock(stockForm)
      setCrearOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitAjuste = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ajusteItem) return
    setSaving(true)
    setError(null)
    try {
      await ajustarStock(ajusteItem.id, ajusteForm)
      setAjusteItem(null)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <StockPageView
      items={data?.items ?? []}
      meta={data?.meta}
      almacenes={almacenes}
      sucursales={sucursales}
      loading={isLoading}
      error={error || (fetchError ? extraerMensajeError(fetchError) : null)}
      search={search}
      idAlmacen={idAlmacen}
      idSucursal={idSucursal}
      bajoMinimo={bajoMinimo}
      canManage={canManage}
      onSearch={(value) => {
        setSearch(value)
        setPage(1)
      }}
      onAlmacen={(value) => {
        setIdAlmacen(value)
        setPage(1)
      }}
      onSucursal={(value) => {
        setIdSucursal(value)
        setPage(1)
      }}
      onBajoMinimo={(value) => {
        setBajoMinimo(value)
        setPage(1)
      }}
      onCreate={openCrear}
      onAjustar={openAjuste}
      onPageChange={setPage}
      onCloseModal={() => {
        if (saving) return
        setCrearOpen(false)
        setAjusteItem(null)
      }}
      modal={
        crearOpen ? (
          <StockForm
            values={stockForm}
            almacenes={almacenes}
            productos={productos}
            loading={saving}
            error={error}
            onChange={(field, value) => setStockForm((current) => ({ ...current, [field]: value }))}
            onSubmit={handleSubmitCrear}
            onCancel={() => setCrearOpen(false)}
          />
        ) : ajusteItem ? (
          <AjusteStockForm
            values={ajusteForm}
            item={ajusteItem}
            loading={saving}
            error={error}
            onChange={(field, value) => setAjusteForm((current) => ({ ...current, [field]: value }))}
            onSubmit={handleSubmitAjuste}
            onCancel={() => setAjusteItem(null)}
          />
        ) : null
      }
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
