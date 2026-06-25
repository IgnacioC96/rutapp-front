import axios, { AxiosError } from 'axios'
import { env } from '@/config/env'
import { useAuthStore } from '@/store/authStore'
import type { ApiError } from '@/types/api'

/**
 * Cliente HTTP central. Toda comunicación con el backend pasa por acá.
 * - Inyecta el JWT en cada request.
 * - Ante un 401 (token inválido/expirado) limpia la sesión y manda al login.
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
})

// MOCK: si está activo, intercepta todas las llamadas con un backend simulado.
// Para quitarlo: poné VITE_USE_MOCK=false (o borrá este bloque y la carpeta src/mocks/).
if (env.useMock) {
  const { mockAdapter } = await import('@/mocks/mockAdapter')
  apiClient.defaults.adapter = mockAdapter
  console.info('[rutapp] Modo MOCK activo — sin backend real.')
}

// Request: agrega el header Authorization si hay token.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response: maneja el 401 de forma global.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession()
      // Evita loop si ya estamos en el login.
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

/** Extrae el mensaje de error del formato estándar { detail: "..." }. */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data?.detail ?? error.message ?? fallback
  }
  return fallback
}