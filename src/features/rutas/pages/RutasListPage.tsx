import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useRutas } from '../api'
import { ESTADO_RUTA_META } from '../estado'

export function RutasListPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useRutas()

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

      {data && data.rutas.length === 0 && (
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
                    {ruta.paradas.length} parada(s)
                    {ruta.total_km != null ? ` · ${ruta.total_km.toFixed(1)} km` : ''}
                    {ruta.tiempo_estimado_min != null ? ` · ${ruta.tiempo_estimado_min} min` : ''}
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
