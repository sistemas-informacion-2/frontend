import { NavLink } from 'react-router-dom'
import { env } from '@/core/config/env'
import { StoreLogoMarca } from '@/modules/electronico/components/StoreLogo'
import type { SidebarGroup } from './Sidebar'

interface SidebarViewProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  groups: SidebarGroup[]
  /** Grupo al que pertenece la página actual (para resaltar su emoji con el menú contraído). */
  grupoActivo?: string
  estaAbierto: (label: string) => boolean
  onToggleGrupo: (label: string) => void
  /** Con el menú contraído: expande el menú y abre ese grupo. */
  onExpandirGrupo: (label: string) => void
}

export function SidebarView({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  groups,
  grupoActivo,
  estaAbierto,
  onToggleGrupo,
  onExpandirGrupo,
}: SidebarViewProps) {
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
          {!collapsed && (
            <span className="flex min-w-0 items-center gap-2">
              <StoreLogoMarca />
              <span className="truncate text-sm font-semibold">{env.appName} Admin</span>
            </span>
          )}

          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 md:flex dark:hover:bg-neutral-800 ${collapsed ? 'mx-auto' : ''}`}
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

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((group) => {
            const abierto = estaAbierto(group.label)
            const listaId = `menu-${group.label.replace(/\s+/g, '-').toLowerCase()}`

            return (
              <div key={group.label} className="mb-1">
                {/* Menú expandido (en móvil siempre): encabezado plegable con sus opciones. */}
                <div className={collapsed ? 'md:hidden' : ''}>
                  <button
                    type="button"
                    onClick={() => onToggleGrupo(group.label)}
                    aria-expanded={abierto}
                    aria-controls={listaId}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" className="text-base leading-none">
                        {group.icon}
                      </span>
                      <span className="truncate">{group.label}</span>
                    </span>
                    <span aria-hidden="true" className={`shrink-0 text-neutral-400 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>

                  {abierto && (
                    <div id={listaId} className="mt-0.5 flex flex-col gap-0.5 border-l border-neutral-200 pl-2 ml-4 dark:border-neutral-800">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `truncate rounded-md px-2.5 py-2 text-sm font-medium ${
                              isActive
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>

                {/* Menú contraído (solo escritorio): un emoji por grupo; tocarlo expande el menú y abre el grupo. */}
                {collapsed && (
                  <button
                    type="button"
                    onClick={() => onExpandirGrupo(group.label)}
                    title={group.label}
                    aria-label={`Abrir ${group.label}`}
                    className={`mx-auto hidden h-10 w-10 items-center justify-center rounded-md text-xl md:flex ${
                      group.label === grupoActivo
                        ? 'bg-neutral-900 dark:bg-white'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span aria-hidden="true">{group.icon}</span>
                  </button>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
