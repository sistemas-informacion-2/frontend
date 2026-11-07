import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/core/providers/ThemeProvider'
import { useAuthStore } from '@/core/store/authStore'
import { EmpresasPage } from './pages/EmpresasPage'
import { PlataformaLoginPage } from './pages/PlataformaLoginPage'

/**
 * App del panel de la plataforma (/plataforma/...). Va aparte de la app de
 * las tiendas: no tiene tienda, ni AuthProvider (su /acceso/auth/me es de
 * tienda) y guarda su sesion en su propia clave de localStorage.
 */
export function PlataformaApp() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/plataforma">
        <Routes>
          <Route path="/login" element={<PlataformaLoginPage />} />
          <Route
            path="/"
            element={
              <SoloSuperadmin>
                <EmpresasPage />
              </SoloSuperadmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

function SoloSuperadmin({ children }: { children: ReactNode }) {
  const tipoUsuario = useAuthStore((state) => state.perfil?.tipoUsuario)
  if (tipoUsuario !== 'S') return <Navigate to="/login" replace />
  return children
}
