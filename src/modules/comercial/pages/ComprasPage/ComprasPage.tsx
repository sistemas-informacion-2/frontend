import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAppStore } from '@/core/store/appStore'
import { listarAlmacenes } from '@/modules/inventario/services/almacenes.service'
import { listarProductos } from '@/modules/inventario/services/productos.service'
import { listarProveedores } from '@/modules/inventario/services/proveedores.service'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { CompraForm } from '../../components/CompraForm'
import { listarCompras, obtenerCompra, registrarCompra } from '../../services/compras.service'
import type { Compra, CompraFormValues, CompraProductoFormValues, CompraVarianteFormValues } from '../../types'
import { ComprasPageView } from './ComprasPage.view'

const PAGE_SIZE = 10
const PRODUCTOS_LIMIT = 100

function productoVacio(): CompraProductoFormValues {
  return { idProducto: '', idAlmacen: '', variantes: [] }
}

function formularioVacio(idSucursal: number | ''): CompraFormValues {
  return {
    idProveedor: '',
    idSucursal,
    nroFactura: '',
    fechaEntregaProgramada: '',
    pagarEnCaja: false,
    productos: [productoVacio()],
  }
}

export function ComprasPage() {
  // La sucursal del filtro es la del selector global del panel (Vista General / Vista por Sucursal).
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const setSucursalActiva = useAppStore((state) => state.setSucursalActiva)
  const [page, setPage] = useState(1)
  const [nroFactura, setNroFactura] = useState('')
  const [idProveedor, setIdProveedor] = useState<number | ''>('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const [crearOpen, setCrearOpen] = useState(false)
  const [form, setForm] = useState<CompraFormValues>(formularioVacio(''))
  const [detalle, setDetalle] = useState<Compra | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredFactura = useDeferredValue(nroFactura)
  const query = {
    page,
    limit: PAGE_SIZE,
    nroFactura: deferredFactura.trim() || undefined,
    idProveedor: idProveedor === '' ? undefined : idProveedor,
    idSucursal: sucursalActivaId ?? undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  }

  const { data, error: fetchError, isLoading, mutate } = useSWR(
    ['compras', query.page, query.nroFactura, query.idProveedor, query.idSucursal, query.fechaDesde, query.fechaHasta],
    () => listarCompras(query),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const { data: proveedores = [] } = useSWR('proveedores-compras', () => listarProveedores({ activo: true }), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  const { data: sucursales = [] } = useSWR('sucursales', listarSucursales, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  // Almacenes y productos dependen de la sucursal elegida en el formulario: solo se ofrece lo que esa sucursal tiene.
  const sucursalForm = form.idSucursal === '' ? null : form.idSucursal
  const { data: almacenes = [] } = useSWR(
    crearOpen && sucursalForm ? ['almacenes-compra', sucursalForm] : null,
    () => listarAlmacenes({ idSucursal: sucursalForm as number, activo: true }),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const { data: productosData } = useSWR(
    crearOpen && sucursalForm ? ['productos-compra', sucursalForm] : null,
    () => listarProductos({ page: 1, limit: PRODUCTOS_LIMIT, idSucursal: sucursalForm as number, activo: true }),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  const openCrear = () => {
    setForm(formularioVacio(sucursalActivaId ?? ''))
    setError(null)
    setCrearOpen(true)
  }

  const handleChange = <K extends keyof CompraFormValues>(field: K, value: CompraFormValues[K]) => {
    setForm((current) => {
      const siguiente = { ...current, [field]: value }
      // Otra sucursal implica otros almacenes y productos, asi que lo ya elegido deja de ser valido.
      if (field === 'idSucursal') siguiente.productos = current.productos.map(() => productoVacio())
      return siguiente
    })
  }

  const actualizarProducto = (indice: number, cambiar: (producto: CompraProductoFormValues) => CompraProductoFormValues) =>
    setForm((current) => ({
      ...current,
      productos: current.productos.map((producto, posicion) => (posicion === indice ? cambiar(producto) : producto)),
    }))

  const handleChangeProducto = (indice: number, cambios: Partial<CompraProductoFormValues>) =>
    actualizarProducto(indice, (producto) => ({ ...producto, ...cambios }))

  const handleToggleVariantes = (indice: number, idsVariante: number[], marcadas: boolean) =>
    actualizarProducto(indice, (producto) => {
      if (!marcadas) {
        return { ...producto, variantes: producto.variantes.filter((variante) => !idsVariante.includes(variante.idVarianteProducto)) }
      }
      // Las variantes recien marcadas heredan precio y lote de la ultima, que suelen repetirse dentro de un producto.
      const ultima = producto.variantes[producto.variantes.length - 1]
      const nuevas: CompraVarianteFormValues[] = idsVariante
        .filter((id) => !producto.variantes.some((variante) => variante.idVarianteProducto === id))
        .map((id) => ({ idVarianteProducto: id, cantidad: '1', precioUnitario: ultima?.precioUnitario ?? '', nroLote: ultima?.nroLote ?? '' }))
      return { ...producto, variantes: [...producto.variantes, ...nuevas] }
    })

  const handleChangeVariante = (indice: number, idVariante: number, cambios: Partial<CompraVarianteFormValues>) =>
    actualizarProducto(indice, (producto) => ({
      ...producto,
      variantes: producto.variantes.map((variante) => (variante.idVarianteProducto === idVariante ? { ...variante, ...cambios } : variante)),
    }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.idProveedor || !form.idSucursal) {
      setError('Selecciona proveedor y sucursal')
      return
    }
    if (form.productos.some((producto) => !producto.idProducto || !producto.idAlmacen)) {
      setError('Cada producto necesita su almacén de destino')
      return
    }
    if (form.productos.some((producto) => producto.variantes.length === 0)) {
      setError('Marca al menos una variante en cada producto')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await registrarCompra(form)
      setCrearOpen(false)
      setPage(1)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const abrirDetalle = async (compra: Compra) => {
    setError(null)
    try {
      setDetalle(await obtenerCompra(compra.id))
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  const resetPagina = <T,>(setter: (valor: T) => void) => (valor: T) => {
    setter(valor)
    setPage(1)
  }

  return (
    <ComprasPageView
      items={data?.items ?? []}
      meta={data?.meta}
      proveedores={proveedores}
      sucursales={sucursales}
      loading={isLoading}
      error={error && !crearOpen ? error : fetchError ? extraerMensajeError(fetchError) : null}
      nroFactura={nroFactura}
      idProveedor={idProveedor}
      idSucursal={sucursalActivaId ?? ''}
      fechaDesde={fechaDesde}
      fechaHasta={fechaHasta}
      detalle={detalle}
      onNroFactura={resetPagina(setNroFactura)}
      onProveedor={resetPagina(setIdProveedor)}
      onSucursal={(value) => {
        setSucursalActiva(value === '' ? null : value)
        setPage(1)
      }}
      onFechaDesde={resetPagina(setFechaDesde)}
      onFechaHasta={resetPagina(setFechaHasta)}
      onCreate={openCrear}
      onVer={abrirDetalle}
      onPageChange={setPage}
      onCloseModal={() => {
        if (saving) return
        setCrearOpen(false)
        setDetalle(null)
      }}
      modal={
        crearOpen ? (
          <CompraForm
            values={form}
            proveedores={proveedores}
            sucursales={sucursales.filter((sucursal) => sucursal.activo)}
            almacenes={almacenes}
            productos={productosData?.items ?? []}
            loading={saving}
            error={error}
            onChange={handleChange}
            onChangeProducto={handleChangeProducto}
            onToggleVariantes={handleToggleVariantes}
            onChangeVariante={handleChangeVariante}
            onAddProducto={() => setForm((current) => ({ ...current, productos: [...current.productos, productoVacio()] }))}
            onRemoveProducto={(indice) =>
              setForm((current) => ({ ...current, productos: current.productos.filter((_, posicion) => posicion !== indice) }))
            }
            onSubmit={handleSubmit}
            onCancel={() => setCrearOpen(false)}
          />
        ) : null
      }
    />
  )
}

function extraerMensajeError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }
  return 'No se pudo completar la operación.'
}
