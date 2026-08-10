import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useUsuarios } from '@/features/usuarios/api'
import { useRutas } from '@/features/rutas/api'

export function GestionFlotaPage() {
  const { data: choferes, isLoading } = useUsuarios({ rol: 'chofer' })
  const { data: rutas } = useRutas({ por_pagina: 100 })
  return <AppShell><div className="mb-5"><h1 className="text-lg font-bold text-white">Gestión de flota</h1><p className="text-sm text-gray-mid">Disponibilidad de choferes y rutas activas.</p></div>
    {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}
    <div className="hidden overflow-hidden rounded-card border border-stroke md:block"><table className="w-full text-left text-sm"><thead className="bg-surface text-xs text-gray-mid"><tr><th className="px-4 py-3">Chofer</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Ruta actual</th><th className="px-4 py-3">Estado</th></tr></thead><tbody>{choferes?.map((chofer) => { const ruta = rutas?.rutas.find((r) => r.chofer_id === chofer.id && !['finalizada', 'completada'].includes(r.estado)); return <tr key={chofer.id} className="border-t border-stroke"><td className="px-4 py-4 font-semibold text-white">{chofer.nombre}</td><td className="px-4 py-4 text-gray-mid">{chofer.telefono ?? chofer.email}</td><td className="px-4 py-4 text-gray-mid">{ruta?.nombre ?? 'Sin ruta asignada'}</td><td className="px-4 py-4"><Badge tone={!chofer.activo ? 'error' : ruta?.estado === 'en_curso' ? 'brand' : 'success'}>{!chofer.activo ? 'Inactivo' : ruta?.estado === 'en_curso' ? 'En ruta' : 'Disponible'}</Badge></td></tr> })}</tbody></table></div>
    <div className="space-y-2 md:hidden">{choferes?.map((c) => <Card key={c.id}><p className="font-semibold text-white">{c.nombre}</p><p className="text-xs text-gray-mid">{c.telefono ?? c.email}</p></Card>)}</div>
  </AppShell>
}
