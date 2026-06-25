import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

/** Latencia simulada para que el mock se sienta como un backend real. */
export const FAKE_LATENCY_MS = 400

export function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_LATENCY_MS))
}

export function makeResponse<T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T,
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: {},
    config,
  }
}

/** Rechaza con el shape que Axios espera (error.response). */
export function reject<T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T,
): Promise<never> {
  return new Promise((_, rej) =>
    setTimeout(
      () => rej({ response: makeResponse(config, status, data) }),
      FAKE_LATENCY_MS,
    ),
  )
}

export function parseBody<T>(config: InternalAxiosRequestConfig): T {
  if (typeof config.data === 'string') {
    return JSON.parse(config.data) as T
  }
  return (config.data ?? {}) as T
}

export function getBearer(config: InternalAxiosRequestConfig): string | null {
  const auth = config.headers?.Authorization
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  return null
}

/** ID pseudo-único para entidades creadas en el mock. */
export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}