import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'success' | 'warning' | 'error' | 'neutral' | 'brand'

const tones: Record<Tone, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  brand: 'bg-brand/15 text-brand',
  neutral: 'bg-gray-mid/15 text-gray-mid',
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}