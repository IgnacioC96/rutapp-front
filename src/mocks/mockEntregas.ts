import type { InternalAxiosRequestConfig } from 'axios'
import type {
  ApiError,
  Entrega,
  EntregaInput,
  EntregasListResponse,
  EstadoEntrega,
} from '@/types/api'
import { makeResponse, parseBody, reject, uid } from './mockHelpers'
import { findClienteMock } from './mockClientes'

/**
 * "Base de datos" en memoria de entregas (mock).
 * Borrá este archivo cuando conectes el backend real.
 */
const entregas: Entrega[] = [
  {
    id: 'ent-001',
    cliente_id: 'cli-001',
    cliente_nombre: 'Juan García',
    direccion_id: 'dir-001',
    direccion_descripcion: 'Av. Corrientes 1234, CABA',
    descripcion: 'Caja de repuestos',
    bultos: 2,
    peso_kg: 8.5,
    fecha_estimada: '2026-06-18',
    estado: 'pendiente',
  },
  {
    id: 'ent-002',
    cliente_id: 'cli-002',
    cliente_nombre: 'Distribuidora El Sol SRL',
    direccion_id: 'dir-003',
    direccion_descripcion: 'Av. San Martín 4500, San Martín',
    descripcion: 'Pallet de bebidas',
    bultos: 1,
    peso_kg: 120,
    fecha_estimada: '2026-06-17',
    observaciones: 'Entregar por portón trasero.',
    estado: 'en_curso',
  },
  {
    id: 'ent-003',
    cliente_id: 'cli-003',
    cliente_nombre: 'María López',
    direccion_id: 'dir-004',
    direccion_descripcion: 'Belgrano 230, Vicente López',
    descripcion: 'Sobre documentación',
    bultos: 1,
    fecha_estimada: '2026-06-15',
    estado: 'completada',
  },
]

/** Completa los campos denormalizados a partir del cliente referenciado. */
function denormalizar(input: EntregaInput): Pick<Entrega, 'cliente_nombre' | 'direccion_descripcion'> {
  const cliente = findClienteMock(input.cliente_id)
  const direccion = cliente?.direcciones.find((d) => d.id === input.direccion_id)
  return {
    cliente_nombre: cliente?.nombre,
    direccion_descripcion: direccion?.descripcion,
  }
}

/** Devuelve true si la URL corresponde a este handler. */
export function matchesEntregas(url: string): boolean {
  return url.includes('/entregas')
}

/** Acceso a una entrega mock (referencia mutable) para el mock de rutas. */
export function findEntregaMock(id: string): Entrega | undefined {
  return entregas.find((e) => e.id === id)
}

export async function handleEntregas(
  config: InternalAxiosRequestConfig,
  url: string,
  method: string,
) {
  // PATCH /entregas/{id}/cancelar
  const cancelarMatch = url.match(/\/entregas\/([^/]+)\/cancelar$/)
  if (cancelarMatch && method === 'patch') {
    const entrega = entregas.find((e) => e.id === cancelarMatch[1])
    if (!entrega) {
      return reject<ApiError>(config, 404, { detail: 'Entrega no encontrada' })
    }
    if (entrega.estado !== 'pendiente') {
      return reject<ApiError>(config, 400, {
        detail: 'Solo se pueden cancelar entregas pendientes',
      })
    }
    entrega.estado = 'cancelada'
    return makeResponse(config, 200, entrega)
  }

  // PATCH /entregas/{id}/completar
  const completarMatch = url.match(/\/entregas\/([^/]+)\/completar$/)
  if (completarMatch && method === 'patch') {
    const entrega = entregas.find((e) => e.id === completarMatch[1])
    if (!entrega) {
      return reject<ApiError>(config, 404, { detail: 'Entrega no encontrada' })
    }
    if (entrega.estado === 'cancelada' || entrega.estado === 'completada') {
      return reject<ApiError>(config, 400, {
        detail: 'La entrega no puede completarse en su estado actual',
      })
    }
    entrega.estado = 'completada'
    return makeResponse(config, 200, entrega)
  }

  // GET /entregas/{id}  |  PUT /entregas/{id}
  const idMatch = url.match(/\/entregas\/([^/]+)$/)
  if (idMatch) {
    const id = idMatch[1]
    const index = entregas.findIndex((e) => e.id === id)
    if (index === -1) {
      return reject<ApiError>(config, 404, { detail: 'Entrega no encontrada' })
    }

    if (method === 'get') {
      return makeResponse(config, 200, entregas[index])
    }

    if (method === 'put') {
      const body = parseBody<EntregaInput>(config)
      const actualizada: Entrega = {
        ...entregas[index],
        ...body,
        ...denormalizar(body),
      }
      entregas[index] = actualizada
      return makeResponse(config, 200, actualizada)
    }
  }

  // GET /entregas  |  POST /entregas
  if (url.endsWith('/entregas')) {
    if (method === 'get') {
      const estado = config.params?.estado as EstadoEntrega | undefined
      const clienteId = config.params?.cliente_id as string | undefined
      const fechaDesde = config.params?.fecha_desde as string | undefined
      const fechaHasta = config.params?.fecha_hasta as string | undefined
      const search = (config.params?.search ?? '').toString().toLowerCase()
      const pagina = Number(config.params?.pagina ?? 1)
      const porPagina = Number(config.params?.por_pagina ?? 20)

      let filtradas = entregas.slice()
      if (estado) filtradas = filtradas.filter((e) => e.estado === estado)
      if (clienteId) filtradas = filtradas.filter((e) => e.cliente_id === clienteId)
      if (fechaDesde)
        filtradas = filtradas.filter((e) => (e.fecha_estimada ?? '') >= fechaDesde)
      if (fechaHasta)
        filtradas = filtradas.filter((e) => (e.fecha_estimada ?? '') <= fechaHasta)
      if (search)
        filtradas = filtradas.filter(
          (e) =>
            (e.cliente_nombre ?? '').toLowerCase().includes(search) ||
            e.id.toLowerCase().includes(search) ||
            e.descripcion.toLowerCase().includes(search),
        )

      const inicio = (pagina - 1) * porPagina
      const pageItems = filtradas.slice(inicio, inicio + porPagina)

      const payload: EntregasListResponse = {
        total: filtradas.length,
        pagina,
        por_pagina: porPagina,
        entregas: pageItems,
      }
      return makeResponse(config, 200, payload)
    }

    if (method === 'post') {
      const body = parseBody<EntregaInput>(config)
      const nueva: Entrega = {
        id: uid('ent'),
        ...body,
        ...denormalizar(body),
        bultos: body.bultos ?? 1,
        estado: 'pendiente',
      }
      entregas.unshift(nueva)
      return makeResponse(config, 201, nueva)
    }
  }

  return reject<ApiError>(config, 404, {
    detail: `[MOCK] Endpoint de entregas no implementado: ${method.toUpperCase()} ${url}`,
  })
}
