import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  Cliente,
  ClienteInput,
  ClientesListResponse,
  ClientesQuery,
} from '@/types/api'

const KEYS = {
  all: ['clientes'] as const,
  list: (query: ClientesQuery) => [...KEYS.all, 'list', query] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
}

/* ---------- Llamadas HTTP ---------- */

async function getClientes(query: ClientesQuery): Promise<ClientesListResponse> {
  const { data } = await apiClient.get<ClientesListResponse>('/clientes', {
    params: query,
  })
  return data
}

async function getCliente(id: string): Promise<Cliente> {
  const { data } = await apiClient.get<Cliente>(`/clientes/${id}`)
  return data
}

async function createCliente(payload: ClienteInput): Promise<Cliente> {
  const { data } = await apiClient.post<Cliente>('/clientes', payload)
  return data
}

async function updateCliente(id: string, payload: ClienteInput): Promise<Cliente> {
  const { data } = await apiClient.put<Cliente>(`/clientes/${id}`, payload)
  return data
}

async function bajaCliente(id: string): Promise<void> {
  await apiClient.patch(`/clientes/${id}/baja`)
}

/* ---------- Hooks ---------- */

export function useClientes(query: ClientesQuery) {
  return useQuery({
    queryKey: KEYS.list(query),
    queryFn: () => getClientes(query),
  })
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ''),
    queryFn: () => getCliente(id!),
    enabled: Boolean(id),
  })
}

export function useCreateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCliente,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateCliente(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClienteInput) => updateCliente(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useBajaCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bajaCliente,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}