import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useUsuarios } from '@/features/usuarios/api'
import { useRuta, useAsignarChofer, useReordenarParadas } from '../api'
import { ESTADO_RUTA_META } from '../estado'
import { MapaRuta } from '../components/MapaRuta'
import { formatearTiempo } from '@/lib/formatearTiempo'
import type { Parada } from '@/types/api'

export function RutaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: ruta, isLoading, isError, error } = useRuta(id)
  const { data: choferes } = useUsuarios({ rol: 'chofer' })
  const asignar = useAsignarChofer(id ?? '')
  const guardarOrden = useReordenarParadas(id ?? '')

  const [choferId, setChoferId] = useState('')
  const [asignarError, setAsignarError] = useState<string | null>(null)
  const [ordenEntregaIds, setOrdenEntregaIds] = useState<string[]>([])
  const [arrastrando, setArrastrando] = useState<number | null>(null)
  const [ordenError, setOrdenError] = useState<string | null>(null)

  const paradasOrdenadas: Parada[] = ruta
    ? [...ruta.paradas].sort((a, b) => {
      const posicionA = ordenEntregaIds.indexOf(a.entrega_id)
      const posicionB = ordenEntregaIds.indexOf(b.entrega_id)
      return (posicionA < 0 ? Number.MAX_SAFE_INTEGER : posicionA) - (posicionB < 0 ? Number.MAX_SAFE_INTEGER : posicionB)
    }).map((parada, index) => ({ ...parada, orden: index + 1 }))
    : []

  const choferesActivos = choferes?.filter((c) => c.activo) ?? []
  const puedeReordenar = ruta?.estado === 'pendiente' || ruta?.estado === 'asignada'
  const hayCambiosDeOrden = ordenEntregaIds.length > 0 && ordenEntregaIds.some((idEntrega, indice) => ruta?.paradas[indice]?.entrega_id !== idEntrega)
  const choferAsignado = ruta?.chofer_id
    ? choferes?.find((c) => c.id === ruta.chofer_id)
    : undefined

  function handleAsignar() {
    if (!choferId) return
    setAsignarError(null)
    asignar.mutate(
      { chofer_id: choferId },
      { onError: (err) => setAsignarError(getApiErrorMessage(err, 'No se pudo asignar')) },
    )
  }

  function reordenarParadas(origen: number, destino: number) {
    if (origen === destino) return
    const siguiente = paradasOrdenadas.map((parada) => parada.entrega_id)
    const [movida] = siguiente.splice(origen, 1)
    siguiente.splice(destino, 0, movida)
    setOrdenEntregaIds(siguiente)
  }

  function guardarNuevoOrden() {
    const paradasSinId = paradasOrdenadas.some((parada) => !parada.parada_id && !parada.entrega_id)
    if (paradasSinId) {
      setOrdenError('No se pudo identificar una de las paradas para guardar su orden.')
      return
    }
    setOrdenError(null)
    guardarOrden.mutate(
      { paradas: paradasOrdenadas.map((parada) => ({ parada_id: parada.parada_id ?? parada.entrega_id, orden: parada.orden })) },
      {
        onSuccess: () => setOrdenEntregaIds([]),
        onError: (err) => setOrdenError(getApiErrorMessage(err, 'No se pudo guardar el nuevo orden')),
      },
    )
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate('/admin/rutas')}
        className="mb-4 text-sm text-gray-mid hover:text-white"
      >
        ← Volver a rutas
      </button>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {isError && (
        <p className="rounded-card border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'No se pudo cargar la ruta')}
        </p>
      )}

      {ruta && (
        <>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold text-white">{ruta.nombre}</h1>
                <Badge tone={ESTADO_RUTA_META[ruta.estado].tone}>
                  {ESTADO_RUTA_META[ruta.estado].label}
                </Badge>
              </div>
              <p className="text-sm text-gray-mid">
                {paradasOrdenadas.length} parada(s)
                {ruta.total_km != null ? ` · ${ruta.total_km.toFixed(1)} km` : ''}
                {ruta.tiempo_estimado_min != null ? ` · ${formatearTiempo(ruta.tiempo_estimado_min)}` : ''}
              </p>
              {ruta.fecha_programada && (
                <p className="mt-1 text-xs text-gray-mid">
                  Programada para {new Date(`${ruta.fecha_programada}T12:00:00`).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>
          </div>

          {/* Asignación de chofer */}
          <Card className="mb-5">
            {choferAsignado ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-mid">Chofer asignado</p>
                  <p className="text-sm font-semibold text-white">{choferAsignado.nombre}</p>
                </div>
                <Badge tone="brand">Asignada</Badge>
              </div>
            ) : ruta.estado === 'pendiente' ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white">Asignar chofer</p>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      name="chofer"
                      placeholder="Elegí un chofer…"
                      options={choferesActivos.map((c) => ({ value: c.id, label: c.nombre }))}
                      value={choferId}
                      onChange={(e) => setChoferId(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleAsignar}
                    loading={asignar.isPending}
                    disabled={!choferId}
                  >
                    Asignar
                  </Button>
                </div>
                {choferesActivos.length === 0 && (
                  <p className="text-xs text-warning">
                    No hay choferes activos. Cargá uno en la sección Choferes.
                  </p>
                )}
                {asignarError && <p className="text-sm text-error">{asignarError}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-mid">
                La ruta ya no admite asignación (estado: {ESTADO_RUTA_META[ruta.estado].label}).
              </p>
            )}
          </Card>

          {ruta.chofer_id && (
            <Card className="mb-5 bg-brand-tint">
              <p className="text-xs text-gray-mid">Enlace público de seguimiento</p>
              <a className="mt-1 block break-all text-sm font-semibold text-brand hover:underline" href={`/seguimiento/RUT-${ruta.id}`} target="_blank" rel="noreferrer">
                {window.location.origin}/seguimiento/RUT-{ruta.id}
              </a>
            </Card>
          )}

          {/* Origen */}
          {ruta.origen_descripcion && (
            <div className="mb-3 flex items-start gap-3 px-1">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs text-gray-mid">
                ◎
              </span>
              <div>
                <p className="text-xs text-gray-mid">Origen</p>
                <p className="text-sm text-white">{ruta.origen_descripcion}</p>
              </div>
            </div>
          )}

          <section className="mb-5">
            <h2 className="mb-1 text-sm font-semibold text-white">Recorrido</h2>
            <p className="mb-2 text-xs text-gray-mid">Origen y paradas en orden de entrega.</p>
            <MapaRuta
              origen={{
                descripcion: ruta.origen_descripcion,
                latitud: ruta.origen_latitud,
                longitud: ruta.origen_longitud,
              }}
              paradas={paradasOrdenadas}
            />
          </section>

          {/* Paradas ordenadas */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-gray-mid">{puedeReordenar ? 'Arrastrá las paradas y guardá el nuevo orden.' : 'Esta ruta ya no permite modificar el orden de sus paradas.'}</p>{puedeReordenar && <Button variant="secondary" className="px-3 py-2 text-xs" disabled={!hayCambiosDeOrden} loading={guardarOrden.isPending} onClick={guardarNuevoOrden}>Guardar orden</Button>}</div>
            {ordenError && <p className="rounded-card bg-error/10 px-3 py-2 text-sm text-error">{ordenError}</p>}
            {paradasOrdenadas.map((parada, index) => (
              <Card key={parada.parada_id ?? parada.entrega_id} className={`flex gap-3 transition-opacity ${arrastrando === index ? 'opacity-50' : ''}`} draggable={puedeReordenar} onDragStart={() => puedeReordenar && setArrastrando(index)} onDragOver={(event) => { if (puedeReordenar) event.preventDefault() }} onDrop={() => { if (puedeReordenar && arrastrando != null) reordenarParadas(arrastrando, index); setArrastrando(null) }} onDragEnd={() => setArrastrando(null)}>
                {puedeReordenar && <span className="cursor-grab pt-1 text-gray-dark" aria-label="Arrastrar parada">⋮⋮</span>}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {parada.orden}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{parada.cliente}</p>
                  <p className="truncate text-xs text-gray-mid">{parada.direccion}</p>
                  {(parada.distancia_desde_anterior_km != null ||
                    parada.tiempo_desde_anterior_min != null) && (
                    <p className="mt-1 text-xs text-gray-dark">
                      {parada.distancia_desde_anterior_km != null
                        ? `${parada.distancia_desde_anterior_km.toFixed(1)} km`
                        : ''}
                      {parada.distancia_desde_anterior_km != null &&
                      parada.tiempo_desde_anterior_min != null
                        ? ' · '
                        : ''}
                      {parada.tiempo_desde_anterior_min != null
                        ? `${formatearTiempo(parada.tiempo_desde_anterior_min)} desde la anterior`
                        : ''}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </AppShell>
  )
}
