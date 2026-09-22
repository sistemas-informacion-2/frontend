import { useCallback, useEffect, useRef, useState } from 'react'

interface ReconocimientoEvent extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

interface ReconocimientoErrorEvent extends Event {
  error: string
}

interface ReconocedorVoz {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: ReconocimientoEvent) => void) | null
  onerror: ((event: ReconocimientoErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

/** Motivos que da la Web Speech API en `event.error`, traducidos para mostrarle algo útil al usuario. */
const MENSAJES_ERROR: Record<string, string> = {
  'not-allowed': 'Bloqueaste el micrófono para este sitio. Habilítalo en los permisos del navegador e intenta de nuevo.',
  'no-speech': 'No se detectó voz. Intenta de nuevo y habla apenas se abra el micrófono.',
  'audio-capture': 'No se encontró un micrófono disponible.',
  network: 'Sin conexión con el servicio de reconocimiento de voz (necesita internet). Revisa tu conexión.',
  aborted: 'Dictado cancelado.',
  'service-not-allowed': 'El navegador bloqueó el servicio de reconocimiento de voz.',
}

function mensajeDeError(codigo: string): string {
  return MENSAJES_ERROR[codigo] ?? `No se pudo usar el dictado por voz (${codigo}).`
}

interface UseReconocimientoVozOptions {
  onResultado: (texto: string) => void
}

type VentanaVoz = {
  webkitSpeechRecognition?: new () => ReconocedorVoz
  SpeechRecognition?: new () => ReconocedorVoz
}

/** El estándar sin prefijo casi no tiene soporte real todavía; Chrome/Edge exponen el prefijado. Probamos ambos. */
function claseReconocedorDisponible(): (new () => ReconocedorVoz) | null {
  const ventana = window as VentanaVoz
  return ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition ?? null
}

/**
 * Transcribe voz a texto con la Web Speech API de Chrome/Edge (es-ES). Es el
 * "micrófono" del CU18: lo escuchado se vuelca al prompt del reporte
 * generativo. En navegadores sin soporte `soportado` queda en false.
 *
 * Ojo: esta API manda el audio a un servicio en la nube (de Google, en
 * Chrome) para transcribirlo, así que necesita conexión a internet y un
 * contexto seguro (https, o localhost en desarrollo) — en sitios http:// que
 * no sean localhost el navegador la bloquea sin avisar mucho. Antes,
 * cualquier error se tragaba en silencio (el botón volvía a 🎤 sin decir por
 * qué); ahora se guarda el motivo (`error`) para poder mostrarlo.
 */
export function useReconocimientoVoz({ onResultado }: UseReconocimientoVozOptions) {
  const onResultadoRef = useRef(onResultado)
  useEffect(() => {
    onResultadoRef.current = onResultado
  }, [onResultado])
  const reconocedorRef = useRef<ReconocedorVoz | null>(null)
  const [soportado] = useState(() => claseReconocedorDisponible() !== null)
  const [escuchando, setEscuchando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!soportado) return
    const ClaseReconocedor = claseReconocedorDisponible()
    if (!ClaseReconocedor) return

    const reconocedor = new ClaseReconocedor()
    reconocedor.lang = 'es-ES'
    reconocedor.interimResults = false
    reconocedor.continuous = false
    reconocedor.onresult = (event) => {
      const ultimo = event.results[event.results.length - 1]
      const texto = ultimo?.[0]?.transcript ?? ''
      if (texto.trim()) onResultadoRef.current(texto.trim())
    }
    reconocedor.onerror = (event) => {
      setEscuchando(false)
      // "aborted" salta cuando nosotros mismos llamamos a stop()/abort(): no es un error real, no hay nada que mostrar.
      if (event.error !== 'aborted') setError(mensajeDeError(event.error))
    }
    reconocedor.onend = () => setEscuchando(false)
    reconocedorRef.current = reconocedor

    return () => {
      reconocedor.abort()
      reconocedorRef.current = null
    }
  }, [soportado])

  const iniciar = useCallback(() => {
    const reconocedor = reconocedorRef.current
    if (!reconocedor || escuchando) return
    setError(null)
    try {
      reconocedor.start()
      setEscuchando(true)
    } catch {
      // start() sobre un reconocedor que ya está arrancando tira un InvalidStateError; no hay nada que hacer.
    }
  }, [escuchando])

  const detener = useCallback(() => {
    reconocedorRef.current?.stop()
    setEscuchando(false)
  }, [])

  return { soportado, escuchando, error, iniciar, detener }
}