import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@/core/providers/ThemeProvider'
import { PortalLayout } from './components/PortalLayout'
import { IngresarPage } from './pages/IngresarPage'
import { LandingPage } from './pages/LandingPage'
import { RegistroPage } from './pages/RegistroPage'
import { RegistroRetornoPage } from './pages/RegistroRetornoPage'

const TITULOS: Record<string, string> = {
  '/': 'DOMINATR',
  '/ingresar': 'Ingresar',
  '/registro': 'Crea tu tienda',
  '/registro/retorno': 'Confirmando tu pago',
}

/** Titulo de la pestana y scroll arriba al cambiar de pagina (salvo saltos a una seccion con #). */
function AlNavegar() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    document.title = `${TITULOS[pathname] ?? 'Inicio'}`
    if (!hash) window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

/**
 * Portal publico de DOMINATR, fuera de cualquier tienda: la landing con los planes, el registro de empresas y el
 * ingreso (dueno de tienda o superadmin).
 */
export function PortalApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AlNavegar />
        <Routes>
          <Route element={<PortalLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/ingresar" element={<IngresarPage />} />
            <Route path="/registro" element={<RegistroPage />} />
            <Route path="/registro/retorno" element={<RegistroRetornoPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
