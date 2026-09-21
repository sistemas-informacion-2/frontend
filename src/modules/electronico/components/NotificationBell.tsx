import { useState } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import {
  contarNoLeidas,
  listarMias,
  marcarLeida,
  marcarTodasLeidas,
} from '@/modules/electronico/services/notificaciones.service'

export function NotificationBell() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [open, setOpen] = useState(false)

  const { data: noLeidas = 0, mutate: mutateContador } = useSWR(
    isAuthenticated ? 'notificaciones/no-leidas' : null,
    contarNoLeidas,
    { refreshInterval: 30000, revalidateOnFocus: true, shouldRetryOnError: false },
  )

  const { data, mutate: mutateLista } = useSWR(
    open && isAuthenticated ? ['notificaciones/mias', 'no-leidas'] : null,
    () => listarMias({ leido: false, limit: 8 }),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  )

  if (!isAuthenticated) return null

  const notificaciones = data?.items ?? []

  const handleMarcarLeida = async (id: number) => {
    await marcarLeida(id)
    await Promise.all([mutateLista(), mutateContador()])
  }

  const handleMarcarTodas = async () => {
    await marcarTodasLeidas()
    await Promise.all([mutateLista(), mutateContador()])
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <BellIcon />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Notificaciones</span>
            {notificaciones.length > 0 && (
              <button type="button" onClick={handleMarcarTodas} className="text-xs font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                Marcar todas
              </button>
            )}
          </div>

          {notificaciones.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">No tienes notificaciones nuevas.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-800">
              {notificaciones.map((notificacion) => (
                <li key={notificacion.id} className="px-3 py-2.5">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{notificacion.titulo}</p>
                  <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{notificacion.mensaje}</p>
                  <button type="button" onClick={() => handleMarcarLeida(notificacion.id)} className="mt-1 text-xs font-medium text-emerald-600 underline hover:text-emerald-800 dark:text-emerald-400">
                    Marcar como leída
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
