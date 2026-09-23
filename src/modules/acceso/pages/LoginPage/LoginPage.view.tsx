import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

interface LoginPageViewProps {
  email: string
  password: string
  loading: boolean
  error: string | null
  /** Ruta a la que se vuelve tras iniciar sesión; se conserva al ir a "Crear cuenta". */
  desde?: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginPageView({
  email,
  password,
  loading,
  error,
  desde,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginPageViewProps) {
  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-neutral-200 p-8 dark:border-neutral-800"
      >
        <h1 className="mb-1 text-2xl font-semibold dark:text-white">Iniciar sesión</h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">Accede con tu correo y contraseña.</p>

        <div className="flex flex-col gap-4">
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Button type="submit" loading={loading} className="mt-6 w-full">
          Ingresar
        </Button>

        <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={desde ? { from: desde } : undefined} className="font-medium text-neutral-900 underline dark:text-white">
            Crear cuenta
          </Link>
        </p>

        <Link
          to="/"
          className="mt-2 block text-center text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          Volver al catálogo
        </Link>
      </form>
    </div>
  )
}
