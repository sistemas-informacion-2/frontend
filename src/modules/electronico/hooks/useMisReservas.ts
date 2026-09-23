import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { cancelarMiReserva, crearMiReserva, fetchMisReservas } from '../api'
import type { CrearReservaInput, Reserva } from '../types'

/** Reservas del cliente autenticado (CU23). Solo un cliente tiene reservas propias. */
export function useMisReservas() {
  const autenticado = useAuthStore((state) => state.isAuthenticated)
  const esCliente = useAuthStore((state) => state.perfil?.tipoUsuario === 'C')

  const { data, isLoading, mutate } = useSWR<Reserva[]>(esCliente ? 'electronico/reservas/mias' : null, fetchMisReservas, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return {
    autenticado,
    esCliente,
    reservas: data ?? [],
    isLoading,
    /** Apartar prendas cambia el stock que se muestra en el catálogo: quien llama debe refrescarlo. */
    reservar: async (input: Omit<CrearReservaInput, 'idCliente'>) => {
      const reserva = await crearMiReserva(input)
      await mutate()
      return reserva
    },
    cancelar: async (id: number, motivo?: string) => {
      const reserva = await cancelarMiReserva(id, motivo)
      await mutate()
      return reserva
    },
  }
}
