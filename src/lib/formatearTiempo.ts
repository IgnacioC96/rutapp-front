/** Convierte minutos a una etiqueta breve y legible para la interfaz. */
export function formatearTiempo(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos < 0) return '0 min'
  const total = Math.round(minutos)
  if (total < 60) return `${total} min`
  const horas = Math.floor(total / 60)
  const minutosRestantes = total % 60
  return minutosRestantes ? `${horas}h ${minutosRestantes}min` : `${horas}h`
}
