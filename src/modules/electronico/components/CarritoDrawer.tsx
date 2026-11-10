import { useEffect, useState } from 'react'
import { extraerMensajeError } from '@/shared/utils/error'
import { useCarrito } from '../hooks'
import { useCarritoDrawer } from '../hooks/useCarritoDrawer'
import { CarritoDrawerView } from './CarritoDrawer.view'

/** Monta el contenido solo mientras está abierto: en cada tarjeta y página no hace falta su lógica. */
export function CarritoDrawer() {
  const abierto = useCarritoDrawer((estado) => estado.abierto)
  return abierto ? <CarritoDrawerContenido /> : null
}

function CarritoDrawerContenido() {
  const cerrar = useCarritoDrawer((estado) => estado.cerrar)
  const { autenticado, esCliente, carrito, isLoading, actualizarCantidad, quitar } = useCarrito()
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<number | null>(null)

  useEffect(() => {
    const alPulsar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cerrar()
    }
    document.addEventListener('keydown', alPulsar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = ''
    }
  }, [cerrar])

  const ejecutar = async (idItem: number, accion: () => Promise<unknown>) => {
    setError(null)
    setOcupado(idItem)
    try {
      await accion()
    } catch (requestError) {
      setError(extraerMensajeError(requestError, 'No se pudo actualizar el carrito. Inténtalo de nuevo.'))
    } finally {
      setOcupado(null)
    }
  }

  return (
    <CarritoDrawerView
      autenticado={autenticado}
      esCliente={esCliente}
      carrito={carrito}
      cargando={isLoading}
      error={error}
      ocupado={ocupado}
      onCerrar={cerrar}
      onCantidad={(idItem, cantidad) => void ejecutar(idItem, () => actualizarCantidad(idItem, cantidad))}
      onQuitar={(idItem) => void ejecutar(idItem, () => quitar(idItem))}
    />
  )
}
