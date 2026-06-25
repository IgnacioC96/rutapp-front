import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  Entrega,
  EntregaInput,
  EntregasListResponse,
  EntregasQuery,
} from '@/types/api'

const KEYS = {
  all: ['entregas'] as const,
  list: (query: EntregasQuery) => [...KEYS.all, 'list', query] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
}

/* ---------- Llamadas HTTP ---------- */

async function getEntregas(query: EntregasQuery): Promise<EntregasListResponse> {
  const { data } = await apiClient.get<EntregasListResponse>('/entregas', {
    params: query,
  })
  return data
}

async function getEntrega(id: string): Promise<Entrega> {
  const { data } = await apiClient.get<Entrega>(`/entregas/${id}`)
  return data
}

async function createEntrega(payload: EntregaInput): Promise<Entrega> {
  const { data } = await apiClient.post<Entrega>('/entregas', payload)
  return data
}

async function updateEntrega(id: string, payload: EntregaInput): Promise<Entrega> {
  const { data } = await apiClient.put<Entrega>(`/entregas/${id}`, payload)
  return data
}

async function cancelarEntrega(id: string): Promise<Entrega> {
  const { data } = await apiClient.patch<Entrega>(`/entregas/${id}/cancelar`)
  return data
}

async function completarEntrega(id: string): Promise<Entrega> {
  const { data } = await apiClient.patch<Entrega>(`/entregas/${id}/completar`)
  return data
}

/* ---------- Hooks ---------- */

export function useEntregas(query: EntregasQuery) {
  return useQuery({
    queryKey: KEYS.list(query),
    queryFn: () => getEntregas(query),
  })
}

export function useEntrega(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ''),
    queryFn: () => getEntrega(id!),
    enabled: Boolean(id),
  })
}

export function useCreateEntrega() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEntrega,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateEntrega(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: EntregaInput) => updateEntrega(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useCancelarEntrega() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelarEntrega,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useCompletarEntrega() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: completarEntrega,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}