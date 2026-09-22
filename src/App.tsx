import { SWRConfig } from 'swr'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isNetworkError } from '@/core/http/errors'
import { AuthProvider } from '@/core/context/AuthContext'
import { ThemeProvider } from '@/core/providers/ThemeProvider'
import { VentasEnLineaPage } from '@/modules/electronico/pages/VentasEnLineaPage/VentasEnLineaPage'
import { DevolucionesPage } from '@/modules/comercial/pages/DevolucionesPage/DevolucionesPage'
import { RegistroPage } from '@/modules/acceso/pages/RegistroPage/RegistroPage'
import { CheckoutPage, CheckoutReservaPage } from '@/modules/electronico/pages/CheckoutPage/CheckoutPage'
import { PaypalRetornoPage } from '@/modules/electronico/pages/CheckoutPage/PaypalRetornoPage'
import { CompraExitosaPage, PagoCanceladoPage } from '@/modules/electronico/pages/CheckoutPage/CheckoutResultadoPages'
import { CuentaLayout } from '@/modules/electronico/pages/MiCuentaPage/CuentaLayout'
import { MisComprasPage } from '@/modules/electronico/pages/MisComprasPage/MisComprasPage'
import { MisDevolucionesPage } from '@/modules/electronico/pages/MisDevolucionesPage/MisDevolucionesPage'
import { ReservasPage } from '@/modules/electronico/pages/ReservasPage/ReservasPage'
import { MisReservasPage } from '@/modules/electronico/pages/MisReservasPage/MisReservasPage'
import { DashboardPage } from '@/modules/reporte/pages/DashboardPage/DashboardPage'
import { ReportesPage } from '@/modules/reporte/pages/ReportesPage/ReportesPage'
import { LoginPage } from '@/modules/acceso/pages/LoginPage/LoginPage'
import { PerfilPage } from '@/modules/acceso/pages/PerfilPage/PerfilPage'
import { BitacoraPage } from '@/modules/acceso/pages/BitacoraPage/BitacoraPage'
import { RolesPage } from '@/modules/acceso/pages/RolesPage/RolesPage'
import { UsuariosPage } from '@/modules/acceso/pages/UsuariosPage/UsuariosPage'
import { CategoriasPage } from '@/modules/inventario/pages/CategoriasPage/CategoriasPage'
import { ProductosPage } from '@/modules/inventario/pages/ProductosPage/ProductosPage'
import { ProveedoresPage } from '@/modules/inventario/pages/ProveedoresPage/ProveedoresPage'
import { TemporadasPage } from '@/modules/inventario/pages/TemporadasPage/TemporadasPage'
import { AlmacenesPage } from '@/modules/inventario/pages/AlmacenesPage/AlmacenesPage'
import { StockPage } from '@/modules/inventario/pages/StockPage/StockPage'
import { ClientesPage } from '@/modules/operaciones/pages/ClientesPage/ClientesPage'
import { EmpleadosPage } from '@/modules/operaciones/pages/EmpleadosPage/EmpleadosPage'
import { SucursalesPage } from '@/modules/operaciones/pages/SucursalesPage/SucursalesPage'
import { CatalogoPage } from '@/modules/electronico/pages/CatalogoPage/CatalogoPage'
import { ProductoPage } from '@/modules/electronico/pages/ProductoPage/ProductoPage'
import { CarritoPage } from '@/modules/electronico/pages/CarritoPage/CarritoPage'
import { PasarelasPage } from '@/modules/comercial/pages/PasarelasPage/PasarelasPage'
import { CajaPage } from '@/modules/comercial/pages/CajaPage/CajaPage'
import { ComprasPage } from '@/modules/comercial/pages/ComprasPage/ComprasPage'
import { VentasPage } from '@/modules/comercial/pages/VentasPage/VentasPage'
import { NotificacionesPage } from '@/modules/electronico/pages/NotificacionesPage/NotificacionesPage'
import { ProbadorAdminPage } from '@/modules/electronico/pages/ProbadorAdminPage/ProbadorAdminPage'
import { ComingSoonPage } from '@/shared/components/ComingSoonPage'
import { ProtectedLayout } from '@/shared/components/layout/ProtectedLayout'
import { PublicLayout } from '@/shared/components/layout/PublicLayout'
import { PermissionRoute } from '@/shared/components/routing/PermissionRoute'

