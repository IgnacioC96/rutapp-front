import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useUsuarios } from '@/features/usuarios/api'
import { useRutas } from '@/features/rutas/api'
import { ESTADO_RUTA_META } from '@/features/rutas/estado'

function fechaLocalHoy() {
  const ahora = new Date()
  const ajuste = ahora.getTimezoneOffset() * 60_000
  return new Date(ahora.getTime() - ajuste).toISOString().slice(0, 10)
}

export function DashboardAdmin() {
  const navigate = useNavigate()
  const hoy = fechaLocalHoy()
  const { data: rutasData, isLoading } = useRutas({ fecha_programada: hoy, por_pagina: 100 })
  const { data: choferes } = useUsuarios({ rol: 'chofer' })
  const rutas = rutasData?.rutas ?? []
  const enCurso = rutas.filter((ruta) => ruta.estado === 'en_curso')
  const sinAsignar = rutas.filter((ruta) => !ruta.chofer_id && ruta.estado === 'pendiente')
  const paradas = rutas.reduce((total, ruta) => total + ruta.paradas.length, 0)
  const completadas = rutas.reduce((total, ruta) => total + ruta.paradas.filter((p) => p.completada).length, 0)
  const choferesEnRuta = new Set(rutas.filter((r) => r.estado === 'en_curso').map((r) => r.chofer_id)).size
  const nombreChofer = (id?: string | null) => choferes?.find((chofer) => chofer.id === id)?.nombre ?? 'Sin asignar'
  const fechaTexto = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${hoy}T12:00:00`))

  return <AppShell>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm capitalize text-brand">{fechaTexto}</p><h1 className="text-xl font-bold text-white">Operación de hoy</h1><p className="text-sm text-gray-mid">Seguimiento de rutas, entregas y disponibilidad de la flota.</p></div>
      <Button onClick={() => navigate('/admin/rutas/nueva')}>+ Planificar ruta</Button>
    </div>

    {isLoading ? <div className="flex justify-center py-12"><Spinner size={28} /></div> : <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><p className="text-xs text-gray-mid">Rutas programadas</p><p className="mt-1 text-2xl font-bold text-white">{rutas.length}</p><p className="mt-1 text-xs text-gray-mid">para hoy</p></Card>
        <Card><p className="text-xs text-gray-mid">Rutas en curso</p><p className="mt-1 text-2xl font-bold text-brand">{enCurso.length}</p><p className="mt-1 text-xs text-gray-mid">en operación</p></Card>
        <Card><p className="text-xs text-gray-mid">Entregas completadas</p><p className="mt-1 text-2xl font-bold text-success">{completadas}/{paradas}</p><p className="mt-1 text-xs text-gray-mid">paradas de hoy</p></Card>
        <Card><p className="text-xs text-gray-mid">Choferes en ruta</p><p className="mt-1 text-2xl font-bold text-white">{choferesEnRuta}</p><p className="mt-1 text-xs text-gray-mid">de {choferes?.filter((c) => c.activo).length ?? 0} activos</p></Card>
      </div>

      {sinAsignar.length > 0 && <Card className="mb-5 border-warning/40 bg-warning/5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-warning">Hay {sinAsignar.length} ruta(s) sin chofer asignado</p><p className="text-xs text-gray-mid">Asignalas para que puedan comenzar su recorrido.</p></div><Button variant="secondary" onClick={() => navigate(`/admin/rutas/${sinAsignar[0].id}`)}>Asignar chofer</Button></div></Card>}

      <section><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-white">Rutas de hoy</h2><p className="text-xs text-gray-mid">Estado operativo y avance de cada recorrido.</p></div><Link className="text-sm font-semibold text-brand hover:underline" to="/admin/rutas">Ver todas</Link></div>
        {rutas.length === 0 ? <EmptyState title="No hay rutas programadas para hoy" description="Planificá una ruta y seleccioná la fecha de operación para verla en este panel." action={<Button onClick={() => navigate('/admin/rutas/nueva')}>Planificar ruta</Button>} /> : <div className="space-y-2">{rutas.map((ruta) => { const hechas = ruta.paradas.filter((p) => p.completada).length; return <button key={ruta.id} onClick={() => navigate(`/admin/rutas/${ruta.id}`)} className="flex w-full items-center gap-3 rounded-card border border-stroke bg-card p-4 text-left transition-colors hover:border-gray-dark"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-white">{ruta.nombre}</p><Badge tone={ESTADO_RUTA_META[ruta.estado].tone}>{ESTADO_RUTA_META[ruta.estado].label}</Badge></div><p className="mt-1 text-xs text-gray-mid">{nombreChofer(ruta.chofer_id)} · {hechas}/{ruta.paradas.length} entregas completadas</p></div><div className="hidden w-28 sm:block"><div className="h-1.5 overflow-hidden rounded-full bg-surface"><div className="h-full bg-brand" style={{ width: `${ruta.paradas.length ? (hechas / ruta.paradas.length) * 100 : 0}%` }} /></div></div><span className="text-brand">→</span></button> })}</div>}
      </section>
    </>}
  </AppShell>
}
