import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'
import { getApiErrorMessage } from '@/lib/apiClient'
import { EntregaForm } from '../components/EntregaForm'
import { useEntrega, useUpdateEntrega } from '../api'

export function EntregaEditarPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: entrega, isLoading, isError, error } = useEntrega(id)
  const update = useUpdateEntrega(id ?? '')

  return (
    <AppShell>
      <button
        onClick={() => navigate(`/admin/entregas/${id}`)}
        className="mb-3 text-sm text-gray-mid hover:text-white"
      >
        ← Volver al detalle
      </button>
      <h1 className="mb-5 text-lg font-bold text-white">Editar entrega</h1>

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
        <div className="max-w-lg">
          <EntregaForm
            initial={entrega}
            submitting={update.isPending}
            errorMessage={
              update.isError
                ? getApiErrorMessage(update.error, 'No se pudo guardar')
                : undefined
            }
            onCancel={() => navigate(`/admin/entregas/${id}`)}
            onSubmit={(data) =>
              update.mutate(data, {
                onSuccess: () => navigate(`/admin/entregas/${id}`),
              })
            }
          />
        </div>
      )}
    </AppShell>
  )
}