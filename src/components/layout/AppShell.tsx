import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/features/auth/api'
import { cn } from '@/lib/cn'

/** Layout compartido por los dashboards. */
export function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    })
  }

  // Links de navegación — solo para admin
  const navLinks = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Clientes',  path: '/admin/clientes' },
    { label: 'Entregas',  path: '/admin/entregas' },
  ]

  const isActive = (path: string) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-stroke bg-surface px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Logo size={32} />

          {/* Navegación — solo admin */}
          {user?.rol === 'admin' && (
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={cn(
                    'px-3 py-1.5 rounded-btn text-sm font-medium transition-colors',
                    isActive(link.path)
                      ? 'bg-brand text-white'
                      : 'text-gray-mid hover:text-white hover:bg-stroke'
                  )}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Usuario + Salir */}
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