import axios from 'axios'
import { env } from '@/core/config/env'
import { aplicarCambiosPendientes, encolarSiCorresponde, lecturaLocal } from '@/core/offline/colaEscrituras'
import { useEstadoOffline } from '@/core/offline/estadoOffline'
import { useAuthStore } from '@/core/store/authStore'
import { basenameTienda, slugTienda } from '@/core/tenant/tienda'
import { getApiErrorCode, isAuthError, isNetworkError } from './errors'
import type { Envelope } from './envelope'
import type { AuthResponse } from '@/modules/acceso/types'

export const httpClient = axios.create({ baseURL: env.apiUrl })

const MAX_NETWORK_RETRIES = 2
const RETRYABLE_METHODS = ['get', 'head', 'options']

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Solo reintentamos lecturas y el login: evita duplicar escrituras de negocio. */
function esReintentable(config: { method?: string; url?: string }): boolean {
  const method = (config.method ?? 'get').toLowerCase()
  if (RETRYABLE_METHODS.includes(method)) return true
  return typeof config.url === 'string' && config.url.includes('/acceso/auth/login')
}

/** La tienda de la pestana viaja en cada request: el backend la usa en las rutas publicas y la valida contra el token. */
const HEADERS_TIENDA: Record<string, string> = slugTienda ? { 'X-Empresa': slugTienda } : {}

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (slugTienda) config.headers['X-Empresa'] = slugTienda
  return config
})

/**
 * Con el plan de DOMINATR vencido el backend solo deja abierto Mi plan: el personal de la tienda va directo ahi
 * (un cliente o un visitante no; a ellos TiendaGate les dice que la tienda no esta disponible).
 */
function llevarAMiPlan(): void {
  const tipo = useAuthStore.getState().perfil?.tipoUsuario
  const destino = `${basenameTienda}/admin/plan`
  if (!slugTienda || (tipo !== 'A' && tipo !== 'E')) return
  if (!window.location.pathname.startsWith(destino)) window.location.replace(destino)
}

/** La URL con sus `params`: las reglas sin conexion filtran por ellos (sucursal, estado...). */
function urlCompleta(config: { url?: string; params?: Record<string, unknown> }): string | undefined {
  const params = Object.entries(config.params ?? {}).filter(([, valor]) => valor !== undefined && valor !== null)
  if (!config.url || params.length === 0) return config.url
  return `${config.url}${config.url.includes('?') ? '&' : '?'}${new URLSearchParams(params.map(([clave, valor]) => [clave, String(valor)])).toString()}`
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return null

  try {
    const response = await axios.post<Envelope<AuthResponse>>(
      `${env.apiUrl}/acceso/auth/refresh`,
      { refreshToken },
      { headers: HEADERS_TIENDA },
    )
    useAuthStore.getState().setSession(response.data.data)
    return response.data.data.accessToken
  } catch (error) {
    // Un corte de red no invalida la sesion; solo la rechaza el backend.
    if (isAuthError(error)) useAuthStore.getState().clear()
    return null
  }
}

httpClient.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get' && !response.config._sinCambiosPendientes) {
      response.data = aplicarCambiosPendientes(urlCompleta(response.config), response.data, useAuthStore.getState().perfil?.id ?? null)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    const idUsuario = useAuthStore.getState().perfil?.id ?? null
    if (originalRequest?.method === 'get' && (isNetworkError(error) || /\/-\d+(\/|$|\?)/.test(originalRequest.url ?? ''))) {
      const local = lecturaLocal(urlCompleta(originalRequest), idUsuario)
      if (local !== undefined) return { data: local, status: 200, statusText: 'Local', headers: {}, config: originalRequest }
    }

    if (isNetworkError(error) && originalRequest) {
      const encolada = await encolarSiCorresponde(originalRequest, idUsuario)
      if (encolada) return encolada
      if (originalRequest.method === 'get' && (originalRequest._retryCount ?? 0) >= MAX_NETWORK_RETRIES) useEstadoOffline.getState().marcarSinCopia(window.location.pathname)
    }

    // Backend reiniciando: no hubo respuesta. Reintentamos con backoff.
    if (isNetworkError(error) && originalRequest && esReintentable(originalRequest)) {
      originalRequest._retryCount = originalRequest._retryCount ?? 0
      if (originalRequest._retryCount < MAX_NETWORK_RETRIES) {
        originalRequest._retryCount += 1
        await delay(300 * 2 ** (originalRequest._retryCount - 1))
        return httpClient(originalRequest)
      }
    }

    if (error.response?.status === 402 && getApiErrorCode(error) === 'PLAN_VENCIDO') llevarAMiPlan()

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return httpClient(originalRequest)
      }
    }
    return Promise.reject(error)
  },
)
