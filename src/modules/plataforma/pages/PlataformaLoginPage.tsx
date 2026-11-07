import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { env } from '@/core/config/env'
import { getApiErrorMessage } from '@/core/http/errors'
import { useAuthStore } from '@/core/store/authStore'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { loginPlataforma } from '../api/plataforma.api'

/** Login del superadmin: sin tienda, contra /plataforma/auth/login. */
export function PlataformaLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      setSession(await loginPlataforma(email, password))
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo iniciar sesión. Intenta nuevamente.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{env.appName} · Plataforma</h1>
          <p className="text-sm text-neutral-500">Acceso del superadministrador</p>
        </div>
        <Input label="Correo" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" loading={loading}>
          Iniciar sesión
        </Button>
      </form>
    </main>
  )
}
