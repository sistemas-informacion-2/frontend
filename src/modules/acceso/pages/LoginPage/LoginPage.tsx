import { extraerMensajeError } from '@/shared/utils/error'
import { type FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getApiStatus } from '@/core/http/errors'
import { useAuthStore } from '@/core/store/authStore'
import { login } from '@/modules/acceso/api'
import { LoginPageView } from './LoginPage.view'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const desde = (location.state as { from?: string } | null)?.from

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const auth = await login(email, password)
      setSession(auth)
      // Un cliente que llego desde un producto o el carrito vuelve ahi; el personal va al panel.
      navigate(auth.perfil.tipoUsuario === 'C' ? (desde ?? '/') : '/admin/dashboard', { replace: true })
    } catch (err) {
      setError(mensajeDeAcceso(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginPageView
      email={email}
      password={password}
      loading={loading}
      error={error}
      desde={desde}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  )
}

function mensajeDeAcceso(err: unknown): string {
  if (getApiStatus(err) === 423) return 'Cuenta bloqueada por intentos fallidos. Contacta a un administrador.'
  return extraerMensajeError(err, 'No se pudo iniciar sesión. Intenta nuevamente.')
}
