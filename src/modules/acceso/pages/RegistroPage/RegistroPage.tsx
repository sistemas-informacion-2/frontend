import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getApiErrorMessage, getApiStatus } from '@/core/http/errors'
import { useAuthStore } from '@/core/store/authStore'
import { registrarCliente } from '@/modules/acceso/api'
import type { RegistroClienteFormValues } from '../../types'
import { RegistroPageView } from './RegistroPage.view'

const FORM_VACIO: RegistroClienteFormValues = { nombre: '', apellido: '', email: '', telefono: '', password: '', confirmarPassword: '' }

/** Devuelve el problema de la contraseña, o null si es válida. Refleja las reglas del servidor. */
function validarPassword(password: string, confirmar: string): string | null {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'La contraseña debe combinar letras y números.'
  if (password !== confirmar) return 'Las contraseñas no coinciden.'
  return null
}

export function RegistroPage() {
  const [values, setValues] = useState<RegistroClienteFormValues>(FORM_VACIO)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autenticado = useAuthStore((state) => state.isAuthenticated)
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const desde = (location.state as { from?: string } | null)?.from

  // Quien ya tiene sesión no necesita registrarse (y tampoco debe verlo tras crear su cuenta).
  if (autenticado && !loading) return <Navigate to="/" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const problema = validarPassword(values.password, values.confirmarPassword)
    if (problema) {
      setError(problema)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const auth = await registrarCliente({
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        email: values.email.trim(),
        telefono: values.telefono.trim() || undefined,
        password: values.password,
      })
      setSession(auth)
      // La cuenta queda con la sesión iniciada: se vuelve a lo que el cliente estaba haciendo (carrito, producto...).
      navigate(desde ?? '/', { replace: true })
    } catch (err) {
      setError(
        getApiStatus(err) === 409
          ? 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.'
          : getApiErrorMessage(err, 'No se pudo crear la cuenta. Inténtalo de nuevo.'),
      )
      setLoading(false)
    }
  }

  return (
    <RegistroPageView
      values={values}
      loading={loading}
      error={error}
      desde={desde}
      onChange={(field, value) => setValues((actual) => ({ ...actual, [field]: value }))}
      onSubmit={handleSubmit}
    />
  )
}
