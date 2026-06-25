import { cn } from '@/lib/cn'

/** Spinner de carga reutilizable. */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-stroke border-t-brand',
        className,
      )}
      style={{ width: size, height: size }}
    />
  )
}