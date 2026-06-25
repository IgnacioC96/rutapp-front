import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useSetup } from '@/features/auth/api'

/**
 * Pantalla de configuración inicial (POST /auth/setup).
 * Crea el PRIMER administrador del sistema. El backend deshabilita
 * este endpoint (403) una vez que existe al menos un usuario.
 */
export function SetupPage() {
  const navigate = useNavigate()
  const setup = useSetup()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!nombre.trim()) next.nombre = 'Ingresá tu nombre'
    if (!email.trim()) next.email = 'Ingresá un email'
    if (password.length < 8) next.password = 'Mínimo 8 caracteres'
    if (password !== password2) next.password2 = 'Las contraseñas no coinciden'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setup.mutate(
      { nombre: nombre.trim(), email: email.trim(), password, rol: 'admin' },
      {
        onSuccess: () => navigate('/login', { replace: true }),
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo size={80} />
          <div>
            <h1 className="text-xl font-bold text-white">Configuración inicial</h1>
            <p className="mt-1 text-xs text-gray-mid">
              Creá el primer usuario administrador.
            </p>
          </div>
        </div>

        {setup.isSuccess ? (
          <div className="rounded-card border border-success/40 bg-success/10 p-4 text-center">
            <p className="text-sm text-white">Administrador creado correctamente.</p>
            <Button className="mt-3 w-full" onClick={() => navigate('/login')}>
              Ir a iniciar sesión
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              name="nombre"
              label="Nombre completo"
              placeholder="Carlos Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              error={errors.nombre}
            />
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="admin@rutapp.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Input
              name="password"
              type="password"
              label="Contraseña (mín. 8 caracteres)"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <Input
              name="password2"
              type="password"
              label="Repetir contraseña"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              error={errors.password2}
            />

            {setup.isError && (
              <p className="rounded-card bg-error/10 px-3 py-2 text-xs text-error">
                {getApiErrorMessage(setup.error, 'No se pudo crear el administrador')}
              </p>
            )}

            <Button type="submit" loading={setup.isPending} className="mt-2 w-full">
              Crear administrador
            </Button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-center text-xs text-gray-mid hover:text-white"
            >
              Ya tengo cuenta · Iniciar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  )
}