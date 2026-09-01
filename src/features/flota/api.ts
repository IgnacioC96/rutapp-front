import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { Vehiculo, VehiculoCreateInput, VehiculoUpdateInput, VehiculosQuery } from '@/types/api'

const KEYS = {
  all: ['vehiculos'] as const,
  list: (query: VehiculosQuery) => [...KEYS.all, 'list', query] as const,
}

async function getVehiculos(query: VehiculosQuery): Promise<Vehiculo[]> {
  const { data } = await apiClient.get<Vehiculo[] | { vehiculos: Vehiculo[] }>('/vehiculos', { params: query })
  return Array.isArray(data) ? data : data.vehiculos
}

async function createVehiculo(payload: VehiculoCreateInput): Promise<Vehiculo> {
  const { data } = await apiClient.post<Vehiculo>('/vehiculos', payload)
  return data
}

async function updateVehiculo(id: string, payload: VehiculoUpdateInput): Promise<Vehiculo> {
  const { data } = await apiClient.put<Vehiculo>(`/vehiculos/${id}`, payload)
  return data
}

async function deleteVehiculo(id: string): Promise<void> {
  await apiClient.delete(`/vehiculos/${id}`)
}

export function useVehiculos(query: VehiculosQuery = {}) {
  return useQuery({ queryKey: KEYS.list(query), queryFn: () => getVehiculos(query) })
}

function useVehiculosMutation<T>(mutationFn: (payload: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useCreateVehiculo() {
  return useVehiculosMutation(createVehiculo)
}

export function useUpdateVehiculo(id: string) {
  return useVehiculosMutation((payload: VehiculoUpdateInput) => updateVehiculo(id, payload))
}

export function useDeleteVehiculo() {
  return useVehiculosMutation(deleteVehiculo)
}
