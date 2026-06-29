import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useLogout } from '@/features/auth/api'
import { cn } from '@/lib/cn'
import type { Rol } from '@/types/api'

interface NavItem {
  label: string
  path: string
  roles: Rol[]
  icon: ReactNode
}

/** Íconos inline (sin dependencias extra). */
const icons = {
  dashboard: (
    <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
  ),
  clientes: (
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
  ),
  entregas: (
    <path d="M20 8h-3V4H3a2 2 0 0 0-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5l-3-4ZM6 18.5A1.5 1.5 0 1 1 7.5 17 1.5 1.5 0 0 1 6 18.5Zm12 0A1.5 1.5 0 1 1 19.5 17 1.5 1.5 0 0 1 18 18.5Zm1-7.5h-2V9.5h1.5l1.96 2.5H19Z" />
  ),
  choferes: (
    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5Z" />
  ),
  rutas: (
    <path d="M9 20.42 2.79 14.2a1 1 0 0 1 0-1.41l9-9a1 1 0 0 1 1.41 0l6.21 6.21a1 1 0 0 1 0 1.41l-9 9a1 1 0 0 1-1.41 0ZM7.5 8A1.5 1.5 0 1 0 9 9.5 1.5 1.5 0 0 0 7.5 8Z" />
  ),
} as const

const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/admin', roles: ['admin'], icon: icons.dashboard },
  { label: 'Clientes', path: '/admin/clientes', roles: ['admin'], icon: icons.clientes },
  { label: 'Entregas', path: '/admin/entregas', roles: ['admin'], icon: icons.entregas },
  { label: 'Choferes', path: '/admin/usuarios', roles: ['admin'], icon: icons.choferes },
  { label: 'Rutas', path: '/admin/rutas', roles: ['admin'], icon: icons.rutas },
  { label: 'Mis rutas', path: '/chofer', roles: ['chofer'], icon: icons.rutas },
]

/** Layout principal: sidebar fijo en desktop, drawer con hamburguesa en mobile. */
export function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const [menuOpen, setMenuOpen] = useState(false)

  // Cierra el drawer al navegar entre páginas.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    })
  }

  function go(path: string) {
    navigate(path)
    setMenuOpen(false)
  }

  const isActive = (path: string) =>
    path === '/admin' || path === '/chofer'
      ? location.pathname === path
      : location.pathname.startsWith(path)

  const items = NAV.filter((item) => (user?.rol ? item.roles.includes(user.rol) : false))

  return (
    <div className="min-h-screen bg-background">
      {/* Barra superior — solo mobile */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-stroke bg-surface px-4 py-3 lg:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          className="rounded-btn p-1 text-gray-mid hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
          </svg>
        </button>
        <Logo size={26} />
        <span className="text-base font-bold tracking-tight text-white">rutapp</span>
      </header>

      {/* Backdrop del drawer — solo mobile cuando está abierto */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-stroke bg-surface',
          'transition-transform duration-200 lg:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Marca + cerrar (mobile) */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-lg font-bold tracking-tight text-white">rutapp</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-btn p-1 text-gray-mid hover:text-white lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M6.4 4.99 4.99 6.4 10.59 12l-5.6 5.6 1.41 1.41L12 13.41l5.6 5.6 1.41-1.41L13.41 12l5.6-5.6-1.41-1.41L12 10.59 6.4 4.99Z" />
            </svg>
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand text-white'
                    : 'text-gray-mid hover:bg-card hover:text-white',
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5 shrink-0"
                  aria-hidden
                >
                  {item.icon}
                </svg>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Tema + usuario + salir */}
        <div className="border-t border-stroke px-3 py-4">
          <button
            onClick={toggleTheme}
            className="mb-3 flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium text-gray-mid transition-colors hover:bg-card hover:text-white"
            aria-label="Cambiar tema"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 shrink-0" aria-hidden>
              {theme === 'dark' ? (
                // Sol (cambiar a claro)
                <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 17a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4.22 4.22a1 1 0 0 1 1.42 0l.7.7A1 1 0 1 1 4.93 6.34l-.7-.7a1 1 0 0 1 0-1.42Zm12.73 12.73a1 1 0 0 1 1.41 0l.7.7a1 1 0 1 1-1.41 1.42l-.7-.71a1 1 0 0 1 0-1.41ZM2 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm17 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1ZM4.22 19.78a1 1 0 0 1 0-1.41l.7-.7a1 1 0 1 1 1.42 1.41l-.71.7a1 1 0 0 1-1.41 0ZM16.95 7.05a1 1 0 0 1 0-1.41l.7-.7a1 1 0 1 1 1.42 1.41l-.71.7a1 1 0 0 1-1.41 0Z" />
              ) : (
                // Luna (cambiar a oscuro)
                <path d="M12.74 2.07a1 1 0 0 1 .26.98 7 7 0 0 0 8.95 8.95 1 1 0 0 1 1.24 1.32A10 10 0 1 1 11.42.83a1 1 0 0 1 1.32 1.24Z" />
              )}
            </svg>
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>

          <div className="px-2 pb-3">
            <p className="truncate text-sm font-medium text-white">{user?.nombre}</p>
            <p className="text-xs capitalize text-gray-mid">{user?.rol}</p>
          </div>
          <Button
            variant="secondary"
            onClick={handleLogout}
            loading={logout.isPending}
            className="w-full"
          >
            Salir
          </Button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-60">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  )
}
