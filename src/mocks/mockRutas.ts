import type { InternalAxiosRequestConfig } from 'axios'
import type {
  ApiError,
  NoEntregadaInput,
  ParadaExtraInput,
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

function getParadaMockId(parada: Parada): string | undefined {
  return parada.parada_id ?? parada.id ?? parada.entrega_id ?? undefined
}

export function matchesRutas(url: string): boolean {
  return url.includes('/rutas')
}

export function getSeguimientoMock(codigo: string): SeguimientoRuta | undefined {
  const ruta = rutas.find((r) => `RUT-${r.id}` === codigo)
  if (!ruta) return undefined
  const chofer = mockUsers.find((u) => u.id === ruta.chofer_id)
  const completadas = ruta.paradas.filter((p) => p.completada || p.omitida).length
  const proxima = ruta.paradas.find((p) => !p.completada && !p.omitida)
  const ubicacion = ubicaciones.get(ruta.id)
  return {
    codigo,
    ruta_nombre: ruta.nombre,
    estado: ruta.estado,
    chofer_nombre: chofer?.nombre ?? 'Chofer asignado',
    progreso: ruta.paradas.length ? Math.round((completadas / ruta.paradas.length) * 100) : 0,
    // Igual que el back: sin datos del cliente, solo "Parada N de M".
    proxima_parada: proxima
      ? { cliente: `Parada ${proxima.orden} de ${ruta.paradas.length}`, direccion: '', orden: proxima.orden, completada: false }
      : undefined,
    chofer_latitud: ubicacion?.latitud ?? ruta.origen_latitud,
    chofer_longitud: ubicacion?.longitud ?? ruta.origen_longitud,
    ultima_actualizacion: ubicacion?.actualizada_en,
  }
}

/** Cierra la ruta si no quedan paradas de entrega sin resolver (completada u omitida). */
function cerrarSiTermino(ruta: Ruta) {
  const sinResolver = ruta.paradas.some((p) => !p.es_parada_extra && !p.completada && !p.omitida)
  if (sinResolver) return
  const hubo = ruta.paradas.some((p) => p.omitida && !p.es_parada_extra)
  ruta.estado = hubo ? 'finalizada' : 'completada'
  ruta.finalizada_en = new Date().toISOString()
}

export async function handleRutas(
  config: InternalAxiosRequestConfig,
  url: string,
  method: string,
) {
  // PATCH /rutas/{id}/entregas/{entregaId}/no-entregada
  const noEntregadaMatch = url.match(/\/rutas\/([^/]+)\/entregas\/([^/]+)\/no-entregada$/)
  if (noEntregadaMatch && method === 'patch') {
    const ruta = rutas.find((r) => r.id === noEntregadaMatch[1])
    const parada = ruta?.paradas.find((p) => p.entrega_id === noEntregadaMatch[2])
    const body = parseBody<NoEntregadaInput>(config)
    if (!ruta || !parada) return reject<ApiError>(config, 404, { mensaje: 'Entrega no encontrada en esta ruta' })
    if (ruta.estado !== 'en_curso') return reject<ApiError>(config, 400, { mensaje: 'Solo se puede marcar una entrega como no entregada en rutas en curso' })
    if (parada.completada) return reject<ApiError>(config, 400, { mensaje: 'Esta entrega ya fue confirmada' })
    if (parada.omitida) return reject<ApiError>(config, 400, { mensaje: 'Esta entrega ya fue marcada como no entregada' })
    parada.omitida = true
    parada.motivo_omision = body.motivo ?? 'nadie_recibio'
    if (body.nota?.trim()) parada.nota_chofer = body.nota.trim()
    const entrega = parada.entrega_id ? findEntregaMock(parada.entrega_id) : undefined
    if (entrega) entrega.estado = 'pendiente'
    cerrarSiTermino(ruta)
    return makeResponse(config, 200, ruta)
  }

  // PATCH /rutas/{id}/paradas/{paradaId}/nota
  const notaMatch = url.match(/\/rutas\/([^/]+)\/paradas\/([^/]+)\/nota$/)
  if (notaMatch && method === 'patch') {
    const ruta = rutas.find((r) => r.id === notaMatch[1])
    const parada = ruta?.paradas.find((p) => getParadaMockId(p) === notaMatch[2])
    const body = parseBody<{ nota?: string | null }>(config)
    if (!ruta || !parada) return reject<ApiError>(config, 404, { mensaje: 'Parada no encontrada en esta ruta' })
    if (ruta.estado !== 'en_curso') return reject<ApiError>(config, 400, { mensaje: 'Solo se pueden dejar notas en rutas en curso' })
    const nota = body.nota?.trim() ?? ''
    if (nota.length > 1000) return reject<ApiError>(config, 422, { mensaje: 'La nota no puede superar los 1000 caracteres' })
    parada.nota_chofer = nota || null
    return makeResponse(config, 200, ruta)
  }

  // PATCH /rutas/{id}/entregas/{entregaId}/confirmar
  const confirmarMatch = url.match(/\/rutas\/([^/]+)\/entregas\/([^/]+)\/confirmar$/)
  if (confirmarMatch && method === 'patch') {
    const ruta = rutas.find((r) => r.id === confirmarMatch[1])
    const parada = ruta?.paradas.find((p) => p.entrega_id === confirmarMatch[2])
    const body = parseBody<{ codigo?: string }>(config)
    if (!ruta || !parada) return reject<ApiError>(config, 404, { detail: 'Entrega no encontrada en la ruta' })
    if (ruta.estado !== 'en_curso') return reject<ApiError>(config, 400, { detail: 'Iniciá la ruta antes de confirmar entregas' })
    if (parada.omitida) return reject<ApiError>(config, 409, { mensaje: 'Esta entrega fue marcada como no entregada. Volvé a planificarla en otra ruta' })
    const entregaConfirmar = parada.entrega_id ? findEntregaMock(parada.entrega_id) : undefined
    // Igual que el backend: sin distinguir mayúsculas/minúsculas y con o sin prefijo "QR-".
    const codigoIngresado = (body.codigo ?? '').trim().toUpperCase().replace(/^QR-/, '')
    if (!entregaConfirmar?.codigo_confirmacion || codigoIngresado !== entregaConfirmar.codigo_confirmacion.toUpperCase()) {
      return reject<ApiError>(config, 400, { detail: 'Código incorrecto' })
    }
    parada.completada = true
    const entrega = parada.entrega_id ? findEntregaMock(parada.entrega_id) : undefined
    if (entrega) entrega.estado = 'completada'
    cerrarSiTermino(ruta)
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
      const pendientes = ruta.paradas.filter((p) => !p.es_parada_extra && !p.completada && !p.omitida)
      if (pendientes.length > 0) {
        pendientes.forEach((p) => {
          const entrega = p.entrega_id ? findEntregaMock(p.entrega_id) : undefined
          if (entrega) entrega.estado = 'pendiente'
        })
        ruta.estado = 'finalizada'
      } else {
        ruta.estado = ruta.paradas.some((p) => p.omitida && !p.es_parada_extra) ? 'finalizada' : 'completada'
      }
      ruta.finalizada_en = new Date().toISOString()
    }
    return makeResponse(config, 200, ruta)
  }

  // POST /rutas/{id}/paradas/extra
  const paradaExtraMatch = url.match(/\/rutas\/([^/]+)\/paradas\/extra$/)
  if (paradaExtraMatch && method === 'post') {
    const ruta = rutas.find((r) => r.id === paradaExtraMatch[1])
    if (!ruta) return reject<ApiError>(config, 404, { detail: 'Ruta no encontrada' })
    if (ruta.estado !== 'pendiente' && ruta.estado !== 'asignada') {
      return reject<ApiError>(config, 400, { detail: 'Solo se pueden agregar paradas en rutas pendientes o asignadas' })
    }
    const body = parseBody<ParadaExtraInput>(config)
    if (!body.descripcion?.trim()) return reject<ApiError>(config, 422, { detail: 'Ingresá una descripción' })

    const ordenNueva = body.orden ?? Math.max(...ruta.paradas.map((p) => p.orden), 0) + 1
    ruta.paradas.forEach((parada) => {
      if (parada.orden >= ordenNueva) parada.orden += 1
    })
    ruta.paradas.push({
      id: uid('parada'),
      orden: ordenNueva,
      entrega_id: null,
      cliente: null,
      direccion: body.direccion?.trim(),
      completada: false,
      es_parada_extra: true,
      descripcion_extra: body.descripcion.trim(),
      direccion_extra: body.direccion?.trim(),
    })
    ruta.paradas.sort((a, b) => a.orden - b.orden)
    return makeResponse(config, 201, ruta)
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
          id: uid('parada'),
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

  // PATCH /rutas/{id}/paradas
  const reordenarMatch = url.match(/\/rutas\/([^/]+)\/paradas$/)
  if (reordenarMatch && method === 'patch') {
    const ruta = rutas.find((r) => r.id === reordenarMatch[1])
    if (!ruta) return reject<ApiError>(config, 404, { detail: 'Ruta no encontrada' })
    const body = parseBody<{ paradas: { parada_id: string; orden: number }[] }>(config)
    body.paradas.forEach((item) => {
      const parada = ruta.paradas.find((p) => getParadaMockId(p) === item.parada_id)
      if (parada) parada.orden = item.orden
    })
    ruta.paradas.sort((a, b) => a.orden - b.orden)
    return makeResponse(config, 200, ruta)
  }

  return reject<ApiError>(config, 404, {
    detail: `[MOCK] Endpoint de rutas no implementado: ${method.toUpperCase()} ${url}`,
  })
}
