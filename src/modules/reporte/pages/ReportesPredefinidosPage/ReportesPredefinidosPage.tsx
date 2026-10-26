import { useCallback, useState } from 'react'
import useSWR from 'swr'
import { getApiErrorMessage } from '@/core/http/errors'
import { useAuthStore } from '@/core/store/authStore'
import type { FormatoExportacion, ReportePredefinidoEjecutado } from '../../reportes.types'
import { descargarReporte, ejecutarReportePredefinido, listarReportesPredefinidos } from '../../services/reportes.service'
import { ReportesPredefinidosPageView } from './ReportesPredefinidosPage.view'

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

/** CU18: reportes predefinidos — consultas ya armadas por el negocio, listas para ejecutar con un clic. */
export function ReportesPredefinidosPage() {
  const puedeGestionar = useAuthStore((state) => state.hasPermission('analitica:reportes:gestionar'))

  const { data: predefinidos = [], isLoading: cargandoCatalogo } = useSWR(
    puedeGestionar ? 'reportes-predefinidos' : null,
    listarReportesPredefinidos,
  )

  const [ejecutando, setEjecutando] = useState<string | null>(null)
  const [activo, setActivo] = useState<ReportePredefinidoEjecutado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null)

  const ejecutar = useCallback(async (codigo: string) => {
    setEjecutando(codigo)
    setError(null)
    try {
      const respuesta = await ejecutarReportePredefinido(codigo)
      setActivo(respuesta)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo ejecutar el reporte.'))
    } finally {
      setEjecutando(null)
    }
  }, [])

  const exportar = useCallback(
    async (formato: FormatoExportacion) => {
      if (!activo || exportando) return
      setExportando(formato)
      setError(null)
      try {
        const { blob, nombreArchivo } = await descargarReporte(formato, activo.request)
        descargarBlob(blob, nombreArchivo)
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudo generar la descarga.'))
      } finally {
        setExportando(null)
      }
    },
    [activo, exportando],
  )

  return (
    <ReportesPredefinidosPageView
      puedeGestionar={puedeGestionar}
      predefinidos={predefinidos}
      cargandoCatalogo={cargandoCatalogo}
      ejecutando={ejecutando}
      activo={activo}
      error={error}
      exportando={exportando}
      onEjecutar={(codigo) => void ejecutar(codigo)}
      onExportar={(formato) => void exportar(formato)}
      onLimpiarError={() => setError(null)}
    />
  )
}
