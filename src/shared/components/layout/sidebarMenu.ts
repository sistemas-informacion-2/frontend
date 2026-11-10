import {
  BarChart3,
  Bell,
  Bookmark,
  Bot,
  Brain,
  Building2,
  CalendarRange,
  CreditCard,
  Database,
  FileSpreadsheet,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  Package,
  Receipt,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tags,
  TrendingUp,
  Truck,
  UserCheck,
  UserRound,
  Users,
  UsersRound,
  Vault,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

export interface SidebarItem {
  label: string
  path: string
  icon: LucideIcon
  permission?: string
}

export interface SidebarGroup {
  label: string
  icon: LucideIcon
  items: SidebarItem[]
}

export const GRUPOS_MENU: SidebarGroup[] = [
  {
    label: 'Acceso y Seguridad',
    icon: ShieldCheck,
    items: [
      { label: 'Usuarios', path: '/admin/usuarios', icon: Users, permission: 'acceso:usuarios:gestionar' },
      { label: 'Roles', path: '/admin/roles', icon: KeyRound, permission: 'acceso:roles:gestionar' },
      { label: 'Perfil', path: '/admin/perfil', icon: UserRound },
      { label: 'Bitácora', path: '/admin/bitacora', icon: History, permission: 'acceso:bitacora:leer' },
    ],
  },
  {
    label: 'Catálogo e Inventario',
    icon: Package,
    items: [
      { label: 'Productos', path: '/admin/productos', icon: Package, permission: 'inventario:productos:gestionar' },
      { label: 'Categorías', path: '/admin/categorias', icon: Tags, permission: 'inventario:categorias:gestionar' },
      { label: 'Proveedores', path: '/admin/proveedores', icon: Truck, permission: 'inventario:proveedores:gestionar' },
      { label: 'Temporadas', path: '/admin/temporadas', icon: CalendarRange, permission: 'inventario:temporadas:gestionar' },
      { label: 'Inventario / Almacén', path: '/admin/almacenes', icon: Warehouse, permission: 'inventario:almacen:gestionar' },
      { label: 'Stock / Existencias', path: '/admin/stock', icon: Layers, permission: 'inventario:almacen:gestionar' },
    ],
  },
  {
    label: 'Comercial y Tesorería',
    icon: ShoppingCart,
    items: [
      { label: 'Ventas Presenciales', path: '/admin/ventas', icon: Receipt, permission: 'comercial:ventas:gestionar' },
      { label: 'Devoluciones', path: '/admin/devoluciones', icon: RotateCcw, permission: 'comercial:devoluciones:gestionar' },
      { label: 'Compras', path: '/admin/compras', icon: ShoppingCart, permission: 'comercial:compras:gestionar' },
      { label: 'Caja', path: '/admin/caja', icon: Vault, permission: 'comercial:caja:gestionar' },
      { label: 'Métodos de Pago', path: '/admin/pasarelas', icon: CreditCard, permission: 'comercial:pasarelas:gestionar' },
    ],
  },
  {
    label: 'E-Commerce Digital',
    icon: Store,
    items: [
      { label: 'Reservas', path: '/admin/reservas', icon: Bookmark, permission: 'electronico:reservas:gestionar' },
      { label: 'Ventas en línea', path: '/admin/ventas-en-linea', icon: ShoppingBag, permission: 'electronico:ventas:leer' },
      { label: 'Notificaciones Push', path: '/admin/notificaciones', icon: Bell, permission: 'electronico:notificaciones:gestionar' },
    ],
  },
  {
    label: 'Operaciones y Estructura',
    icon: Building2,
    items: [
      { label: 'Sucursales', path: '/admin/sucursales', icon: MapPin, permission: 'operaciones:sucursales:gestionar' },
      { label: 'Empleados', path: '/admin/empleados', icon: UserCheck, permission: 'operaciones:empleados:gestionar' },
      { label: 'Clientes', path: '/admin/clientes', icon: UsersRound, permission: 'acceso:clientes:gestionar' },
    ],
  },
  {
    label: 'Reportes',
    icon: BarChart3,
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Reportes Predefinidos', path: '/admin/reportes/predefinidos', icon: FileSpreadsheet, permission: 'analitica:reportes:gestionar' },
      { label: 'Constructor de Reportes', path: '/admin/reportes/constructor', icon: BarChart3, permission: 'analitica:reportes:gestionar' },
      { label: 'Reportes por Voz / IA', path: '/admin/reportes/generativo', icon: Bot, permission: 'analitica:reportes:gestionar' },
    ],
  },
  {
    label: 'Inteligencia de negocio',
    icon: Brain,
    items: [
      { label: 'Asistente', path: '/admin/bi/asistente', icon: MessageSquareText, permission: 'analitica:bi:usar' },
      { label: 'Modelos', path: '/admin/bi/modelos', icon: TrendingUp, permission: 'analitica:bi:usar' },
      { label: 'Estado de los datos', path: '/admin/bi/estado', icon: Database, permission: 'analitica:bi:usar' },
    ],
  },
]

/** Migas de pan de una ruta del panel, tomadas del propio menú. */
export function migasDeRuta(pathname: string): string[] {
  for (const grupo of GRUPOS_MENU) {
    const item = grupo.items.find((candidato) => pathname === candidato.path || pathname.startsWith(`${candidato.path}/`))
    if (item) return [grupo.label, item.label]
  }
  return pathname
    .split('/')
    .filter(Boolean)
    .map((segmento) => segmento.charAt(0).toUpperCase() + segmento.slice(1).replace(/-/g, ' '))
}
