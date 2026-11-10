export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  appName: import.meta.env.VITE_APP_NAME ?? 'FashionStore',
  /** API key de https://platform.decart.ai para el probador con IA. Queda embebida en el bundle. */
  decartApiKey: import.meta.env.VITE_DECART_API_KEY?.trim() ?? '',
}
