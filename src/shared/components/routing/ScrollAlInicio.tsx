import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** Cada página nueva empieza arriba; con Atrás/Adelante el navegador recupera la posición en que estaba. */
export function ScrollAlInicio() {
  const { pathname } = useLocation()
  const tipoNavegacion = useNavigationType()

  useLayoutEffect(() => {
    if (tipoNavegacion !== 'POP') window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, tipoNavegacion])

  return null
}
