import type { InternalAxiosRequestConfig } from 'axios'
import type { ApiError, Rol, Usuario, UsuarioInput } from '@/types/api'
import { makeResponse, parseBody, reject } from './mockHelpers'
import { mockUsers, type MockUser } from './mockUsers'

/**
 * MOCK de usuarios (ABM de choferes). Reusa el array mockUsers
 * para que el login reconozca a los choferes recién creados.
 * Borrá este archivo cuando conectes el backend real.
 */

function toUsuario(u: MockUser): Usuario {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    telefono: u.telefono,
    activo: u.activo !== false,
  }
}

export function matchesUsuarios(url: string): boolean {
  return url.includes('/auth/usuarios')
}

export async function handleUsuarios(
  config: InternalAxiosRequestConfig,
  url: string,
  method: string,
) {
  // PATCH /auth/usuarios/{id}/desactivar
  const desMatch = url.match(/\/auth\/usuarios\/([^/]+)\/desactivar$/)
  if (desMatch && method === 'patch') {
    const u = mockUsers.find((x) => x.id === desMatch[1])
    if (!u) return reject<ApiError>(config, 404, { detail: 'Usuario no encontrado' })
    if (u.activo === false) {
      return reject<ApiError>(config, 400, { detail: 'El usuario ya está inactivo' })
    }
    u.activo = false
    return makeResponse(config, 200, toUsuario(u))
  }

  // GET /auth/usuarios  |  POST /auth/usuarios
  if (url.endsWith('/auth/usuarios')) {
    if (method === 'get') {
      const rol = config.params?.rol as Rol | undefined
      let list = mockUsers.slice()
      if (rol) list = list.filter((u) => u.rol === rol)
      return makeResponse(config, 200, list.map(toUsuario))
    }

    if (method === 'post') {
      const body = parseBody<UsuarioInput>(config)
      if (!body.nombre?.trim() || !body.email?.trim() || (body.password ?? '').length < 8) {
        return reject<ApiError>(config, 422, {
          detail: 'Datos inválidos: revisá nombre, email y contraseña (mín. 8 caracteres)',
        })
      }
      if (mockUsers.some((u) => u.email === body.email.trim())) {
        return reject<ApiError>(config, 400, {
          detail: 'Ya existe un usuario con ese email',
        })
      }
      const nuevo: MockUser = {
        id: `u-${body.rol}-${Date.now()}`,
        nombre: body.nombre.trim(),
        email: body.email.trim(),
        password: body.password,
        rol: body.rol,
        telefono: body.telefono?.trim() || undefined,
        activo: true,
      }
      mockUsers.push(nuevo)
      return makeResponse(config, 201, toUsuario(nuevo))
    }
  }

  return reject<ApiError>(config, 404, {
    detail: `[MOCK] Endpoint de usuarios no implementado: ${method.toUpperCase()} ${url}`,
  })
}
