import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getApiErrorMessage } from '@/lib/apiClient'
import { cn } from '@/lib/cn'
import { useEntregas } from '@/features/entregas/api'
import { useCreateRuta } from '../api'

const POR_PAGINA = 100

export function RutaNuevaPage() {
  const navigate = useNavigate()
  const crear = useCreateRuta()

  const { data, isLoading, isError, error } = useEntregas({
    estado: 'pendiente',
    por_pagina: POR_PAGINA,
  })

  const [nombre, setNombre] = useState('')
  const [origen, setOrigen] = useState('')
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const entregas = data?.entregas ?? []

  function toggle(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!nombre.trim()) e.nombre = 'Ingresá un nombre para la ruta'
    if (!origen.trim()) e.origen = 'Ingresá el punto de origen'
    if (seleccion.size === 0) e.entregas = 'Seleccioná al menos una entrega'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setFormError(null)
    if (!validar()) return
    crear.mutate(
      {
        nombre: nombre.trim(),
        entregas_ids: Array.from(seleccion),
        origen_descripcion: origen.trim(),
      },
      {
        onSuccess: (ruta) => navigate(`/admin/rutas/${ruta.id}`, { replace: true }),
        onError: (err) => setFormError(getApiErrorMessage(err, 'No se pudo crear la ruta')),
      },
    )
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate('/admin/rutas')}
        className="mb-4 text-sm text-gray-mid hover:text-white"
      >
        ← Volver a rutas
      </button>

      <h1 className="mb-1 text-lg font-bold text-white">Nueva ruta</h1>
      <p className="mb-5 text-sm text-gray-mid">
        Elegí las entregas pendientes y el origen. El sistema calcula el orden óptimo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="space-y-3">
          <Input
            name="nombre"
            label="Nombre de la ruta"
            placeholder="Ruta zona norte — martes"
            value={nombre}
            error={errores.nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <Input
            name="origen"
            label="Punto de origen (depósito / dirección)"
            placeholder="Av. Corrientes 1234, CABA"
            value={origen}
            error={errores.origen}
            onChange={(e) => setOrigen(e.target.value)}
          />
        </Card>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Entregas pendientes</h2>
            <span className="text-xs text-gray-mid">{seleccion.size} seleccionada(s)</span>
          </div>

          {isLoading && (
            <div className="flex justify-center py-10">
              <Spinner size={24} />
            </div>
          )}

          {isError && (
            <p className="rounded-card border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
              {getApiErrorMessage(error, 'No se pudieron cargar las entregas')}
            </p>
          )}

          {data && entregas.length === 0 && (
            <EmptyState
              title="No hay entregas pendientes"
              description="Cargá entregas antes de planificar una ruta."
            />
          )}

          {entregas.length > 0 && (
            <div className="space-y-2">
              {entregas.map((entrega) => {
                const checked = seleccion.has(entrega.id)
                return (
                  <button
                    type="button"
                    key={entrega.id}
                    onClick={() => toggle(entrega.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors',
                      checked
                        ? 'border-brand bg-brand-tint'
                        : 'border-stroke bg-card hover:border-gray-dark',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded border text-xs',
                        checked ? 'border-brand bg-brand text-white' : 'border-gray-dark',
                      )}
                    >
                      {checked ? '✓' : ''}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {entrega.cliente_nombre ?? 'Cliente'} — {entrega.descripcion}
                      </p>
                      {entrega.direccion_descripcion && (
                        <p className="truncate text-xs text-gray-mid">
                          {entrega.direccion_descripcion}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {errores.entregas && <p className="mt-2 text-sm text-error">{errores.entregas}</p>}
        </div>

        {formError && <p className="text-sm text-error">{formError}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/rutas')}>
            Cancelar
          </Button>
          <Button type="submit" loading={crear.isPending}>
            Crear y optimizar ruta
          </Button>
        </div>
      </form>
    </AppShell>
  )
}
