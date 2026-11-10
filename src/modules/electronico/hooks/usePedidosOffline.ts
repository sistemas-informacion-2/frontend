import { useEffect, useState, useSyncExternalStore } from 'react'
import { useAuthStore } from '@/core/store/authStore'
import { listarPedidos, type PedidoOffline } from '@/core/offline/pedidosOfflineDb'
import { EVENTO_PEDIDOS_OFFLINE } from '../offline/pedidosOffline'

function suscribirConexion(alCambiar: () => void): () => void {
  window.addEventListener('online', alCambiar)
  window.addEventListener('offline', alCambiar)
  return () => {
    window.removeEventListener('online', alCambiar)
    window.removeEventListener('offline', alCambiar)
  }
}

/** true mientras el navegador cree tener red (navigator.onLine). */
export function useEnLinea(): boolean {
  return useSyncExternalStore(suscribirConexion, () => navigator.onLine, () => true)
}

/** Pedidos offline (RF-SYNC-01) del cliente con sesion, al dia con lo que hagan la pagina y el Service Worker. */
export function usePedidosOffline() {
  const idUsuario = useAuthStore((state) => (state.perfil?.tipoUsuario === 'C' ? state.perfil.id : null))
  const [pedidos, setPedidos] = useState<PedidoOffline[]>([])

  useEffect(() => {
    if (typeof indexedDB === 'undefined') return
    let vigente = true
    const cargar = () => {
      listarPedidos()
        .then((lista) => vigente && setPedidos(lista))
        .catch(() => undefined)
    }
    cargar()
    window.addEventListener(EVENTO_PEDIDOS_OFFLINE, cargar)
    return () => {
      vigente = false
      window.removeEventListener(EVENTO_PEDIDOS_OFFLINE, cargar)
    }
  }, [])

  return idUsuario === null ? [] : pedidos.filter((pedido) => pedido.id_cliente === idUsuario)
}
