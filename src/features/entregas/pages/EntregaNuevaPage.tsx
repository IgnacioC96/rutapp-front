import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { getApiErrorMessage } from '@/lib/apiClient'
import { EntregaForm } from '../components/EntregaForm'
import { useCreateEntrega } from '../api'

export function EntregaNuevaPage() {
  const navigate = useNavigate()
  const create = useCreateEntrega()

  return (
    <AppShell>
      <button
        onClick={() => navigate('/admin/entregas')}
        className="mb-3 text-sm text-gray-mid hover:text-white"
      >
        ← Volver a entregas
      </button>
      <h1 className="mb-5 text-lg font-bold text-white">Nueva entrega</h1>

      <div className="max-w-lg">
        <EntregaForm
          submitting={create.isPending}
          errorMessage={
            create.isError ? getApiErrorMessage(create.error, 'No se pudo crear') : undefined
          }
          onCancel={() => navigate('/admin/entregas')}
          onSubmit={(data) =>
            create.mutate(data, {
              onSuccess: (entrega) => navigate(`/admin/entregas/${entrega.id}`),
            })
          }
        />
      </div>
    </AppShell>
  )
}