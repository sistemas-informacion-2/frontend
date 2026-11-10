import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { useMiPlan } from '@/modules/suscripcion/hooks/useMiPlan'
import { SidebarView } from './SidebarView'

/** Funciones que dependen del plan de DOMINATR. */
type FuncionPlan = 'bi' | 'reportesAvanzados'

export interface SidebarItem {
  label: string
  path: string
  permission?: string
  /** Si el plan no incluye esta funcion, la opcion se ve con candado y lleva a Mi plan. */
  funcion?: FuncionPlan
  bloqueado?: boolean
}

export interface SidebarGroup {
  label: string
  icon: string
  items: SidebarItem[]
}

const GROUPS: SidebarGroup[] = [
  {
    label: 'Acceso y Seguridad',
    icon: '🛡️',
    items: [
      { label: 'Usuarios', path: '/admin/usuarios', permission: 'acceso:usuarios:gestionar' },
      { label: 'Roles', path: '/admin/roles', permission: 'acceso:roles:gestionar' },
      { label: 'Perfil', path: '/admin/perfil' },
      { label: 'Bitácora', path: '/admin/bitacora', permission: 'acceso:bitacora:leer' },
    ],
  },
  {
    label: 'Catálogo e Inventario',
    icon: '📦',
    items: [
      { label: 'Productos', path: '/admin/productos', permission: 'inventario:productos:gestionar' },
      { label: 'Categorías', path: '/admin/categorias', permission: 'inventario:categorias:gestionar' },
      { label: 'Proveedores', path: '/admin/proveedores', permission: 'inventario:proveedores:gestionar' },
      { label: 'Temporadas', path: '/admin/temporadas', permission: 'inventario:temporadas:gestionar' },
      { label: 'Inventario / Almacén', path: '/admin/almacenes', permission: 'inventario:almacen:gestionar' },
      { label: 'Stock / Existencias', path: '/admin/stock', permission: 'inventario:almacen:gestionar' },
    ],
  },
  {
    label: 'Comercial y Tesorería',
    icon: '💰',
    items: [
      { label: 'Ventas Presenciales', path: '/admin/ventas', permission: 'comercial:ventas:gestionar' },
      { label: 'Devoluciones', path: '/admin/devoluciones', permission: 'comercial:devoluciones:gestionar' },
      { label: 'Compras', path: '/admin/compras', permission: 'comercial:compras:gestionar' },
      { label: 'Caja', path: '/admin/caja', permission: 'comercial:caja:gestionar' },
      { label: 'Métodos de Pago', path: '/admin/pasarelas', permission: 'comercial:pasarelas:gestionar' },
    ],
  },
  {
    label: 'E-Commerce Digital',
    icon: '🛒',
    items: [
      { label: 'Reservas', path: '/admin/reservas', permission: 'electronico:reservas:gestionar' },
      { label: 'Ventas en línea', path: '/admin/ventas-en-linea', permission: 'electronico:ventas:leer' },
      { label: 'Notificaciones Push', path: '/admin/notificaciones', permission: 'electronico:notificaciones:gestionar' },
    ],
  },
  {
    label: 'Operaciones y Estructura',
    icon: '🏢',
    items: [
      { label: 'Sucursales', path: '/admin/sucursales', permission: 'operaciones:sucursales:gestionar' },
      { label: 'Empleados', path: '/admin/empleados', permission: 'operaciones:empleados:gestionar' },
      { label: 'Clientes', path: '/admin/clientes', permission: 'acceso:clientes:gestionar' },
    ],
  },
  {
    label: 'Reportes',
    icon: '📊',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Reportes Predefinidos', path: '/admin/reportes/predefinidos', permission: 'analitica:reportes:gestionar' },
      { label: 'Constructor de Reportes', path: '/admin/reportes/constructor', permission: 'analitica:reportes:gestionar', funcion: 'reportesAvanzados' },
      { label: 'Reportes por Voz / IA', path: '/admin/reportes/generativo', permission: 'analitica:reportes:gestionar', funcion: 'reportesAvanzados' },
    ],
  },
  {
    label: 'Inteligencia de negocio',
    icon: '🧠',
    items: [
      { label: 'Asistente', path: '/admin/bi/asistente', permission: 'analitica:bi:usar', funcion: 'bi' },
      { label: 'Modelos', path: '/admin/bi/modelos', permission: 'analitica:bi:usar', funcion: 'bi' },
      { label: 'Estado de los datos', path: '/admin/bi/estado', permission: 'analitica:bi:usar', funcion: 'bi' },
    ],
  },
  {
    label: 'Suscripción',
    icon: '💳',
    items: [{ label: 'Mi plan', path: '/admin/plan' }],
  },
]

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const collapsed = useAppStore((state) => state.sidebarCollapsed)
  const toggleCollapsed = useAppStore((state) => state.toggleSidebar)
  const gruposAbiertos = useAppStore((state) => state.gruposAbiertos)
  const setGrupoAbierto = useAppStore((state) => state.setGrupoAbierto)
  const { pathname } = useLocation()
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const { data: miPlan } = useMiPlan()

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => !item.permission || hasPermission(item.permission))
      .map((item) => {
        // Sin el plan cargado todavia no se bloquea nada: el backend igual responde 403 si no corresponde.
        const bloqueado = !!item.funcion && !!miPlan && !miPlan.plan[item.funcion]
        return bloqueado ? { ...item, bloqueado, path: `/admin/plan?funcion=${item.funcion}` } : item
      }),
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
      // Con el menú contraído solo se ve el emoji: tocarlo expande el menú y abre ese grupo.
      onExpandirGrupo={(label) => {
        setGrupoAbierto(label, true)
        if (collapsed) toggleCollapsed()
      }}
    />
  )
}
