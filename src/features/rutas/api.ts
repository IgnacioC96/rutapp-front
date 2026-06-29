import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  Ruta,
  RutaAsignarInput,
  RutaInput,
  RutasListResponse,
  RutasQuery,
} from '@/types/api'

const KEYS = {
  all: ['rutas'] as const,
  list: (query: RutasQuery) => [...KEYS.all, 'list', query] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
}

/* ---------- Llamadas HTTP ---------- */

async function getRutas(query: RutasQuery): Promise<RutasListResponse> {
  const { data } = await apiClient.get<RutasListResponse>('/rutas', { params: query })
  return data
}

async function getRuta(id: string): Promise<Ruta> {
  const { data } = await apiClient.get<Ruta>(`/rutas/${id}`)
  return data
}

/** POST /rutas — crea la ruta y devuelve las paradas ya optimizadas. */
async function createRuta(payload: RutaInput): Promise<Ruta> {
  const { data } = await apiClient.post<Ruta>('/rutas', payload)
  return data
}

async function asignarChofer(id: string, payload: RutaAsignarInput): Promise<Ruta> {
  const { data } = await apiClient.patch<Ruta>(`/rutas/${id}/asignar`, payload)
  return data
}

/* ---------- Hooks ---------- */

export function useRutas(query: RutasQuery = {}) {
  return useQuery({
    queryKey: KEYS.list(query),
    queryFn: () => getRutas(query),
  })
}

export function useRuta(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ''),
    queryFn: () => getRuta(id!),
    enabled: Boolean(id),
  })
}

export function useCreateRuta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createRuta,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      // Las entregas pasan a "en_curso" al crear la ruta.
      qc.invalidateQueries({ queryKey: ['entregas'] })
    },
  })
}

export function useAsignarChofer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RutaAsignarInput) => asignarChofer(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
