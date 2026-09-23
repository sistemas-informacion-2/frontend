import axios from 'axios'
import { env } from '@/core/config/env'
import { useAuthStore } from '@/core/store/authStore'
import { isAuthError, isNetworkError } from './errors'
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

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return null

  try {
    const response = await axios.post<Envelope<AuthResponse>>(
      `${env.apiUrl}/acceso/auth/refresh`,
      { refreshToken },
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Backend reiniciando: no hubo respuesta. Reintentamos con backoff.
    if (isNetworkError(error) && originalRequest && esReintentable(originalRequest)) {
      originalRequest._retryCount = originalRequest._retryCount ?? 0
      if (originalRequest._retryCount < MAX_NETWORK_RETRIES) {
        originalRequest._retryCount += 1
        await delay(300 * 2 ** (originalRequest._retryCount - 1))
        return httpClient(originalRequest)
      }
    }

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
