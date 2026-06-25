import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Rol } from '@/types/api'

/**
 * Protege rutas: requiere sesión y, opcionalmente, un rol específico.
 * Si no cumple, redirige al login o al dashboard que le corresponde.
 */
export function ProtectedRoute({ rol }: { rol?: Rol }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (rol && user?.rol !== rol) {
    // Tiene sesión pero rol incorrecto: lo mando a su área.
    return <Navigate to={user?.rol === 'admin' ? '/admin' : '/chofer'} replace />
  }

  return <Outlet />
}