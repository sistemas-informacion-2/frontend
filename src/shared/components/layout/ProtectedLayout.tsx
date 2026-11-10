import { ChevronRight, MapPin, Menu, Store, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { useCerrarSesion } from '@/modules/acceso/hooks/useCerrarSesion'
import { NotificationBell } from '@/modules/electronico/components/NotificationBell'
import { InvitacionWebPush } from '@/modules/electronico/components/PanelWebPush'
import { useEnLinea } from '@/modules/electronico/hooks'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { AvisoPlan } from '@/modules/suscripcion/components/AvisoPlan'
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'
import { CambiosSinEnviar } from './CambiosSinEnviar'
import { PreparacionOffline } from './PreparacionOffline'
import { Sidebar } from './Sidebar'
import { migasDeRuta } from './sidebarMenu'
import { useEscriturasPendientes, useSincronizarEscrituras } from './useEscriturasOffline'
import { usePrecargaAdmin } from './usePrecargaAdmin'

const ROL_LABEL: Record<string, string> = {
  A: 'Administrador',
  E: 'Empleado',
  C: 'Cliente',
}

function Breadcrumbs() {
  const { pathname } = useLocation()
  const migas = migasDeRuta(pathname)

  return (
    <nav className="flex min-w-0 items-center gap-1.5 truncate text-sm text-neutral-500 dark:text-neutral-400" aria-label="Breadcrumb">
      {migas.map((miga, index) => (
        <span key={miga} className="flex min-w-0 items-center gap-1.5">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className={`truncate ${index === migas.length - 1 ? 'font-medium text-neutral-900 dark:text-neutral-100' : 'hidden sm:inline'}`}>{miga}</span>
        </span>
      ))}
    </nav>
  )
}

function EstadoRed({ enLinea }: { enLinea: boolean }) {
  if (enLinea) {
    return (
      <span title="Con conexión" className="hidden items-center gap-1.5 text-xs text-neutral-500 sm:flex dark:text-neutral-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
        En línea
      </span>
    )
  }
  return (
    <span role="status" title="Los cambios se enviarán al volver la conexión" className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
      Sin conexión
    </span>
  )
}

function SelectorSucursal() {
  const puedeElegir = useAuthStore((state) => state.hasPermission('operaciones:sucursales:gestionar'))
  const sucursalPropia = useAuthStore((state) => state.perfil?.sucursalNombre)
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const setSucursalActiva = useAppStore((state) => state.setSucursalActiva)
  const { data: sucursales = [] } = useSWR(puedeElegir ? 'sucursales' : null, listarSucursales, { revalidateOnFocus: false })

  // Una sucursal recordada que ya no esta en la lista (desactivada, borrada o de otra tienda) dejaria todo el panel
  // en cero y el selector en blanco: se vuelve a la Vista General.
  const sucursalDesconocida = sucursalActivaId !== null && sucursales.length > 0 && !sucursales.some((sucursal) => sucursal.id === sucursalActivaId)
  useEffect(() => {
    if (sucursalDesconocida) setSucursalActiva(null)
  }, [sucursalDesconocida, setSucursalActiva])

  if (!puedeElegir) {
    if (!sucursalPropia) return null
    return (
      <span className="hidden items-center gap-1.5 text-sm text-neutral-600 lg:flex dark:text-neutral-400">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {sucursalPropia}
      </span>
    )
  }

  return (
    <label className="relative hidden lg:block">
      <span className="sr-only">Sucursal activa</span>
      <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
      <select
        value={sucursalActivaId ?? ''}
        onChange={(event) => setSucursalActiva(event.target.value === '' ? null : Number(event.target.value))}
        className="max-w-44 cursor-pointer truncate rounded-md border border-neutral-200 bg-white py-1.5 pl-8 pr-2 text-sm text-neutral-700 outline-none transition-colors hover:border-neutral-300 focus:border-brand focus:ring-2 focus:ring-brand-ring dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
      >
        <option value="">Todas las sucursales</option>
        {sucursales.map((sucursal) => (
          <option key={sucursal.id} value={sucursal.id}>
            {sucursal.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ProtectedLayout() {
  const perfil = useAuthStore((state) => state.perfil)
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const cerrarSesion = useCerrarSesion()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const enLinea = useEnLinea()
  usePrecargaAdmin(enLinea)
  useSincronizarEscrituras(enLinea)
  const sinEnviar = useEscriturasPendientes().length

  if (!perfil) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    const aviso = `Tienes ${sinEnviar} cambio(s) sin enviar. Quedan guardados en este dispositivo y se enviarán cuando esta cuenta vuelva a iniciar sesión, para lo cual necesitas conexión. ¿Cerrar sesión?`
    if (sinEnviar > 0 && !window.confirm(aviso)) return
    void cerrarSesion('/login')
  }

  const usuario = {
    nombre: `${perfil.nombre} ${perfil.apellido}`,
    detalle: `${ROL_LABEL[perfil.tipoUsuario]}${perfil.sucursalNombre ? ` · ${perfil.sucursalNombre}` : ''}`,
  }

  return (
    <div className="flex h-screen bg-app">
      <InvitacionWebPush />
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} usuario={usuario} onCerrarSesion={handleLogout} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 sm:px-6 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menú"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 md:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <Breadcrumbs />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <EstadoRed enLinea={enLinea} />
            <PreparacionOffline />
            <CambiosSinEnviar />
            <SelectorSucursal />
            <Link to="/" title="Ir a la tienda" aria-label="Ir a la tienda" className="hidden h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 sm:flex dark:text-neutral-300 dark:hover:bg-neutral-800">
              <Store className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <AvisoPlan />

        {!enLinea && (
          <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Sin conexión: ves los últimos datos guardados y lo que crees, edites o elimines se enviará solo al volver la red. Los filtros nuevos y exportar necesitan conexión.
          </p>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Algunas pantallas toman la sucursal activa solo al montarse: al cambiarla deben empezar de nuevo. */}
          <Outlet key={sucursalActivaId ?? 'todas'} />
        </main>
      </div>
    </div>
  )
}
