import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useRutas } from '../api'
import { ESTADO_RUTA_META } from '../estado'
import { formatearTiempo } from '@/lib/formatearTiempo'
import type { EstadoRuta, Ruta } from '@/types/api'

const ESTADO_OPTIONS = (Object.keys(ESTADO_RUTA_META) as EstadoRuta[]).map((value) => ({
  value,
  label: ESTADO_RUTA_META[value].label,
}))

/** "8 de 10 entregadas · 2 no entregadas" usando el resumen del backend. */
function resumenParadas(ruta: Ruta): string {
  const total = ruta.paradas_total ?? ruta.paradas.filter((p) => !p.es_parada_extra).length
  const completadas = ruta.paradas_completadas ?? ruta.paradas.filter((p) => !p.es_parada_extra && p.completada).length
  const omitidas = ruta.paradas_omitidas ?? ruta.paradas.filter((p) => !p.es_parada_extra && p.omitida).length
  return `${completadas} de ${total} entregadas${omitidas > 0 ? ` · ${omitidas} no entregada(s)` : ''}`
}

export function RutasListPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const rangoInvalido = Boolean(fechaDesde && fechaHasta && fechaDesde > fechaHasta)
  const { data, isLoading, isError, error } = useRutas({
    estado: (estado || undefined) as EstadoRuta | undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: rangoInvalido ? undefined : fechaHasta || undefined,
  })
  const hayFiltros = Boolean(estado || fechaDesde || fechaHasta)

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Rutas</h1>
          <p className="text-sm text-gray-mid">
            {data ? `${data.total} ruta(s)` : 'Planificación de rutas'}
          </p>
        </div>
        <Button onClick={() => navigate('/admin/rutas/nueva')}>+ Nueva ruta</Button>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Select
          label="Estado"
          name="filtro-estado"
          placeholder="Todos los estados"
          options={ESTADO_OPTIONS}
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        />
        <Input label="Desde" name="fecha-desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        <Input label="Hasta" name="fecha-hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        {hayFiltros && (
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => { setEstado(''); setFechaDesde(''); setFechaHasta('') }}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
      {rangoInvalido && (
        <p className="mb-3 text-xs text-error">La fecha "Desde" no puede ser posterior a "Hasta".</p>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {isError && (
        <p className="rounded-card border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'No se pudieron cargar las rutas')}
        </p>
      )}

      {data && data.rutas.length === 0 && hayFiltros && (
        <EmptyState title="Sin resultados" description="No hay rutas que coincidan con los filtros." />
      )}

      {data && data.rutas.length === 0 && !hayFiltros && (
        <EmptyState
          title="Sin rutas"
          description="Creá una ruta seleccionando entregas pendientes y un punto de origen."
          action={<Button onClick={() => navigate('/admin/rutas/nueva')}>+ Nueva ruta</Button>}
        />
      )}

      {data && data.rutas.length > 0 && (
        <div className="space-y-2">
          {data.rutas.map((ruta) => {
            const meta = ESTADO_RUTA_META[ruta.estado]
            return (
              <Card
                key={ruta.id}
                onClick={() => navigate(`/admin/rutas/${ruta.id}`)}
                className="flex cursor-pointer items-center justify-between gap-3 transition-colors hover:border-gray-dark"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{ruta.nombre}</p>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  <p className="truncate text-xs text-gray-mid">
                    {resumenParadas(ruta)}
                    {ruta.fecha_programada ? ` · ${ruta.fecha_programada}` : ''}
                    {ruta.total_km != null ? ` · ${ruta.total_km.toFixed(1)} km` : ''}
                    {ruta.tiempo_estimado_min != null ? ` · ${formatearTiempo(ruta.tiempo_estimado_min)}` : ''}
                  </p>
                </div>
                <span className="text-brand">→</span>
              </Card>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
