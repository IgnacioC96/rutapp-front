import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useSeguimiento } from '@/features/rutas/api'
import { ESTADO_RUTA_META } from '@/features/rutas/estado'
import 'leaflet/dist/leaflet.css'

// Fix para el icono de Leaflet en Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Icono naranja personalizado para el chofer
const iconoChofer = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

/**
 * Componente auxiliar que mueve el mapa al pin del chofer
 * cada vez que se actualizan las coordenadas.
 */
function ActualizarVista({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], map.getZoom())
  }, [lat, lon])
  return null
}

export function SeguimientoPublicoPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const { data, isLoading, isError, error } = useSeguimiento(codigo)

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <p className="mb-1 text-xl font-bold text-white">rutapp</p>
        <p className="mb-6 text-sm text-gray-mid">Seguimiento de tu entrega</p>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        )}

        {/* Error */}
        {isError && (
          <Card>
            <p className="text-sm text-error">
              {getApiErrorMessage(error, 'No encontramos este seguimiento.')}
            </p>
          </Card>
        )}

        {/* Datos de seguimiento */}
        {data && (
          <div className="space-y-4">

            {/* Card progreso */}
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-mid">Ruta</p>
                  <h1 className="text-lg font-bold text-white">{data.ruta_nombre}</h1>
                </div>
                <Badge tone={ESTADO_RUTA_META[data.estado].tone}>
                  {ESTADO_RUTA_META[data.estado].label}
                </Badge>
              </div>
              <div className="mt-5">
                <div className="mb-1 flex justify-between text-xs text-gray-mid">
                  <span>Progreso de entregas</span>
                  <span>{data.progreso}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full bg-brand transition-all"
                    style={{ width: `${data.progreso}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Card chofer y próxima parada */}
            <Card>
              <p className="text-xs text-gray-mid">Chofer</p>
              <p className="text-sm font-semibold text-white">{data.chofer_nombre}</p>
              {data.proxima_parada ? (
                <>
                  <p className="mt-4 text-xs text-gray-mid">Próxima parada</p>
                  <p className="text-sm text-white">{data.proxima_parada.cliente}</p>
                  <p className="text-xs text-gray-mid">{data.proxima_parada.direccion}</p>
                </>
              ) : (
                <p className="mt-4 text-sm text-success">La ruta completó todas sus paradas.</p>
              )}
            </Card>

            {/* Card ubicación en tiempo real con mapa */}
            <Card className="bg-brand-tint">
              <p className="text-xs text-gray-mid">Ubicación en tiempo real</p>
              {data.chofer_latitud && data.chofer_longitud ? (
                <>
                  <p className="mt-1 mb-3 text-sm text-white">
                    Chofer reportando ubicación · Actualizada {new Date(data.ultima_actualizacion).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                  </p>
                  {/* Mapa con pin del chofer */}
                  <div className="overflow-hidden rounded-lg border border-stroke">
                    <MapContainer
                      center={[data.chofer_latitud, data.chofer_longitud]}
                      zoom={15}
                      scrollWheelZoom={false}
                      className="h-48 w-full"
                      aria-label="Ubicación del chofer en tiempo real"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <ActualizarVista lat={data.chofer_latitud} lon={data.chofer_longitud} />
                      <Marker
                        key={`${data.chofer_latitud}-${data.chofer_longitud}`}
                        position={[data.chofer_latitud, data.chofer_longitud]}
                        icon={iconoChofer}
                      >
                        <Popup>{data.chofer_nombre}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-gray-mid">
                  Esperando la primera ubicación del chofer.
                </p>
              )}
              <p className="mt-3 text-xs text-gray-dark">
                Esta vista se actualiza automáticamente cada 15 segundos.
              </p>
            </Card>

          </div>
        )}
      </div>
    </main>
  )
}