import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { SidebarView } from './SidebarView'
import { GRUPOS_MENU } from './sidebarMenu'

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
  usuario: { nombre: string; detalle: string }
  onCerrarSesion: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile, usuario, onCerrarSesion }: SidebarProps) {
  const collapsed = useAppStore((state) => state.sidebarCollapsed)
  const toggleCollapsed = useAppStore((state) => state.toggleSidebar)
  const gruposAbiertos = useAppStore((state) => state.gruposAbiertos)
  const setGrupoAbierto = useAppStore((state) => state.setGrupoAbierto)
  const { pathname } = useLocation()
  const hasPermission = useAuthStore((state) => state.hasPermission)

  const groups = GRUPOS_MENU.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0)

  // El grupo de la página actual es el que se ve abierto mientras la persona no haya decidido otra cosa.
  const grupoActivo = groups.find((group) => group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)))?.label
  const estaAbierto = (label: string) => gruposAbiertos[label] ?? label === grupoActivo

  return (
    <SidebarView
      collapsed={collapsed}
      onToggleCollapsed={toggleCollapsed}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
      groups={groups}
      grupoActivo={grupoActivo}
      estaAbierto={estaAbierto}
      onToggleGrupo={(label) => setGrupoAbierto(label, !estaAbierto(label))}
      // Con el menú contraído solo se ve el ícono: tocarlo expande el menú y abre ese grupo.
      onExpandirGrupo={(label) => {
        setGrupoAbierto(label, true)
        if (collapsed) toggleCollapsed()
      }}
      usuario={usuario}
      onCerrarSesion={onCerrarSesion}
    />
  )
}
