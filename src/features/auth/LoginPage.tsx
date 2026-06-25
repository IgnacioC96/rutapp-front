import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useLogin } from '@/features/auth/api'
import type { Rol } from '@/types/api'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()

  const [rol, setRol] = useState<Rol>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    login.mutate(
      { email, password, rol },
      {
        onSuccess: (data) => {
          navigate(data.rol === 'admin' ? '/admin' : '/chofer', { replace: true })
        },
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size={96} />
        </div>

        {/* Selector de rol */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-card border border-stroke bg-card p-1">
          {(['admin', 'chofer'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRol(r)}
              className={cn(
                'rounded-[6px] py-2 text-sm font-semibold capitalize transition-colors',
                rol === r
                  ? 'bg-brand text-white'
                  : 'text-gray-mid hover:text-white',
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="usuario@rutapp.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            name="password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {login.isError && (
            <p className="rounded-card bg-error/10 px-3 py-2 text-xs text-error">
              {getApiErrorMessage(login.error, 'Credenciales inválidas')}
            </p>
          )}

          <Button type="submit" loading={login.isPending} className="mt-2 w-full">
            Ingresar
          </Button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/setup')}
          className="mt-5 block w-full text-center text-xs text-gray-mid hover:text-white"
        >
          ¿Primera vez? Configurar administrador
        </button>
      </div>
    </div>
  )
}