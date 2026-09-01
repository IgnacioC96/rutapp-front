import { useState, type FormEvent } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useUsuarios } from '@/features/usuarios/api'
import { useCreateVehiculo, useDeleteVehiculo, useUpdateVehiculo, useVehiculos } from '@/features/flota/api'
import type { Vehiculo, VehiculoCreateInput, VehiculoUpdateInput } from '@/types/api'

const ESTADOS = [{ value: 'disponible', label: 'Disponible' }, { value: 'en_ruta', label: 'En ruta' }, { value: 'mantenimiento', label: 'Mantenimiento' }] as const
const estadoTone = { disponible: 'success', en_ruta: 'brand', mantenimiento: 'warning' } as const

type VehiculoFormPayload = { patente: string; marca_modelo: string; capacidad_kg: number; estado: Vehiculo['estado']; chofer_id?: string }

function VehiculoForm({ initial, choferes, submitting, errorMessage, onSubmit, onCancel }: { initial?: Vehiculo; choferes: { id: string; nombre: string; activo: boolean }[]; submitting: boolean; errorMessage?: string; onSubmit: (payload: VehiculoFormPayload) => void; onCancel: () => void }) {
  const [patente, setPatente] = useState(initial?.patente ?? '')
  const [marcaModelo, setMarcaModelo] = useState(initial?.marca_modelo ?? '')
  const [capacidad, setCapacidad] = useState(initial?.capacidad_kg?.toString() ?? '')
  const [estado, setEstado] = useState<Vehiculo['estado']>(initial?.estado ?? 'disponible')
  const [choferId, setChoferId] = useState(initial?.chofer_id ?? '')
  const [error, setError] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const capacidadKg = Number(capacidad)
    if (!patente.trim() || !marcaModelo.trim() || !Number.isFinite(capacidadKg) || capacidadKg <= 0) { setError('Completá patente, marca/modelo y una capacidad mayor a 0.'); return }
    onSubmit({ patente: patente.trim().toUpperCase(), marca_modelo: marcaModelo.trim(), capacidad_kg: capacidadKg, estado, chofer_id: choferId || undefined })
  }
  return <form className="space-y-3" onSubmit={submit}>
    <Input label="Patente *" name="patente" value={patente} onChange={(e) => setPatente(e.target.value)} placeholder="AB 123 CD" disabled={Boolean(initial)} />
    <Input label="Marca y modelo *" name="marca_modelo" value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} placeholder="Fiat Ducato" />
    <Input label="Capacidad (kg) *" name="capacidad" type="number" min="1" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} placeholder="1000" />
    {initial && <Select label="Estado" name="estado" options={ESTADOS.map((item) => ({ ...item }))} value={estado} onChange={(e) => setEstado(e.target.value as Vehiculo['estado'])} />}
    <Select label="Chofer asignado" name="chofer" placeholder="Sin asignar" options={choferes.filter((c) => c.activo).map((c) => ({ value: c.id, label: c.nombre }))} value={choferId} onChange={(e) => setChoferId(e.target.value)} />
    {(error || errorMessage) && <p className="rounded-card bg-error/10 px-3 py-2 text-sm text-error">{error || errorMessage}</p>}
    <div className="flex justify-end gap-2 pt-1"><Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button><Button type="submit" loading={submitting}>{initial ? 'Guardar cambios' : 'Agregar vehículo'}</Button></div>
  </form>
}

