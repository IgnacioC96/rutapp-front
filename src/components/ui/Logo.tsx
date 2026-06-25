import { cn } from '@/lib/cn'
import { LOGO_B64 } from '@/assets/logoB64'

/** Logo oficial de rutapp embebido en base64 (no requiere servidor de imágenes). */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_B64}
      alt="rutapp"
      width={size}
      height={size}
      className={cn('object-contain', className)}
    />
  )
}