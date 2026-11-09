import { useRef, useState } from 'react'
import useSWR from 'swr'
import { getApiErrorMessage } from '@/core/http/errors'
import type { DatosGrafico, Grafico, MensajeChat } from '../../bi.types'
import {
  borrarConversacion,
  borrarGrafico,
  guardarGrafico,
  listarConversaciones,
  listarGraficos,
  obtenerConversacion,
  obtenerDatosGrafico,
  preguntar,
} from '../../services/bi.service'
import { AsistentePageView } from './AsistentePage.view'

/** Chat con el asistente del BI. Cada respuesta puede traer graficos, que se pueden guardar y volver a abrir. */
export function AsistentePage() {
  const { data: conversaciones = [], mutate: recargarConversaciones } = useSWR('bi-conversaciones', listarConversaciones)
  const { data: graficos = [], mutate: recargarGraficos } = useSWR('bi-graficos', listarGraficos)

  const [idConversacion, setIdConversacion] = useState<number | null>(null)
  const [mensajes, setMensajes] = useState<MensajeChat[]>([])
  const [pregunta, setPregunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [graficoAbierto, setGraficoAbierto] = useState<DatosGrafico | null>(null)
  const siguienteId = useRef(-1)

  const enviar = async (texto: string) => {
    const limpio = texto.trim()
    if (!limpio || enviando) return
    const idPregunta = siguienteId.current--
    setMensajes((actuales) => [...actuales, { id: idPregunta, rol: 'USUARIO', texto: limpio, herramientas: [] }])
    setPregunta('')
    setEnviando(true)
    setError(null)
    try {
      const respuesta = await preguntar(limpio, idConversacion)
      setIdConversacion(respuesta.idConversacion)
      setMensajes((actuales) => [...actuales, { id: siguienteId.current--, rol: 'ASISTENTE', texto: respuesta.texto, herramientas: respuesta.herramientas }])
      await recargarConversaciones()
    } catch (requestError) {
      // La pregunta vuelve al cuadro de texto para poder reintentarla.
      setMensajes((actuales) => actuales.filter((mensaje) => mensaje.id !== idPregunta))
      setPregunta(limpio)
      setError(getApiErrorMessage(requestError, 'No se pudo obtener una respuesta.'))
    } finally {
      setEnviando(false)
    }
  }

  const nuevaConversacion = () => {
    setIdConversacion(null)
    setMensajes([])
    setError(null)
  }

  const abrirConversacion = async (id: number) => {
    setError(null)
    try {
      const detalle = await obtenerConversacion(id)
      setIdConversacion(id)
      setMensajes(detalle.mensajes.map((mensaje) => ({ id: mensaje.id, rol: mensaje.rol, texto: mensaje.contenido, herramientas: mensaje.herramientas ?? [] })))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No se pudo abrir la conversación.'))
    }
  }

  const eliminarConversacion = async (id: number) => {
    if (!window.confirm('¿Borrar esta conversación?')) return
    setError(null)
    try {
      await borrarConversacion(id)
      if (id === idConversacion) nuevaConversacion()
      await recargarConversaciones()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No se pudo borrar la conversación.'))
    }
  }

  const guardar = async (grafico: Grafico) => {
    setError(null)
    try {
      await guardarGrafico(grafico)
      await recargarGraficos()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No se pudo guardar el gráfico.'))
      throw requestError
    }
  }

  const abrirGrafico = async (id: number) => {
    setError(null)
    try {
      setGraficoAbierto(await obtenerDatosGrafico(id))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No se pudo abrir el gráfico.'))
    }
  }

  const eliminarGrafico = async (id: number) => {
    if (!window.confirm('¿Borrar este gráfico guardado?')) return
    setError(null)
    try {
      await borrarGrafico(id)
      await recargarGraficos()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No se pudo borrar el gráfico.'))
    }
  }

  return (
    <AsistentePageView
      conversaciones={conversaciones}
      graficos={graficos}
      idConversacion={idConversacion}
      mensajes={mensajes}
      pregunta={pregunta}
      enviando={enviando}
      error={error}
      graficoAbierto={graficoAbierto}
      onPregunta={setPregunta}
      onEnviar={(texto) => void enviar(texto)}
      onNueva={nuevaConversacion}
      onAbrirConversacion={(id) => void abrirConversacion(id)}
      onBorrarConversacion={(id) => void eliminarConversacion(id)}
      onGuardarGrafico={guardar}
      onAbrirGrafico={(id) => void abrirGrafico(id)}
      onBorrarGrafico={(id) => void eliminarGrafico(id)}
      onCerrarGrafico={() => setGraficoAbierto(null)}
    />
  )
}
