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

/**
 * CU18: reportes predefinidos — consultas ya armadas por el negocio.
 * Maestro-detalle: la lista de la izquierda solo selecciona (agrupada por
 * categoría); el reporte se ejecuta recién al tocar "Generar" en el panel
 * de detalle, igual que el resto de pantallas de reportes de la app.
 */
export function ReportesPredefinidosPage() {
  const puedeGestionar = useAuthStore((state) => state.hasPermission('analitica:reportes:gestionar'))

  const { data: predefinidos = [], isLoading: cargandoCatalogo } = useSWR(
    puedeGestionar ? 'reportes-predefinidos' : null,
    listarReportesPredefinidos,
  )

  const [seleccionadoCodigo, setSeleccionadoCodigo] = useState<string | null>(null)
  const seleccionado = predefinidos.find((predefinido) => predefinido.codigo === seleccionadoCodigo) ?? predefinidos[0] ?? null

  const [ejecutando, setEjecutando] = useState(false)
  const [activo, setActivo] = useState<ReportePredefinidoEjecutado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null)

  const generar = useCallback(async () => {
    if (!seleccionado || ejecutando) return
    setEjecutando(true)
    setError(null)
    try {
      const respuesta = await ejecutarReportePredefinido(seleccionado.codigo)
      setActivo(respuesta)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo ejecutar el reporte.'))
    } finally {
      setEjecutando(false)
    }
  }, [ejecutando, seleccionado])

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
      seleccionado={seleccionado}
      ejecutando={ejecutando}
      activo={activo}
      error={error}
      exportando={exportando}
      onSeleccionar={setSeleccionadoCodigo}
      onGenerar={() => void generar()}
      onExportar={(formato) => void exportar(formato)}
      onLimpiarError={() => setError(null)}
    />
  )
}
