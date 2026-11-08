import { httpClient } from '@/core/http/httpClient'
import { useAuthStore } from '@/core/store/authStore'

const BASE = '/electronico/notificaciones/web-push'
const ESPERA_MS = 20_000

interface Envelope<T> {
  data: T
}

export function webPushSoportado(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function obtenerConfiguracion(): Promise<{ habilitado: boolean; clavePublica: string | null }> {
  const response = await httpClient.get<Envelope<{ habilitado: boolean; clavePublica: string | null }>>(`${BASE}/configuracion`)
  return response.data.data
}

function claveABytes(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const binario = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0))
}

/** Algunos navegadores nunca responden al suscribirse (por ejemplo, si bloquean el servicio push). */
function conLimite<T>(operacion: Promise<T>): Promise<T> {
  const limite = new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('Este navegador no respondió. Intenta de nuevo o usa otro navegador.')), ESPERA_MS))
  return Promise.race([operacion, limite])
}

export async function suscripcionActual(): Promise<PushSubscription | null> {
  if (!webPushSoportado()) return null
  const registro = await navigator.serviceWorker.getRegistration()
  return (await registro?.pushManager.getSubscription()) ?? null
}

// toJSON() tambien trae expirationTime, que el backend rechaza por no ser parte del contrato.
function guardarEnServidor(suscripcion: PushSubscription) {
  const { endpoint, keys } = suscripcion.toJSON()
  return httpClient.post(`${BASE}/suscripciones`, { endpoint, keys })
}

/** Pide permiso, suscribe este navegador y lo vincula a la cuenta. Debe llamarse desde un clic del usuario. */
export async function activarWebPush(clavePublica: string): Promise<void> {
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('No diste permiso para mostrar notificaciones.')
  const registro = await conLimite(navigator.serviceWorker.ready)
  const suscripcion = (await registro.pushManager.getSubscription()) ?? (await conLimite(registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveABytes(clavePublica) })))
  await guardarEnServidor(suscripcion)
}

/** Deja de recibir avisos en este navegador. */
export async function desactivarWebPush(): Promise<void> {
  const suscripcion = await suscripcionActual()
  if (!suscripcion) return
  await httpClient.delete(`${BASE}/suscripciones`, { data: { endpoint: suscripcion.endpoint } })
  await suscripcion.unsubscribe()
}

export async function enviarPruebaWebPush(): Promise<number> {
  const response = await httpClient.post<Envelope<{ enviados: number }>>(`${BASE}/prueba`)
  return response.data.data.enviados
}

/** Al cerrar sesion: en una computadora compartida no deben llegar los avisos de esta cuenta. */
export async function desvincularWebPush(): Promise<void> {
  const suscripcion = await suscripcionActual()
  if (suscripcion) await httpClient.delete(`${BASE}/suscripciones`, { data: { endpoint: suscripcion.endpoint } })
}

async function vincularDispositivo(): Promise<void> {
  if (!webPushSoportado() || Notification.permission !== 'granted') return
  const suscripcion = await suscripcionActual()
  if (suscripcion) await guardarEnServidor(suscripcion)
}

/** Se llama una vez al arrancar la app: si este navegador ya tenia avisos activos, los vincula a la cuenta que entra. */
export function iniciarVinculoWebPush(): void {
  if (useAuthStore.getState().accessToken) void vincularDispositivo().catch(() => undefined)
  let anterior = useAuthStore.getState().accessToken
  useAuthStore.subscribe((estado) => {
    const recienIniciada = anterior === null && estado.accessToken !== null
    anterior = estado.accessToken
    if (recienIniciada) void vincularDispositivo().catch(() => undefined)
  })
}
