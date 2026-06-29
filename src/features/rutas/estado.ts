import type { EstadoRuta } from '@/types/api'

interface EstadoMeta {
  label: string
  tone: 'success' | 'warning' | 'error' | 'neutral' | 'brand'
}

export const ESTADO_RUTA_META: Record<EstadoRuta, EstadoMeta> = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  asignada: { label: 'Asignada', tone: 'brand' },
  en_curso: { label: 'En curso', tone: 'brand' },
  completada: { label: 'Completada', tone: 'success' },
  finalizada: { label: 'Finalizada', tone: 'neutral' },
}
