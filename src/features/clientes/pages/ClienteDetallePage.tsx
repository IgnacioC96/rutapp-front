import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useCliente, useBajaCliente } from '../api'

export function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cliente, isLoading, isError, error } = useCliente(id)
  const baja = useBajaCliente()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleBaja() {
    if (!id) return
    baja.mutate(id, {
      onSuccess: () => {
        setConfirmOpen(false)
        navigate('/admin/clientes')
      },
    })
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate('/admin/clientes')}
        className="mb-3 text-sm text-gray-mid hover:text-white"
      >
        ← Volver a clientes
      </button>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {isError && (
        <p className="rounded-card bg-error/10 px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'No se pudo cargar el cliente')}
        </p>
      )}

      {cliente && (
        <>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold text-white">{cliente.nombre}</h1>
                {!cliente.activo && <Badge tone="error">Inactivo</Badge>}
              </div>
              <p className="text-sm text-gray-mid">{cliente.telefono_whatsapp}</p>
            </div>
            <Button variant="secondary" onClick={() => navigate(`/admin/clientes/${id}/editar`)}>
              Editar
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-mid">
                Direcciones
              </h2>
              <div className="flex flex-col gap-2">
                {cliente.direcciones.map((dir, i) => (
                  <div key={dir.id ?? i} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-white">{dir.descripcion}</p>
                      {dir.referencia && (
                        <p className="text-xs text-gray-dark">{dir.referencia}</p>
                      )}
                    </div>
                    {dir.es_principal && <Badge tone="brand">Principal</Badge>}
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-xs text-gray-mid">CUIT</p>
                <p className="text-sm text-white">{cliente.cuit ?? '—'}</p>
              </Card>
              <Card>
                <p className="text-xs text-gray-mid">Total de entregas</p>
                <p className="text-sm text-white">{cliente.total_entregas ?? 0}</p>
              </Card>
            </div>

            {cliente.notas && (
              <Card>
                <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-mid">
                  Notas
                </h2>
                <p className="text-sm text-white">{cliente.notas}</p>
              </Card>
            )}

            {cliente.activo && (
              <div className="pt-2">
                <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
                  Dar de baja
                </Button>
              </div>
            )}
          </div>

          <Modal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Dar de baja cliente"
          >
            <p className="mb-4 text-sm text-gray-mid">
              ¿Confirmás la baja de <span className="text-white">{cliente.nombre}</span>? El
              cliente dejará de aparecer en los listados activos.
            </p>
            {baja.isError && (
              <p className="mb-3 rounded-card bg-error/10 px-3 py-2 text-sm text-error">
                {getApiErrorMessage(baja.error, 'No se pudo dar de baja')}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleBaja}
                loading={baja.isPending}
                className="flex-1 !bg-error hover:!bg-error/90"
              >
                Sí, dar de baja
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={baja.isPending}
              >
                Cancelar
              </Button>
            </div>
          </Modal>
        </>
      )}
    </AppShell>
  )
}