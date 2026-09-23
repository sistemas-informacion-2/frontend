import { env } from '@/core/config/env'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useSucursalesPublicas } from '../hooks'
import { StoreLogo } from './StoreLogo'

export function StoreFooter() {
  const { sucursales, isLoading } = useSucursalesPublicas()

  const telefonos = Array.from(new Set(sucursales.map((s) => s.telefono).filter((t): t is string => !!t)))
  const correos = Array.from(new Set(sucursales.map((s) => s.correo).filter((c): c is string => !!c)))

  return (
    <footer id="contacto" className="scroll-mt-4 border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <StoreLogo className="text-xl text-neutral-900 dark:text-white" />
          <p className="mt-3 max-w-xs text-sm text-neutral-600 dark:text-neutral-400">
            {env.appName}: moda para cada temporada, con atención en nuestras sucursales y compra en línea.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Nuestras sucursales</h2>
          {isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : sucursales.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Pronto publicaremos nuestras sedes.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {sucursales.map((sucursal) => (
                <li key={sucursal.id} className="text-sm">
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">{sucursal.nombre}</p>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {sucursal.ubicacion}, {sucursal.ciudadNombre}
                  </p>
                  {sucursal.horarioApertura && sucursal.horarioCierre && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      {sucursal.horarioApertura} - {sucursal.horarioCierre}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Canales de atención</h2>
          {isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-44" />
            </div>
          ) : telefonos.length === 0 && correos.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Pronto publicaremos nuestros canales de contacto.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              {telefonos.map((telefono) => (
                <li key={telefono}>
                  Tel.{' '}
                  <a href={`tel:${telefono}`} className="hover:text-neutral-900 dark:hover:text-white">
                    {telefono}
                  </a>
                </li>
              ))}
              {correos.map((correo) => (
                <li key={correo}>
                  <a href={`mailto:${correo}`} className="hover:text-neutral-900 dark:hover:text-white">
                    {correo}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-500">
        © {new Date().getFullYear()} {env.appName}. Todos los derechos reservados.
      </div>
    </footer>
  )
}
