import { useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { ESTADO_RUTA_META } from '@/features/rutas/estado'
import { useActualizarUbicacion, useConfirmarEntregaQr, useFinalizarRuta, useIniciarRuta, useRutas } from '@/features/rutas/api'
import type { Parada, Ruta } from '@/types/api'

function QrConfirmation({ ruta, parada, onClose }: { ruta: Ruta; parada: Parada; onClose: () => void }) {
  const confirmar = useConfirmarEntregaQr(ruta.id)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [camaraActiva, setCamaraActiva] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), [])
  async function abrirCamara() {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (video.current) { video.current.srcObject = stream.current; await video.current.play() }
      setCamaraActiva(true)
      const Detector = (window as unknown as {
        BarcodeDetector?: new () => {
          detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>
        }
      }).BarcodeDetector
      if (Detector && video.current) {
        const detector = new Detector()
        const leer = async () => { if (!video.current || !stream.current) return; const [resultado] = await detector.detect(video.current); if (resultado?.rawValue) { setCodigo(resultado.rawValue); setCamaraActiva(false); stream.current.getTracks().forEach((track) => track.stop()); stream.current = null; return }; window.setTimeout(leer, 500) }
        void leer()
      }
    } catch { setError('No se pudo acceder a la cámara. Ingresá el código manualmente.') }
  }
  function confirmarQr() {
    setError(null)
    confirmar.mutate({ entregaId: parada.entrega_id, codigo: codigo.trim() }, { onSuccess: onClose, onError: (err) => setError(getApiErrorMessage(err, 'No se pudo validar el código')) })
  }
  return <Modal open onClose={onClose} title="Confirmar entrega con QR">
    <p className="mb-4 text-sm text-gray-mid">Escaneá el código de la entrega o ingresalo manualmente si la cámara no está disponible.</p>
    <Input autoFocus name="codigoQr" label="Código QR" placeholder="QR-entrega-id" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
    {!camaraActiva && <button type="button" onClick={() => void abrirCamara()} className="mt-3 text-sm font-semibold text-brand hover:underline">Abrir lector con cámara</button>}
    {camaraActiva && <video ref={video} muted playsInline className="mt-3 aspect-video w-full rounded-card bg-black object-cover" />}
    <p className="mt-2 text-xs text-gray-dark">Demo: QR-{parada.entrega_id}</p>
    {error && <p className="mt-3 text-sm text-error">{error}</p>}
    <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={confirmarQr} loading={confirmar.isPending} disabled={!codigo.trim()}>Validar QR</Button></div>
  </Modal>
}

export function DashboardChofer() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, error } = useRutas({ chofer_id: user?.id, por_pagina: 20 })
  const [qrParada, setQrParada] = useState<{ ruta: Ruta; parada: Parada } | null>(null)
  const activa = data?.rutas.find((r) => r.estado === 'en_curso')
  const iniciar = useIniciarRuta(data?.rutas.find((r) => r.estado === 'asignada')?.id ?? '')
  const finalizar = useFinalizarRuta(activa?.id ?? '')
  const ubicar = useActualizarUbicacion(activa?.id ?? '')

  useEffect(() => {
    if (!activa || !navigator.geolocation) return
    const enviar = () => navigator.geolocation.getCurrentPosition(
      ({ coords }) => ubicar.mutate({ latitud: coords.latitude, longitud: coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 8_000 },
    )
    enviar()
    const id = window.setInterval(enviar, 15_000)
    return () => window.clearInterval(id)
  }, [activa, ubicar]) // La ubicación se informa cada 15 segundos mientras una ruta está activa.

  return <AppShell>
    <div className="mb-5"><h1 className="text-lg font-bold text-white">Mi ruta de hoy</h1><p className="text-sm text-gray-mid">Tus paradas y confirmaciones de entrega.</p></div>
    {isLoading && <div className="flex justify-center py-12"><Spinner size={28} /></div>}
    {isError && <p className="rounded-card border border-error/40 bg-error/10 p-3 text-sm text-error">{getApiErrorMessage(error, 'No se pudo cargar tu ruta')}</p>}
    {data && data.rutas.length === 0 && <EmptyState title="No tenés rutas asignadas" description="Cuando el administrador te asigne una ruta, aparecerá acá." />}
    {data?.rutas.map((ruta) => {
      const completas = ruta.paradas.filter((p) => p.completada).length
      const puedeIniciar = ruta.estado === 'asignada'
      const puedeFinalizar = ruta.estado === 'en_curso' && completas === ruta.paradas.length
      return <section key={ruta.id} className="mb-6 space-y-3">
        <Card className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex gap-2"><h2 className="font-semibold text-white">{ruta.nombre}</h2><Badge tone={ESTADO_RUTA_META[ruta.estado].tone}>{ESTADO_RUTA_META[ruta.estado].label}</Badge></div><p className="text-xs text-gray-mid">{completas}/{ruta.paradas.length} entregas · {ruta.total_km ?? 0} km</p></div><div className="flex gap-2">{puedeIniciar && <Button onClick={() => iniciar.mutate()} loading={iniciar.isPending}>Iniciar ruta</Button>}{ruta.estado === 'en_curso' && <Button variant="secondary" onClick={() => finalizar.mutate()} loading={finalizar.isPending} disabled={!puedeFinalizar}>Finalizar ruta</Button>}</div></Card>
        {ruta.estado === 'en_curso' && <p className="text-xs text-success">● Ubicación compartida automáticamente cada 15 segundos.</p>}
        {ruta.paradas.map((parada) => <Card key={parada.entrega_id} className="flex items-center gap-3"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${parada.completada ? 'bg-success text-white' : 'bg-brand text-white'}`}>{parada.completada ? '✓' : parada.orden}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{parada.cliente}</p><p className="truncate text-xs text-gray-mid">{parada.direccion}</p></div>{!parada.completada && ruta.estado === 'en_curso' && <Button className="px-3 py-2" onClick={() => setQrParada({ ruta, parada })}>Confirmar QR</Button>}</Card>)}
      </section>
    })}
    {qrParada && <QrConfirmation {...qrParada} onClose={() => setQrParada(null)} />}
  </AppShell>
}
