import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
import { MapaRuta } from '../components/MapaRuta'
import type { Ruta } from '@/types/api'

const POR_PAGINA = 100

export function RutaNuevaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const plantilla = (location.state as { plantilla?: Ruta } | null)?.plantilla
  const crear = useCreateRuta()

  const { data, isLoading, isError, error } = useEntregas({
    estado: 'pendiente',
    por_pagina: POR_PAGINA,
  })

  const [nombre, setNombre] = useState(plantilla?.nombre ?? '')
  const [origen, setOrigen] = useState(plantilla?.origen_descripcion ?? '')
const [origenCoords, setOrigenCoords] = useState<{ latitud: number; longitud: number } | null>(null)

// Geocodifica el origen con Nominatim cuando el usuario deja de escribir
useEffect(() => {
  if (!origen || origen.length < 8) {
    setOrigenCoords(null)
    return
  }
  const timer = setTimeout(async () => {
    try {
      const query = encodeURIComponent(`${origen}, Argentina`)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`)
      const data = await res.json()
      if (data[0]) {
        setOrigenCoords({
          latitud: parseFloat(data[0].lat),
          longitud: parseFloat(data[0].lon)
        })
      }
    } catch {
      setOrigenCoords(null)
    }
  }, 800) // espera 800ms después de que el usuario deja de escribir
  return () => clearTimeout(timer)
}, [origen])
  const [fechaProgramada, setFechaProgramada] = useState(() => new Date().toISOString().slice(0, 10))
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [guardarPlantilla, setGuardarPlantilla] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const entregas = data?.entregas ?? []
  const entregasSeleccionadas = entregas.filter((entrega) => seleccion.has(entrega.id))

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
        fecha_programada: fechaProgramada,
        guardar_plantilla: guardarPlantilla,
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

      {plantilla && (
        <Card className="mb-5 border-brand/40 bg-brand-tint">
          <p className="text-sm font-semibold text-white">Plantilla cargada: {plantilla.nombre}</p>
          <p className="mt-1 text-xs text-gray-mid">
            Se precargaron el nombre y el origen. Ahora seleccioná las entregas reales de esta salida.
          </p>
        </Card>
      )}

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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-mid">
            <input type="checkbox" checked={guardarPlantilla} onChange={(e) => setGuardarPlantilla(e.target.checked)} className="accent-brand" />
            Guardar como plantilla para reutilizar este recorrido
          </label>
          <Input
            name="origen"
            label="Punto de origen (depósito / dirección)"
            placeholder="Av. Corrientes 1234, CABA"
            value={origen}
            error={errores.origen}
            onChange={(e) => setOrigen(e.target.value)}
          />
          <Input
            name="fechaProgramada"
            label="Fecha programada"
            type="date"
            value={fechaProgramada}
            onChange={(e) => setFechaProgramada(e.target.value)}
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

        {entregasSeleccionadas.length > 0 && (
          <section>
            <h2 className="mb-1 text-sm font-semibold text-white">Vista previa del recorrido</h2>
            <p className="mb-2 text-xs text-gray-mid">Las ubicaciones se ajustan al optimizar la ruta.</p>
            <MapaRuta
              origen={{ descripcion: origen, latitud: origenCoords?.latitud, longitud: origenCoords?.longitud }}
              paradas={entregasSeleccionadas.map((entrega, index) => ({
                orden: index + 1,
                cliente: entrega.cliente_nombre ?? 'Cliente',
                direccion: entrega.direccion_descripcion ?? 'Dirección',
              }))}
            />
          </section>
        )}

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
