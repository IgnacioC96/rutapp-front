import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'

export function DashboardChofer() {
  return (
    <AppShell>
      <h1 className="mb-1 text-lg font-bold text-white">Mis recorridos</h1>
      <p className="mb-6 text-sm text-gray-mid">
        Próximamente: rutas asignadas y confirmación de entregas.
      </p>
      <Card>
        <p className="text-sm text-gray-mid">No tenés rutas asignadas por ahora.</p>
      </Card>
    </AppShell>
  )
}