function App() {
  return (
    <SWRConfig
      value={{
        shouldRetryOnError: true,
        revalidateOnFocus: false,
        // Reintenta solo cortes de red (backend reiniciando); los 4xx/5xx con
        // respuesta no se reintentan.
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          if (!isNetworkError(error) || retryCount >= 3) return
          setTimeout(() => revalidate({ retryCount }), Math.min(1000 * 2 ** retryCount, 8000))
        },
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<CatalogoPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegistroPage />} />
                <Route path="/categoria/:slug" element={<ComingSoonPage />} />
                <Route path="/producto/:id" element={<ProductoPage />} />
                <Route path="/carrito" element={<CarritoPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/reserva/:id" element={<CheckoutReservaPage />} />
                <Route path="/checkout/paypal/retorno" element={<PaypalRetornoPage />} />
                <Route path="/checkout/paypal/cancelado" element={<PagoCanceladoPage />} />
                <Route path="/checkout/exito" element={<CompraExitosaPage />} />
                <Route path="/mis-reservas" element={<Navigate to="/mi-cuenta/reservas" replace />} />
                <Route path="/mi-cuenta" element={<CuentaLayout />}>
                  <Route index element={<PerfilPage />} />
                  <Route path="reservas" element={<MisReservasPage />} />
                  <Route path="compras" element={<MisComprasPage />} />
                  <Route path="devoluciones" element={<MisDevolucionesPage />} />
                </Route>
              </Route>

              <Route path="/admin" element={<ProtectedLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="perfil" element={<PerfilPage />} />
                <Route path="bitacora" element={<PermissionRoute permission="acceso:bitacora:leer"><BitacoraPage /></PermissionRoute>} />
                <Route path="roles" element={<PermissionRoute permission="acceso:roles:gestionar"><RolesPage /></PermissionRoute>} />
                <Route path="usuarios" element={<PermissionRoute permission="acceso:usuarios:gestionar"><UsuariosPage /></PermissionRoute>} />
                <Route path="clientes" element={<PermissionRoute permission="acceso:clientes:gestionar"><ClientesPage /></PermissionRoute>} />
                <Route path="empleados" element={<PermissionRoute permission="operaciones:empleados:gestionar"><EmpleadosPage /></PermissionRoute>} />
                <Route path="sucursales" element={<PermissionRoute permission="operaciones:sucursales:gestionar"><SucursalesPage /></PermissionRoute>} />
                <Route path="categorias" element={<PermissionRoute permission="inventario:categorias:gestionar"><CategoriasPage /></PermissionRoute>} />
                <Route path="productos" element={<PermissionRoute permission="inventario:productos:gestionar"><ProductosPage /></PermissionRoute>} />
                <Route path="proveedores" element={<PermissionRoute permission="inventario:proveedores:gestionar"><ProveedoresPage /></PermissionRoute>} />
                <Route path="temporadas" element={<PermissionRoute permission="inventario:temporadas:gestionar"><TemporadasPage /></PermissionRoute>} />
                <Route path="almacenes" element={<PermissionRoute permission="inventario:almacen:gestionar"><AlmacenesPage /></PermissionRoute>} />
                <Route path="stock" element={<PermissionRoute permission="inventario:almacen:gestionar"><StockPage /></PermissionRoute>} />
                <Route path="pasarelas" element={<PermissionRoute permission="comercial:pasarelas:gestionar"><PasarelasPage /></PermissionRoute>} />
                <Route path="caja" element={<PermissionRoute permission="comercial:caja:gestionar"><CajaPage /></PermissionRoute>} />
                <Route path="compras" element={<PermissionRoute permission="comercial:compras:gestionar"><ComprasPage /></PermissionRoute>} />
                <Route path="ventas" element={<PermissionRoute permission="comercial:ventas:gestionar"><VentasPage /></PermissionRoute>} />
                <Route path="ventas-en-linea" element={<PermissionRoute permission="electronico:ventas:leer"><VentasEnLineaPage /></PermissionRoute>} />
                <Route path="reservas" element={<PermissionRoute permission="electronico:reservas:gestionar"><ReservasPage /></PermissionRoute>} />
                <Route path="devoluciones" element={<PermissionRoute permission="comercial:devoluciones:gestionar"><DevolucionesPage /></PermissionRoute>} />
                <Route path="notificaciones" element={<PermissionRoute permission="electronico:notificaciones:gestionar"><NotificacionesPage /></PermissionRoute>} />
                <Route path="probador-virtual" element={<PermissionRoute permission="electronico:probador:gestionar"><ProbadorAdminPage /></PermissionRoute>} />
                <Route path="reportes" element={<PermissionRoute permission="analitica:reportes:gestionar"><ReportesPage /></PermissionRoute>} />
                <Route path="*" element={<ComingSoonPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </SWRConfig>
  )
}

export default App
