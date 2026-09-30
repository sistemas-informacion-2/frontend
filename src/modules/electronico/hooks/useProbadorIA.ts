import { useEffect, useState } from 'react'
import { decartConfigurado, obtenerProbadorDecart } from '../api/decart'
import {
  ErrorProbadorIA,
  iniciarSesionProbadorIA,
  mensajeErrorProbadorIA,
  type EstadoConexionIA,
  type InfoErrorProbadorIA,
} from '../utils/probador-ia'

export type EstadoProbadorIA = 'conectando' | 'enVivo' | 'reconectando' | 'desconectado' | 'error'

interface ResultadoIntento {
  intento: number
  estado: EstadoProbadorIA
  remoteStream: MediaStream | null
  error: InfoErrorProbadorIA | null
}

const ESTADO_POR_CONEXION: Record<EstadoConexionIA, EstadoProbadorIA> = {
  connecting: 'conectando',
  connected: 'enVivo',
  generating: 'enVivo',
  reconnecting: 'reconectando',
  disconnected: 'desconectado',
}

const SIN_CONFIGURAR = mensajeErrorProbadorIA(new ErrorProbadorIA('missing-config'))

/** Conecta la cámara frontal con Decart mientras el componente esté montado; reintentar() reinicia desde cero. */
export function useProbadorIA({ prompt, imagenUrl }: { prompt: string; imagenUrl: string | null }) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<ResultadoIntento | null>(null)

  useEffect(() => {
    // Sin key o sin imagen no hay nada que conectar.
    if (!decartConfigurado || !imagenUrl) return

    // Cada intento empieza limpio: lo que llega se guarda con su número y lo de intentos viejos se descarta.
    const actualizar = (cambio: Partial<Omit<ResultadoIntento, 'intento'>>) =>
      setResultado((previo) => ({
        ...(previo?.intento === intento ? previo : { intento, estado: 'conectando' as const, remoteStream: null, error: null }),
        ...cambio,
      }))
    const fallar = (error: unknown) => {
      if (import.meta.env.DEV) console.warn('[probador] La sesión de prueba virtual falló', error)
      actualizar({ estado: 'error', remoteStream: null, error: mensajeErrorProbadorIA(error) })
    }

    let cancelado = false
    let detener: (() => void) | null = null

    obtenerProbadorDecart().then(
      (decart) => {
        if (cancelado) return
        detener = iniciarSesionProbadorIA(
          {
            abrirCamara: () =>
              navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: 'user', frameRate: decart.fpsCaptura, width: decart.modelo.width, height: decart.modelo.height },
              }),
            // Se descarga en el navegador: Decart no alcanza imágenes servidas en la red local.
            descargarPrenda: async () => {
              const respuesta = await fetch(imagenUrl)
              if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
              return respuesta.blob()
            },
            conectar: async (camara, prenda, eventos) => {
              const cliente = await decart.cliente.realtime.connect(camara, {
                model: decart.modelo,
                preferredVideoCodec: 'vp8',
                onRemoteStream: eventos.onRemoteStream,
                onConnectionChange: eventos.onConnectionChange,
                initialState: { prompt: { text: prompt, enhance: true }, image: prenda },
              })
              return {
                disconnect: () => cliente.disconnect(),
                onFailure: (listener) => {
                  cliente.on('error', listener)
                  cliente.on('sessionEnded', () => listener(new ErrorProbadorIA('connection-lost')))
                },
              }
            },
          },
          {
            onRemoteStream: (remoteStream) => actualizar({ remoteStream }),
            onConnectionChange: (conexion) => actualizar({ estado: ESTADO_POR_CONEXION[conexion] }),
            onError: fallar,
          },
        )
      },
      // El chunk del SDK no se pudo descargar (red caída, deploy nuevo).
      (error: unknown) => {
        if (!cancelado) fallar(error)
      },
    )

    return () => {
      cancelado = true
      detener?.()
    }
  }, [prompt, imagenUrl, intento])

  const reintentar = () => setIntento((actual) => actual + 1)

  if (!decartConfigurado) return { estado: 'error' as EstadoProbadorIA, remoteStream: null, error: SIN_CONFIGURAR, reintentar }

  const actual = resultado?.intento === intento ? resultado : null
  return {
    estado: actual?.estado ?? ('conectando' as EstadoProbadorIA),
    remoteStream: actual?.remoteStream ?? null,
    error: actual?.error ?? null,
    reintentar,
  }
}
