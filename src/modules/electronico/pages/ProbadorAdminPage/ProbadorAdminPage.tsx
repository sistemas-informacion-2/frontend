import { isAxiosError } from 'axios'
import { useDeferredValue, useState } from 'react'
import useSWR from 'swr'
import {
  listarVariantesProbador,
  quitarModeloProbador,
  subirModeloProbador,
  type ProbadorVarianteAdmin,
} from '../../api/probador.api'
import { ProbadorAdminPageView } from './ProbadorAdminPage.view'

export function ProbadorAdminPage() {
  const [busqueda, setBusqueda] = useState('')
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [vistaPreviaUrl, setVistaPreviaUrl] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const q = useDeferredValue(busqueda.trim())
  const { data = [], isLoading, mutate } = useSWR(['probador-variantes-modelos', q], () => listarVariantesProbador(q))

  const seleccionada = data.find((variante) => variante.id === seleccionadaId) ?? null

  const seleccionar = (variante: ProbadorVarianteAdmin) => {
    if (vistaPreviaUrl) URL.revokeObjectURL(vistaPreviaUrl)
    setSeleccionadaId(variante.id)
    setArchivo(null)
    setVistaPreviaUrl(null)
    setError(null)
  }

  const onArchivo = (file: File | null) => {
    if (vistaPreviaUrl) URL.revokeObjectURL(vistaPreviaUrl)
    setArchivo(file)
    setVistaPreviaUrl(file ? URL.createObjectURL(file) : null)
    setError(null)
  }

  const guardarModelo = async () => {
    if (!seleccionada || !archivo) return
    setGuardando(true)
    setError(null)
    try {
      await subirModeloProbador(seleccionada.id, archivo)
      onArchivo(null)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setGuardando(false)
    }
  }

  const quitarModelo = async () => {
    if (!seleccionada) return
    setGuardando(true)
    setError(null)
    try {
      await quitarModeloProbador(seleccionada.id)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ProbadorAdminPageView
      variantes={data}
      loading={isLoading}
      busqueda={busqueda}
      seleccionada={seleccionada}
      seleccionadaId={seleccionadaId}
      vistaPreviaUrl={vistaPreviaUrl}
      archivo={archivo}
      guardando={guardando}
      error={error}
      onBusqueda={setBusqueda}
      onSeleccionar={seleccionar}
      onArchivo={onArchivo}
      onGuardar={guardarModelo}
      onQuitar={quitarModelo}
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