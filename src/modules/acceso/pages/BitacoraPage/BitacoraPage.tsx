import { isAxiosError } from 'axios'
import { useDeferredValue, useState } from 'react'
import useSWR from 'swr'
import { listarBitacora, obtenerBitacora } from '@/modules/acceso/services/bitacora.service'
import type { BitacoraRegistro, OperacionBitacora } from '@/modules/acceso/types'
import { BitacoraPageView } from './BitacoraPage.view'

const PAGE_SIZE = 10

export function BitacoraPage() {
  const [page, setPage] = useState(1); const [tablaAfectada, setTablaAfectada] = useState(''); const [operacion, setOperacion] = useState<OperacionBitacora | ''>(''); const [fechaDesde, setFechaDesde] = useState(''); const [fechaHasta, setFechaHasta] = useState(''); const [usuarioId, setUsuarioId] = useState(''); const [detalle, setDetalle] = useState<BitacoraRegistro | null>(null)
  const deferredTabla = useDeferredValue(tablaAfectada)
  const query = { page, limit: PAGE_SIZE, tablaAfectada: deferredTabla.trim() || undefined, operacion: operacion || undefined, fechaDesde: fechaDesde || undefined, fechaHasta: fechaHasta || undefined, usuarioId: usuarioId ? Number(usuarioId) : undefined }
  const { data, error, isLoading } = useSWR(['bitacora', query], () => listarBitacora(query), { revalidateOnFocus: false })
  const clear = () => { setTablaAfectada(''); setOperacion(''); setFechaDesde(''); setFechaHasta(''); setUsuarioId(''); setPage(1) }
  const abrirDetalle = (registro: BitacoraRegistro) => {
    void obtenerBitacora(registro.id).then(setDetalle).catch(() => setDetalle(registro))
  }
  return <BitacoraPageView registros={data?.items ?? []} meta={data?.meta} loading={isLoading} error={error ? extraerMensajeError(error) : null} tablaAfectada={tablaAfectada} operacion={operacion} fechaDesde={fechaDesde} fechaHasta={fechaHasta} usuarioId={usuarioId} detalle={detalle} onTablaAfectada={(value) => { setTablaAfectada(value); setPage(1) }} onOperacion={(value) => { setOperacion(value); setPage(1) }} onFechaDesde={(value) => { setFechaDesde(value); setPage(1) }} onFechaHasta={(value) => { setFechaHasta(value); setPage(1) }} onUsuarioId={(value) => { setUsuarioId(value); setPage(1) }} onClearFilters={clear} onPageChange={setPage} onDetalle={abrirDetalle} onCloseDetalle={() => setDetalle(null)} />
}

function extraerMensajeError(error: unknown): string { if (isAxiosError(error)) { const message = error.response?.data?.message; if (Array.isArray(message)) return message[0] ?? 'La solicitud no es válida.'; if (typeof message === 'string') return message } return 'No se pudo cargar la bitácora.' }