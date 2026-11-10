import { Link } from 'react-router-dom'
import { IconoCheck, IconoFlecha } from '../Iconos'
import type { TiendaCreada } from '../../types'
import { formatoFecha } from '../../utils/formato'

interface TiendaListaProps {
  tienda: TiendaCreada
  /** true si ya se inicio sesion en la tienda (prueba gratuita): el boton entra directo al panel. */
  sesionIniciada: boolean
}

/** Fin del registro: la tienda ya existe. */
export function TiendaLista({ tienda, sesionIniciada }: TiendaListaProps) {
  const panel = `/t/${tienda.slug}/admin/dashboard`
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:py-24">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <IconoCheck className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Tu tienda está lista</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-300">
        <strong className="font-semibold text-neutral-900 dark:text-white">{tienda.nombre}</strong> ya está creada con el plan {tienda.planNombre}
        {tienda.venceEl ? `, vigente hasta el ${formatoFecha(tienda.venceEl)}` : ''}.
      </p>

      <dl className="mt-8 w-full divide-y divide-neutral-200 rounded-2xl border border-neutral-200 text-left text-sm dark:divide-neutral-800 dark:border-neutral-800">
        <div className="flex justify-between gap-4 px-5 py-3">
          <dt className="text-neutral-500 dark:text-neutral-400">Tu tienda</dt>
          <dd className="truncate font-medium">
            {window.location.host}/t/{tienda.slug}
          </dd>
        </div>
        <div className="flex justify-between gap-4 px-5 py-3">
          <dt className="text-neutral-500 dark:text-neutral-400">Usuario administrador</dt>
          <dd className="truncate font-medium">{tienda.adminEmail}</dd>
        </div>
      </dl>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        {sesionIniciada ? (
          <a href={panel} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
            Entrar a mi panel
            <IconoFlecha className="h-4 w-4" />
          </a>
        ) : (
          <Link
            to={`/ingresar?email=${encodeURIComponent(tienda.adminEmail)}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Ingresar a mi panel
            <IconoFlecha className="h-4 w-4" />
          </Link>
        )}
        <a href={`/t/${tienda.slug}`} className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-5 py-3 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900">
          Ver mi tienda
        </a>
      </div>
      <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400">
        Primero crea tu sucursal y tu almacén, y después carga tus productos.
      </p>
    </section>
  )
}
