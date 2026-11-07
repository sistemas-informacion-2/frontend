import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
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
}
