import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

/**
 * Genera los iconos de la PWA (192/512, maskable, favicon, apple-touch-icon)
 * a partir de un unico SVG fuente. Correr con: npm run pwa:icons
 */
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/pwa-icon.svg'],
})
