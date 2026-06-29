import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useUsuarios, useCreateUsuario, useDesactivarUsuario } from '../api'
import type { UsuarioInput } from '@/types/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FORM_INICIAL: UsuarioInput = {
  nombre: '',
  email: '',
  password: '',
  rol: 'chofer',
  telefono: '',
}

export function UsuariosListPage() {
  const { data: choferes, isLoading, isError, error } = useUsuarios({ rol: 'chofer' })
  const crear = useCreateUsuario()
  const desactivar = useDesactivarUsuario()

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<UsuarioInput>(FORM_INICIAL)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [bajaError, setBajaError] = useState<string | null>(null)

  function abrirModal() {
    setForm(FORM_INICIAL)
    setErrores({})
    setFormError(null)
    setModalOpen(true)
  }

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Ingresá el nombre'
    if (!form.email.trim()) e.email = 'Ingresá el email'
    else if (!EMAIL_RE.test(form.email)) e.email = 'Email inválido'
    if (!form.password) e.password = 'Ingresá una contraseña'
    else if (form.password.length < 8) e.password = 'Mínimo 8 caracteres'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setFormError(null)
    if (!validar()) return
    crear.mutate(
      { ...form, telefono: form.telefono?.trim() || undefined },
      {
        onSuccess: () => setModalOpen(false),
        onError: (err) => setFormError(getApiErrorMessage(err, 'No se pudo crear el chofer')),
      },
    )
  }

  function handleDesactivar(id: string, nombre: string) {
    if (!window.confirm(`¿Desactivar a ${nombre}? No podrá iniciar sesión.`)) return
    setBajaError(null)
    desactivar.mutate(id, {
      onError: (err) => setBajaError(getApiErrorMessage(err, 'No se pudo desactivar')),
    })
  }

  const activos = choferes?.filter((c) => c.activo).length ?? 0

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Choferes</h1>
          <p className="text-sm text-gray-mid">
            {choferes ? `${activos} activo(s) de ${choferes.length}` : 'Gestión de choferes'}
          </p>
        </div>
        <Button onClick={abrirModal}>+ Nuevo chofer</Button>
      </div>

      {bajaError && (
        <p className="mb-3 rounded-card border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          {bajaError}
        </p>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {isError && (
        <p className="rounded-card border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'No se pudieron cargar los choferes')}
        </p>
      )}

      {choferes && choferes.length === 0 && (
        <EmptyState
          title="Sin choferes"
          description="Todavía no cargaste ningún chofer."
          action={<Button onClick={abrirModal}>+ Nuevo chofer</Button>}
        />
      )}

      {choferes && choferes.length > 0 && (
        <div className="space-y-2">
          {choferes.map((chofer) => (
            <Card key={chofer.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{chofer.nombre}</p>
                  {chofer.activo ? (
                    <Badge tone="success">Activo</Badge>
                  ) : (
                    <Badge tone="neutral">Inactivo</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-gray-mid">
                  {chofer.email}
                  {chofer.telefono ? ` · ${chofer.telefono}` : ''}
                </p>
              </div>
              {chofer.activo && (
                <Button
                  variant="secondary"
                  onClick={() => handleDesactivar(chofer.id, chofer.nombre)}
                  loading={desactivar.isPending && desactivar.variables === chofer.id}
                >
                  Desactivar
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo chofer">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            name="nombre"
            label="Nombre"
            placeholder="Juan Pérez"
            value={form.nombre}
            error={errores.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="chofer@rutapp.com"
            value={form.email}
            error={errores.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            name="password"
            type="password"
            label="Contraseña (mín. 8)"
            placeholder="••••••••"
            value={form.password}
            error={errores.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <Input
            name="telefono"
            label="Teléfono (opcional)"
            placeholder="+54 9 11 ..."
            value={form.telefono ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          />

          {formError && <p className="text-sm text-error">{formError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={crear.isPending}>
              Crear chofer
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
