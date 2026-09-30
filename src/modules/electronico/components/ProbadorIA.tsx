import { useEffect, useRef } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { useProbadorIA, type EstadoProbadorIA } from '../hooks/useProbadorIA'
import type { ProductoDetalle } from '../types'
import { construirPromptProbador, elegirImagenPrenda } from '../utils/probador-ia'

interface ProbadorIAProps {
  open: boolean
  producto: Pick<ProductoDetalle, 'nombre' | 'categoriaNombre' | 'descripcion' | 'imagenes'>
  /** "Talla M · Negro · Slim": la variante que se agregaría al carrito. */
  detalleVariante?: string
  onCerrar: () => void
  onAgregarAlCarrito?: () => void
  agregandoAlCarrito?: boolean
}

const INDICADOR: Record<EstadoProbadorIA, { punto: string; texto: string }> = {
  conectando: { punto: 'bg-neutral-400', texto: 'Conectando' },
  enVivo: { punto: 'bg-emerald-500', texto: 'En vivo' },
  reconectando: { punto: 'bg-amber-400', texto: 'Reconectando…' },
  desconectado: { punto: 'bg-red-500', texto: 'Desconectado' },
  error: { punto: 'bg-red-500', texto: 'Error' },
}

const MENSAJE_CONEXION_PERDIDA = 'Se perdió la conexión con el probador.'

/**
 * Probador con IA (CU19): la cámara va en vivo a Decart y se muestra el video que devuelve, con la
 * prenda del producto ya puesta. La sesión vive solo mientras el modal está abierto (Modal no monta
 * a sus hijos cerrado), así que al cerrarlo se apaga la cámara y se deja de facturar.
 */
export function ProbadorIA({ open, onCerrar, ...resto }: ProbadorIAProps) {
  return (
    <Modal open={open} title="Probador con IA" onClose={onCerrar} maxWidthClassName="sm:max-w-3xl">
      <ProbadorIAContenido onCerrar={onCerrar} {...resto} />
    </Modal>
  )
}

function ProbadorIAContenido({ producto, detalleVariante, onCerrar, onAgregarAlCarrito, agregandoAlCarrito }: Omit<ProbadorIAProps, 'open'>) {
  const imagenUrl = elegirImagenPrenda(producto.imagenes)?.url ?? null
  const prompt = construirPromptProbador(producto)
  const { estado, remoteStream, error, reintentar } = useProbadorIA({ prompt, imagenUrl })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const video = videoRef.current
    if (video) video.srcObject = remoteStream
  }, [remoteStream])

  if (!imagenUrl) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
        Esta prenda no tiene imagen para probarse con IA.
      </p>
    )
  }

  const indicador = INDICADOR[estado]
  const detenido = estado === 'error' || estado === 'desconectado'
  const mensajeError = estado === 'desconectado' ? MENSAJE_CONEXION_PERDIDA : error?.mensaje
  const puedeReintentar = estado === 'desconectado' || (estado === 'error' && error?.reintentable)

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900">
        {/* Efecto espejo: el cliente se ve como frente a un espejo, igual que en la app móvil. */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover ${remoteStream ? '' : 'invisible'}`}
          style={{ transform: 'scaleX(-1)' }}
        />
        {!remoteStream && !detenido && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-white">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            Conectando con el probador…
          </div>
        )}
        <div
          className="absolute right-2 top-2 flex items-center gap-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white"
          aria-live="polite"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${indicador.punto}`} aria-hidden="true" />
          {indicador.texto}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <img src={imagenUrl} alt={`Prenda: ${producto.nombre}`} className="h-16 w-14 shrink-0 rounded-lg bg-neutral-100 object-cover dark:bg-neutral-800" />
        <div className="min-w-0 text-sm">
          <p className="truncate font-medium text-neutral-900 dark:text-white">{producto.nombre}</p>
          {detalleVariante && <p className="text-neutral-500 dark:text-neutral-400">{detalleVariante}</p>}
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Prenda que te estás probando</p>
        </div>
      </div>

      {mensajeError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {mensajeError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        {puedeReintentar && (
          <Button variant="secondary" onClick={reintentar}>
            Reintentar
          </Button>
        )}
        <Button variant="secondary" onClick={onCerrar}>
          Cerrar
        </Button>
        {onAgregarAlCarrito && (
          <Button onClick={onAgregarAlCarrito} loading={agregandoAlCarrito}>
            Agregar esta prenda al carrito 🛒
          </Button>
        )}
      </div>
    </div>
  )
}
