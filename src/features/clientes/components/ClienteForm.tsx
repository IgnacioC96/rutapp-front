import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { divIcon, type LatLngExpression } from 'leaflet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import type { Cliente, ClienteInput, Direccion } from '@/types/api'
import 'leaflet/dist/leaflet.css'

interface ClienteFormProps {
  initial?: Cliente
  submitting?: boolean
  errorMessage?: string
  onSubmit: (data: ClienteInput) => void
  onCancel: () => void
}

const MAX_DIRECCIONES = 3
const WHATSAPP_REGEX = /^\+\d{10,15}$/
const CABA: LatLngExpression = [-34.6037, -58.3816]
const PIN_ICON = divIcon({ className: '', html: '<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:#f26522;border:3px solid white;transform:rotate(-45deg);box-shadow:0 1px 4px #000"></span>', iconSize: [22, 22], iconAnchor: [11, 22] })

interface ResultadoNominatim {
  lat: string
  lon: string
}

function CentrarMapa({ posicion }: { posicion: LatLngExpression }) {
  const map = useMap()
  useEffect(() => { map.setView(posicion) }, [map, posicion])
  return null
}

function SeleccionarPunto({ onChange }: { onChange: (latitud: number, longitud: number) => void }) {
  useMapEvents({ click: (event) => onChange(event.latlng.lat, event.latlng.lng) })
  return null
}

function PinDireccion({ direccion, onChange }: { direccion: Direccion; onChange: (latitud: number, longitud: number) => void }) {
  const posicion: LatLngExpression = direccion.latitud != null && direccion.longitud != null ? [direccion.latitud, direccion.longitud] : CABA
  const [estadoBusqueda, setEstadoBusqueda] = useState<'idle' | 'buscando' | 'sin_resultado'>('idle')
  const onChangeRef = useRef(onChange)
  const descripcionInicial = useRef(direccion.descripcion.trim())
  const teniaCoordenadasIniciales = useRef(direccion.latitud != null && direccion.longitud != null)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    const direccionTexto = direccion.descripcion.trim()
    if (direccionTexto.length < 6 || (direccionTexto === descripcionInicial.current && teniaCoordenadasIniciales.current)) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setEstadoBusqueda('buscando')
      const params = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'ar', q: direccionTexto })
      fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() as Promise<ResultadoNominatim[]> : Promise.reject(new Error('Nominatim no respondió')))
        .then((resultados) => {
          const resultado = resultados[0]
          if (!resultado) { setEstadoBusqueda('sin_resultado'); return }
          const latitud = Number(resultado.lat)
          const longitud = Number(resultado.lon)
          if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) { setEstadoBusqueda('sin_resultado'); return }
          onChangeRef.current(latitud, longitud)
          setEstadoBusqueda('idle')
        })
        .catch((error: unknown) => { if ((error as DOMException).name !== 'AbortError') setEstadoBusqueda('sin_resultado') })
    }, 700)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [direccion.descripcion])

  return <div className="overflow-hidden rounded-card border border-stroke">
    <MapContainer center={posicion} zoom={13} scrollWheelZoom={false} className="h-48 w-full" aria-label="Mapa para ubicar la dirección" whenReady={() => undefined}>
      <CentrarMapa posicion={posicion} /><SeleccionarPunto onChange={onChange} />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={posicion} draggable icon={PIN_ICON} eventHandlers={{ dragend: (event) => { const punto = event.target.getLatLng(); onChange(punto.lat, punto.lng) } }} />
    </MapContainer>
    <p className="px-3 py-2 text-xs text-gray-mid">{estadoBusqueda === 'buscando' ? 'Buscando la dirección…' : estadoBusqueda === 'sin_resultado' ? 'No encontramos la dirección; ubicá el pin manualmente.' : 'Hacé clic en el mapa o arrastrá el pin para ajustar la ubicación.'}</p>
  </div>
}

function emptyDireccion(es_principal = false): Direccion {
  return { descripcion: '', referencia: '', es_principal }
}

