import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { SidebarView } from './SidebarView'

export interface SidebarItem {
  label: string
  path: string
  permission?: string
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
    ],
  },
  {
    label: 'Comercial y Tesorería',
    icon: '💰',
    items: [
      { label: 'Ventas Presenciales', path: '/admin/ventas', permission: 'comercial:ventas:gestionar' },
      { label: 'Compras', path: '/admin/compras', permission: 'comercial:compras:gestionar' },
      { label: 'Caja', path: '/admin/caja', permission: 'comercial:caja:gestionar' },
      { label: 'Métodos de Pago', path: '/admin/pasarelas', permission: 'comercial:pasarelas:gestionar' },
    ],
  },
  {
    label: 'E-Commerce Digital',
    icon: '🛒',
    items: [
      { label: 'Carrito', path: '/admin/carritos', permission: 'electronico:carrito:leer' },
      { label: 'Probador Virtual', path: '/admin/probador-virtual', permission: 'electronico:probador:gestionar' },
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
    label: 'Reportes y Analítica',
    icon: '📊',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Reportes Generativos', path: '/admin/reportes', permission: 'analitica:reportes:gestionar' },
    ],
  },
]

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const collapsed = useAppStore((state) => state.sidebarCollapsed)
  const toggleCollapsed = useAppStore((state) => state.toggleSidebar)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0)

  return (
    <SidebarView
      collapsed={collapsed}
      onToggleCollapsed={toggleCollapsed}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
      groups={groups}
    />
  )
}
