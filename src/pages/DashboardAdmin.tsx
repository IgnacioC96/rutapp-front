import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'

export function DashboardAdmin() {
  return (
    <AppShell>
      <h1 className="mb-1 text-lg font-bold text-white">Dashboard Admin</h1>
      <p className="mb-6 text-sm text-gray-mid">
        Gestión de clientes, entregas y rutas.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link to="/admin/clientes">
          <Card className="transition-colors hover:border-gray-dark">
            <p className="text-xs text-gray-mid">Clientes</p>
            <p className="mt-1 text-2xl font-bold text-white">Ver</p>
            <p className="mt-1 text-xs text-brand">Gestionar →</p>
          </Card>
        </Link>
        <Link to="/admin/entregas">
          <Card className="transition-colors hover:border-gray-dark">
            <p className="text-xs text-gray-mid">Entregas</p>
            <p className="mt-1 text-2xl font-bold text-white">Ver</p>
            <p className="mt-1 text-xs text-brand">Gestionar →</p>
          </Card>
        </Link>
        <Card>
          <p className="text-xs text-gray-mid">Rutas activas</p>
          <p className="mt-1 text-2xl font-bold text-white">—</p>
        </Card>
      </div>
    </AppShell>
  )
}