export function GestionFlotaPage() {
  const [estado, setEstado] = useState(''); const [choferId, setChoferId] = useState(''); const [editing, setEditing] = useState<Vehiculo>(); const [formOpen, setFormOpen] = useState(false); const [deleting, setDeleting] = useState<Vehiculo>()
  const { data: choferes = [] } = useUsuarios({ rol: 'chofer' })
  const query = { ...(estado ? { estado: estado as Vehiculo['estado'] } : {}), ...(choferId ? { chofer_id: choferId } : {}) }
  const { data: vehiculos, isLoading, isError, error } = useVehiculos(query); const create = useCreateVehiculo(); const update = useUpdateVehiculo(editing?.id ?? ''); const remove = useDeleteVehiculo()
  const choferNombre = (id?: string | null) => choferes.find((chofer) => chofer.id === id)?.nombre ?? 'Sin asignar'
  const closeForm = () => { setFormOpen(false); setEditing(undefined) }
  const save = (payload: VehiculoFormPayload) => {
    if (editing) {
      const updatePayload: VehiculoUpdateInput = { marca_modelo: payload.marca_modelo, capacidad_kg: payload.capacidad_kg, estado: payload.estado, chofer_id: payload.chofer_id || null }
      update.mutate(updatePayload, { onSuccess: closeForm })
    } else {
      const createPayload: VehiculoCreateInput = { patente: payload.patente, marca_modelo: payload.marca_modelo, capacidad_kg: payload.capacidad_kg, chofer_id: payload.chofer_id }
      create.mutate(createPayload, { onSuccess: closeForm })
    }
  }
  const labelEstado = (value: Vehiculo['estado']) => ESTADOS.find((item) => item.value === value)?.label
  return <AppShell>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-lg font-bold text-white">Gestión de flota</h1><p className="text-sm text-gray-mid">Administrá vehículos, disponibilidad y asignaciones.</p></div><Button onClick={() => setFormOpen(true)}>+ Agregar vehículo</Button></div>
    <div className="mb-4 grid gap-2 sm:grid-cols-2"><Select label="Filtrar por estado" name="filtro-estado" placeholder="Todos los estados" options={ESTADOS.map((item) => ({ ...item }))} value={estado} onChange={(e) => setEstado(e.target.value)} /><Select label="Filtrar por chofer" name="filtro-chofer" placeholder="Todos los choferes" options={choferes.map((c) => ({ value: c.id, label: c.nombre }))} value={choferId} onChange={(e) => setChoferId(e.target.value)} /></div>
    {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}
    {isError && <p className="rounded-card bg-error/10 px-3 py-2 text-sm text-error">{getApiErrorMessage(error, 'No se pudieron cargar los vehículos')}</p>}
    {!isLoading && !isError && vehiculos?.length === 0 && <EmptyState title="No hay vehículos para mostrar" description="Agregá un vehículo para comenzar a gestionar tu flota." action={<Button onClick={() => setFormOpen(true)}>Agregar vehículo</Button>} />}
    {!!vehiculos?.length && <><div className="hidden overflow-hidden rounded-card border border-stroke md:block"><table className="w-full text-left text-sm"><thead className="bg-surface text-xs text-gray-mid"><tr><th className="px-4 py-3">Patente</th><th className="px-4 py-3">Vehículo</th><th className="px-4 py-3">Capacidad</th><th className="px-4 py-3">Chofer</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3" /></tr></thead><tbody>{vehiculos.map((v) => <tr key={v.id} className="border-t border-stroke"><td className="px-4 py-4 font-semibold text-white">{v.patente}</td><td className="px-4 py-4 text-gray-mid">{v.marca_modelo}</td><td className="px-4 py-4 text-gray-mid">{v.capacidad_kg.toLocaleString('es-AR')} kg</td><td className="px-4 py-4 text-gray-mid">{choferNombre(v.chofer_id)}</td><td className="px-4 py-4"><Badge tone={estadoTone[v.estado]}>{labelEstado(v.estado)}</Badge></td><td className="px-4 py-4"><div className="flex justify-end gap-2"><button className="text-xs font-semibold text-brand hover:underline" onClick={() => { setEditing(v); setFormOpen(true) }}>Editar</button><button className="text-xs font-semibold text-error hover:underline" onClick={() => setDeleting(v)}>Eliminar</button></div></td></tr>)}</tbody></table></div><div className="space-y-2 md:hidden">{vehiculos.map((v) => <Card key={v.id}><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-white">{v.patente}</p><p className="text-sm text-gray-mid">{v.marca_modelo} · {v.capacidad_kg} kg</p><p className="mt-1 text-xs text-gray-mid">{choferNombre(v.chofer_id)}</p></div><Badge tone={estadoTone[v.estado]}>{labelEstado(v.estado)}</Badge></div><div className="mt-3 flex gap-3"><button className="text-xs font-semibold text-brand" onClick={() => { setEditing(v); setFormOpen(true) }}>Editar</button><button className="text-xs font-semibold text-error" onClick={() => setDeleting(v)}>Eliminar</button></div></Card>)}</div></>}
    <Modal open={formOpen} onClose={closeForm} title={editing ? 'Editar vehículo' : 'Agregar vehículo'}><VehiculoForm key={editing?.id ?? 'nuevo'} initial={editing} choferes={choferes} submitting={create.isPending || update.isPending} errorMessage={create.isError ? getApiErrorMessage(create.error, 'No se pudo crear el vehículo') : update.isError ? getApiErrorMessage(update.error, 'No se pudo guardar el vehículo') : undefined} onSubmit={save} onCancel={closeForm} /></Modal>
    <Modal open={Boolean(deleting)} onClose={() => setDeleting(undefined)} title="Eliminar vehículo"><p className="mb-4 text-sm text-gray-mid">¿Querés eliminar {deleting?.patente}? Esta acción no se puede deshacer.</p><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDeleting(undefined)} disabled={remove.isPending}>Cancelar</Button><Button loading={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) })}>Eliminar</Button></div>{remove.isError && <p className="mt-3 text-sm text-error">{getApiErrorMessage(remove.error, 'No se pudo eliminar el vehículo')}</p>}</Modal>
  </AppShell>
}
