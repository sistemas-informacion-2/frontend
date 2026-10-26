import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { getApiErrorMessage } from '@/core/http/errors'
import { useReconocimientoVoz } from '../../hooks/useReconocimientoVoz'
import type { FormatoExportacion, ReportRunRequest, ResultadoReporte } from '../../reportes.types'
import { descargarReporte, ejecutarReporte, generarReporte, obtenerCatalogoReportes } from '../../services/reportes.service'
import { ReportesGenerativoPageView } from './ReportesGenerativoPage.view'

export interface MensajeConversacion {
  id: number
  prompt: string
  interpretacion: string
  fuente: 'IA' | 'REGEX'
}

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

/** Lee un texto en voz alta con la síntesis de voz del navegador (es-ES). Sin soporte, no hace nada. */
function leerEnVozAlta(texto: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const mensaje = new SpeechSynthesisUtterance(texto)
  mensaje.lang = 'es-ES'
  window.speechSynthesis.speak(mensaje)
}

/**
 * CU18: Reportes por voz / generativos. El pedido en lenguaje natural (texto
 * o dictado) se interpreta con IA (Gemini) y, si no está disponible, con un
 * traductor por palabras clave — ver `fuente` de cada mensaje. Las preguntas
 * y respuestas quedan en una conversación (no se persiste entre sesiones);
 * "Nueva conversación" la reinicia. El reporte activo se puede "Refinar" con
 * el mismo editor visual del Constructor QBE, sin salir de la pantalla.
 */
export function ReportesGenerativoPage() {
  const puedeGestionar = useAuthStore((state) => state.hasPermission('analitica:reportes:gestionar'))
  const { data: catalogo } = useSWR(puedeGestionar ? 'catalogo-reportes' : null, obtenerCatalogoReportes)

  const [prompt, setPrompt] = useState('')
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historial, setHistorial] = useState<MensajeConversacion[]>([])
  const idMensaje = useRef(0)

  const [promptOrigen, setPromptOrigen] = useState<string | null>(null)
  const [request, setRequest] = useState<ReportRunRequest | null>(null)
  const [resultado, setResultado] = useState<ResultadoReporte | null>(null)
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null)

  const [vozActivada, setVozActivada] = useState(true)
  const [refinando, setRefinando] = useState(false)
  const [requestAntesDeRefinar, setRequestAntesDeRefinar] = useState<ReportRunRequest | null>(null)
  const [aplicandoRefinar, setAplicandoRefinar] = useState(false)

  const voz = useReconocimientoVoz({
    onResultado: (texto) => setPrompt((actual) => (actual ? `${actual} ${texto}` : texto)),
  })

  const tipoActivo = catalogo?.find((tipo) => tipo.id === request?.reportType)

  const generar = useCallback(async () => {
    if (!prompt.trim() || generando) return
    const promptActual = prompt.trim()
    setGenerando(true)
    setError(null)
    try {
      const respuesta = await generarReporte(promptActual)
      idMensaje.current += 1
      setHistorial((actual) => [...actual, { id: idMensaje.current, prompt: promptActual, interpretacion: respuesta.interpretacion, fuente: respuesta.fuente }])
      setPromptOrigen(promptActual)
      setRequest(respuesta.request)
      setResultado(respuesta.result)
      setPrompt('')
      if (vozActivada) leerEnVozAlta(respuesta.interpretacion)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo interpretar el pedido.'))
    } finally {
      setGenerando(false)
    }
  }, [generando, prompt, vozActivada])

  const nuevaConversacion = useCallback(() => {
    setHistorial([])
    setPrompt('')
    setPromptOrigen(null)
    setRequest(null)
    setResultado(null)
    setError(null)
    setRefinando(false)
  }, [])

  const abrirRefinar = useCallback(() => {
    setRequestAntesDeRefinar(request)
    setRefinando(true)
  }, [request])

  const cancelarRefinar = useCallback(() => {
    setRequest(requestAntesDeRefinar)
    setRefinando(false)
  }, [requestAntesDeRefinar])

  const aplicarRefinar = useCallback(async () => {
    if (!request || aplicandoRefinar) return
    setAplicandoRefinar(true)
    setError(null)
    try {
      const resul = await ejecutarReporte(request)
      setResultado(resul)
      setRefinando(false)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo generar el reporte.'))
    } finally {
      setAplicandoRefinar(false)
    }
  }, [aplicandoRefinar, request])

  const combinar = useCallback(
    (parche: Partial<ReportRunRequest>) => {
      setRequest((actual) => (actual ? { ...actual, ...parche } : actual))
    },
    [],
  )

  // Al refinar, cambiar de tipo de reporte arranca con columnas vacías: a diferencia del Constructor,
  // acá no hay un "preset" por tipo — el usuario las elige a mano con los checkboxes de abajo.
  const cambiarTipo = useCallback((reportType: string) => {
    setRequest((actual) => (actual ? { reportType, selectedFields: [], filters: [], sort: undefined, limit: actual.limit ?? 50, offset: 0 } : actual))
  }, [])

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

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  return (
    <ReportesGenerativoPageView
      puedeGestionar={puedeGestionar}
      prompt={prompt}
      generando={generando}
      error={error}
      historial={historial}
      promptOrigen={promptOrigen}
      catalogo={catalogo}
      tipoActivo={tipoActivo}
      request={request}
      resultado={resultado}
      exportando={exportando}
      vozActivada={vozActivada}
      escuchandoVoz={voz.escuchando}
      vozSoportada={voz.soportado}
      errorVoz={voz.error}
      refinando={refinando}
      aplicandoRefinar={aplicandoRefinar}
      onPrompt={setPrompt}
      onIniciarVoz={voz.iniciar}
      onDetenerVoz={voz.detener}
      onGenerar={() => void generar()}
      onNuevaConversacion={nuevaConversacion}
      onAlternarVoz={() => setVozActivada((actual) => !actual)}
      onEscuchar={leerEnVozAlta}
      onAbrirRefinar={abrirRefinar}
      onCancelarRefinar={cancelarRefinar}
      onAplicarRefinar={() => void aplicarRefinar()}
      onCambiarTipo={cambiarTipo}
      onCombinar={combinar}
      onFiltroPatch={(indice, parche) =>
        setRequest((actual) => {
          if (!actual) return actual
          const filtros = [...(actual.filters ?? [])]
          filtros[indice] = { ...filtros[indice], ...parche }
          return { ...actual, filters: filtros }
        })
      }
      onFiltroAgregar={(filtro) => setRequest((actual) => (actual ? { ...actual, filters: [...(actual.filters ?? []), filtro] } : actual))}
      onFiltroBorrar={(indice) =>
        setRequest((actual) => (actual ? { ...actual, filters: (actual.filters ?? []).filter((_, i) => i !== indice) } : actual))
      }
      onOrdenChange={(orden) => setRequest((actual) => (actual ? { ...actual, sort: orden } : actual))}
      onFechasChange={(desde, hasta) =>
        setRequest((actual) => (actual ? { ...actual, dateFrom: desde || undefined, dateTo: hasta || undefined } : actual))
      }
      onLimiteChange={(limite) => setRequest((actual) => (actual ? { ...actual, limit: limite, offset: 0 } : actual))}
      onExportar={(formato) => void exportar(formato)}
      onLimpiarError={() => setError(null)}
    />
  )
}
