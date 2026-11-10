import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { iniciarSincronizacionOffline } from './modules/electronico/offline/pedidosOffline'
import { iniciarVinculoWebPush } from './modules/electronico/services/webPush.service'
import { PlataformaApp } from './modules/plataforma/PlataformaApp'
import { SLUG_TIENDA_POR_DEFECTO, esRutaPlataforma, slugTienda } from './core/tenant/tienda'

const { pathname, search, hash } = window.location

if (!esRutaPlataforma(pathname) && !slugTienda) {
  // URL sin tienda (enlaces anteriores al SaaS, la raiz): se lleva a la tienda por defecto conservando la ruta.
  window.location.replace(`/t/${SLUG_TIENDA_POR_DEFECTO}${pathname === '/' ? '' : pathname}${search}${hash}`)
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>{esRutaPlataforma(pathname) ? <PlataformaApp /> : <App />}</StrictMode>,
  )

  // No-op en dev si devOptions.enabled no genero el SW; en build normal registra
  // el service worker y lo actualiza solo (registerType: 'autoUpdate').
  registerSW({ immediate: true })

  // La cola offline y los avisos push son de la tienda: el panel de plataforma no compra ni recibe avisos.
  if (slugTienda) {
    // RF-SYNC-01: comparte la sesion con el SW y reenvia los pedidos offline pendientes al volver la red.
    iniciarSincronizacionOffline()

    iniciarVinculoWebPush()
  }
}
