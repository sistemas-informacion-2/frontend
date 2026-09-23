import { useState } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { DevolucionDetalle } from '@/modules/comercial/components/DevolucionDetalle'
import { fetchMiDevolucion, fetchMisDevoluciones } from '../../api'
import { extraerMensajeError } from '../../utils/reservas'
import { MisDevolucionesPageView } from './MisDevolucionesPage.view'

const PAGE_SIZE = 10

export function MisDevolucionesPage() {
  const esCliente = useAuthStore((state) => state.perfil?.tipoUsuario === 'C')
  const [page, setPage] = useState(1)
  const [devolucionId, setDevolucionId] = useState<number | null>(null)

  const { data, error, isLoading } = useSWR(esCliente ? ['mi-cuenta/devoluciones', page] : null, () => fetchMisDevoluciones(page, PAGE_SIZE), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
  const { data: devolucion, isLoading: cargandoDetalle } = useSWR(devolucionId ? ['mi-cuenta/devolucion', devolucionId] : null, () =>
    fetchMiDevolucion(devolucionId as number),
  )

  return (
    <MisDevolucionesPageView
      esCliente={esCliente}
      devoluciones={data?.items ?? []}
      meta={data?.meta}
      cargando={isLoading}
      error={error ? extraerMensajeError(error) : null}
      abierta={devolucionId !== null}
      detalle={
        devolucionId === null ? null : cargandoDetalle || !devolucion ? (
          <p className="text-sm text-neutral-500">Cargando detalle…</p>
        ) : (
          <DevolucionDetalle devolucion={devolucion} />
        )
      }
      onVer={setDevolucionId}
      onCerrar={() => setDevolucionId(null)}
      onPageChange={setPage}
    />
  )
}
