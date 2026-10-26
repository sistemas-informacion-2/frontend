import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '@/core/http/errors'
import { useAuthStore } from '@/core/store/authStore'
import { useReconocimientoVoz } from '../../hooks/useReconocimientoVoz'
import type { FormatoExportacion, ReportRunRequest, ResultadoReporte } from '../../reportes.types'
import { descargarReporte, generarReporte } from '../../services/reportes.service'
import { ReportesGenerativoPageView } from './ReportesGenerativoPage.view'

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
 * CU18: Reportes por voz / generativos. El pedido en lenguaje natural (texto
 * o dictado) se interpreta con IA (Gemini) y, si no está disponible, con un
 * traductor por palabras clave — ver `fuente` en la respuesta. La config
 * resultante se puede abrir en el Constructor QBE para ajustarla a mano.
 */
export function ReportesGenerativoPage() {
  const puedeGestionar = useAuthStore((state) => state.hasPermission('analitica:reportes:gestionar'))
  const navigate = useNavigate()

  const [prompt, setPrompt] = useState('')
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [interpretacion, setInterpretacion] = useState('')
  const [fuenteInterpretacion, setFuenteInterpretacion] = useState<'IA' | 'REGEX' | null>(null)
  const [request, setRequest] = useState<ReportRunRequest | null>(null)
  const [resultado, setResultado] = useState<ResultadoReporte | null>(null)
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null)

  const voz = useReconocimientoVoz({
    onResultado: (texto) => setPrompt((actual) => (actual ? `${actual} ${texto}` : texto)),
  })

  const generar = useCallback(async () => {
    if (!prompt.trim() || generando) return
    setGenerando(true)
    setError(null)
    try {
      const respuesta = await generarReporte(prompt.trim())
      setInterpretacion(respuesta.interpretacion)
      setFuenteInterpretacion(respuesta.fuente)
      setRequest(respuesta.request)
      setResultado(respuesta.result)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo interpretar el pedido.'))
    } finally {
      setGenerando(false)
    }
  }, [generando, prompt])

  const exportar = useCallback(
    async (formato: FormatoExportacion) => {
      if (!request || exportando) return
      setExportando(formato)
      setError(null)
      try {
        const { blob, nombreArchivo } = await descargarReporte(formato, request)
        descargarBlob(blob, nombreArchivo)
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudo generar la descarga.'))
      } finally {
        setExportando(null)
      }
    },
    [exportando, request],
  )

  const ajustarEnConstructor = useCallback(() => {
    if (!request) return
    navigate('/admin/reportes/constructor', { state: { request } })
  }, [navigate, request])

  return (
    <ReportesGenerativoPageView
      puedeGestionar={puedeGestionar}
      prompt={prompt}
      generando={generando}
      error={error}
      interpretacion={interpretacion}
      fuenteInterpretacion={fuenteInterpretacion}
      resultado={resultado}
      exportando={exportando}
      escuchandoVoz={voz.escuchando}
      vozSoportada={voz.soportado}
      errorVoz={voz.error}
      onPrompt={setPrompt}
      onIniciarVoz={voz.iniciar}
      onDetenerVoz={voz.detener}
      onGenerar={() => void generar()}
      onExportar={(formato) => void exportar(formato)}
      onAjustarEnConstructor={ajustarEnConstructor}
      onLimpiarError={() => setError(null)}
    />
  )
}
