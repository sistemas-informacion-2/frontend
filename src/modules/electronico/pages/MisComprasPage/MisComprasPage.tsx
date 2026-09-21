import { useState } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { VentaDetalle } from '@/modules/comercial/components/VentaDetalle'
import { fetchMiCompra, fetchMisCompras } from '../../api'
import { extraerMensajeError } from '../../utils/reservas'
import { MisComprasPageView } from './MisComprasPage.view'

const PAGE_SIZE = 10

export function MisComprasPage() {
  const esCliente = useAuthStore((state) => state.perfil?.tipoUsuario === 'C')
  const [page, setPage] = useState(1)
  const [compraId, setCompraId] = useState<number | null>(null)

  const { data, error, isLoading } = useSWR(esCliente ? ['mi-cuenta/compras', page] : null, () => fetchMisCompras(page, PAGE_SIZE), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
  const { data: compra, isLoading: cargandoDetalle } = useSWR(compraId ? ['mi-cuenta/compra', compraId] : null, () =>
    fetchMiCompra(compraId as number),
  )

  return (
    <MisComprasPageView
      esCliente={esCliente}
      compras={data?.items ?? []}
      meta={data?.meta}
      cargando={isLoading}
      error={error ? extraerMensajeError(error) : null}
      abierta={compraId !== null}
      detalle={compraId === null ? null : cargandoDetalle || !compra ? <p className="text-sm text-neutral-500">Cargando detalle…</p> : <VentaDetalle venta={compra} />}
      onVer={setCompraId}
      onCerrar={() => setCompraId(null)}
      onPageChange={setPage}
    />
  )
}
