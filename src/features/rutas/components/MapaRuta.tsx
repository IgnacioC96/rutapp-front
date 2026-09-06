import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import type { Parada } from '@/types/api'
import { getParadaDireccion, getParadaTitulo } from '../paradas'
import 'leaflet/dist/leaflet.css'

type Punto = Pick<Parada, 'orden' | 'cliente' | 'direccion' | 'latitud' | 'longitud' | 'es_parada_extra' | 'descripcion_extra' | 'direccion_extra'>

const CABA: LatLngExpression = [-34.6037, -58.3816]

/**
 * Obtiene la ruta real por calles usando OSRM (gratuito, sin API key).
 * Recibe coordenadas en formato [lat, lon] y devuelve la polyline de la ruta.
 */
async function obtenerRutaReal(coordenadas: LatLngExpression[]): Promise<LatLngExpression[]> {
  try {
    // OSRM espera coordenadas en formato lon,lat separadas por ;
    const puntos = coordenadas
      .map((c) => {
        const [lat, lon] = c as [number, number]
        return `${lon},${lat}`
      })
      .join(';')

    const url = `https://router.project-osrm.org/route/v1/driving/${puntos}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) return coordenadas

    const data = await res.json()
    if (!data.routes?.[0]?.geometry?.coordinates) return coordenadas

    // OSRM devuelve [lon, lat] — lo invertimos a [lat, lon] para Leaflet
    return data.routes[0].geometry.coordinates.map(
      ([lon, lat]: [number, number]) => [lat, lon] as LatLngExpression
    )
  } catch {
    // Si falla OSRM, dibujamos líneas rectas como fallback
    return coordenadas
  }
}

/** Mapa OpenStreetMap con routing real por calles usando OSRM. */
export function MapaRuta({
  origen,
  paradas,
  className = '',
}: {
  origen?: { descripcion?: string; latitud?: number; longitud?: number }
  paradas: Punto[]
  className?: string
}) {
  const puntoOrigen: LatLngExpression =
    origen?.latitud != null && origen.longitud != null
      ? [origen.latitud, origen.longitud]
      : CABA

  const puntos = paradas.map((parada, indice) => {
    // Fallback para paradas sin coordenadas (durante planificación)
    const fallback: LatLngExpression = [
      -34.6037 + (indice + 1) * 0.012,
      -58.3816 - (indice + 1) * 0.015,
    ]
    return {
      ...parada,
      posicion:
        parada.latitud != null && parada.longitud != null
          ? ([parada.latitud, parada.longitud] as LatLngExpression)
          : fallback,
    }
  })

  // Estado para la polyline de la ruta real por calles
  const [rutaReal, setRutaReal] = useState<LatLngExpression[]>([])
  const recorridoRecto = [puntoOrigen, ...puntos.map((p) => p.posicion)]

  useEffect(() => {
    // Solo buscar ruta real si todas las paradas tienen coordenadas reales
    const todasTienenCoords = puntos.every(
      (p) => p.latitud != null && p.longitud != null
    )
    if (!todasTienenCoords || puntos.length === 0) {
      setRutaReal(recorridoRecto)
      return
    }

    obtenerRutaReal(recorridoRecto).then(setRutaReal)
  }, [paradas, origen])

  const polyline = rutaReal.length > 0 ? rutaReal : recorridoRecto

  return (
    <div className={`overflow-hidden rounded-card border border-stroke ${className}`}>
      <MapContainer
        center={puntoOrigen}
        zoom={12}
        scrollWheelZoom={false}
        className="h-64 w-full"
        aria-label="Mapa de la ruta"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcador de origen */}
        <CircleMarker
          center={puntoOrigen}
          radius={9}
          pathOptions={{ color: '#ffffff', fillColor: '#f26522', fillOpacity: 1, weight: 3 }}
        >
          <Popup>
            <strong>Origen</strong>
            <br />
            {origen?.descripcion ?? 'Punto de origen'}
          </Popup>
          <Tooltip permanent direction="top">Origen</Tooltip>
        </CircleMarker>

        {/* Ruta por calles reales */}
        <Polyline
          positions={polyline}
          pathOptions={{ color: '#f26522', weight: 4, opacity: 0.85 }}
        />

        {/* Marcadores de paradas */}
        {puntos.map((parada) => (
          <CircleMarker
            key={`${parada.orden}-${getParadaDireccion(parada)}`}
            center={parada.posicion}
            radius={12}
            pathOptions={{ color: '#ffffff', fillColor: '#1a1a1a', fillOpacity: 1, weight: 2 }}
          >
            <Tooltip
              permanent
              direction="center"
              className="!border-0 !bg-transparent !p-0 !font-bold !text-white !shadow-none"
            >
              {parada.orden}
            </Tooltip>
            <Popup>
              <strong>{getParadaTitulo(parada)}</strong>
              <br />
              {getParadaDireccion(parada)}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}