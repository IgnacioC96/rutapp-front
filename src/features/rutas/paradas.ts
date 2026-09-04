import type { Parada } from '@/types/api'

export function getParadaId(parada: Parada): string | undefined {
  return parada.parada_id ?? parada.id ?? parada.entrega_id ?? undefined
}

export function getParadaKey(parada: Parada, index: number): string {
  return getParadaId(parada) ?? `${parada.orden}-${index}`
}

export function esParadaEntrega(parada: Parada): boolean {
  return !parada.es_parada_extra && Boolean(parada.entrega_id)
}

export function getParadaTitulo(parada: Parada): string {
  return parada.es_parada_extra
    ? parada.descripcion_extra?.trim() || 'Parada operativa'
    : parada.cliente?.trim() || 'Cliente'
}

export function getParadaDireccion(parada: Parada): string {
  return parada.direccion_extra?.trim() || parada.direccion?.trim() || 'Sin direccion'
}
