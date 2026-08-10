import { useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useSeguimiento } from '@/features/rutas/api'
import { ESTADO_RUTA_META } from '@/features/rutas/estado'

export function SeguimientoPublicoPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const { data, isLoading, isError, error } = useSeguimiento(codigo)
  return <main className="min-h-screen bg-background px-4 py-10"><div className="mx-auto max-w-lg">
    <p className="mb-1 text-xl font-bold text-white">rutapp</p><p className="mb-6 text-sm text-gray-mid">Seguimiento de tu entrega</p>
    {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}
    {isError && <Card><p className="text-sm text-error">{getApiErrorMessage(error, 'No encontramos este seguimiento.')}</p></Card>}
    {data && <div className="space-y-4"><Card><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-gray-mid">Ruta</p><h1 className="text-lg font-bold text-white">{data.ruta_nombre}</h1></div><Badge tone={ESTADO_RUTA_META[data.estado].tone}>{ESTADO_RUTA_META[data.estado].label}</Badge></div><div className="mt-5"><div className="mb-1 flex justify-between text-xs text-gray-mid"><span>Progreso de entregas</span><span>{data.progreso}%</span></div><div className="h-2 overflow-hidden rounded-full bg-surface"><div className="h-full bg-brand transition-all" style={{ width: `${data.progreso}%` }} /></div></div></Card>
      <Card><p className="text-xs text-gray-mid">Chofer</p><p className="text-sm font-semibold text-white">{data.chofer_nombre}</p>{data.proxima_parada ? <><p className="mt-4 text-xs text-gray-mid">Próxima parada</p><p className="text-sm text-white">{data.proxima_parada.cliente}</p><p className="text-xs text-gray-mid">{data.proxima_parada.direccion}</p></> : <p className="mt-4 text-sm text-success">La ruta completó todas sus paradas.</p>}</Card>
      <Card className="bg-brand-tint"><p className="text-xs text-gray-mid">Ubicación en tiempo real</p>{data.ubicacion ? <><p className="mt-1 text-sm text-white">Chofer reportando ubicación</p><p className="text-xs text-gray-mid">Actualizada {new Date(data.ubicacion.actualizada_en).toLocaleTimeString()}</p></> : <p className="mt-1 text-sm text-gray-mid">Esperando la primera ubicación del chofer.</p>}<p className="mt-3 text-xs text-gray-dark">Esta vista se actualiza automáticamente cada 15 segundos.</p></Card></div>}
  </div></main>
}
