import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { disposeObjeto } from './three-utils'

interface Modelo3DViewProps {
  /** URL del modelo glTF/GLB (autocontenido) a renderizar. */
  url: string
  className?: string
  autoRotate?: boolean
  ariaLabel?: string
}

/**
 * Visor 3D para los modelos de prendas exportados desde Blender (.glb). Centra
 * el modelo en camara, lo encuadra automaticamente y deja rotarlo con el
 * raton (y auto-rotar cuando se pide). No tiene dependencias de estado: el
 * ciclo de vida de la escena vive 100% dentro de un efecto.
 */
export function Modelo3DView({ url, className = '', autoRotate = true, ariaLabel = 'Modelo 3D de la prenda' }: Modelo3DViewProps) {
  const contenedorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return

    const ancho = contenedor.clientWidth || 1
    const alto = contenedor.clientHeight || 1

    const escena = new THREE.Scene()
    escena.background = new THREE.Color('#e7e5e4')

    const camara = new THREE.PerspectiveCamera(45, ancho / alto, 0.1, 1000)
    camara.position.set(0, 1.2, 2.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(ancho, alto)
    renderer.domElement.style.display = 'block'
    contenedor.appendChild(renderer.domElement)

    const control = new OrbitControls(camara, renderer.domElement)
    control.enableDamping = true
    control.dampingFactor = 0.08
    control.autoRotate = autoRotate
    control.autoRotateSpeed = 3
    control.enablePan = false
    control.minDistance = 0.4
    control.maxDistance = 10

    escena.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2))
    const principal = new THREE.DirectionalLight(0xffffff, 1.6)
    principal.position.set(1.5, 3, 2)
    escena.add(principal)
    const relleno = new THREE.DirectionalLight(0xffffff, 0.6)
    relleno.position.set(-1.5, 1, -2)
    escena.add(relleno)

    // Suelo sutil para dar contexto a la rotacion.
    const suelo = new THREE.GridHelper(2, 10, 0xa8a29e, 0xd6d3d1)
    suelo.position.y = -0.001
    escena.add(suelo)

    let modelo: THREE.Object3D | null = null
    let raf = 0
    let abierto = true

    const loader = new GLTFLoader()
    loader.load(
      url,
      (gltf) => {
        if (!abierto) return
        modelo = gltf.scene
        const caja = new THREE.Box3().setFromObject(modelo)
        const centro = caja.getCenter(new THREE.Vector3())
        const tamano = caja.getSize(new THREE.Vector3())
        const radio = Math.max(tamano.x, tamano.y, tamano.z) || 1
        camara.position.set(centro.x + radio * 0.8, centro.y + radio * 0.9, centro.z + radio * 2)
        control.target.copy(centro)
        escena.add(modelo)
      },
      undefined,
      (error) => {
        console.error('No se pudo cargar el modelo 3D', error)
      },
    )

    const observar = new ResizeObserver(() => {
      const w = contenedor.clientWidth || 1
      const h = contenedor.clientHeight || 1
      camara.aspect = w / h
      camara.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    observar.observe(contenedor)

    const bucle = () => {
      if (!abierto) return
      control.update()
      renderer.render(escena, camara)
      raf = requestAnimationFrame(bucle)
    }
    raf = requestAnimationFrame(bucle)

    return () => {
      abierto = false
      cancelAnimationFrame(raf)
      observar.disconnect()
      control.dispose()
      if (modelo) {
        escena.remove(modelo)
        disposeObjeto(modelo)
      }
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [url, autoRotate])

  return <div ref={contenedorRef} className={className} role="img" aria-label={ariaLabel} />
}