import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { useClientes } from '@/features/clientes/api'
import type { Entrega, EntregaInput } from '@/types/api'

interface EntregaFormProps {
  initial?: Entrega
  submitting?: boolean
  errorMessage?: string
  onSubmit: (data: EntregaInput) => void
  onCancel: () => void
}

export function EntregaForm({
  initial,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: EntregaFormProps) {
  // Para elegir cliente y dirección necesitamos el catálogo de clientes activos.
  const { data: clientesData, isLoading: loadingClientes } = useClientes({
    por_pagina: 100,
  })
  const clientes = clientesData?.clientes ?? []

  const [clienteId, setClienteId] = useState(initial?.cliente_id ?? '')
  const [direccionId, setDireccionId] = useState(initial?.direccion_id ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [bultos, setBultos] = useState(initial?.bultos?.toString() ?? '1')
  const [pesoKg, setPesoKg] = useState(initial?.peso_kg?.toString() ?? '')
  const [fecha, setFecha] = useState(initial?.fecha_estimada ?? '')
  const [observaciones, setObservaciones] = useState(initial?.observaciones ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const direccionesDelCliente = useMemo(() => {
    const cliente = clientes.find((c) => c.id === clienteId)
    return cliente?.direcciones ?? []
  }, [clientes, clienteId])

  function handleClienteChange(value: string) {
    setClienteId(value)
    // Al cambiar de cliente, reseteamos la dirección (pertenece al cliente anterior).
    const cliente = clientes.find((c) => c.id === value)
    const principal = cliente?.direcciones.find((d) => d.es_principal) ?? cliente?.direcciones[0]
    setDireccionId(principal?.id ?? '')
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!clienteId) next.cliente = 'Elegí un cliente'
    if (!direccionId) next.direccion = 'Elegí una dirección'
    if (!descripcion.trim()) next.descripcion = 'Describí el pedido'
    if (bultos && Number(bultos) < 1) next.bultos = 'Debe ser 1 o más'
    if (pesoKg && Number(pesoKg) < 0) next.peso = 'Peso inválido'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      cliente_id: clienteId,
      direccion_id: direccionId,
      descripcion: descripcion.trim(),
      bultos: bultos ? Number(bultos) : undefined,
      peso_kg: pesoKg ? Number(pesoKg) : undefined,
      fecha_estimada: fecha || undefined,
      observaciones: observaciones.trim() || undefined,
    })
  }

  if (loadingClientes) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={28} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        name="cliente"
        label="Cliente *"
        placeholder="Seleccioná un cliente"
        value={clienteId}
        onChange={(e) => handleClienteChange(e.target.value)}
        error={errors.cliente}
        options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
      />

      <Select
        name="direccion"
        label="Dirección de entrega *"
        placeholder={clienteId ? 'Seleccioná una dirección' : 'Elegí un cliente primero'}
        value={direccionId}
        onChange={(e) => setDireccionId(e.target.value)}
        error={errors.direccion}
        disabled={!clienteId}
        options={direccionesDelCliente.map((d) => ({
          value: d.id ?? '',
          label: d.es_principal ? `${d.descripcion} (principal)` : d.descripcion,
        }))}
      />

      <Input
        name="descripcion"
        label="Descripción del pedido *"
        placeholder="Ej: Caja de repuestos"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        error={errors.descripcion}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          name="bultos"
          type="number"
          min={1}
          label="Bultos"
          value={bultos}
          onChange={(e) => setBultos(e.target.value)}
          error={errors.bultos}
        />
        <Input
          name="peso"
          type="number"
          min={0}
          step="0.1"
          label="Peso (kg)"
          placeholder="Opcional"
          value={pesoKg}
          onChange={(e) => setPesoKg(e.target.value)}
          error={errors.peso}
        />
      </div>

      <Input
        name="fecha"
        type="date"
        label="Fecha estimada"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="observaciones" className="text-xs font-medium text-gray-mid">
          Observaciones (opcional)
        </label>
        <textarea
          id="observaciones"
          name="observaciones"
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej: entregar por portón trasero"
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
          {initial ? 'Guardar cambios' : 'Crear entrega'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}