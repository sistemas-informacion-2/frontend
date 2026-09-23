import { useDeferredValue, useState } from 'react'
import useSWR from 'swr'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { VentaDetalle } from '@/modules/comercial/components/VentaDetalle'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { listarVentasEnLinea, obtenerVentaEnLinea } from '../../api'
import { extraerMensajeError } from '../../utils/reservas'
import { VentasEnLineaPageView } from './VentasEnLineaPage.view'

const PAGE_SIZE = 10

export function VentasEnLineaPage() {
  const perfil = useAuthStore((state) => state.perfil)
  // Un empleado siempre ve su sucursal; el administrador sigue el selector global del panel.
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const sucursalEfectiva = perfil?.sucursalId ?? sucursalActivaId

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [ventaId, setVentaId] = useState<number | null>(null)
  const deferredSearch = useDeferredValue(search)

  const { data, error, isLoading } = useSWR(
    ['ventas-en-linea', page, deferredSearch.trim(), sucursalEfectiva],
    () => listarVentasEnLinea({ page, limit: PAGE_SIZE, search: deferredSearch.trim() || undefined, idSucursal: sucursalEfectiva ?? undefined }),
    { keepPreviousData: true, revalidateOnFocus: false },
  )
  const { data: sucursales = [] } = useSWR('sucursales-ventas-en-linea', listarSucursales, { revalidateOnFocus: false })
  const sucursalNombre = sucursalEfectiva ? (sucursales.find((sucursal) => sucursal.id === sucursalEfectiva)?.nombre ?? perfil?.sucursalNombre ?? `Sucursal ${sucursalEfectiva}`) : null

  const { data: venta, isLoading: cargandoDetalle } = useSWR(ventaId ? ['venta-en-linea', ventaId] : null, () => obtenerVentaEnLinea(ventaId as number))

  return (
    <VentasEnLineaPageView
      ventas={data?.items ?? []}
      meta={data?.meta}
      loading={isLoading}
      error={error ? extraerMensajeError(error) : null}
      search={search}
      sucursalNombre={sucursalNombre}
      abierta={ventaId !== null}
      detalle={
        ventaId === null ? null : cargandoDetalle || !venta ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando detalle…</p>
        ) : (
          <VentaDetalle venta={venta} />
        )
      }
      onSearch={(value) => {
        setSearch(value)
        setPage(1)
      }}
      onVer={setVentaId}
      onCerrar={() => setVentaId(null)}
      onPageChange={setPage}
    />
  )
}
