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
// Solo el 401 es "sesión vencida/inválida". El 403 (p. ej. ruta ajena) es "sin permiso":
// no se toca la sesión y el mensaje del backend llega al componente que lo muestra.
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

/**
 * Extrae el mensaje de error del formato { error, mensaje, detalle? } del backend.
 * `mensaje` ya viene en español y es apto para mostrar. Se acepta `detail` solo por el mock.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const data = error.response?.data
    return data?.mensaje ?? data?.detail ?? error.message ?? fallback
  }
  return fallback
}

/** Código corto de error (`datos_invalidos`, `http_error`, ...) para lógica condicional. */
export function getApiErrorCode(error: unknown): string | undefined {
  return axios.isAxiosError<ApiError>(error) ? error.response?.data?.error : undefined
}

/** Errores por campo de un 422: { campo: mensaje }. Vacío si no es un 422 con `detalle`. */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<ApiError>(error)) return {}
  const detalle = error.response?.data?.detalle ?? []
  return Object.fromEntries(detalle.map((d) => [d.campo, d.mensaje]))
}