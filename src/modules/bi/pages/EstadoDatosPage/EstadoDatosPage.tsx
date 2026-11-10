import { useState } from 'react'
import useSWR from 'swr'
import { getApiErrorMessage } from '@/core/http/errors'
import { useAuthStore } from '@/core/store/authStore'
import { ejecutarEtl, obtenerEstadoBi, obtenerHistorialEtl, obtenerResumenModelos } from '../../services/bi.service'
import { EstadoDatosPageView } from './EstadoDatosPage.view'

/** Que tan al dia estan los datos del BI, y el boton para cargarlos a pedido. */
export function EstadoDatosPage() {
  const puedeActualizar = useAuthStore((state) => state.hasPermission('analitica:bi:etl'))
  const estado = useSWR('bi-estado', obtenerEstadoBi, {
    // Mientras los modelos se entrenan en segundo plano, se sigue preguntando.
    refreshInterval: (datos) => (datos?.ml.ultimaEjecucion?.estado === 'EN_CURSO' ? 4000 : 0),
  })
  const historial = useSWR('bi-etl-historial', obtenerHistorialEtl)
  const modelos = useSWR('bi-modelos', obtenerResumenModelos)

  const [actualizando, setActualizando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const actualizar = async () => {
    setActualizando(true)
    setMensaje(null)
    setError(null)
    try {
      const resumen = await ejecutarEtl()
      setMensaje(`Datos actualizados en ${resumen.segundos} s. Los modelos se están entrenando; sus resultados aparecerán en unos segundos.`)
      await Promise.all([estado.mutate(), historial.mutate(), modelos.mutate()])
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No se pudieron actualizar los datos.'))
    } finally {
      setActualizando(false)
    }
  }

  return (
    <EstadoDatosPageView
      estado={estado.data}
      historial={historial.data ?? []}
      modelos={modelos.data?.modelos ?? []}
      cargando={estado.isLoading}
      puedeActualizar={puedeActualizar}
      actualizando={actualizando}
      mensaje={mensaje}
      error={error ?? (estado.error ? getApiErrorMessage(estado.error, 'No se pudo cargar el estado.') : null)}
      onActualizar={() => void actualizar()}
    />
  )
}
