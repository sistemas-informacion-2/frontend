import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { obtenerMiPlan } from '../api/suscripcion.api'

export const CLAVE_MI_PLAN = 'suscripcion/mi-plan'

/** Plan de la tienda para el personal (A y E); los clientes no lo consultan. */
export function useMiPlan() {
  const tipo = useAuthStore((state) => state.perfil?.tipoUsuario)
  const esPersonal = tipo === 'A' || tipo === 'E'
  return useSWR(esPersonal ? CLAVE_MI_PLAN : null, obtenerMiPlan, { revalidateOnFocus: false, shouldRetryOnError: false })
}
