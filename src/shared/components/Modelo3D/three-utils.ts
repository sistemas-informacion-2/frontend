import * as THREE from 'three'

/** Libera geometrías y materiales de un objeto three.js (y sus hijos) antes de sacarlo de la escena. */
export function disposeObjeto(raiz: THREE.Object3D): void {
  raiz.traverse((objeto) => {
    if (objeto instanceof THREE.Mesh) {
      objeto.geometry?.dispose()
      const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material]
      for (const material of materiales) disposeMaterial(material)
    }
  })
}

function disposeMaterial(material: THREE.Material | undefined): void {
  if (!material) return
  for (const valor of Object.values(material)) {
    if (valor && typeof (valor as { dispose?: () => void }).dispose === 'function') {
      ;(valor as { dispose: () => void }).dispose()
    }
  }
  material.dispose()
}
