import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { SetupPage } from '@/features/auth/SetupPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { DashboardAdmin } from '@/pages/DashboardAdmin'
import { DashboardChofer } from '@/pages/DashboardChofer'
import { ClientesListPage } from '@/features/clientes/pages/ClientesListPage'
import { ClienteNuevoPage } from '@/features/clientes/pages/ClienteNuevoPage'
import { ClienteDetallePage } from '@/features/clientes/pages/ClienteDetallePage'
import { ClienteEditarPage } from '@/features/clientes/pages/ClienteEditarPage'
import { EntregasListPage } from '@/features/entregas/pages/EntregasListPage'
import { EntregaNuevaPage } from '@/features/entregas/pages/EntregaNuevaPage'
import { EntregaDetallePage } from '@/features/entregas/pages/EntregaDetallePage'
import { EntregaEditarPage } from '@/features/entregas/pages/EntregaEditarPage'
import { UsuariosListPage } from '@/features/usuarios/pages/UsuariosListPage'
import { RutasListPage } from '@/features/rutas/pages/RutasListPage'
import { RutaNuevaPage } from '@/features/rutas/pages/RutaNuevaPage'
import { RutaDetallePage } from '@/features/rutas/pages/RutaDetallePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />

        {/* Rutas de admin */}
        <Route element={<ProtectedRoute rol="admin" />}>
          <Route path="/admin" element={<DashboardAdmin />} />
          <Route path="/admin/clientes" element={<ClientesListPage />} />
          <Route path="/admin/clientes/nuevo" element={<ClienteNuevoPage />} />
          <Route path="/admin/clientes/:id" element={<ClienteDetallePage />} />
          <Route path="/admin/clientes/:id/editar" element={<ClienteEditarPage />} />
          <Route path="/admin/entregas" element={<EntregasListPage />} />
          <Route path="/admin/entregas/nueva" element={<EntregaNuevaPage />} />
          <Route path="/admin/entregas/:id" element={<EntregaDetallePage />} />
          <Route path="/admin/entregas/:id/editar" element={<EntregaEditarPage />} />
          <Route path="/admin/usuarios" element={<UsuariosListPage />} />
          <Route path="/admin/rutas" element={<RutasListPage />} />
          <Route path="/admin/rutas/nueva" element={<RutaNuevaPage />} />
          <Route path="/admin/rutas/:id" element={<RutaDetallePage />} />
        </Route>

        {/* Rutas de chofer */}
        <Route element={<ProtectedRoute rol="chofer" />}>
          <Route path="/chofer" element={<DashboardChofer />} />
        </Route>

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
