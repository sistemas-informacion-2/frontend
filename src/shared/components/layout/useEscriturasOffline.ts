import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useSWRConfig } from 'swr'
import { obtenerEscrituras, sincronizarEscrituras, suscribirEscrituras } from '@/core/offline/colaEscrituras'
import { httpClient } from '@/core/http/httpClient'
import { useAuthStore } from '@/core/store/authStore'

/** El evento `online` llega antes de que la conexion este lista: se espera un momento antes del primer envio. */
const ESPERA_INICIAL_MS = 1000
const REINTENTO_MS = 10_000

/** Cambios hechos sin conexion por este usuario, en el orden en que se hicieron. */
export function useEscriturasPendientes() {
  const idUsuario = useAuthStore((state) => state.perfil?.id ?? null)
  const escrituras = useSyncExternalStore(suscribirEscrituras, obtenerEscrituras)
  return useMemo(() => escrituras.filter((escritura) => escritura.idUsuario === idUsuario), [escrituras, idUsuario])
}

/** Con red, envia los cambios pendientes: al entrar, al volver la conexion y, si queda alguno, cada 10 segundos. */
export function useSincronizarEscrituras(enLinea: boolean) {
  const idUsuario = useAuthStore((state) => state.perfil?.id ?? null)
  const hayPorEnviar = useEscriturasPendientes().some((escritura) => escritura.estado === 'PENDIENTE')
  const { mutate } = useSWRConfig()

  useEffect(() => {
    if (!enLinea || idUsuario === null || !hayPorEnviar) return
    const enviar = () => {
      void sincronizarEscrituras(httpClient, idUsuario).then((huboCambios) => {
        if (huboCambios) void mutate(() => true)
      })
    }
    const primerEnvio = window.setTimeout(enviar, ESPERA_INICIAL_MS)
    const intervalo = window.setInterval(enviar, REINTENTO_MS)
    return () => {
      window.clearTimeout(primerEnvio)
      window.clearInterval(intervalo)
    }
  }, [enLinea, hayPorEnviar, idUsuario, mutate])
}
