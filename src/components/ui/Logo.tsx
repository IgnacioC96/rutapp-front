import { cn } from '@/lib/cn'
import { LOGO_B64 } from '@/assets/logoB64'

/** Logo oficial de rutapp embebido en base64 (no requiere servidor de imágenes). */
export function Logo({
  size = 32,
  className,
  markOnly = false,
}: {
  size?: number
  className?: string
  /** Muestra sólo el isotipo R/pin, sin la leyenda incluida en la imagen. */
  markOnly?: boolean
}) {
  if (markOnly) {
    return (
      <span
        aria-label="rutapp"
        role="img"
        style={{ width: size, height: size }}
        className={cn('inline-block shrink-0 overflow-hidden', className)}
      >
        <img
          src={LOGO_B64}
          alt=""
          className="size-full max-w-none scale-[1.72] origin-[50%_22.5%]"
        />
      </span>
    )
  }

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
