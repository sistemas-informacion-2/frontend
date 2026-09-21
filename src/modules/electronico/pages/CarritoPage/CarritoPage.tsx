import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useCarrito } from '../../hooks'
import { CarritoPageView } from './CarritoPage.view'

export function CarritoPage() {
  const { autenticado, esCliente, carrito, isLoading, actualizarCantidad, quitar, vaciar } = useCarrito()
  const [error, setError] = useState<string | null>(null)
  /** id del item que se está modificando, para bloquear sus botones mientras responde el servidor. */
  const [ocupado, setOcupado] = useState<number | 'todo' | null>(null)

  const ejecutar = async (que: number | 'todo', accion: () => Promise<unknown>) => {
    setError(null)
    setOcupado(que)
    try {
      await accion()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setOcupado(null)
    }
  }

  return (
    <CarritoPageView
      autenticado={autenticado}
      esCliente={esCliente}
      carrito={carrito}
      cargando={isLoading}
      error={error}
      ocupado={ocupado}
      onCantidad={(idItem, cantidad) => ejecutar(idItem, () => actualizarCantidad(idItem, cantidad))}
      onQuitar={(idItem) => ejecutar(idItem, () => quitar(idItem))}
      onVaciar={() => ejecutar('todo', vaciar)}
    />
  )
}

function extraerMensajeError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }
  return 'No se pudo actualizar el carrito. Inténtalo de nuevo.'
}
