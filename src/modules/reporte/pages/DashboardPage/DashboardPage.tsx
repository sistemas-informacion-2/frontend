import { useState } from 'react'
import useSWR from 'swr'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { obtenerResumenDashboard } from '../../services/dashboard.service'
import { DashboardPageView } from './DashboardPage.view'

/** El dashboard se refresca solo para acercarse al "tiempo real" que pide CU22. */
const REFRESCO_MS = 60_000

export function DashboardPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const puedeVerIndicadores = useAuthStore((state) => state.hasPermission('analitica:dashboard:leer'))
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const [dias, setDias] = useState(7)

  const { data: sucursales = [] } = useSWR(puedeVerIndicadores ? 'sucursales-dashboard' : null, listarSucursales)
  const {
    data: resumen,
    error,
    isLoading,
    mutate,
  } = useSWR(
    puedeVerIndicadores ? ['analitica/dashboard', sucursalActivaId, dias] : null,
    () => obtenerResumenDashboard({ idSucursal: sucursalActivaId ?? undefined, dias }),
    { refreshInterval: REFRESCO_MS, revalidateOnFocus: false, shouldRetryOnError: false },
  )

  return (
    <DashboardPageView
      nombre={perfil?.nombre ?? ''}
      subtitulo={`Rol: ${perfil?.tipoUsuario === 'A' ? 'Administrador' : perfil?.tipoUsuario === 'E' ? 'Empleado' : 'Cliente'}${
        perfil?.sucursalNombre ? ` · Sucursal: ${perfil.sucursalNombre}` : ''
      }`}
      puedeVerIndicadores={puedeVerIndicadores}
      resumen={resumen}
      cargando={isLoading}
      hayError={!!error}
      vista={sucursalActivaId === null ? 'Vista General' : (sucursales.find((s) => s.id === sucursalActivaId)?.nombre ?? 'Sucursal')}
      idSucursal={sucursalActivaId}
      dias={dias}
      onDias={setDias}
      onReintentar={() => void mutate()}
    />
  )
}
