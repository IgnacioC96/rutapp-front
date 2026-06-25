import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'
import { getApiErrorMessage } from '@/lib/apiClient'
import { ClienteForm } from '../components/ClienteForm'
import { useCliente, useUpdateCliente } from '../api'

export function ClienteEditarPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cliente, isLoading, isError, error } = useCliente(id)
  const update = useUpdateCliente(id ?? '')

  return (
    <AppShell>
      <button
        onClick={() => navigate(`/admin/clientes/${id}`)}
        className="mb-3 text-sm text-gray-mid hover:text-white"
      >
        ← Volver al detalle
      </button>
      <h1 className="mb-5 text-lg font-bold text-white">Editar cliente</h1>

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
        <div className="max-w-lg">
          <ClienteForm
            initial={cliente}
            submitting={update.isPending}
            errorMessage={
              update.isError
                ? getApiErrorMessage(update.error, 'No se pudo guardar')
                : undefined
            }
            onCancel={() => navigate(`/admin/clientes/${id}`)}
            onSubmit={(data) =>
              update.mutate(data, {
                onSuccess: () => navigate(`/admin/clientes/${id}`),
              })
            }
          />
        </div>
      )}
    </AppShell>
  )
}