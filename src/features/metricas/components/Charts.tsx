import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { nf } from '@/features/metricas/format'

/** Gráficos livianos en SVG/HTML, sin librerías externas. Los colores salen de los tokens de la app. */

export function Panel({ titulo, subtitulo, children, className }: { titulo: string; subtitulo?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-card border border-stroke bg-card p-4', className)}>
      <h2 className="text-sm font-semibold text-white">{titulo}</h2>
      {subtitulo && <p className="mt-0.5 text-xs text-gray-mid">{subtitulo}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function Kpi({ titulo, valor, detalle, tono }: { titulo: string; valor: string; detalle?: string; tono?: 'ok' | 'alerta' }) {
  return (
    <div className="rounded-card border border-stroke bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-mid">{titulo}</p>
      <p className={cn('mt-1 text-2xl font-bold', tono === 'alerta' ? 'text-warning' : tono === 'ok' ? 'text-success' : 'text-white')}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-gray-mid">{detalle}</p>}
    </div>
  )
}

/** Barras horizontales con etiqueta y valor. */
export function BarrasHorizontales({ items, vacio = 'Sin datos en el período' }: { items: { etiqueta: string; valor: number }[]; vacio?: string }) {
  if (!items.length) return <p className="text-sm text-gray-mid">{vacio}</p>
  const max = Math.max(...items.map((i) => i.valor), 1)
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.etiqueta}>
          <div className="mb-0.5 flex justify-between gap-3 text-xs">
            <span className="truncate text-white">{i.etiqueta}</span>
            <span className="shrink-0 font-semibold text-gray-mid">{nf.format(i.valor)}</span>
          </div>
          <div className="h-2 rounded-full bg-stroke">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(2, (i.valor / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Líneas en el tiempo (hasta 3 series), con ejes y cuadrícula simples. */
export function LineasTemporales({ etiquetas, series }: { etiquetas: string[]; series: { nombre: string; valores: number[]; clase: string }[] }) {
  const W = 640, H = 300, L = 34, R = 10, T = 10, B = 26
  const max = Math.max(1, ...series.flatMap((s) => s.valores))
  const techo = Math.ceil(max / 10) * 10 || 10
  const n = etiquetas.length
  const x = (i: number) => L + (n <= 1 ? 0 : (i * (W - L - R)) / (n - 1))
  const y = (v: number) => T + (1 - v / techo) * (H - T - B)
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(techo * f))
  const paso = Math.max(1, Math.ceil(n / 8))
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Actividad diaria">
        {marcas.map((m) => (
          <g key={m}>
            <line x1={L} x2={W - R} y1={y(m)} y2={y(m)} className="stroke-stroke" strokeWidth="1" />
            <text x={L - 6} y={y(m) + 3} textAnchor="end" className="fill-gray-mid" fontSize="10">{m}</text>
          </g>
        ))}
        {etiquetas.map((e, i) => (i % paso === 0 ? <text key={e} x={x(i)} y={H - 8} textAnchor="middle" className="fill-gray-mid" fontSize="10">{e}</text> : null))}
        {series.map((s) => (
          <polyline key={s.nombre} fill="none" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" className={s.clase}
            points={s.valores.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-mid">
        {series.map((s) => (
          <span key={s.nombre} className="inline-flex items-center gap-1.5">
            <svg width="16" height="4"><line x1="0" x2="16" y1="2" y2="2" strokeWidth="3" className={s.clase} /></svg>
            {s.nombre}
          </span>
        ))}
      </div>
    </div>
  )
}

const COLORES = ['var(--color-brand)', 'var(--color-success)', 'var(--color-warning)', '#5c9ce6', '#9575cd', 'var(--color-gray-mid)']

/** Gráfico de torta (dona) con leyenda y porcentajes. */
export function Dona({ items }: { items: { etiqueta: string; valor: number }[] }) {
  const total = items.reduce((a, i) => a + i.valor, 0)
  if (!total) return <p className="text-sm text-gray-mid">Sin datos en el período</p>
  const R = 52, C = 2 * Math.PI * R
  const arcos = items.map((i, idx) => {
    const largo = (i.valor / total) * C
    const desde = items.slice(0, idx).reduce((a, x) => a + (x.valor / total) * C, 0)
    return { etiqueta: i.etiqueta, largo, desde, color: COLORES[idx % COLORES.length] }
  })
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0 -rotate-90" role="img" aria-label="Distribución">
        {arcos.map((a) => (
          <circle key={a.etiqueta} cx="70" cy="70" r={R} fill="none" strokeWidth="22" stroke={a.color}
            strokeDasharray={`${a.largo} ${C - a.largo}`} strokeDashoffset={-a.desde} />
        ))}
      </svg>
      <ul className="space-y-1.5 text-xs">
        {items.map((i, idx) => (
          <li key={i.etiqueta} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORES[idx % COLORES.length] }} />
            <span className="text-white">{i.etiqueta}</span>
            <span className="whitespace-nowrap text-gray-mid">{Math.round((i.valor / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Mapa de calor día de la semana x hora. */
export function MapaDeCalor({ matriz }: { matriz: number[][] }) {
  const max = Math.max(1, ...matriz.flat())
  const horas = Array.from({ length: 24 }, (_, h) => h)
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        <div className="ml-9 grid grid-cols-24 gap-[2px] text-[10px] text-gray-mid" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
          {horas.map((h) => <span key={h} className="text-center">{h % 3 === 0 ? h : ''}</span>)}
        </div>
        {matriz.map((fila, d) => (
          <div key={DIAS[d]} className="mt-[2px] flex items-center gap-1">
            <span className="w-8 text-[11px] text-gray-mid">{DIAS[d]}</span>
            <div className="grid flex-1 gap-[2px]" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
              {fila.map((v, h) => (
                <div key={h} title={`${DIAS[d]} ${h}:00 — ${v} visitas`} className="h-7 rounded-[3px] bg-stroke/50"
                  style={v ? { background: 'var(--color-brand)', opacity: 0.15 + 0.85 * (v / max) } : undefined} />
              ))}
            </div>
          </div>
        ))}
        <p className="ml-9 mt-2 text-[11px] text-gray-mid">Visitas por hora (hora argentina). Más intenso = más actividad.</p>
      </div>
    </div>
  )
}

/** Embudo: cada etapa como barra proporcional a la primera, con el % que avanza. */
export function Embudo({ etapas, tonos }: { etapas: { etapa: string; cantidad: number }[]; tonos?: string[] }) {
  const base = Math.max(etapas[0]?.cantidad ?? 0, 1)
  return (
    <ul className="space-y-2.5">
      {etapas.map((e, i) => (
        <li key={e.etapa}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span className="text-white">{e.etapa}</span>
            <span className="text-gray-mid"><b className="text-white">{nf.format(e.cantidad)}</b> · {Math.round((e.cantidad / base) * 100)} %</span>
          </div>
          <div className="h-3 rounded-sm bg-stroke">
            <div className="h-3 rounded-sm" style={{ width: `${Math.max(2, (e.cantidad / base) * 100)}%`, background: tonos?.[i] ?? 'var(--color-brand)' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
