import type { InternalAxiosRequestConfig } from 'axios'
import type {
  ApiError,
  Cliente,
  ClienteInput,
  ClientesListResponse,
} from '@/types/api'
import { makeResponse, parseBody, reject, uid } from './mockHelpers'

/**
 * "Base de datos" en memoria de clientes (mock).
 * Borrá este archivo cuando conectes el backend real.
 */
const clientes: Cliente[] = [
  {
    id: 'cli-001',
    nombre: 'Juan García',
    telefono_whatsapp: '+5491155556666',
    direcciones: [
      { id: 'dir-001', descripcion: 'Av. Corrientes 1234, CABA', es_principal: true },
      { id: 'dir-002', descripcion: 'Lavalle 850, CABA', referencia: 'Piso 3 B', es_principal: false },
    ],
    cuit: '20-12345678-9',
    notas: 'Prefiere entregas por la mañana.',
    total_entregas: 12,
    activo: true,
  },
  {
    id: 'cli-002',
    nombre: 'Distribuidora El Sol SRL',
    telefono_whatsapp: '+5491144443333',
    direcciones: [
      { id: 'dir-003', descripcion: 'Av. San Martín 4500, San Martín', es_principal: true },
    ],
    cuit: '30-71122334-5',
    total_entregas: 47,
    activo: true,
  },
  {
    id: 'cli-003',
    nombre: 'María López',
    telefono_whatsapp: '+5491166667777',
    direcciones: [
      { id: 'dir-004', descripcion: 'Belgrano 230, Vicente López', es_principal: true },
    ],
    total_entregas: 3,
    activo: true,
  },
]

function normalizarDirecciones(input: ClienteInput): Cliente['direcciones'] {
  return input.direcciones.map((d) => ({
    ...d,
    id: d.id ?? uid('dir'),
  }))
}

/** Busca un cliente por id (lo usa el mock de entregas para denormalizar). */
export function findClienteMock(id: string): Cliente | undefined {
  return clientes.find((c) => c.id === id)
}

/** Devuelve true si la URL corresponde a este handler. */
export function matchesClientes(url: string): boolean {
  return url.includes('/clientes')
}

export async function handleClientes(
  config: InternalAxiosRequestConfig,
  url: string,
  method: string,
) {
  // PATCH /clientes/{id}/baja
  const bajaMatch = url.match(/\/clientes\/([^/]+)\/baja$/)
  if (bajaMatch && method === 'patch') {
    const cliente = clientes.find((c) => c.id === bajaMatch[1])
    if (!cliente) {
      return reject<ApiError>(config, 404, { detail: 'Cliente no encontrado' })
    }
    cliente.activo = false
    return makeResponse(config, 200, cliente)
  }

  // GET /clientes/{id}  |  PUT /clientes/{id}
  const idMatch = url.match(/\/clientes\/([^/]+)$/)
  if (idMatch) {
    const id = idMatch[1]
    const index = clientes.findIndex((c) => c.id === id)
    if (index === -1) {
      return reject<ApiError>(config, 404, { detail: 'Cliente no encontrado' })
    }

    if (method === 'get') {
      return makeResponse(config, 200, clientes[index])
    }

    if (method === 'put') {
      const body = parseBody<ClienteInput>(config)
      const actualizado: Cliente = {
        ...clientes[index],
        nombre: body.nombre,
        telefono_whatsapp: body.telefono_whatsapp,
        direcciones: normalizarDirecciones(body),
        cuit: body.cuit,
        notas: body.notas,
      }
      clientes[index] = actualizado
      return makeResponse(config, 200, actualizado)
    }
  }

  // GET /clientes  |  POST /clientes
  if (url.endsWith('/clientes')) {
    if (method === 'get') {
      const search = (config.params?.search ?? '').toString().toLowerCase()
      const pagina = Number(config.params?.pagina ?? 1)
      const porPagina = Number(config.params?.por_pagina ?? 20)

      const activos = clientes.filter((c) => c.activo)
      const filtrados = search
        ? activos.filter(
            (c) =>
              c.nombre.toLowerCase().includes(search) ||
              c.direcciones.some((d) => d.descripcion.toLowerCase().includes(search)),
          )
        : activos

      const inicio = (pagina - 1) * porPagina
      const pageItems = filtrados.slice(inicio, inicio + porPagina)

      const payload: ClientesListResponse = {
        total: filtrados.length,
        pagina,
        por_pagina: porPagina,
        clientes: pageItems,
      }
      return makeResponse(config, 200, payload)
    }

    if (method === 'post') {
      const body = parseBody<ClienteInput>(config)
      const nuevo: Cliente = {
        id: uid('cli'),
        nombre: body.nombre,
        telefono_whatsapp: body.telefono_whatsapp,
        direcciones: normalizarDirecciones(body),
        cuit: body.cuit,
        notas: body.notas,
        total_entregas: 0,
        activo: true,
      }
      clientes.unshift(nuevo)
      return makeResponse(config, 201, nuevo)
    }
  }

  return reject<ApiError>(config, 404, {
    detail: `[MOCK] Endpoint de clientes no implementado: ${method.toUpperCase()} ${url}`,
  })
}