import { isAxiosError } from 'axios'
import { useDeferredValue, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { listarAlmacenes } from '@/modules/inventario/services/almacenes.service'
import { listarEmpleados } from '@/modules/operaciones/services/empleados.service'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { listarPasarelasPresencial } from '@/modules/comercial/services/pasarelas.service'
import {
  buscarOrigenDevolucion,
  crearDevolucion,
  listarDevoluciones,
  obtenerDevolucion,
} from '@/modules/comercial/services/devoluciones.service'
import { DevolucionDetalle } from '@/modules/comercial/components/DevolucionDetalle'
import { DevolucionForm, type DevolucionFormValues, type LineaDevolucionForm } from '@/modules/comercial/components/DevolucionForm'
import type { ItemDevolucionInput, OrigenDevolucion, TipoDevolucion } from '@/modules/comercial/types'
import { DevolucionesPageView } from './DevolucionesPage.view'

const PAGE_SIZE = 10

const LINEA_VACIA: LineaDevolucionForm = { cantidad: '0', estadoProducto: 'REINGRESO_INVENTARIO', idAlmacen: '' }

const FORM_VACIO: DevolucionFormValues = {
  tipo: 'PRODUCTO_ENTREGADO',
  codigo: '',
  motivo: 'TALLA_INCORRECTA',
  idPasarela: '',
  idCajero: '',
  observaciones: '',
  autorizarFueraDePlazo: false,
  lineas: {},
}

export function DevolucionesPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const canManage = useAuthStore((state) => state.hasPermission('comercial:devoluciones:gestionar'))
  const esAdmin = perfil?.tipoUsuario === 'A'
  // Un empleado siempre opera su sucursal; el administrador sigue el selector global del panel.
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const sucursalEfectiva = perfil?.sucursalId ?? sucursalActivaId

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tipo, setTipo] = useState<TipoDevolucion | ''>('')
  const [crearOpen, setCrearOpen] = useState(false)
  const [devolucionId, setDevolucionId] = useState<number | null>(null)
  const [form, setForm] = useState<DevolucionFormValues>(FORM_VACIO)
  const [origen, setOrigen] = useState<OrigenDevolucion | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)

  const { data, error: fetchError, isLoading, mutate } = useSWR(
    ['devoluciones', page, deferredSearch.trim(), tipo, sucursalEfectiva],
    () =>
      listarDevoluciones({
        page,
        limit: PAGE_SIZE,
        search: deferredSearch.trim() || undefined,
        tipoDevolucion: tipo || undefined,
        idSucursal: sucursalEfectiva ?? undefined,
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const { data: sucursales = [] } = useSWR('sucursales-devoluciones', listarSucursales, { revalidateOnFocus: false })
  const sucursalNombre = sucursalEfectiva ? (sucursales.find((sucursal) => sucursal.id === sucursalEfectiva)?.nombre ?? `Sucursal ${sucursalEfectiva}`) : null

  const { data: almacenes = [] } = useSWR(
    crearOpen && sucursalEfectiva ? ['almacenes-devoluciones', sucursalEfectiva] : null,
    () => listarAlmacenes({ idSucursal: sucursalEfectiva ?? undefined, activo: true }),
  )
  const { data: pasarelas = [] } = useSWR(crearOpen ? 'pasarelas-presencial-devoluciones' : null, listarPasarelasPresencial)
  const { data: cajerosData } = useSWR(crearOpen && esAdmin && sucursalEfectiva ? ['cajeros-devoluciones', sucursalEfectiva] : null, () =>
    listarEmpleados({ page: 1, limit: 100, idSucursal: sucursalEfectiva ?? undefined, activo: true }),
  )
  const { data: devolucion, isLoading: cargandoDetalle } = useSWR(devolucionId ? ['devolucion', devolucionId] : null, () =>
    obtenerDevolucion(devolucionId as number),
  )

  const openCrear = () => {
    setForm(FORM_VACIO)
    setOrigen(null)
    setError(null)
    setCrearOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setCrearOpen(false)
    setDevolucionId(null)
    setError(null)
  }

  const updateForm = <K extends keyof DevolucionFormValues>(field: K, value: DevolucionFormValues[K]) => {
    setForm((current) => {
      const siguiente = { ...current, [field]: value }
      if (field === 'tipo') siguiente.motivo = value === 'CANCELACION_RESERVA' ? 'CANCELACION' : 'TALLA_INCORRECTA'
      return siguiente
    })
    // Cambiar el tipo o el código invalida la búsqueda anterior.
    if (field === 'tipo' || field === 'codigo') setOrigen(null)
  }

  const updateLinea = <K extends keyof LineaDevolucionForm>(idVariante: number, field: K, value: LineaDevolucionForm[K]) =>
    setForm((current) => ({
      ...current,
      lineas: {
        ...current.lineas,
        [idVariante]: { ...(current.lineas[idVariante] ?? LINEA_VACIA), [field]: value },
      },
    }))

  const buscar = async () => {
    setBuscando(true)
    setError(null)
    try {
      const codigo = form.codigo.trim()
      const encontrado = await buscarOrigenDevolucion(form.tipo === 'CANCELACION_RESERVA' ? { codigoReserva: codigo } : { codigoNota: codigo })
      setOrigen(encontrado)
      setForm((current) => ({
        ...current,
        autorizarFueraDePlazo: false,
        lineas: Object.fromEntries(
          encontrado.lineas.map((linea) => [linea.idVarianteProducto, { ...LINEA_VACIA }]),
        ),
      }))
    } catch (requestError) {
      setOrigen(null)
      setError(extraerMensajeError(requestError))
    } finally {
      setBuscando(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!origen) return
    if (!sucursalEfectiva) {
      setError('Elige una sucursal en el selector del panel')
      return
    }
    if (esAdmin && form.idCajero === '') {
      setError('Selecciona el cajero responsable')
      return
    }

    let items: ItemDevolucionInput[] | undefined
    if (form.tipo === 'PRODUCTO_ENTREGADO') {
      items = origen.lineas
        .map((linea) => ({ linea, valor: form.lineas[linea.idVarianteProducto] }))
        .filter(({ valor }) => valor && Number(valor.cantidad) > 0)
        .map(({ linea, valor }) => ({
          idVarianteProducto: linea.idVarianteProducto,
          cantidad: Number(valor.cantidad),
          estadoProducto: valor.estadoProducto,
          idAlmacen: valor.idAlmacen === '' ? undefined : valor.idAlmacen,
        }))
      if (items.length === 0) {
        setError('Indica la cantidad de al menos una prenda a devolver')
        return
      }
      if (items.some((item) => item.estadoProducto === 'REINGRESO_INVENTARIO' && item.idAlmacen === undefined)) {
        setError('Elige el almacén que recibe las prendas aptas para la venta')
        return
      }
    }

    setSaving(true)
    setError(null)
    try {
      const creada = await crearDevolucion({
        ...(form.tipo === 'CANCELACION_RESERVA' ? { codigoReserva: origen.codigo } : { codigoNota: origen.codigo }),
        idSucursal: sucursalEfectiva,
        idCajero: esAdmin && form.idCajero !== '' ? form.idCajero : undefined,
        idPasarela: form.idPasarela === '' ? undefined : form.idPasarela,
        motivoDevolucion: form.motivo,
        observaciones: form.observaciones.trim() || undefined,
        autorizarFueraDePlazo: form.autorizarFueraDePlazo || undefined,
        items,
      })
      setCrearOpen(false)
      await mutate()
      setDevolucionId(creada.id)
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DevolucionesPageView
      devoluciones={data?.items ?? []}
      meta={data?.meta}
      loading={isLoading}
      error={!crearOpen && !devolucionId && fetchError ? extraerMensajeError(fetchError) : null}
      search={search}
      tipo={tipo}
      sucursalNombre={sucursalNombre}
      canManage={canManage}
      modal={crearOpen ? 'crear' : devolucionId ? 'detalle' : null}
      modalContent={
        crearOpen ? (
          <DevolucionForm
            values={form}
            origen={origen}
            buscando={buscando}
            almacenes={almacenes}
            pasarelas={pasarelas}
            cajeros={cajerosData?.items ?? []}
            esAdmin={esAdmin}
            sucursalNombre={sucursalNombre}
            loading={saving}
            error={error}
            onChange={updateForm}
            onLinea={updateLinea}
            onBuscar={buscar}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        ) : devolucionId ? (
          cargandoDetalle || !devolucion ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando detalle…</p>
          ) : (
            <DevolucionDetalle devolucion={devolucion} />
          )
        ) : null
      }
      onSearch={(value) => {
        setSearch(value)
        setPage(1)
      }}
      onTipo={(value) => {
        setTipo(value)
        setPage(1)
      }}
      onCreate={openCrear}
      onVerDetalle={setDevolucionId}
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
