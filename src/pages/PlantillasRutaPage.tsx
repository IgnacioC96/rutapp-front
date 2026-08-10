import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useRutas } from '@/features/rutas/api'

export function PlantillasRutaPage() {
  const navigate = useNavigate(); const { data, isLoading } = useRutas({ solo_plantillas: true, por_pagina: 100 })
  return <AppShell><div className="mb-5 flex items-center justify-between"><div><h1 className="text-lg font-bold text-white">Plantillas de ruta</h1><p className="text-sm text-gray-mid">Recorridos guardados para reutilizar.</p></div><Button onClick={() => navigate('/admin/rutas/nueva')}>+ Crear plantilla</Button></div>
    {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}
    {data?.rutas.length === 0 && <EmptyState title="Sin plantillas guardadas" description="Al crear una ruta, activá “Guardar como plantilla”." action={<Button onClick={() => navigate('/admin/rutas/nueva')}>Crear plantilla</Button>} />}
    <div className="space-y-2">{data?.rutas.map((r) => <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-white">{r.nombre}</p><p className="text-xs text-gray-mid">{r.paradas.length} paradas · origen: {r.origen_descripcion}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => navigate(`/admin/rutas/${r.id}`)}>Ver</Button><Button onClick={() => navigate('/admin/rutas/nueva', { state: { plantilla: r } })}>Usar plantilla</Button></div></Card>)}</div>
  </AppShell>
}
