import type { InternalAxiosRequestConfig } from 'axios'
import type {
  ApiError,
  Parada,
  Ruta,
  RutaAsignarInput,
  RutaInput,
  RutasListResponse,
  SeguimientoRuta,
  UbicacionChofer,
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
const ubicaciones = new Map<string, UbicacionChofer>()
const PARADAS_DEMO = [
  [-34.6037, -58.3816], [-34.5864, -58.4351], [-34.5622, -58.4587],
] as const

export function matchesRutas(url: string): boolean {
  return url.includes('/rutas')
}

export function getSeguimientoMock(codigo: string): SeguimientoRuta | undefined {
  const ruta = rutas.find((r) => `RUT-${r.id}` === codigo)
  if (!ruta) return undefined
  const chofer = mockUsers.find((u) => u.id === ruta.chofer_id)
  const completadas = ruta.paradas.filter((p) => p.completada).length
  const proxima = ruta.paradas.find((p) => !p.completada)
  return {
    codigo,
    ruta_nombre: ruta.nombre,
    estado: ruta.estado,
    chofer_nombre: chofer?.nombre ?? 'Chofer asignado',
    progreso: ruta.paradas.length ? Math.round((completadas / ruta.paradas.length) * 100) : 0,
    proxima_parada: proxima ? { cliente: proxima.cliente, direccion: proxima.direccion, orden: proxima.orden } : undefined,
    ubicacion: ubicaciones.get(ruta.id),
    ultima_actualizacion: ubicaciones.get(ruta.id)?.actualizada_en,
  }
}

export async function handleRutas(
  config: InternalAxiosRequestConfig,
  url: string,
  method: string,
) {
  // PATCH /rutas/{id}/entregas/{entregaId}/confirmar
  const confirmarMatch = url.match(/\/rutas\/([^/]+)\/entregas\/([^/]+)\/confirmar$/)
  if (confirmarMatch && method === 'patch') {
    const ruta = rutas.find((r) => r.id === confirmarMatch[1])
    const parada = ruta?.paradas.find((p) => p.entrega_id === confirmarMatch[2])
    const body = parseBody<{ codigo?: string }>(config)
    if (!ruta || !parada) return reject<ApiError>(config, 404, { detail: 'Entrega no encontrada en la ruta' })
    if (ruta.estado !== 'en_curso') return reject<ApiError>(config, 400, { detail: 'Iniciá la ruta antes de confirmar entregas' })
    if (body.codigo !== `QR-${parada.entrega_id}`) return reject<ApiError>(config, 400, { detail: 'El código QR no corresponde a esta entrega' })
    parada.completada = true
    const entrega = findEntregaMock(parada.entrega_id)
    if (entrega) entrega.estado = 'completada'
    return makeResponse(config, 200, ruta)
  }

  // PATCH /rutas/{id}/ubicacion
  const ubicacionMatch = url.match(/\/rutas\/([^/]+)\/ubicacion$/)
  if (ubicacionMatch && method === 'patch') {
    const ruta = rutas.find((r) => r.id === ubicacionMatch[1])
    const body = parseBody<Pick<UbicacionChofer, 'latitud' | 'longitud'>>(config)
    if (!ruta) return reject<ApiError>(config, 404, { detail: 'Ruta no encontrada' })
    ubicaciones.set(ruta.id, { ...body, actualizada_en: new Date().toISOString() })
    return makeResponse(config, 200, ruta)
  }

  // PATCH /rutas/{id}/iniciar | /finalizar
  const accionMatch = url.match(/\/rutas\/([^/]+)\/(iniciar|finalizar)$/)
  if (accionMatch && method === 'patch') {
    const ruta = rutas.find((r) => r.id === accionMatch[1])
    if (!ruta) return reject<ApiError>(config, 404, { detail: 'Ruta no encontrada' })
    if (accionMatch[2] === 'iniciar') {
      if (ruta.estado !== 'asignada') return reject<ApiError>(config, 400, { detail: 'La ruta debe estar asignada para iniciarla' })
      ruta.estado = 'en_curso'; ruta.iniciada_en = new Date().toISOString()
    } else {
      if (ruta.estado !== 'en_curso') return reject<ApiError>(config, 400, { detail: 'La ruta no está en curso' })
      if (ruta.paradas.some((p) => !p.completada)) return reject<ApiError>(config, 400, { detail: 'Confirmá todas las entregas antes de finalizar' })
      ruta.estado = 'finalizada'; ruta.finalizada_en = new Date().toISOString()
    }
    return makeResponse(config, 200, ruta)
  }

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
      const choferId = config.params?.chofer_id as string | undefined
      const soloPlantillas = config.params?.solo_plantillas === true || config.params?.solo_plantillas === 'true'
      const fechaProgramada = config.params?.fecha_programada as string | undefined
      let filtradas = rutas.slice()
      if (choferId) filtradas = filtradas.filter((r) => r.chofer_id === choferId)
      if (soloPlantillas) filtradas = filtradas.filter((r) => r.es_plantilla)
      if (fechaProgramada) filtradas = filtradas.filter((r) => r.fecha_programada === fechaProgramada)
      const payload: RutasListResponse = {
        total: filtradas.length,
        pagina,
        por_pagina: porPagina,
        rutas: filtradas.reverse(),
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
          latitud: PARADAS_DEMO[i % PARADAS_DEMO.length][0],
          longitud: PARADAS_DEMO[i % PARADAS_DEMO.length][1],
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
        fecha_programada: body.fecha_programada,
        origen_descripcion: body.origen_descripcion?.trim(),
        origen_latitud: body.origen_latitud ?? -34.6037,
        origen_longitud: body.origen_longitud ?? -58.3816,
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
