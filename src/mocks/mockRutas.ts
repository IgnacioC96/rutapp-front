import type { InternalAxiosRequestConfig } from 'axios'
import type {
  ApiError,
  Parada,
  Ruta,
  RutaAsignarInput,
  RutaInput,
  RutasListResponse,
} from '@/types/api'
import { makeResponse, parseBody, reject, uid } from './mockHelpers'
import { findEntregaMock } from './mockEntregas'
import { mockUsers } from './mockUsers'

/**
 * MOCK de rutas. Simula la creación con "optimización" simple
 * (mantiene el orden de selección y asigna distancias/tiempos de ejemplo).
 * Borrá este archivo cuando conectes el backend real.
 */

const rutas: Ruta[] = []

export function matchesRutas(url: string): boolean {
  return url.includes('/rutas')
}

export async function handleRutas(
  config: InternalAxiosRequestConfig,
  url: string,
  method: string,
) {
  // PATCH /rutas/{id}/asignar
  const asignarMatch = url.match(/\/rutas\/([^/]+)\/asignar$/)
  if (asignarMatch && method === 'patch') {
    const ruta = rutas.find((r) => r.id === asignarMatch[1])
    if (!ruta) return reject<ApiError>(config, 404, { detail: 'Ruta no encontrada' })
    if (ruta.estado !== 'pendiente') {
      return reject<ApiError>(config, 400, {
        detail: 'Solo se pueden asignar rutas pendientes',
      })
    }
    const body = parseBody<RutaAsignarInput>(config)
    const chofer = mockUsers.find((u) => u.id === body.chofer_id && u.rol === 'chofer')
    if (!chofer || chofer.activo === false) {
      return reject<ApiError>(config, 404, { detail: 'Chofer no encontrado o inactivo' })
    }
    ruta.chofer_id = chofer.id
    ruta.estado = 'asignada'
    return makeResponse(config, 200, ruta)
  }

  // GET /rutas/{id}
  const idMatch = url.match(/\/rutas\/([^/]+)$/)
  if (idMatch && method === 'get') {
    const ruta = rutas.find((r) => r.id === idMatch[1])
    if (!ruta) return reject<ApiError>(config, 404, { detail: 'Ruta no encontrada' })
    return makeResponse(config, 200, ruta)
  }

  // GET /rutas  |  POST /rutas
  if (url.endsWith('/rutas')) {
    if (method === 'get') {
      const pagina = Number(config.params?.pagina ?? 1)
      const porPagina = Number(config.params?.por_pagina ?? 20)
      const payload: RutasListResponse = {
        total: rutas.length,
        pagina,
        por_pagina: porPagina,
        rutas: rutas.slice().reverse(),
      }
      return makeResponse(config, 200, payload)
    }

    if (method === 'post') {
      const body = parseBody<RutaInput>(config)
      if (!body.nombre?.trim()) {
        return reject<ApiError>(config, 422, { detail: 'La ruta necesita un nombre' })
      }
      if (!body.entregas_ids?.length) {
        return reject<ApiError>(config, 400, {
          detail: 'Seleccioná al menos una entrega',
        })
      }
      if (!body.origen_descripcion?.trim() && body.origen_latitud == null) {
        return reject<ApiError>(config, 400, { detail: 'Falta el punto de origen' })
      }

      // Validar entregas y construir paradas (orden de selección = "optimizado").
      const paradas: Parada[] = []
      let totalKm = 0
      let totalMin = 0
      for (let i = 0; i < body.entregas_ids.length; i++) {
        const entrega = findEntregaMock(body.entregas_ids[i])
        if (!entrega) {
          return reject<ApiError>(config, 404, {
            detail: `Entrega ${body.entregas_ids[i]} no encontrada`,
          })
        }
        if (entrega.estado !== 'pendiente') {
          return reject<ApiError>(config, 400, {
            detail: `La entrega "${entrega.descripcion}" no está pendiente`,
          })
        }
        const km = Number((3 + (i % 3) * 1.5).toFixed(1))
        const min = 10 + (i % 4) * 5
        totalKm += km
        totalMin += min
        paradas.push({
          orden: i + 1,
          entrega_id: entrega.id,
          cliente: entrega.cliente_nombre ?? 'Cliente',
          direccion: entrega.direccion_descripcion ?? 'Dirección',
          distancia_desde_anterior_km: km,
          tiempo_desde_anterior_min: min,
        })
        // La entrega pasa a "en_curso" al sumarla a una ruta.
        entrega.estado = 'en_curso'
      }

      const ruta: Ruta = {
        id: uid('ruta'),
        nombre: body.nombre.trim(),
        estado: 'pendiente',
        total_km: Number(totalKm.toFixed(1)),
        tiempo_estimado_min: totalMin,
        es_plantilla: body.guardar_plantilla ?? false,
        origen_descripcion: body.origen_descripcion?.trim(),
        chofer_id: null,
        creada_en: new Date().toISOString(),
        iniciada_en: null,
        finalizada_en: null,
        paradas,
      }
      rutas.push(ruta)
      return makeResponse(config, 201, ruta)
    }
  }

  return reject<ApiError>(config, 404, {
    detail: `[MOCK] Endpoint de rutas no implementado: ${method.toUpperCase()} ${url}`,
  })
}
