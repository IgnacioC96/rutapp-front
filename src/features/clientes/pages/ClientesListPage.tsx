import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useDebounce } from '@/lib/useDebounce'
import { useClientes } from '../api'

const POR_PAGINA = 10

export function ClientesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [pagina, setPagina] = useState(1)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading, isError, error, isFetching } = useClientes({
    search: debouncedSearch || undefined,
    pagina,
    por_pagina: POR_PAGINA,
  })

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.por_pagina)) : 1

  function handleSearchChange(value: string) {
    setSearch(value)
    setPagina(1)
  }

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Clientes</h1>
          <p className="text-sm text-gray-mid">
            {data ? `${data.total} cliente(s)` : 'Gestión de clientes'}
          </p>
        </div>
        <Button onClick={() => navigate('/admin/clientes/nuevo')}>+ Nuevo cliente</Button>
      </div>

      <div className="mb-4">
        <Input
          name="search"
          placeholder="Buscar por nombre o dirección…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {isError && (
        <p className="rounded-card bg-error/10 px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'No se pudieron cargar los clientes')}
        </p>
      )}

      {data && data.clientes.length === 0 && (
        <EmptyState
          title="Sin clientes"
          description={
            debouncedSearch
              ? 'No hay resultados para tu búsqueda.'
              : 'Todavía no hay clientes cargados.'
          }
          action={
            !debouncedSearch && (
              <Button onClick={() => navigate('/admin/clientes/nuevo')}>
                Cargar el primero
              </Button>
            )
          }
        />
      )}

      {data && data.clientes.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.clientes.map((cliente) => {
            const principal =
              cliente.direcciones.find((d) => d.es_principal) ?? cliente.direcciones[0]
            return (
              <Link key={cliente.id} to={`/admin/clientes/${cliente.id}`}>
                <Card className="transition-colors hover:border-gray-dark">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{cliente.nombre}</p>
                      <p className="truncate text-sm text-gray-mid">
                        {principal?.descripcion ?? 'Sin dirección'}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-dark">
                        {cliente.telefono_whatsapp}
                      </p>
                    </div>
                    <Badge tone="brand">{cliente.total_entregas ?? 0} entregas</Badge>
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