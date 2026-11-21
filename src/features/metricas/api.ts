import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { MetricasDashboard } from '@/types/api'

const pad = (n: number) => String(n).padStart(2, '0')
const aFecha = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** GET /metricas/dashboard — solo admin. `dias` = cuántos días hacia atrás (incluye hoy). */
export function useMetricasDashboard(dias: number) {
  const hasta = new Date()
  const desde = new Date()
  desde.setDate(hasta.getDate() - (dias - 1))
  const params = { desde: aFecha(desde), hasta: aFecha(hasta) }
  return useQuery({
    queryKey: ['metricas', 'dashboard', params],
    queryFn: async () => (await apiClient.get<MetricasDashboard>('/metricas/dashboard', { params })).data,
    staleTime: 60_000,
  })
}

/** Avisa al backend que el usuario cambió de pantalla. Nunca interrumpe la app si falla. */
export function registrarNavegacion(url: string, urlAnterior: string | null): void {
  apiClient
    .post('/metricas/navegacion', { url, url_anterior: urlAnterior })
    .catch(() => undefined)
}

/** Marca el fin de la sesión (botón Salir). */
export async function cerrarSesionMetricas(): Promise<void> {
  await apiClient.post('/metricas/sesion/cerrar')
}
