import { DrawingUtils, FilesetResolver, PoseLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { disposeObjeto } from '@/shared/components/Modelo3D/three-utils'
import type { ProbadorVariante, ZonaProbador } from '../types'
import { calcularTransformPrenda, referenciaVisible, INDICES_DEBUG_POR_ZONA, type AjusteCalibracion } from '../utils/probador-ar'

interface ProbadorVirtualProps {
  open: boolean
  /** Assets oficiales de la variante desde la API (CU19). Puede tardar un momento. */
  variante?: ProbadorVariante
  /** Datos locales como respaldo para renderizar la prenda antes de que llegue la API. */
  nombre?: string
  color?: string
  talla?: string
  corte?: string
  onCerrar: () => void
  onAgregarAlCarrito?: () => void
  agregandoAlCarrito?: boolean
}

const WASM_BASE = '/mediapipe/wasm'
const MODELO_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

// El overlay de debug (checkboxes "Landmarks"/"Esqueleto") solo muestra los
// puntos/conexiones de la zona del cuerpo que le toca a la prenda: una falda
// (INFERIOR) no necesita ver hombros/brazos, y viceversa. INDICES_DEBUG_POR_ZONA
// ya excluye la cara (0-10), que no aporta nada acá.
const CONEXIONES_POR_ZONA: Record<ZonaProbador, typeof PoseLandmarker.POSE_CONNECTIONS> = Object.fromEntries(
  (Object.entries(INDICES_DEBUG_POR_ZONA) as [ZonaProbador, number[]][]).map(([zona, indices]) => {
    const permitidos = new Set(indices)
    return [zona, PoseLandmarker.POSE_CONNECTIONS.filter((c) => permitidos.has(c.start) && permitidos.has(c.end))]
  }),
) as Record<ZonaProbador, typeof PoseLandmarker.POSE_CONNECTIONS>

type EstadoCamara = 'iniciando' | 'lista' | 'sinPermiso' | 'error'

/**
 * Probador virtual (CU19): abre la cámara, detecta la pose con MediaPipe y
 * superpone el modelo 3D real de la prenda (.glb, exportado de Blender) sobre
 * el cuerpo en tiempo real, siguiendo hombros/cadera y el giro del torso (ver
 * `utils/probador-ar.ts`). Si la variante todavía no tiene un .glb asociado,
 * no se dibuja nada sobre el video: solo se avisa con un mensaje.
 */
export function ProbadorVirtual({
  open,
  variante,
  nombre,
  color,
  talla,
  corte,
  onCerrar,
  onAgregarAlCarrito,
  agregandoAlCarrito,
}: ProbadorVirtualProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvas3dRef = useRef<HTMLCanvasElement | null>(null)
  const statusRef = useRef<HTMLDivElement | null>(null)

  const [estado, setEstado] = useState<EstadoCamara>('iniciando')
  const [mensaje, setMensaje] = useState('Cargando modelo…')
  const [mostrarLandmarks, setMostrarLandmarks] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)
  // Cada .glb está modelado a su manera (más o menos ancho, cuello más o
  // menos alto); estos controles corrigen a ojo el cálculo automático sin
  // tener que volver a exportar nada desde Blender. Se reinician al cambiar
  // de variante porque el ajuste que le sirve a una prenda no le sirve a otra.
  const [ajusteEscala, setAjusteEscala] = useState(1)
  const [ajusteAltura, setAjusteAltura] = useState(0)
  // Un ajuste calibrado para una prenda no tiene por qué servir para otra:
  // se reinicia durante el render (patrón "adjusting state when a prop
  // changes" de React) apenas cambia la variante, sin pasar por un efecto.
  const [varianteIdPrevia, setVarianteIdPrevia] = useState(variante?.id)
  if (variante?.id !== varianteIdPrevia) {
    setVarianteIdPrevia(variante?.id)
    setAjusteEscala(1)
    setAjusteAltura(0)
  }

  // Los landmarks suavizados y el stream viven fuera del render.
  const suavizado = useRef<NormalizedLandmark[] | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const ultimoT = useRef(-1)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)

  // Escena AR: se crea una sola vez por apertura del modal; el modelo dentro se
  // reemplaza (sin reiniciar cámara ni escena) cuando cambia modelo3dUrl.
  const escenaRef = useRef<THREE.Scene | null>(null)
  const camara3dRef = useRef<THREE.PerspectiveCamera | null>(null)
  const renderer3dRef = useRef<THREE.WebGLRenderer | null>(null)
  const modeloGrupoRef = useRef<THREE.Group | null>(null)
  const anchoBaseModeloRef = useRef(1)
  const altoBaseModeloRef = useRef(1)
  const modeloListoRef = useRef(false)
  // Segunda capa de suavizado, ahora sobre el transform ya calculado (no solo
  // sobre los landmarks): atan2()/distancias amplifican el ruido que sobrevive
  // al suavizado de landmarks, así que sin esto el modelo seguía vibrando un
  // poco aunque ya no "convulsionara". null = todavía no hay nada que suavizar
  // (primer frame con el modelo visible: se salta el suavizado para no arrancar con lag).
  const transformSuavizadoRef = useRef<{ posicion: THREE.Vector3; escalaX: number; escalaY: number; rotY: number; rotZ: number } | null>(null)

  // Valores que el bucle de pintado lee en cada frame (se actualizan sin reiniciar la cámara).
  const nombrePrendaRef = useRef('')
  const zonaRef = useRef<ZonaProbador>('SUPERIOR')
  const mostrarLandmarksRef = useRef(false)
  const mostrarEsqueletoRef = useRef(false)
  const ajusteRef = useRef<AjusteCalibracion>({ escala: 1, alturaDelta: 0 })
  const imprimirRef = useRef<(texto: string) => void>(() => undefined)

  // Se sincronizan en cada render; el bucle (RAF) solo los lee fuera del render.
  useEffect(() => {
    nombrePrendaRef.current = variante?.producto?.nombre ?? nombre ?? ''
    zonaRef.current = variante?.zonaProbador ?? 'SUPERIOR'
    mostrarLandmarksRef.current = mostrarLandmarks
    mostrarEsqueletoRef.current = mostrarEsqueleto
    ajusteRef.current = { escala: ajusteEscala, alturaDelta: ajusteAltura }
  })

  const limpiar = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    landmarkerRef.current?.close()
    landmarkerRef.current = null
    suavizado.current = null
    ultimoT.current = -1
  }, [])

  // Vida de la cámara + escena AR: solo depende de si el modal está abierto.
  useEffect(() => {
    if (!open) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const canvas3d = canvas3dRef.current
    if (!video || !canvas || !canvas3d) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const status = statusRef.current

    setEstado('iniciando')
    setMensaje('Cargando modelo…')
    const dibujo = new DrawingUtils(ctx)

    // Escena AR transparente por encima del video: se crea ya (con un tamaño
    // provisional) para que el efecto de carga del .glb (más abajo) pueda
    // enganchar el modelo apenas esté listo, sin esperar a la cámara.
    const escena = new THREE.Scene()
    const camara3d = new THREE.PerspectiveCamera(50, 4 / 3, 0.1, 50)
    const renderer3d = new THREE.WebGLRenderer({ canvas: canvas3d, alpha: true, antialias: true })
    renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer3d.setClearColor(0x000000, 0)
    escena.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.4))
    const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.4)
    luzPrincipal.position.set(1, 2, 3)
    escena.add(luzPrincipal)
    escenaRef.current = escena
    camara3dRef.current = camara3d
    renderer3dRef.current = renderer3d

    const imprimir = (texto: string) => {
      if (status) status.textContent = texto
      setMensaje(texto)
    }
    imprimirRef.current = imprimir

    let raf = 0
    let cancelado = false

    const iniciar = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
        if (cancelado) return
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODELO_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
        if (cancelado) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: 'user' },
          audio: false,
        })
        if (cancelado) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        video.srcObject = stream
        await new Promise<void>((resolve) => (video.onloadedmetadata = () => resolve()))
        await video.play()
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas3d.width = video.videoWidth
        canvas3d.height = video.videoHeight
        camara3d.aspect = video.videoWidth / video.videoHeight
        camara3d.updateProjectionMatrix()
        renderer3d.setSize(video.videoWidth, video.videoHeight, false)

        setEstado('lista')
        imprimir(nombrePrendaRef.current || 'Listo — ponte frente a la cámara')
        raf = requestAnimationFrame(bucle)
} catch (error) {
        const detalle = error instanceof Error ? error.message : 'Error desconocido'
        setEstado(error instanceof DOMException && error.name === 'NotAllowedError' ? 'sinPermiso' : 'error')
        imprimir(`No se pudo abrir la cámara: ${detalle}`)
      }
    }

    function bucle() {
      const videoActual = videoRef.current
      if (videoActual && videoActual.currentTime !== ultimoT.current) {
        ultimoT.current = videoActual.currentTime
        const resultado = landmarkerRef.current?.detectForVideo(videoActual, performance.now())
        renderPrenda(resultado?.landmarks[0])
      }
      raf = requestAnimationFrame(bucle)
    }

    function renderPrenda(lm: NormalizedLandmark[] | undefined) {
      const canvasActual = canvasRef.current
      const ctxActual = canvasActual?.getContext('2d')
      if (!canvasActual || !ctxActual) return
      ctxActual.clearRect(0, 0, canvasActual.width, canvasActual.height)

      if (!lm) {
        suavizado.current = null
        transformSuavizadoRef.current = null
        imprimir('No veo a nadie')
        if (modeloGrupoRef.current) modeloGrupoRef.current.visible = false
        renderer3d.render(escena, camara3d)
        return
      }
      imprimir(nombrePrendaRef.current || 'Prenda')

      const ALPHA = 0.5
      const previo = suavizado.current
      suavizado.current = previo
        ? lm.map((p, i) => ({
            x: p.x + (previo[i].x - p.x) * ALPHA,
            y: p.y + (previo[i].y - p.y) * ALPHA,
            // OJO: `z` también hay que suavizarlo. Es el eje más ruidoso que
            // reporta MediaPipe (no hay cámara de profundidad real, lo estima),
            // y es justo el que decide el giro (yaw) del modelo — dejarlo sin
            // suavizar es lo que hacía "temblar"/"convulsionar" la prenda: cada
            // frame giraba de golpe siguiendo puro ruido.
            z: (p.z ?? 0) + ((previo[i].z ?? 0) - (p.z ?? 0)) * ALPHA,
            visibility: p.visibility,
          }))
        : lm.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }))

      const zona = zonaRef.current
      // Una falda se ancla en la cadera, no en los hombros: qué landmarks hacen
      // falta depende de la categoría del producto (ver utils/probador-ar.ts).
      const referenciaOk = referenciaVisible(suavizado.current, zona)

      const usaModelo3d = modeloListoRef.current && modeloGrupoRef.current
      if (referenciaOk && usaModelo3d) {
        const transform = calcularTransformPrenda(camara3d, suavizado.current, zona, ajusteRef.current)
        const grupo = modeloGrupoRef.current
        if (transform && grupo) {
          const escalaX = transform.anchoHombros / anchoBaseModeloRef.current
          const escalaY = zona === 'COMPLETO' && transform.altoTorso ? transform.altoTorso / altoBaseModeloRef.current : escalaX

          // Suaviza el transform final (no solo los landmarks de entrada):
          // amortigua el ruido que atan2()/distancias amplifican en el paso
          // anterior. FACTOR bajo = reacciona rápido pero tiembla; alto = se
          // ve firme pero acompaña el movimiento con un poco de retraso.
          const FACTOR_SUAVIZADO = 0.35
          const anterior = transformSuavizadoRef.current
          const actual = anterior
            ? {
                posicion: anterior.posicion.clone().lerp(transform.posicion, FACTOR_SUAVIZADO),
                escalaX: anterior.escalaX + (escalaX - anterior.escalaX) * FACTOR_SUAVIZADO,
                escalaY: anterior.escalaY + (escalaY - anterior.escalaY) * FACTOR_SUAVIZADO,
                rotY: anterior.rotY + (transform.rotacionY - anterior.rotY) * FACTOR_SUAVIZADO,
                rotZ: anterior.rotZ + (transform.rotacionZ - anterior.rotZ) * FACTOR_SUAVIZADO,
              }
            : { posicion: transform.posicion.clone(), escalaX, escalaY, rotY: transform.rotacionY, rotZ: transform.rotacionZ }
          transformSuavizadoRef.current = actual

          grupo.visible = true
          grupo.position.copy(actual.posicion)
          grupo.scale.set(actual.escalaX, actual.escalaY, actual.escalaX)
          grupo.rotation.set(0, actual.rotY, actual.rotZ)
        }
      } else if (referenciaOk) {
        transformSuavizadoRef.current = null
        imprimir('Esta prenda todavía no tiene modelo 3D para probarse')
        if (modeloGrupoRef.current) modeloGrupoRef.current.visible = false
      } else {
        transformSuavizadoRef.current = null
        imprimir(zona === 'INFERIOR' ? 'Necesito ver tu cadera (aléjate un poco de la cámara)' : 'Necesito ver los hombros')
        if (modeloGrupoRef.current) modeloGrupoRef.current.visible = false
      }

      renderer3d.render(escena, camara3d)

      if (mostrarEsqueletoRef.current) dibujo.drawConnectors(suavizado.current, CONEXIONES_POR_ZONA[zona], { color: '#00e5ff', lineWidth: 2 })
      if (mostrarLandmarksRef.current) {
        const puntosZona = INDICES_DEBUG_POR_ZONA[zona].map((indice) => suavizado.current![indice])
        dibujo.drawLandmarks(puntosZona, { color: '#ffea00', radius: 4 })
      }
    }

    raf = requestAnimationFrame(iniciar)

    return () => {
      cancelado = true
      cancelAnimationFrame(raf)
      limpiar()
      if (modeloGrupoRef.current) {
        escena.remove(modeloGrupoRef.current)
        disposeObjeto(modeloGrupoRef.current)
        modeloGrupoRef.current = null
      }
      modeloListoRef.current = false
      renderer3d.dispose()
      escenaRef.current = null
      camara3dRef.current = null
      renderer3dRef.current = null
    }
    // La cámara se abre solo cuando el modal se abre/cierra. Los cambios de
    // variante, color o checkboxes se reflejan por refs sin reiniciar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Carga (o reemplazo) del modelo 3D dentro de la escena AR ya creada arriba.
  // No reinicia cámara ni landmarker: solo cambia qué se dibuja encima.
  useEffect(() => {
    if (!open) return
    const escena = escenaRef.current
    const url = variante?.modelo3dUrl
    if (!escena) return

    modeloListoRef.current = false
    transformSuavizadoRef.current = null
    if (modeloGrupoRef.current) {
      escena.remove(modeloGrupoRef.current)
      disposeObjeto(modeloGrupoRef.current)
      modeloGrupoRef.current = null
    }
    if (!url) return

    let cancelado = false
    const loader = new GLTFLoader()
    loader.load(
      url,
      (gltf) => {
        if (cancelado) return
        const modelo = gltf.scene
        const caja = new THREE.Box3().setFromObject(modelo)
        const centro = caja.getCenter(new THREE.Vector3())
        const tamano = caja.getSize(new THREE.Vector3())
        // Centra el modelo en X/Z y sube su "cuello" (borde superior) al origen
        // del grupo: cada frame solo hace falta mover/escalar/girar el grupo.
        modelo.position.set(-centro.x, -caja.max.y, -centro.z)

        const grupo = new THREE.Group()
        grupo.add(modelo)
        grupo.visible = false
        escena.add(grupo)

        modeloGrupoRef.current = grupo
        anchoBaseModeloRef.current = Math.max(tamano.x, 0.01)
        altoBaseModeloRef.current = Math.max(tamano.y, 0.01)
        modeloListoRef.current = true
      },
      undefined,
      (error) => {
        console.error('No se pudo cargar el modelo 3D del probador', error)
      },
    )

    return () => {
      cancelado = true
    }
  }, [open, variante?.modelo3dUrl])

  useEffect(() => {
    if (!open) return
    const status = statusRef.current
    if (status) status.textContent = nombrePrendaRef.current || 'Prenda'
  }, [open])

  return (
    <Modal open={open} title="Probador virtual" onClose={onCerrar} maxWidthClassName="sm:max-w-3xl">
      <div className="space-y-4">
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-black">
          {/* Efecto espejo sobre video y canvases para que la prenda acompañe el movimiento del usuario. */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas ref={canvas3dRef} className="absolute inset-0 h-full w-full" style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ transform: 'scaleX(-1)' }} />
          <div
            ref={statusRef}
            className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white"
            aria-live="polite"
          >
            {mensaje}
          </div>
          {variante?.modelo3dUrl && (
            <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
              Modelo 3D en vivo
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <p className="text-sm">
            <span className="font-medium text-neutral-900 dark:text-white">
              {variante?.producto?.nombre ?? nombre ?? 'Prenda'}
            </span>
            <span className="ml-2 text-neutral-500 dark:text-neutral-400">
              Talla {variante?.talla ?? talla} · {variante?.color ?? color} · {variante?.corte ?? corte}
              {variante && <> · {variante.sku}</>}
            </span>
          </p>
        </div>

        {variante?.modelo3dUrl && (
          <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
            <label className="flex min-w-0 flex-1 items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
              <span className="w-16 shrink-0">Tamaño</span>
              <input
                type="range"
                min={0.4}
                max={2.5}
                step={0.05}
                value={ajusteEscala}
                onChange={(e) => setAjusteEscala(Number(e.target.value))}
                className="min-w-0 flex-1"
              />
              <span className="w-12 shrink-0 text-right tabular-nums">{ajusteEscala.toFixed(2)}×</span>
            </label>
            <label className="flex min-w-0 flex-1 items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
              <span className="w-16 shrink-0">Altura</span>
              <input
                type="range"
                min={-0.6}
                max={0.6}
                step={0.02}
                value={ajusteAltura}
                onChange={(e) => setAjusteAltura(Number(e.target.value))}
                className="min-w-0 flex-1"
              />
              <span className="w-12 shrink-0 text-right tabular-nums">{ajusteAltura.toFixed(2)}</span>
            </label>
            <Button
              type="button"
              variant="secondary"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => {
                setAjusteEscala(1)
                setAjusteAltura(0)
              }}
            >
              Restablecer
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-700 dark:text-neutral-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mostrarLandmarks}
              onChange={(e) => setMostrarLandmarks(e.target.checked)}
              className="accent-neutral-900 dark:accent-white"
            />
            Landmarks
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mostrarEsqueleto}
              onChange={(e) => setMostrarEsqueleto(e.target.checked)}
              className="accent-neutral-900 dark:accent-white"
            />
            Esqueleto
          </label>

          {estado !== 'lista' && (
            <p className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
              {estado === 'iniciando' ? 'Preparando modelo…' : 'Permite el acceso a la cámara para probarte la prenda.'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
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
    </Modal>
  )
}
