import { useState } from 'react'
import { useAuthStore } from '@/core/store/authStore'
import { Button } from '@/shared/components/ui/Button'
import { useWebPush, type EstadoWebPush } from '../hooks/useWebPush'

const esIphoneSinInstalar = () => /iphone|ipad/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches

const TEXTOS: Record<EstadoWebPush, string> = {
  cargando: 'Comprobando este dispositivo…',
  'no-soportado': 'Este navegador no admite notificaciones.',
  'no-disponible': 'Las notificaciones no están disponibles en este momento.',
  bloqueado: 'Bloqueaste las notificaciones. Permítelas en la configuración del sitio de tu navegador y recarga la página.',
  inactivo: 'Recibe avisos de tus compras y promociones aunque la tienda esté cerrada.',
  activo: 'Los avisos están activos en este dispositivo.',
}

/** Activa o desactiva las notificaciones del navegador en este dispositivo (Mi perfil). */
export function PanelWebPush() {
  const { estado, ocupado, aviso, activar, probar, desactivar } = useWebPush()
  const texto = estado === 'no-soportado' && esIphoneSinInstalar() ? 'En iPhone, primero agrega la tienda a tu pantalla de inicio (iOS 16.4 o posterior) y ábrela desde ahí.' : TEXTOS[estado]

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Avisos en este dispositivo</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{texto}</p>
      {aviso && <p className={`mt-2 text-sm ${aviso.error ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'}`}>{aviso.texto}</p>}

      {estado === 'inactivo' && (
        <Button className="mt-4" loading={ocupado} onClick={() => void activar()}>
          Activar avisos
        </Button>
      )}

      {estado === 'activo' && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" disabled={ocupado} onClick={() => void probar()}>
            Enviar prueba
          </Button>
          <Button variant="secondary" disabled={ocupado} onClick={() => void desactivar()}>
            Desactivar
          </Button>
        </div>
      )}
    </section>
  )
}

const claveDescartada = (idUsuario: number) => `fashionstore-invitacion-avisos-${idUsuario}`

function fueDescartada(idUsuario: number): boolean {
  try {
    return localStorage.getItem(claveDescartada(idUsuario)) === '1'
  } catch {
    return false
  }
}

/**
 * Invita a activar los avisos al entrar. El navegador solo muestra su ventana de permiso tras un clic, asi que sin esto
 * los avisos dependerian de que la persona encuentre la opcion en "Mi perfil".
 */
export function InvitacionWebPush() {
  const idUsuario = useAuthStore((state) => state.perfil?.id ?? null)
  const { estado, ocupado, aviso, activar } = useWebPush()
  const [descartada, setDescartada] = useState(false)

  if (idUsuario === null || descartada || fueDescartada(idUsuario) || estado !== 'inactivo') return null

  const descartar = () => {
    try {
      localStorage.setItem(claveDescartada(idUsuario), '1')
    } catch {
      // Sin almacenamiento, solo se oculta hasta recargar.
    }
    setDescartada(true)
  }

  return (
    <div role="dialog" aria-label="Activar avisos" className="fixed bottom-4 left-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-neutral-200 bg-white p-4 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      <p className="font-medium text-neutral-900 dark:text-white">¿Quieres recibir avisos?</p>
      <p className="mt-1 text-neutral-600 dark:text-neutral-400">Te avisamos de tus compras y promociones aunque la tienda esté cerrada.</p>
      {aviso?.error && <p className="mt-2 text-red-600 dark:text-red-400">{aviso.texto}</p>}
      <div className="mt-3 flex gap-2">
        <Button loading={ocupado} onClick={() => void activar()}>
          Activar avisos
        </Button>
        <Button variant="secondary" disabled={ocupado} onClick={descartar}>
          Ahora no
        </Button>
      </div>
    </div>
  )
}
