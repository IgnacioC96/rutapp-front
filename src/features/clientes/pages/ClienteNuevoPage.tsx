import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { getApiErrorMessage } from '@/lib/apiClient'
import { ClienteForm } from '../components/ClienteForm'
import { useCreateCliente } from '../api'

export function ClienteNuevoPage() {
  const navigate = useNavigate()
  const create = useCreateCliente()

  return (
    <AppShell>
      <button
        onClick={() => navigate('/admin/clientes')}
        className="mb-3 text-sm text-gray-mid hover:text-white"
      >
        ← Volver a clientes
      </button>
      <h1 className="mb-5 text-lg font-bold text-white">Nuevo cliente</h1>

      <div className="max-w-lg">
        <ClienteForm
          submitting={create.isPending}
          errorMessage={
            create.isError ? getApiErrorMessage(create.error, 'No se pudo crear') : undefined
          }
          onCancel={() => navigate('/admin/clientes')}
          onSubmit={(data) =>
            create.mutate(data, {
              onSuccess: (cliente) => navigate(`/admin/clientes/${cliente.id}`),
            })
          }
        />
      </div>
    </AppShell>
  )
}