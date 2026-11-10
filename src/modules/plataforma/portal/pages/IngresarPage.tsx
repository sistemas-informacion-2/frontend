import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { NOMBRE_PLATAFORMA } from '@/modules/plataforma/marca'
import { getApiErrorMessage } from '@/core/http/errors'
import { useAuthStore } from '@/core/store/authStore'
import { guardarSesionDeTienda } from '@/core/tenant/sesionDeTienda'
import { loginPlataforma } from '@/modules/plataforma/api/plataforma.api'
import { iniciarSesionEnTienda, tiendasDeUsuario } from '../api/portal.api'
import { Campo } from '../components/Campo'
import { IconoFlecha } from '../components/Iconos'
import type { TiendaDeUsuario } from '../types'

type Modo = 'tienda' | 'plataforma'

const ROL: Record<TiendaDeUsuario['tipoUsuario'], string> = { A: 'Administrador', E: 'Empleado' }

/**
 * Ingreso desde el portal. "Mi tienda": correo y contrasena; si el correo trabaja en varias tiendas, se elige una.
 * "Plataforma": el superadmin de DOMINATR.
 */
export function IngresarPage() {
  const [params] = useSearchParams()
  const [modo, setModo] = useState<Modo>(params.get('como') === 'plataforma' ? 'plataforma' : 'tienda')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tiendas, setTiendas] = useState<TiendaDeUsuario[] | null>(null)
  const setSesionPlataforma = useAuthStore((state) => state.setSession)

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo)
    setError(null)
    setTiendas(null)
  }

  const entrarEnTienda = async (tienda: TiendaDeUsuario) => {
    setCargando(true)
    setError(null)
    try {
      guardarSesionDeTienda(tienda.slug, await iniciarSesionEnTienda(tienda.slug, email, password))
      window.location.assign(`/t/${tienda.slug}/admin/dashboard`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo iniciar sesión en la tienda.'))
      setCargando(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCargando(true)
    setError(null)
    try {
      if (modo === 'plataforma') {
        setSesionPlataforma(await loginPlataforma(email, password))
        window.location.assign('/plataforma')
        return
      }
      const encontradas = await tiendasDeUsuario(email, password)
      if (encontradas.length === 1) {
        await entrarEnTienda(encontradas[0])
        return
      }
      setTiendas(encontradas)
      setCargando(false)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo iniciar sesión. Intenta nuevamente.'))
      setCargando(false)
    }
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-14 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight">Ingresar</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        ¿Aún no tienes tienda?{' '}
        <Link to="/registro?plan=PRUEBA" className="font-medium text-neutral-900 underline dark:text-white">
          Pruébala 7 días gratis
        </Link>
      </p>

      <div role="tablist" aria-label="Tipo de ingreso" className="mt-8 grid grid-cols-2 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900">
        {(
          [
            ['tienda', 'Mi tienda'],
            ['plataforma', 'Plataforma'],
          ] as const
        ).map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={modo === valor}
            onClick={() => cambiarModo(valor)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              modo === valor
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {tiendas ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold">Elige una tienda</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Tu correo tiene acceso a {tiendas.length} tiendas.</p>
            </div>
            <ul className="flex flex-col gap-2">
              {tiendas.map((tienda) => (
                <li key={tienda.slug}>
                  <button
                    type="button"
                    disabled={cargando}
                    onClick={() => void entrarEnTienda(tienda)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-left hover:border-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:hover:border-white dark:hover:bg-neutral-800"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{tienda.nombre}</span>
                      <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                        /t/{tienda.slug} · {ROL[tienda.tipoUsuario]}
                      </span>
                    </span>
                    <IconoFlecha className="h-4 w-4 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
            {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
            <button type="button" onClick={() => setTiendas(null)} className="text-sm font-medium text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
              Usar otra cuenta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {modo === 'tienda' ? 'Para dueños y personal de una tienda.' : `Acceso del superadministrador de ${NOMBRE_PLATAFORMA}.`}
            </p>
            <Campo label="Correo electrónico" type="email" autoComplete="username" value={email} onValor={setEmail} obligatorio />
            <Campo label="Contraseña" type="password" autoComplete="current-password" value={password} onValor={setPassword} obligatorio />
            {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={cargando}
              className="mt-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {cargando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        )}
      </div>
      <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        ¿Eres cliente de una tienda? Ingresa desde la página de esa tienda.
      </p>
    </section>
  )
}
