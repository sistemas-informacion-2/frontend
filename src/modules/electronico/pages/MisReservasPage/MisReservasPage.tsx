import { useState } from 'react'
import { useMisReservas } from '../../hooks'
import { extraerMensajeError } from '../../utils/reservas'
import { MisReservasPageView } from './MisReservasPage.view'

export function MisReservasPage() {
  const { autenticado, esCliente, reservas, isLoading, cancelar } = useMisReservas()
  const [error, setError] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)
  const [confirmando, setConfirmando] = useState<number | null>(null)

  const onCancelar = async (id: number) => {
    setError(null)
    setCancelando(id)
    try {
      await cancelar(id)
      setConfirmando(null)
    } catch (requestError) {
      setError(extraerMensajeError(requestError, 'No se pudo cancelar la reserva. Inténtalo de nuevo.'))
    } finally {
      setCancelando(null)
    }
  }

  return (
    <MisReservasPageView
      autenticado={autenticado}
      esCliente={esCliente}
      reservas={reservas}
      cargando={isLoading}
      error={error}
      cancelando={cancelando}
      confirmando={confirmando}
      onPedirCancelar={setConfirmando}
      onCancelar={onCancelar}
    />
  )
}
