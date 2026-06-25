import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold ' +
  'transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-brand/60'

const variants: Record<Variant, string> = {
  primary: 'rounded-btn bg-brand text-white hover:bg-brand/90',
  secondary:
    'rounded-btn border border-stroke bg-card text-white hover:border-gray-dark',
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  )
}