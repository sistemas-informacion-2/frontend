import * as THREE from 'three'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { ZonaProbador } from '../types'

/** Índices de landmarks de MediaPipe Pose (33 puntos) que usa el anclaje del modelo 3D. */
const L = { LS: 11, RS: 12, LH: 23, RH: 24 }

const INDICES_TORSO_SUPERIOR = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
const INDICES_TORSO_INFERIOR = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32]

/**
 * Qué landmarks de pose mostrar en el overlay de debug (los checkbox
 * "Landmarks"/"Esqueleto") según la zona de la prenda: una falda no necesita
 * ver los puntos de hombros/brazos, y viceversa. COMPLETO muestra ambos
 * (sin la cara: índices 0-10, que no aportan nada acá).
 */
export const INDICES_DEBUG_POR_ZONA: Record<ZonaProbador, number[]> = {
  SUPERIOR: INDICES_TORSO_SUPERIOR,
  INFERIOR: INDICES_TORSO_INFERIOR,
  COMPLETO: [...INDICES_TORSO_SUPERIOR, ...INDICES_TORSO_INFERIOR],
}

/**
 * Probador virtual en AR (CU19): en vez de dibujar una silueta plana, se
 * superpone el modelo 3D real (.glb) sobre el video siguiendo el cuerpo. No
 * hay sensor de profundidad real, así que se asume una profundidad fija
 * delante de la cámara virtual y se proyectan ahí los landmarks de
 * referencia. Cuando el usuario se acerca, sus landmarks se separan más en
 * píxeles → el ángulo entre esos rayos crece → el punto proyectado a esa
 * profundidad fija también se separa más → el modelo se ve más grande. Esa es
 * toda la "escala por distancia": no hace falta estimar la distancia real.
 *
 * Qué landmarks se usan como referencia depende de la zona del cuerpo que
 * declara la categoría del producto (`Categoria.zonaProbador`, backend): una
 * polera no se ancla igual que una falda. Ver `calcularTransformPrenda`.
 */

/** Profundidad (unidades three.js) a la que se asume el torso del usuario. Puramente visual: ajusta a ojo con tu cámara. */
const PROFUNDIDAD_TORSO = 2.2
/** Cuánto más ancho que la distancia hombro-a-hombro/cadera-a-cadera se dibuja la prenda, para que "abrace" el cuerpo. */
const FACTOR_ANCHO_PRENDA = 1.3
/** Cuánto baja el centro de una prenda SUPERIOR desde la línea de hombros (fracción del ancho de hombros), para que el cuello caiga bien. */
const FACTOR_CAIDA_CUELLO = 0.16
/** Cuánto sube el centro de una prenda INFERIOR desde la línea de cadera (fracción del ancho de cadera), para que la cintura quede a la altura correcta. */
const FACTOR_SUBIDA_CINTURA = 0.12
/** Límite del giro estimado (yaw) para que un landmark ruidoso no haga girar el modelo de golpe. */
const LIMITE_YAW_RAD = 0.7

/**
 * Cada modelo .blend está modelado a su manera (mangas más o menos abiertas,
 * cuello más o menos alto...), así que ningún factor fijo le va a quedar bien
 * a todos. `ajuste` son los controles que el probador expone para compensar
 * eso a ojo, sin tocar el .blend: 1/0 es "sin ajuste" (el cálculo automático
 * de arriba, tal cual).
 */
export interface AjusteCalibracion {
  /** Multiplica el ancho/alto calculado (1 = tal cual, 1.2 = 20% más grande). */
  escala: number
  /** Fracción del ancho de referencia que se suma a la altura (positivo = sube el modelo). */
  alturaDelta: number
}

export const AJUSTE_NEUTRO: AjusteCalibracion = { escala: 1, alturaDelta: 0 }

export interface TransformPrenda {
  posicion: THREE.Vector3
  /** Ancho deseado del modelo en unidades three.js (mismo eje que `anchoBaseModelo` al escalar). */
  anchoHombros: number
  /** Solo para zona COMPLETO: alto deseado (hombros→cadera) en unidades three.js, para escalar sin distorsionar el ancho. */
  altoTorso: number | null
  rotacionY: number
  rotacionZ: number
}

