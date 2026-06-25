import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useEntrega, useCancelarEntrega, useCompletarEntrega } from '../api'
import { ESTADO_ENTREGA_META } from '../estado'

type ConfirmAction = 'cancelar' | 'completar' | null

export function EntregaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: entrega, isLoading, isError, error } = useEntrega(id)
  const cancelar = useCancelarEntrega()
  const completar = useCompletarEntrega()
  const [confirm, setConfirm] = useState<ConfirmAction>(null)

  const pending = cancelar.isPending || completar.isPending
  const actionError = cancelar.error ?? completar.error

  function ejecutar() {
    if (!id || !confirm) return
    const mutation = confirm === 'cancelar' ? cancelar : completar
    mutation.mutate(id, { onSuccess: () => setConfirm(null) })
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate('/admin/entregas')}
        className="mb-3 text-sm text-gray-mid hover:text-white"
      >
        ← Volver a entregas
      </button>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {isError && (
        <p className="rounded-card bg-error/10 px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'No se pudo cargar la entrega')}
        </p>
      )}

      {entrega && (
        <>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold text-white">
                  {entrega.cliente_nombre ?? 'Entrega'}
                </h1>
                <Badge tone={ESTADO_ENTREGA_META[entrega.estado].tone}>
                  {ESTADO_ENTREGA_META[entrega.estado].label}
                </Badge>
              </div>
              <p className="text-sm text-gray-mid">{entrega.descripcion}</p>
            </div>
            {entrega.estado === 'pendiente' && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/admin/entregas/${id}/editar`)}
              >
                Editar
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-mid">
                Dirección
              </h2>
              <p className="text-sm text-white">{entrega.direccion_descripcion ?? '—'}</p>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-xs text-gray-mid">Bultos</p>
                <p className="text-sm text-white">{entrega.bultos ?? 1}</p>
              </Card>
              <Card>
                <p className="text-xs text-gray-mid">Peso</p>
                <p className="text-sm text-white">
                  {entrega.peso_kg != null ? `${entrega.peso_kg} kg` : '—'}
                </p>
              </Card>
              <Card>
                <p className="text-xs text-gray-mid">Fecha estimada</p>
                <p className="text-sm text-white">{entrega.fecha_estimada ?? '—'}</p>
              </Card>
              <Card>
                <p className="text-xs text-gray-mid">ID</p>
                <p className="truncate text-sm text-white">{entrega.id}</p>
              </Card>
            </div>

            {entrega.observaciones && (
              <Card>
                <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-mid">
                  Observaciones
                </h2>
                <p className="text-sm text-white">{entrega.observaciones}</p>
              </Card>
            )}

            {/* Acciones según estado */}
            {(entrega.estado === 'pendiente' || entrega.estado === 'en_curso') && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => setConfirm('completar')}>Marcar completada</Button>
                {entrega.estado === 'pendiente' && (
                  <Button variant="secondary" onClick={() => setConfirm('cancelar')}>
                    Cancelar entrega
                  </Button>
                )}
              </div>
            )}
          </div>

          <Modal
            open={confirm !== null}
            onClose={() => setConfirm(null)}
            title={confirm === 'cancelar' ? 'Cancelar entrega' : 'Completar entrega'}
          >
            <p className="mb-4 text-sm text-gray-mid">
              {confirm === 'cancelar'
                ? '¿Confirmás la cancelación de esta entrega? No se podrá revertir.'
                : '¿Confirmás que esta entrega fue completada?'}
            </p>
            {actionError && (
              <p className="mb-3 rounded-card bg-error/10 px-3 py-2 text-sm text-error">
                {getApiErrorMessage(actionError, 'No se pudo procesar')}
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={ejecutar} loading={pending} className="flex-1">
                Confirmar
              </Button>
              <Button variant="secondary" onClick={() => setConfirm(null)} disabled={pending}>
                Volver
              </Button>
            </div>
          </Modal>
        </>
      )}
    </AppShell>
  )
}