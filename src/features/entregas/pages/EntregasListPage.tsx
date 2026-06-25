import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useDebounce } from '@/lib/useDebounce'
import { useClientes } from '@/features/clientes/api'
import type { EstadoEntrega } from '@/types/api'
import { useEntregas } from '../api'
import { ESTADOS_ENTREGA, ESTADO_ENTREGA_META } from '../estado'

const POR_PAGINA = 10

export function EntregasListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoEntrega | ''>('')
  const [clienteId, setClienteId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const debouncedSearch = useDebounce(search)

  const { data: clientesData } = useClientes({ por_pagina: 100 })
  const clientes = clientesData?.clientes ?? []

  const { data, isLoading, isError, error, isFetching } = useEntregas({
    search: debouncedSearch || undefined,
    estado: estado || undefined,
    cliente_id: clienteId || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    pagina,
    por_pagina: POR_PAGINA,
  })

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.por_pagina)) : 1

  function resetPagina<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value)
      setPagina(1)
    }
  }

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Entregas</h1>
          <p className="text-sm text-gray-mid">
            {data ? `${data.total} entrega(s)` : 'Gestión de entregas'}
          </p>
        </div>
        <Button onClick={() => navigate('/admin/entregas/nueva')}>+ Nueva entrega</Button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3">
        <Input
          name="search"
          placeholder="Buscar por cliente, descripción o #ID…"
          value={search}
          onChange={(e) => resetPagina(setSearch)(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            name="estado"
            placeholder="Todos los estados"
            value={estado}
            onChange={(e) => resetPagina(setEstado)(e.target.value as EstadoEntrega | '')}
            options={ESTADOS_ENTREGA.map((e) => ({
              value: e,
              label: ESTADO_ENTREGA_META[e].label,
            }))}
          />
          <Select
            name="cliente"
            placeholder="Todos los clientes"
            value={clienteId}
            onChange={(e) => resetPagina(setClienteId)(e.target.value)}
            options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
          />
          <Input
            name="fecha_desde"
            type="date"
            label="Desde"
            value={fechaDesde}
            onChange={(e) => resetPagina(setFechaDesde)(e.target.value)}
          />
          <Input
            name="fecha_hasta"
            type="date"
            label="Hasta"
            value={fechaHasta}
            onChange={(e) => resetPagina(setFechaHasta)(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {isError && (
        <p className="rounded-card bg-error/10 px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'No se pudieron cargar las entregas')}
        </p>
      )}

      {data && data.entregas.length === 0 && (
        <EmptyState
          title="Sin entregas"
          description="No hay entregas que coincidan con los filtros."
        />
      )}

      {data && data.entregas.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.entregas.map((entrega) => {
            const meta = ESTADO_ENTREGA_META[entrega.estado]
            return (
              <Link key={entrega.id} to={`/admin/entregas/${entrega.id}`}>
                <Card className="transition-colors hover:border-gray-dark">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {entrega.cliente_nombre ?? 'Cliente'}
                      </p>
                      <p className="truncate text-sm text-gray-mid">{entrega.descripcion}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-dark">
                        {entrega.direccion_descripcion ?? '—'}
                        {entrega.fecha_estimada && ` · ${entrega.fecha_estimada}`}
                      </p>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {data && totalPaginas > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            disabled={pagina <= 1 || isFetching}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-mid">
            {pagina} / {totalPaginas}
          </span>
          <Button
            variant="secondary"
            disabled={pagina >= totalPaginas || isFetching}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </AppShell>
  )
}