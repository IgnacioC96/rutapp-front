import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
  Ruta,
  RutaAsignarInput,
  RutaInput,
  RutasListResponse,
  RutasQuery,
  SeguimientoRuta,
  UbicacionChofer,
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

async function iniciarRuta(id: string): Promise<Ruta> {
  const { data } = await apiClient.patch<Ruta>(`/rutas/${id}/iniciar`)
  return data
}

async function finalizarRuta(id: string): Promise<Ruta> {
  const { data } = await apiClient.patch<Ruta>(`/rutas/${id}/finalizar`)
  return data
}

async function confirmarEntrega(id: string, entregaId: string, codigo: string): Promise<Ruta> {
  const { data } = await apiClient.patch<Ruta>(`/rutas/${id}/entregas/${entregaId}/confirmar`, { codigo })
  return data
}

async function actualizarUbicacion(id: string, ubicacion: Pick<UbicacionChofer, 'latitud' | 'longitud'>): Promise<Ruta> {
  const { data } = await apiClient.patch<Ruta>(`/rutas/${id}/ubicacion`, ubicacion)
  return data
}

async function getSeguimiento(codigo: string): Promise<SeguimientoRuta> {
  const { data } = await apiClient.get<SeguimientoRuta>(`/seguimiento/${codigo}`)
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

function useRutaAction(mutationFn: () => Promise<Ruta>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      qc.invalidateQueries({ queryKey: ['entregas'] })
    },
  })
}

export function useIniciarRuta(id: string) {
  return useRutaAction(() => iniciarRuta(id))
}

export function useFinalizarRuta(id: string) {
  return useRutaAction(() => finalizarRuta(id))
}

export function useConfirmarEntregaQr(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entregaId, codigo }: { entregaId: string; codigo: string }) => confirmarEntrega(id, entregaId, codigo),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ['entregas'] }) },
  })
}

export function useActualizarUbicacion(id: string) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (ubicacion: Pick<UbicacionChofer, 'latitud' | 'longitud'>) => actualizarUbicacion(id, ubicacion), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) })
}

export function useSeguimiento(codigo: string | undefined) {
  return useQuery({ queryKey: ['seguimiento', codigo], queryFn: () => getSeguimiento(codigo!), enabled: Boolean(codigo), refetchInterval: 15_000 })
}
