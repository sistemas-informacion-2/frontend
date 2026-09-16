import { NavLink } from 'react-router-dom'
import { env } from '@/core/config/env'
import type { SidebarGroup } from './Sidebar'

interface SidebarViewProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  groups: SidebarGroup[]
}

export function SidebarView({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile, groups }: SidebarViewProps) {
  return (
    <>
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 md:hidden ${mobileOpen ? 'block' : 'hidden'}`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 md:relative md:z-auto md:translate-x-0 md:transition-[width] dark:border-neutral-800 dark:bg-neutral-950 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-16' : 'md:w-64'}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-4 dark:border-neutral-800">
          {!collapsed && <span className="truncate text-sm font-semibold">{env.appName} Admin</span>}

          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 md:flex dark:hover:bg-neutral-800"
          >
            {collapsed ? '»' : '«'}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 md:hidden dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {group.icon} {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={item.label}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `truncate rounded-md px-2.5 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                      }`}
                  >
                    <span className="md:hidden">{item.label}</span>
                    <span className="hidden md:inline">{collapsed ? item.label.slice(0, 1) : item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
