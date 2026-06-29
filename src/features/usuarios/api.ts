import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Usuario, UsuarioInput, UsuariosQuery } from '@/types/api'

const KEYS = {
  all: ['usuarios'] as const,
  list: (query: UsuariosQuery) => [...KEYS.all, 'list', query] as const,
}

/* ---------- Llamadas HTTP ---------- */

/** GET /auth/usuarios — devuelve un array plano (sin paginar). */
async function getUsuarios(query: UsuariosQuery): Promise<Usuario[]> {
  const { data } = await apiClient.get<Usuario[]>('/auth/usuarios', {
    params: query,
  })
  return data
}

async function createUsuario(payload: UsuarioInput): Promise<Usuario> {
  const { data } = await apiClient.post<Usuario>('/auth/usuarios', payload)
  return data
}

async function desactivarUsuario(id: string): Promise<Usuario> {
  const { data } = await apiClient.patch<Usuario>(`/auth/usuarios/${id}/desactivar`)
  return data
}

/* ---------- Hooks ---------- */

export function useUsuarios(query: UsuariosQuery = {}) {
  return useQuery({
    queryKey: KEYS.list(query),
    queryFn: () => getUsuarios(query),
  })
}

export function useCreateUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createUsuario,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDesactivarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: desactivarUsuario,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
