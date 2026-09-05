import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useUsuarios } from '@/features/usuarios/api'
import { useRuta, useAgregarParadaExtra, useAsignarChofer, useReordenarParadas } from '../api'
import { ESTADO_RUTA_META } from '../estado'
import { MapaRuta } from '../components/MapaRuta'
import { getParadaDireccion, getParadaId, getParadaKey, getParadaTitulo } from '../paradas'
import { formatearTiempo } from '@/lib/formatearTiempo'
import type { Parada, ParadaExtraInput, Ruta } from '@/types/api'

function ParadaExtraModal({ ruta, onClose }: { ruta: Ruta; onClose: () => void }) {
  const agregar = useAgregarParadaExtra(ruta.id)
  const [descripcion, setDescripcion] = useState('')
  const [direccion, setDireccion] = useState('')
  const [orden, setOrden] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const next: Record<string, string> = {}
    if (!descripcion.trim()) next.descripcion = 'Ingresá una descripción'
    if (!direccion.trim()) next.direccion = 'Ingresá una dirección'

    const ordenTrim = orden.trim()
    const ordenNumerico = ordenTrim ? Number(ordenTrim) : null
    if (ordenNumerico !== null && (!Number.isInteger(ordenNumerico) || ordenNumerico < 1)) {
      next.orden = 'El orden debe ser un número mayor a 0'
    }

    setErrores(next)
    if (Object.keys(next).length > 0) return

    const payload: ParadaExtraInput = {
      descripcion: descripcion.trim(),
      direccion: direccion.trim(),
      ...(ordenNumerico !== null ? { orden: ordenNumerico } : {}),
    }

    agregar.mutate(payload, {
      onSuccess: onClose,
      onError: (err) => setFormError(getApiErrorMessage(err, 'No se pudo agregar la parada extra')),
    })
  }

  return (
    <Modal open onClose={onClose} title="Agregar parada extra">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          autoFocus
          name="descripcionParadaExtra"
          label="Descripción"
          placeholder="Carga de nafta YPF"
          value={descripcion}
          error={errores.descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <Input
          name="direccionParadaExtra"
          label="Dirección"
          placeholder="Av. San Martín 500, Ituzaingó"
          value={direccion}
          error={errores.direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />
        <Input
          name="ordenParadaExtra"
          label="Orden (opcional)"
          type="number"
          min="1"
          max={ruta.paradas.length + 1}
          placeholder={`${ruta.paradas.length + 1}`}
          value={orden}
          error={errores.orden}
          onChange={(e) => setOrden(e.target.value)}
        />
        {formError && <p className="text-sm text-error">{formError}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={agregar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={agregar.isPending}>
            Agregar parada
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function RutaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: ruta, isLoading, isError, error } = useRuta(id)
  const { data: choferes } = useUsuarios({ rol: 'chofer' })
  const asignar = useAsignarChofer(id ?? '')
  const guardarOrden = useReordenarParadas(id ?? '')

  const [choferId, setChoferId] = useState('')
  const [asignarError, setAsignarError] = useState<string | null>(null)
  const [ordenParadaIds, setOrdenParadaIds] = useState<string[]>([])
  const [arrastrando, setArrastrando] = useState<number | null>(null)
  const [ordenError, setOrdenError] = useState<string | null>(null)
  const [creandoParadaExtra, setCreandoParadaExtra] = useState(false)

  const paradasActuales: Parada[] = ruta
    ? [...ruta.paradas].sort((a, b) => a.orden - b.orden)
    : []

  const paradasOrdenadas: Parada[] = ruta
    ? [...paradasActuales].sort((a, b) => {
      if (ordenParadaIds.length === 0) return 0
      const posicionA = ordenParadaIds.indexOf(getParadaId(a) ?? '')
      const posicionB = ordenParadaIds.indexOf(getParadaId(b) ?? '')
      return (posicionA < 0 ? Number.MAX_SAFE_INTEGER : posicionA) - (posicionB < 0 ? Number.MAX_SAFE_INTEGER : posicionB)
    }).map((parada, index) => ({ ...parada, orden: index + 1 }))
    : []

  const choferesActivos = choferes?.filter((c) => c.activo) ?? []
  const puedeReordenar = ruta?.estado === 'pendiente' || ruta?.estado === 'asignada'
  const puedeAgregarParadaExtra = ruta?.estado === 'pendiente' || ruta?.estado === 'asignada'
  const hayCambiosDeOrden = ordenParadaIds.length > 0 && ordenParadaIds.some((idParada, indice) => getParadaId(paradasActuales[indice]) !== idParada)
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
    const siguiente = paradasOrdenadas.map((parada) => getParadaId(parada) ?? '')
    const [movida] = siguiente.splice(origen, 1)
    siguiente.splice(destino, 0, movida)
    setOrdenParadaIds(siguiente)
  }

  function guardarNuevoOrden() {
    const paradasSinId = paradasOrdenadas.some((parada) => !getParadaId(parada))
    if (paradasSinId) {
      setOrdenError('No se pudo identificar una de las paradas para guardar su orden.')
      return
    }
    setOrdenError(null)
    guardarOrden.mutate(
      { paradas: paradasOrdenadas.map((parada) => ({ parada_id: getParadaId(parada)!, orden: parada.orden })) },
      {
        onSuccess: () => setOrdenParadaIds([]),
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
            {puedeAgregarParadaExtra && (
              <Button variant="secondary" onClick={() => setCreandoParadaExtra(true)}>
                + Parada extra
              </Button>
            )}
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

          {ruta.chofer_id && ruta.codigo_seguimiento && (
            <Card className="mb-5 bg-brand-tint">
              <p className="text-xs text-gray-mid">Enlace público de seguimiento</p>
              <a className="mt-1 block break-all text-sm font-semibold text-brand hover:underline" href={`/seguimiento/${ruta.codigo_seguimiento}`} target="_blank" rel="noreferrer">
                {window.location.origin}/seguimiento/{ruta.codigo_seguimiento}
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
              <Card key={getParadaKey(parada, index)} className={`flex gap-3 transition-opacity ${arrastrando === index ? 'opacity-50' : ''}`} draggable={puedeReordenar} onDragStart={() => puedeReordenar && setArrastrando(index)} onDragOver={(event) => { if (puedeReordenar) event.preventDefault() }} onDrop={() => { if (puedeReordenar && arrastrando != null) reordenarParadas(arrastrando, index); setArrastrando(null) }} onDragEnd={() => setArrastrando(null)}>
                {puedeReordenar && <span className="cursor-grab pt-1 text-gray-dark" aria-label="Arrastrar parada">⋮⋮</span>}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {parada.orden}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{getParadaTitulo(parada)}</p>
                    {parada.es_parada_extra && <Badge tone="brand">Operativa</Badge>}
                  </div>
                  <p className="truncate text-xs text-gray-mid">{getParadaDireccion(parada)}</p>
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
          {creandoParadaExtra && <ParadaExtraModal ruta={ruta} onClose={() => setCreandoParadaExtra(false)} />}
        </>
      )}
    </AppShell>
  )
}
