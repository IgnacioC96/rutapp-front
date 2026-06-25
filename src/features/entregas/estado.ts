import type { EstadoEntrega } from '@/types/api'

interface EstadoMeta {
  label: string
  tone: 'success' | 'warning' | 'error' | 'neutral' | 'brand'
}

export const ESTADO_ENTREGA_META: Record<EstadoEntrega, EstadoMeta> = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  en_curso: { label: 'En curso', tone: 'brand' },
  completada: { label: 'Completada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'error' },
}

export const ESTADOS_ENTREGA: EstadoEntrega[] = [
  'pendiente',
  'en_curso',
  'completada',
  'cancelada',
]