import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { iniciarSincronizacionOffline } from './modules/electronico/offline/pedidosOffline'
import { iniciarVinculoWebPush } from './modules/electronico/services/webPush.service'
import { PlataformaApp } from './modules/plataforma/PlataformaApp'
import { PortalApp } from './modules/plataforma/portal/PortalApp'
import { esRutaPlataforma, esRutaPortal, slugTienda } from './core/tenant/tienda'

const { pathname } = window.location

/**
 * Tres apps en el mismo bundle, segun la URL:
 * - '/', '/ingresar', '/registro': el portal de DOMINATR (planes, registro de empresas e ingreso).
 * - '/plataforma/...': el panel del superadmin.
 * - '/t/:slug/...': una tienda.
 */
function appDeLaRuta(): ReactNode | null {
  if (esRutaPortal(pathname)) return <PortalApp />
  if (esRutaPlataforma(pathname)) return <PlataformaApp />
  if (slugTienda) return <App />
  return null
}

const app = appDeLaRuta()
if (app) {
  createRoot(document.getElementById('root')!).render(<StrictMode>{app}</StrictMode>)

  // En build registra el service worker y lo actualiza solo.
  registerSW({ immediate: true })

  // La cola offline y los avisos push son de la tienda: el portal y la plataforma no compran ni reciben avisos.
  if (slugTienda) {
    iniciarSincronizacionOffline()
    iniciarVinculoWebPush()
  }
} else {
  // Una ruta sin tienda (/producto/5, enlaces de antes del SaaS): no hay forma de saber de que tienda es, asi que se
  // lleva al portal de DOMINATR. Las tiendas siempre viven bajo /t/:slug.
  window.location.replace('/')
}
