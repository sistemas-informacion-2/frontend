import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/core/store/authStore'
import { me } from '@/modules/acceso/api'

/**
 * Al montar la app, si hay un accessToken persistido pero el perfil no fue
 * revalidado en esta sesión del navegador, confirma con el backend que sigue
 * siendo válido (y lo limpia si no). El estado de sesión en sí vive en
 * `useAuthStore` (zustand), accesible fuera de React para el httpClient.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const perfilCacheado = useAuthStore((state) => state.perfil)
  const clear = useAuthStore((state) => state.clear)
  const setPerfil = useAuthStore((state) => state.setPerfil)
  const [ready, setReady] = useState(!accessToken || !!perfilCacheado)

  useEffect(() => {
    if (!accessToken) return
    me()
      .then(setPerfil)
      .catch(() => clear())
      .finally(() => setReady(true))
    // Solo se ejecuta una vez al montar: revalida la sesión persistida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null
  return children
}
