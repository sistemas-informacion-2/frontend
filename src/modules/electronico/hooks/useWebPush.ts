import { useCallback, useEffect, useState } from 'react'
import { activarWebPush, desactivarWebPush, enviarPruebaWebPush, obtenerConfiguracion, suscripcionActual, webPushSoportado } from '../services/webPush.service'

export type EstadoWebPush = 'cargando' | 'no-soportado' | 'no-disponible' | 'bloqueado' | 'inactivo' | 'activo'

/** Para que la invitacion y el panel de "Mi perfil" no se contradigan cuando uno de los dos cambia el estado. */
const EVENTO_CAMBIO = 'fashionstore:web-push'

function estadoInicial(): EstadoWebPush {
  if (!webPushSoportado()) return 'no-soportado'
  return Notification.permission === 'denied' ? 'bloqueado' : 'cargando'
}

function avisarCambio() {
  window.dispatchEvent(new Event(EVENTO_CAMBIO))
}

/** Estado y acciones de las notificaciones del navegador en este dispositivo. */
export function useWebPush() {
  const [estado, setEstado] = useState<EstadoWebPush>(estadoInicial)
  const [clavePublica, setClavePublica] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null)

  useEffect(() => {
    const recargar = () => setEstado(estadoInicial())
    window.addEventListener(EVENTO_CAMBIO, recargar)
    return () => window.removeEventListener(EVENTO_CAMBIO, recargar)
  }, [])

  useEffect(() => {
    if (estado !== 'cargando') return
    void Promise.all([obtenerConfiguracion(), suscripcionActual()])
      .then(([configuracion, suscripcion]) => {
        setClavePublica(configuracion.clavePublica)
        if (!configuracion.habilitado) setEstado('no-disponible')
        else setEstado(suscripcion && Notification.permission === 'granted' ? 'activo' : 'inactivo')
      })
      .catch(() => setEstado('no-disponible'))
  }, [estado])

  const ejecutar = useCallback(async (accion: () => Promise<void>) => {
    setOcupado(true)
    setAviso(null)
    try {
      await accion()
    } catch (error) {
      if (Notification.permission === 'denied') setEstado('bloqueado')
      // Solo los errores propios traen un mensaje para el usuario; los del navegador y de red son tecnicos.
      const propio = error instanceof Error && error.name === 'Error' && !('isAxiosError' in error)
      setAviso({ texto: propio ? error.message : 'No se pudo completar. Revisa tu conexión e intenta de nuevo.', error: true })
    } finally {
      setOcupado(false)
    }
  }, [])

  const activar = useCallback(
    () =>
      ejecutar(async () => {
        if (!clavePublica) return
        await activarWebPush(clavePublica)
        avisarCambio()
        setAviso({ texto: 'Listo: ahora recibirás avisos aquí.', error: false })
      }),
    [clavePublica, ejecutar],
  )

  const probar = useCallback(
    () =>
      ejecutar(async () => {
        const enviados = await enviarPruebaWebPush()
        setAviso(enviados > 0 ? { texto: 'Aviso de prueba enviado. Si no aparece, revisa las notificaciones de tu sistema operativo.', error: false } : { texto: 'No se pudo enviar el aviso. Desactívalos y vuelve a activarlos.', error: true })
      }),
    [ejecutar],
  )

  const desactivar = useCallback(
    () =>
      ejecutar(async () => {
        await desactivarWebPush()
        avisarCambio()
      }),
    [ejecutar],
  )

  return { estado, ocupado, aviso, activar, probar, desactivar }
}
