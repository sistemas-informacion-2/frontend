import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { env } from '@/core/config/env'
import { StoreLogoMarca } from '@/modules/electronico/components/StoreLogo'
import type { SidebarGroup } from './sidebarMenu'

interface SidebarViewProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  groups: SidebarGroup[]
  /** Grupo al que pertenece la página actual (para resaltar su ícono con el menú contraído). */
  grupoActivo?: string
  estaAbierto: (label: string) => boolean
  onToggleGrupo: (label: string) => void
  /** Con el menú contraído: expande el menú y abre ese grupo. */
  onExpandirGrupo: (label: string) => void
  usuario: { nombre: string; detalle: string }
  onCerrarSesion: () => void
}

const BOTON_ICONO = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand dark:text-neutral-400 dark:hover:bg-neutral-800'

export function SidebarView({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile, groups, grupoActivo, estaAbierto, onToggleGrupo, onExpandirGrupo, usuario, onCerrarSesion }: SidebarViewProps) {
  return (
    <>
      <div onClick={onCloseMobile} aria-hidden="true" className={`fixed inset-0 z-40 animate-fade-in bg-black/40 md:hidden ${mobileOpen ? 'block' : 'hidden'}`} />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white transition-[transform,width] duration-200 md:relative md:z-auto md:translate-x-0 dark:border-neutral-800 dark:bg-neutral-950 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-16' : 'md:w-64'}`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-neutral-200 px-3 dark:border-neutral-800">
          <span className={`flex min-w-0 items-center gap-2 ${collapsed ? 'md:hidden' : ''}`}>
            <StoreLogoMarca />
            <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{env.appName} Admin</span>
          </span>
          <button type="button" onClick={onToggleCollapsed} aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'} className={`${BOTON_ICONO} hidden md:flex ${collapsed ? 'mx-auto' : ''}`}>
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden="true" /> : <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>
          <button type="button" onClick={onCloseMobile} aria-label="Cerrar menú" className={`${BOTON_ICONO} md:hidden`}>
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((group) => {
            const abierto = estaAbierto(group.label)
            const listaId = `menu-${group.label.replace(/\s+/g, '-').toLowerCase()}`
            const IconoGrupo = group.icon

            return (
              <div key={group.label} className="mb-1">
                {/* Menú expandido (en móvil siempre): encabezado plegable con sus opciones. */}
                <div className={collapsed ? 'md:hidden' : ''}>
                  <button
                    type="button"
                    onClick={() => onToggleGrupo(group.label)}
                    aria-expanded={abierto}
                    aria-controls={listaId}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <IconoGrupo className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{group.label}</span>
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>

                  {/* El alto se anima con grid-rows: la lista no necesita una altura fija. */}
                  <div id={listaId} className={`grid transition-[grid-template-rows] duration-200 ${abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        {group.items.map((item) => {
                          const IconoItem = item.icon
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={onCloseMobile}
                              tabIndex={abierto ? undefined : -1}
                              className={({ isActive }) =>
                                `relative flex items-center gap-2.5 truncate rounded-md py-2 pl-5 pr-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
                                  isActive
                                    ? 'bg-brand/10 font-semibold text-brand before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand'
                                    : 'font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                                }`
                              }
                            >
                              <IconoItem className="h-4 w-4 shrink-0" aria-hidden="true" />
                              <span className="truncate">{item.label}</span>
                            </NavLink>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menú contraído (solo escritorio): un ícono por grupo; tocarlo expande el menú y abre el grupo. */}
                {collapsed && (
                  <button
                    type="button"
                    onClick={() => onExpandirGrupo(group.label)}
                    title={group.label}
                    aria-label={`Abrir ${group.label}`}
                    className={`mx-auto hidden h-10 w-10 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand md:flex ${
                      group.label === grupoActivo ? 'bg-brand/10 text-brand' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <IconoGrupo className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )
          })}
        </nav>

        <div className={`flex items-center gap-2.5 border-t border-neutral-200 p-3 dark:border-neutral-800 ${collapsed ? 'md:flex-col' : ''}`}>
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">
            {usuario.nombre.charAt(0).toUpperCase()}
          </span>
          <div className={`min-w-0 flex-1 leading-tight ${collapsed ? 'md:hidden' : ''}`}>
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{usuario.nombre}</p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{usuario.detalle}</p>
          </div>
          <button type="button" onClick={onCerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión" className={BOTON_ICONO}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  )
}
