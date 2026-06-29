import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import type {
  LoginRequest,
  LoginResponse,
  CurrentUser,
  ApiError,
  SetupRequest,
  SetupResponse,
} from '@/types/api'
import { mockUsers, type MockUser } from './mockUsers'
import { delay, getBearer, makeResponse, parseBody, reject } from './mockHelpers'
import { handleClientes, matchesClientes } from './mockClientes'
import { handleEntregas, matchesEntregas } from './mockEntregas'
import { handleUsuarios, matchesUsuarios } from './mockUsuarios'
import { handleRutas, matchesRutas } from './mockRutas'

/**
 * ============================================================
 * MOCK ADAPTER — backend simulado para desarrollo sin API.
 *
 * Cómo quitarlo cuando tengas el backend real:
 *   1. Poné VITE_USE_MOCK=false en .env.development (o borralo).
 *   2. (Opcional) borrá la carpeta src/mocks/ completa.
 *   3. Quitá el bloque "if (env.useMock)" de src/lib/apiClient.ts.
 *
 * No requiere tocar ningún componente ni hook: estos siguen
 * llamando a apiClient como si el backend fuera real.
 * ============================================================
 */

// "Base de datos" en memoria de tokens emitidos -> usuario.
const tokenStore = new Map<string, CurrentUser>()

/**
 * POST /auth/setup — crea el PRIMER administrador.
 * Mientras existan usuarios (los semilla de mockUsers), responde 403.
 * Para probar el camino feliz: comentá los usuarios semilla en mockUsers.ts.
 */
function handleSetup(config: InternalAxiosRequestConfig, url: string, method: string) {
  if (!url.endsWith('/auth/setup') || method !== 'post') return null

  if (mockUsers.length > 0) {
    return reject<ApiError>(config, 403, {
      detail: 'El sistema ya fue configurado',
    })
  }

  const body = parseBody<SetupRequest>(config)
  if (body.rol !== 'admin') {
    return reject<ApiError>(config, 400, {
      detail: 'El primer usuario debe tener rol admin',
    })
  }
  if (!body.nombre?.trim() || !body.email?.trim() || (body.password ?? '').length < 8) {
    return reject<ApiError>(config, 422, {
      detail: 'Datos inválidos: revisá nombre, email y contraseña (mín. 8 caracteres)',
    })
  }

  const nuevo: MockUser = {
    id: `u-admin-${Date.now()}`,
    nombre: body.nombre.trim(),
    email: body.email.trim(),
    password: body.password,
    rol: 'admin',
  }
  mockUsers.push(nuevo)

  const payload: SetupResponse = {
    id: nuevo.id,
    nombre: nuevo.nombre,
    email: nuevo.email,
    rol: 'admin',
    activo: true,
  }
  return delay(makeResponse(config, 201, payload))
}

function handleAuth(config: InternalAxiosRequestConfig, url: string, method: string) {
  // POST /auth/login
  if (url.endsWith('/auth/login') && method === 'post') {
    const body = parseBody<LoginRequest>(config)
    const user = mockUsers.find(
      (u) =>
        u.email === body.email &&
        u.password === body.password &&
        u.rol === body.rol &&
        u.activo !== false,
    )

    if (!user) {
      return reject<ApiError>(config, 401, {
        detail: 'Email, contraseña o rol incorrectos',
      })
    }

    const token = `mock-token-${user.id}-${Date.now()}`
    const currentUser: CurrentUser = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    }
    tokenStore.set(token, currentUser)

    const payload: LoginResponse = {
      access_token: token,
      token_type: 'bearer',
      rol: user.rol,
      nombre: user.nombre,
    }
    return delay(makeResponse(config, 200, payload))
  }

  // GET /auth/me
  if (url.endsWith('/auth/me') && method === 'get') {
    const token = getBearer(config)
    const user = token ? tokenStore.get(token) : null
    if (!user) {
      return reject<ApiError>(config, 401, { detail: 'No autenticado' })
    }
    return delay(makeResponse(config, 200, user))
  }

  // POST /auth/logout
  if (url.endsWith('/auth/logout') && method === 'post') {
    const token = getBearer(config)
    if (token) tokenStore.delete(token)
    return delay(makeResponse(config, 204, null))
  }

  return null
}

/** Adapter de Axios que resuelve manualmente los endpoints mockeados. */
export const mockAdapter: AxiosAdapter = async (config) => {
  const url = config.url ?? ''
  const method = (config.method ?? 'get').toLowerCase()

  const setupResult = handleSetup(config, url, method)
  if (setupResult) return setupResult

  const authResult = handleAuth(config, url, method)
  if (authResult) return authResult

  if (matchesUsuarios(url)) {
    return handleUsuarios(config, url, method)
  }

  if (matchesClientes(url)) {
    return handleClientes(config, url, method)
  }

  if (matchesEntregas(url)) {
    return handleEntregas(config, url, method)
  }

  if (matchesRutas(url)) {
    return handleRutas(config, url, method)
  }

  // Cualquier otro endpoint aún no mockeado.
  return reject<ApiError>(config, 404, {
    detail: `[MOCK] Endpoint no implementado: ${method.toUpperCase()} ${url}`,
  })
}