/** Punto normalizado de video (0..1, sin espejar) -> punto 3D a una profundidad fija delante de la cámara. */
function puntoAMundo(camara: THREE.PerspectiveCamera, x: number, y: number, profundidad: number): THREE.Vector3 {
  const ndcX = x * 2 - 1
  const ndcY = -(y * 2 - 1)
  const enFrustum = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camara)
  const direccion = enFrustum.sub(camara.position).normalize()
  return camara.position.clone().add(direccion.multiplyScalar(profundidad))
}

/** Landmarks de MediaPipe que hacen de "hombros" o "cadera" según la zona, para no repetir la lógica de roll/yaw. */
function parReferencia(zona: ZonaProbador): { izq: number; der: number } {
  return zona === 'INFERIOR' ? { izq: L.LH, der: L.RH } : { izq: L.LS, der: L.RS }
}

/**
 * A partir de los landmarks de pose (33 puntos de MediaPipe) y la zona del
 * cuerpo de la prenda, calcula dónde, de qué tamaño y con qué giro debe verse
 * el modelo 3D. Devuelve null si los landmarks de referencia no son visibles.
 */
export function calcularTransformPrenda(
  camara: THREE.PerspectiveCamera,
  lm: NormalizedLandmark[],
  zona: ZonaProbador,
  ajuste: AjusteCalibracion = AJUSTE_NEUTRO,
): TransformPrenda | null {
  const { izq, der } = parReferencia(zona)
  const a = lm[izq]
  const b = lm[der]
  if (!a || !b) return null

  const puntoA = puntoAMundo(camara, a.x, a.y, PROFUNDIDAD_TORSO)
  const puntoB = puntoAMundo(camara, b.x, b.y, PROFUNDIDAD_TORSO)
  const ancho = puntoA.distanceTo(puntoB)

  const posicion = puntoA.clone().add(puntoB).multiplyScalar(0.5)
  let altoTorso: number | null = null

  if (zona === 'INFERIOR') {
    posicion.y += ancho * FACTOR_SUBIDA_CINTURA
  } else if (zona === 'COMPLETO') {
    // Ancla igual que SUPERIOR (hombros) pero además mide hasta la cadera para
    // poder estirar el modelo sin ensancharlo de más.
    posicion.y -= ancho * FACTOR_CAIDA_CUELLO
    const cadera = lm[L.LH] && lm[L.RH] ? puntoAMundo(camara, (lm[L.LH].x + lm[L.RH].x) / 2, (lm[L.LH].y + lm[L.RH].y) / 2, PROFUNDIDAD_TORSO) : null
    if (cadera) altoTorso = posicion.distanceTo(cadera)
  } else {
    posicion.y -= ancho * FACTOR_CAIDA_CUELLO
  }

  posicion.y += ancho * ajuste.alturaDelta

  // Roll: inclinación de la línea de referencia en la imagen. Con hombros/cadera
  // nivelados, puntoA (landmark izquierdo) y puntoB (derecho) quedan casi a la
  // misma altura (dy≈0) con puntoA.x > puntoB.x, así que atan2 da ≈0: sin este
  // caso base en 0, cualquier offset fijo (p. ej. restar π) gira el modelo
  // 180° todo el tiempo, y una prenda colgada "boca abajo" es justo lo que se
  // ve como "al revés".
  const rotacionZ = Math.atan2(puntoA.y - puntoB.y, puntoA.x - puntoB.x)

  // Yaw: MediaPipe reporta `z` relativo por landmark (más negativo = más cerca de la cámara).
  // Si un lado está más cerca que el otro, el cuerpo está girado hacia ese lado.
  const dz = (b.z ?? 0) - (a.z ?? 0)
  const dx = Math.hypot(a.x - b.x, a.y - b.y) || 1
  const rotacionY = clamp(Math.atan2(dz, dx), -LIMITE_YAW_RAD, LIMITE_YAW_RAD)

  return {
    posicion,
    anchoHombros: ancho * FACTOR_ANCHO_PRENDA * ajuste.escala,
    altoTorso: altoTorso !== null ? altoTorso * ajuste.escala : null,
    rotacionY,
    rotacionZ,
  }
}

/** Visibilidad mínima que necesita cada zona para poder anclar el modelo. */
export function referenciaVisible(lm: NormalizedLandmark[], zona: ZonaProbador): boolean {
  const { izq, der } = parReferencia(zona)
  return (lm[izq]?.visibility ?? 0) > 0.5 && (lm[der]?.visibility ?? 0) > 0.5
}

function clamp(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valor))
}
