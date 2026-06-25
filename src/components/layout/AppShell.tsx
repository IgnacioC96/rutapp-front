import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/features/auth/api'

/** Layout temporal compartido por los dashboards (placeholder de MVP). */
export function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-stroke bg-surface px-4 py-3">
        <div className="flex items-center">
          <Logo size={32} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-mid">
            {user?.nombre} · <span className="capitalize">{user?.rol}</span>
          </span>
          <Button variant="secondary" onClick={handleLogout} loading={logout.isPending}>
            Salir
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}