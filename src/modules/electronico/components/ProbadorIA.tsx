import { Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
export function ProbadorIA({ open, onCerrar, producto, ...resto }: ProbadorIAProps) {
  const inicial = elegirImagenPrenda(producto.imagenes)?.url ?? null
  const [elegida, setElegida] = useState<string | null>(null)
  const imagenUrl = elegida ?? inicial

  return (
    <Modal open={open} title="Probador con IA" onClose={onCerrar} maxWidthClassName="sm:max-w-3xl">
      {/* Cada prenda es una sesión nueva con Decart: al elegir otra, el contenido se vuelve a montar. */}
      <ProbadorIAContenido key={imagenUrl} imagenUrl={imagenUrl} onElegirImagen={setElegida} onCerrar={onCerrar} producto={producto} {...resto} />
    </Modal>
  )
}

function ProbadorIAContenido({ imagenUrl, onElegirImagen, producto, detalleVariante, onCerrar, onAgregarAlCarrito, agregandoAlCarrito }: Omit<ProbadorIAProps, 'open'> & { imagenUrl: string | null; onElegirImagen: (url: string) => void }) {
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

  // El video se muestra en espejo: la foto se guarda igual a como la persona se está viendo.
  const capturar = () => {
    const video = videoRef.current
    const lienzo = document.createElement('canvas')
    if (!video || video.videoWidth === 0) return
    lienzo.width = video.videoWidth
    lienzo.height = video.videoHeight
    const contexto = lienzo.getContext('2d')
    if (!contexto) return
    contexto.translate(lienzo.width, 0)
    contexto.scale(-1, 1)
    contexto.drawImage(video, 0, 0)
    const enlace = document.createElement('a')
    enlace.href = lienzo.toDataURL('image/png')
    enlace.download = `probador-${producto.nombre.toLowerCase().replace(/\s+/g, '-')}.png`
    enlace.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
      {producto.imagenes.length > 1 && (
        <div role="group" aria-label="Elegir prenda" className="flex max-h-72 shrink-0 flex-col gap-2 overflow-y-auto [scrollbar-width:none]">
          {producto.imagenes.map((imagen) => (
            <button key={imagen.id} type="button" onClick={() => onElegirImagen(imagen.url)} aria-pressed={imagen.url === imagenUrl} aria-label={`Probar imagen ${imagen.orden + 1}`} className={`h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${imagen.url === imagenUrl ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <img src={imagen.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-video min-w-0 flex-1 overflow-hidden rounded-xl bg-neutral-900">
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
        {/* Marco guía: ayuda a colocarse de cuerpo entero frente a la cámara. */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-white/30">
          <g fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 1.5">
            <circle cx="50" cy="20" r="8" />
            <path d="M34 92 V50 Q34 34 50 34 Q66 34 66 50 V92" />
          </g>
        </svg>
        {remoteStream && (
          <button type="button" onClick={capturar} className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand-solid px-4 py-2 text-sm font-medium text-brand-on shadow-lg transition-all hover:bg-brand-solid-hover active:scale-95">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Capturar
          </button>
        )}
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
            Agregar esta prenda al carrito
          </Button>
        )}
      </div>
    </div>
  )
}
