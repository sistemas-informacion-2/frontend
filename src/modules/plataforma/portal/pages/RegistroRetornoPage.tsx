import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '@/core/http/errors'
import { confirmarRegistro } from '../api/portal.api'
import { TiendaLista } from '../components/registro/TiendaLista'
import type { TiendaCreada } from '../types'
import { borrarBorrador } from '../utils/registro'

type Estado = { tipo: 'confirmando' } | { tipo: 'lista'; tienda: TiendaCreada } | { tipo: 'error'; mensaje: string }

/** Vuelta de Stripe tras pagar un plan: confirma el pago y la tienda se crea en ese momento. */
export function RegistroRetornoPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [estado, setEstado] = useState<Estado>(
    sessionId ? { tipo: 'confirmando' } : { tipo: 'error', mensaje: 'Falta la referencia del pago. Si pagaste, escríbenos y lo revisamos.' },
  )

  useEffect(() => {
    if (!sessionId) return
    let vigente = true
    // Confirmar es idempotente en el backend: si se llama dos veces (recarga, modo estricto) no se crea otra tienda.
    confirmarRegistro(sessionId)
      .then((tienda) => {
        borrarBorrador()
        if (vigente) setEstado({ tipo: 'lista', tienda })
      })
      .catch((err) => {
        if (vigente) setEstado({ tipo: 'error', mensaje: getApiErrorMessage(err, 'No se pudo confirmar el pago.') })
      })
    return () => {
      vigente = false
    }
  }, [sessionId])

  if (estado.tipo === 'lista') return <TiendaLista tienda={estado.tienda} sesionIniciada={false} />

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      {estado.tipo === 'confirmando' ? (
        <>
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" aria-hidden="true" />
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Confirmando tu pago…</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Estamos creando tu tienda. No cierres esta página.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold tracking-tight">No se pudo crear la tienda</h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300" role="alert">
            {estado.mensaje}
          </p>
          <Link to="/registro" className="mt-8 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
            Volver al registro
          </Link>
        </>
      )}
    </section>
  )
}
