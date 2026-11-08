import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { iniciarSincronizacionOffline } from './modules/electronico/offline/pedidosOffline'
import { iniciarVinculoWebPush } from './modules/electronico/services/webPush.service'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// No-op en dev si devOptions.enabled no genero el SW; en build normal registra
// el service worker y lo actualiza solo (registerType: 'autoUpdate').
registerSW({ immediate: true })

// RF-SYNC-01: comparte la sesion con el SW y reenvia los pedidos offline pendientes al volver la red.
iniciarSincronizacionOffline()

iniciarVinculoWebPush()
