import { SWRConfig } from 'swr'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/core/context/AuthContext'
import { CarritoProvider } from '@/core/context/CarritoContext'
import { ThemeProvider } from '@/core/providers/ThemeProvider'
import { DashboardPage } from '@/modules/acceso/pages/Dashboard/DashboardPage'
import { LoginPage } from '@/modules/acceso/pages/LoginPage/LoginPage'
import { RolesPage } from '@/modules/acceso/pages/RolesPage/RolesPage'
import { UsuariosPage } from '@/modules/acceso/pages/UsuariosPage/UsuariosPage'
import { CategoriasPage } from '@/modules/inventario/pages/CategoriasPage/CategoriasPage'
import { ProductosPage } from '@/modules/inventario/pages/ProductosPage/ProductosPage'
import { ProveedoresPage } from '@/modules/inventario/pages/ProveedoresPage/ProveedoresPage'
import { TemporadasPage } from '@/modules/inventario/pages/TemporadasPage/TemporadasPage'
import { SucursalesPage } from '@/modules/operaciones/pages/SucursalesPage/SucursalesPage'
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
                    path="roles"
                    element={
                      <PermissionRoute permission="acceso:roles:gestionar">
                        <RolesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="usuarios"
                    element={
                      <PermissionRoute permission="acceso:usuarios:gestionar">
                        <UsuariosPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="sucursales"
                    element={
                      <PermissionRoute permission="operaciones:sucursales:gestionar">
                        <SucursalesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="categorias"
                    element={
                      <PermissionRoute permission="inventario:categorias:gestionar">
                        <CategoriasPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="productos"
                    element={
                      <PermissionRoute permission="inventario:productos:gestionar">
                        <ProductosPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="proveedores"
                    element={
                      <PermissionRoute permission="inventario:proveedores:gestionar">
                        <ProveedoresPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="temporadas"
                    element={
                      <PermissionRoute permission="inventario:temporadas:gestionar">
                        <TemporadasPage />
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
