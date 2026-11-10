import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Service Worker propio (src/sw.ts): RF-SYNC-01 necesita una cola de Background Sync con logica propia
      // (renovar el token, interpretar el 409 de stock, avisar a la pagina), algo que generateSW no permite.
      // Las reglas de cacheo que antes estaban aqui (workbox.runtimeCaching) ahora viven en sw.ts.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // El SW se reemplaza solo en segundo plano; el usuario nunca ve un prompt
      // de "nueva version disponible" que tenga que aceptar a mano.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'pwa-icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        // Un solo manifest para todo el sitio (portal y tiendas). Un manifest propio por tienda queda pendiente.
        name: 'DOMINATR',
        short_name: 'DOMINATR',
        description: 'Tienda en línea, mostrador, inventario y reportes para comercios de ropa.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#09090b',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // App shell precacheado en el build (se inyecta en self.__WB_MANIFEST de sw.ts).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      devOptions: {
        // Permite probar el SW con "npm run dev" sin tener que hacer build cada vez.
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // Vite no lee CHOKIDAR_USEPOLLING por si solo. En contenedores con
      // bind mount desde Windows el sondeo es la unica forma de detectar
      // cambios; fuera de Docker se queda desactivado.
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
    },
  },
})
