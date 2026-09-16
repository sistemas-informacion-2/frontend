import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
