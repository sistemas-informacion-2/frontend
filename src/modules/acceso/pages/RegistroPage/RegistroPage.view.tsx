import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import type { RegistroClienteFormValues } from '../../types'

interface RegistroPageViewProps {
  values: RegistroClienteFormValues
  loading: boolean
  error: string | null
  /** Ruta a la que se vuelve después de registrarse; se conserva al ir a "Iniciar sesión". */
  desde?: string
  onChange: <K extends keyof RegistroClienteFormValues>(field: K, value: RegistroClienteFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function RegistroPageView({ values, loading, error, desde, onChange, onSubmit }: RegistroPageViewProps) {
  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-8">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-neutral-200 p-8 dark:border-neutral-800">
        <h1 className="mb-1 text-2xl font-semibold dark:text-white">Crear cuenta</h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          Regístrate para guardar tu carrito, reservar prendas y seguir tus compras.
        </p>

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre" autoComplete="given-name" required maxLength={100} value={values.nombre} onChange={(event) => onChange('nombre', event.target.value)} />
            <Input label="Apellido" autoComplete="family-name" required maxLength={100} value={values.apellido} onChange={(event) => onChange('apellido', event.target.value)} />
          </div>
          <Input label="Correo electrónico" type="email" autoComplete="email" required maxLength={150} value={values.email} onChange={(event) => onChange('email', event.target.value)} />
          <Input label="Teléfono (opcional)" type="tel" autoComplete="tel" maxLength={20} value={values.telefono} onChange={(event) => onChange('telefono', event.target.value)} />
          <Input
            label="Contraseña (8+ caracteres, con letras y números)"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={values.password}
            onChange={(event) => onChange('password', event.target.value)}
          />
          <Input
            label="Repite la contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={values.confirmarPassword}
            onChange={(event) => onChange('confirmarPassword', event.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="mt-6 w-full">
          Crear cuenta
        </Button>

        <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" state={desde ? { from: desde } : undefined} className="font-medium text-neutral-900 underline dark:text-white">
            Inicia sesión
          </Link>
        </p>
        <Link to="/" className="mt-2 block text-center text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          Volver al catálogo
        </Link>
      </form>
    </div>
  )
}