export function ClienteForm({
  initial,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: ClienteFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [telefono, setTelefono] = useState(initial?.telefono_whatsapp ?? '')
  const [cuit, setCuit] = useState(initial?.cuit ?? '')
  const [notas, setNotas] = useState(initial?.notas ?? '')
  const [direcciones, setDirecciones] = useState<Direccion[]>(
    initial?.direcciones?.length ? initial.direcciones : [emptyDireccion(true)],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  function updateDireccion(index: number, patch: Partial<Direccion>) {
    setDirecciones((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function setPrincipal(index: number) {
    setDirecciones((prev) => prev.map((d, i) => ({ ...d, es_principal: i === index })))
  }

  function addDireccion() {
    if (direcciones.length >= MAX_DIRECCIONES) return
    setDirecciones((prev) => [...prev, emptyDireccion(false)])
  }

  function removeDireccion(index: number) {
    setDirecciones((prev) => {
      const next = prev.filter((_, i) => i !== index)
      // Garantizar que siempre haya una principal.
      if (!next.some((d) => d.es_principal) && next.length > 0) {
        next[0] = { ...next[0], es_principal: true }
      }
      return next
    })
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!nombre.trim()) next.nombre = 'El nombre es obligatorio'
    if (!telefono.trim()) {
      next.telefono = 'El WhatsApp es obligatorio'
    } else if (!WHATSAPP_REGEX.test(telefono.trim())) {
      next.telefono = 'Formato internacional: +54911XXXXXXXX'
    }
    direcciones.forEach((d, i) => {
      if (!d.descripcion.trim()) next[`dir-${i}`] = 'La dirección no puede estar vacía'
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      nombre: nombre.trim(),
      telefono_whatsapp: telefono.trim(),
      cuit: cuit.trim() || undefined,
      notas: notas.trim() || undefined,
      direcciones: direcciones.map((d) => ({
        ...d,
        descripcion: d.descripcion.trim(),
        referencia: d.referencia?.trim() || undefined,
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        name="nombre"
        label="Nombre / Razón social *"
        placeholder="Juan García"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={errors.nombre}
      />
      <Input
        name="telefono"
        label="WhatsApp *"
        placeholder="+5491155556666"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        error={errors.telefono}
      />
      <Input
        name="cuit"
        label="CUIT (opcional)"
        placeholder="20-12345678-9"
        value={cuit}
        onChange={(e) => setCuit(e.target.value)}
      />

      {/* Direcciones */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-mid">
            Direcciones * (máx. {MAX_DIRECCIONES})
          </span>
          {direcciones.length < MAX_DIRECCIONES && (
            <button
              type="button"
              onClick={addDireccion}
              className="text-xs font-semibold text-brand hover:underline"
            >
              + Agregar dirección
            </button>
          )}
        </div>

        {direcciones.map((dir, i) => (
          <div
            key={i}
            className={cn(
              'flex flex-col gap-2 rounded-card border p-3',
              dir.es_principal ? 'border-brand bg-brand-tint' : 'border-stroke',
            )}
          >
            <Input
              name={`dir-desc-${i}`}
              placeholder="Calle, número, localidad"
              value={dir.descripcion}
              onChange={(e) => updateDireccion(i, { descripcion: e.target.value })}
              error={errors[`dir-${i}`]}
            />
            <PinDireccion direccion={dir} onChange={(latitud, longitud) => updateDireccion(i, { latitud, longitud })} />
            <Input
              name={`dir-ref-${i}`}
              placeholder="Referencia (piso, depto, indicaciones)"
              value={dir.referencia ?? ''}
              onChange={(e) => updateDireccion(i, { referencia: e.target.value })}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-mid">
                <input
                  type="radio"
                  name="principal"
                  checked={dir.es_principal}
                  onChange={() => setPrincipal(i)}
                  className="accent-brand"
                />
                Dirección principal
              </label>
              {direcciones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDireccion(i)}
                  className="text-xs font-semibold text-error hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notas" className="text-xs font-medium text-gray-mid">
          Notas internas (opcional)
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej: prefiere entregas por la mañana"
          className="w-full resize-none rounded-card border border-stroke bg-card px-3.5 py-2.5 text-sm text-white placeholder:text-gray-dark focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      {errorMessage && (
        <p className="rounded-card bg-error/10 px-3 py-2 text-sm text-error">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={submitting} className="flex-1">
          {initial ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
