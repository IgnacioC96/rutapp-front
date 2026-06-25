import type { ReactNode } from 'react'

/** Estado vacío genérico para listados sin resultados. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-stroke px-6 py-12 text-center">
      <p className="font-semibold text-white">{title}</p>
      {description && <p className="max-w-sm text-sm text-gray-mid">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}