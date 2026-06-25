import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-gray-mid">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-card border bg-card px-3.5 py-2.5 text-sm text-white',
          'placeholder:text-gray-dark focus:outline-none focus:ring-2',
          error
            ? 'border-error focus:ring-error/40'
            : 'border-stroke focus:border-brand focus:ring-brand/30',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
})