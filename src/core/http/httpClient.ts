import axios from 'axios'
import { env } from '@/core/config/env'
import { useAuthStore } from '@/core/store/authStore'
import type { AuthResponse } from '@/modules/acceso/types'

export const httpClient = axios.create({ baseURL: env.apiUrl })

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
    const response = await axios.post<{ data: AuthResponse }>(
      `${env.apiUrl}/acceso/auth/refresh`,
      { refreshToken },
    )
    useAuthStore.getState().setSession(response.data.data)
    return response.data.data.accessToken
  } catch {
    useAuthStore.getState().clear()
    return null
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
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
