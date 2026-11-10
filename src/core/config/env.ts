export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  /** Nombre de respaldo mientras carga el de la tienda (cada tienda muestra el suyo, ver useNombreTienda). */
  appName: import.meta.env.VITE_APP_NAME ?? 'Tienda',
  /** API key de https://platform.decart.ai para el probador con IA. Queda embebida en el bundle. */
  decartApiKey: import.meta.env.VITE_DECART_API_KEY?.trim() ?? '',
}
