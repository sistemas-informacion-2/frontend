import { cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const origen = join(raiz, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const destino = join(raiz, 'public', 'mediapipe', 'wasm');

if (!existsSync(origen)) {
  console.warn('[mediapipe] no se encontro node_modules/@mediapipe/tasks-vision/wasm; se omite la copia');
  process.exit(0);
}

cpSync(origen, destino, { recursive: true });
console.log(`[mediapipe] assets copiados de ${origen} a ${destino}`);