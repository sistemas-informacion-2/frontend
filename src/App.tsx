import { SWRConfig } from 'swr'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/core/context/AuthContext'
import { CarritoProvider } from '@/core/context/CarritoContext'
import { ThemeProvider } from '@/core/providers/ThemeProvider'
import { DashboardPage } from '@/modules/acceso/pages/Dashboard/DashboardPage'
import { LoginPage } from '@/modules/acceso/pages/LoginPage/LoginPage'
import { UsuariosPage } from '@/modules/acceso/pages/UsuariosPage/UsuariosPage'
import { CatalogoPage } from '@/modules/comercial/pages/CatalogoPage/CatalogoPage'
import { ComingSoonPage } from '@/shared/components/ComingSoonPage'
import { ProtectedLayout } from '@/shared/components/layout/ProtectedLayout'
import { PublicLayout } from '@/shared/components/layout/PublicLayout'
import { PermissionRoute } from '@/shared/components/routing/PermissionRoute'

function App() {
  return (
    <SWRConfig value={{ shouldRetryOnError: false, revalidateOnFocus: false }}>
      <ThemeProvider>
        <AuthProvider>
          <CarritoProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<CatalogoPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/buscar" element={<ComingSoonPage />} />
                  <Route path="/categoria/:slug" element={<ComingSoonPage />} />
                  <Route path="/carrito" element={<ComingSoonPage />} />
                  <Route path="/mi-cuenta" element={<ComingSoonPage />} />
                </Route>

                <Route path="/admin" element={<ProtectedLayout />}>
                   <Route path="dashboard" element={<DashboardPage />} />
                  <Route
                    path="usuarios"
                    element={
                      <PermissionRoute permission="acceso:usuarios:gestionar">
                        <UsuariosPage />
                      </PermissionRoute>
                    }
                  />
                  <Route path="*" element={<ComingSoonPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CarritoProvider>
        </AuthProvider>
      </ThemeProvider>
    </SWRConfig>
  )
}

export default App
