import type { ReactNode } from 'react'
import useSWR from 'swr'
import { httpClient } from '@/core/http/httpClient'
import { getApiStatus } from '@/core/http/errors'
import { unwrap, type Envelope } from '@/core/http/envelope'
import { useEmpresaStore, type EmpresaPublica } from './empresaStore'
import { SLUG_TIENDA_POR_DEFECTO, slugTienda } from './tienda'

async function obtenerEmpresaPublica(slug: string): Promise<EmpresaPublica> {
  return unwrap(await httpClient.get<Envelope<EmpresaPublica>>(`/plataforma/empresas/${slug}/publico`))
}

/**
 * Resuelve la tienda de la URL antes de mostrar nada: si no existe o esta
 * suspendida lo dice en lugar de dejar que cada pantalla falle con un 404/403.
 * Deja la empresa en useEmpresaStore (nombre, logo, color) y pone su nombre
 * como titulo de la pestana.
 */
export function TiendaGate({ children }: { children: ReactNode }) {
  const setEmpresa = useEmpresaStore((state) => state.setEmpresa)
  const { data: empresa, error, isLoading, mutate } = useSWR(slugTienda ? ['tienda', slugTienda] : null, () => obtenerEmpresaPublica(slugTienda!), {
    revalidateOnFocus: false,
    onSuccess: (datos) => {
      setEmpresa(datos)
      document.title = datos.nombre
    },
  })

  if (isLoading) return <Aviso titulo="Cargando tienda…" />
  if (error && getApiStatus(error) === 404) {
    return (
      <Aviso titulo="Tienda no encontrada" detalle={`No existe ninguna tienda en /t/${slugTienda}.`}>
        <a href={`/t/${SLUG_TIENDA_POR_DEFECTO}`} className="text-sm font-medium underline">
          Ir a la tienda principal
        </a>
      </Aviso>
    )
  }
  if (error || !empresa) {
    return (
      <Aviso titulo="No se pudo cargar la tienda" detalle="Revisa tu conexión e intenta de nuevo.">
        <button type="button" onClick={() => void mutate()} className="text-sm font-medium underline">
          Reintentar
        </button>
      </Aviso>
    )
  }
  if (empresa.estado === 'SUSPENDIDA') {
    return <Aviso titulo={empresa.nombre} detalle="Esta tienda está temporalmente fuera de servicio." />
  }

  return children
}

function Aviso({ titulo, detalle, children }: { titulo: string; detalle?: string; children?: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-white px-4 text-center text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <h1 className="text-xl font-semibold">{titulo}</h1>
      {detalle && <p className="text-sm text-neutral-500">{detalle}</p>}
      {children}
    </main>
  )
}
