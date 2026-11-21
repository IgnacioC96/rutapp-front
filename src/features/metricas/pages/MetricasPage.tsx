import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'
import { getApiErrorMessage } from '@/lib/apiClient'
import { useMetricasDashboard } from '@/features/metricas/api'
import { BarrasHorizontales, Dona, Embudo, Kpi, LineasTemporales, MapaDeCalor, Panel } from '@/features/metricas/components/Charts'
import { nf } from '@/features/metricas/format'
import { cn } from '@/lib/cn'

const PERIODOS = [{ dias: 7, label: '7 días' }, { dias: 30, label: '30 días' }, { dias: 90, label: '90 días' }]

const ETIQUETA_EVENTO: Record<string, string> = {
  CREAR_ENTREGA: 'Crear entrega', CONFIRMAR_ENTREGA: 'Confirmar entrega', ENTREGA_NO_REALIZADA: 'Entrega no realizada',
  CREAR_RUTA: 'Crear y optimizar ruta', ASIGNAR_RUTA: 'Asignar ruta', INICIAR_RUTA: 'Iniciar ruta', RUTA_CERRADA: 'Ruta cerrada',
  FINALIZAR_RUTA: 'Finalizar ruta', REORDENAR_PARADAS: 'Reordenar paradas', NOTA_PARADA: 'Nota en parada', CREAR_CLIENTE: 'Crear cliente',
  EDITAR_CLIENTE: 'Editar cliente', EDITAR_ENTREGA: 'Editar entrega', CANCELAR_ENTREGA: 'Cancelar entrega', CREAR_USUARIO: 'Crear usuario',
  CREAR_VEHICULO: 'Crear vehículo', LOGIN: 'Ingresos', LOGOUT: 'Salidas', LOGIN_FALLIDO: 'Ingresos rechazados', BUSCAR: 'Búsquedas',
}
const etiquetaEvento = (e: string) => ETIQUETA_EVENTO[e] ?? e.charAt(0) + e.slice(1).toLowerCase().replace(/_/g, ' ')
const DISPOSITIVO: Record<string, string> = { escritorio: 'Computadora', movil: 'Celular', tablet: 'Tablet', desconocido: 'Desconocido' }
const fechaCorta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const seg = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1).replace('.', ',')} s` : `${ms} ms`)

export function MetricasPage() {
  const [dias, setDias] = useState(30)
  const { data, isLoading, isError, error } = useMetricasDashboard(dias)

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Métricas de uso</h1>
            <p className="text-sm text-gray-mid">
              Cómo se usa rutapp: accesos, actividad y resultados del reparto
              {data && <> · del {fechaCorta(data.desde)} al {fechaCorta(data.hasta)}</>}
            </p>
          </div>
          <div className="inline-flex rounded-btn border border-stroke bg-card p-0.5" role="group" aria-label="Período">
            {PERIODOS.map((p) => (
              <button key={p.dias} type="button" onClick={() => setDias(p.dias)}
                className={cn('rounded-btn px-3 py-1.5 text-sm font-medium transition-colors', dias === p.dias ? 'bg-brand text-white' : 'text-gray-mid hover:text-white')}>
                {p.label}
              </button>
            ))}
          </div>
        </header>

        {isLoading && <div className="flex justify-center py-20"><Spinner /></div>}
        {isError && <p className="rounded-card bg-error/10 px-3 py-2 text-sm text-error">{getApiErrorMessage(error, 'No se pudieron cargar las métricas')}</p>}

        {data && <Contenido d={data} />}
      </div>
    </AppShell>
  )
}

function Contenido({ d }: { d: NonNullable<ReturnType<typeof useMetricasDashboard>['data']> }) {
  const k = d.kpis
  const porRol = Object.fromEntries(d.sesiones_por_rol.map((r) => [r.rol, r.duracion_prom_min]))
  const lenta = d.operaciones_lentas[0]
  const peorForm = [...d.abandono_formularios].sort((a, b) => b.abandono_pct - a.abandono_pct)[0]
  const menosUsada = d.uso_por_seccion.filter((s) => s.seccion !== 'Seguimiento público')[0]
  const lecturas: string[] = []
  if (peorForm && peorForm.inicios > 0) lecturas.push(`“${peorForm.flujo}” es el formulario que más se abandona: ${peorForm.abandono_pct.toString().replace('.', ',')} % (${peorForm.inicios - peorForm.completados} de ${peorForm.inicios} veces no se completó).`)
  if (lenta) lecturas.push(`La operación más lenta es “${etiquetaEvento(lenta.evento)}”: en el 5 % de los casos tarda ${seg(lenta.p95_ms)} (promedio ${seg(lenta.promedio_ms)}).`)
  if (menosUsada) lecturas.push(`La sección menos usada es “${menosUsada.seccion}” (${nf.format(menosUsada.visitas)} ${menosUsada.visitas === 1 ? 'visita' : 'visitas'} en el período).`)
  if (k.logins_fallidos > 0) lecturas.push(`Hubo ${nf.format(k.logins_fallidos)} ingresos rechazados (${((k.logins_fallidos / Math.max(1, k.logins + k.logins_fallidos)) * 100).toFixed(1).replace('.', ',')} % de los intentos).`)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <Kpi titulo="Usuarios activos" valor={nf.format(k.usuarios_activos)} detalle={`${nf.format(k.sesiones)} sesiones`} />
        <Kpi titulo="Visitas" valor={nf.format(k.visitas)} detalle="pantallas vistas" />
        <Kpi titulo="Tiempo de sesión" valor={`${Math.round(k.duracion_promedio_min)} min`} detalle={`admin ${porRol.admin ?? 0} · chofer ${porRol.chofer ?? 0} min`} />
        <Kpi titulo="Acciones" valor={nf.format(k.operaciones)} detalle={`${k.operaciones_por_sesion.toString().replace('.', ',')} por sesión`} />
        <Kpi titulo="Entregas confirmadas" valor={`${k.conversion_entregas_pct.toString().replace('.', ',')} %`} detalle={`${nf.format(k.entregas_confirmadas)} de ${nf.format(k.entregas_creadas)} creadas`} tono="ok" />
        <Kpi titulo="Abandono" valor={`${k.abandono_formularios_pct.toString().replace('.', ',')} %`} detalle="de formularios de alta" tono={k.abandono_formularios_pct > 20 ? 'alerta' : undefined} />
        <Kpi titulo="Registros creados" valor={nf.format(k.registros_creados)} detalle={`${nf.format(k.registros_modificados)} editados · ${nf.format(k.registros_eliminados)} eliminados`} />
      </div>

      {lecturas.length > 0 && (
        <Panel titulo="Lectura rápida" subtitulo="Lo más llamativo del período">
          <ul className="list-disc space-y-1 pl-5 text-sm text-white marker:text-brand">{lecturas.map((l) => <li key={l}>{l}</li>)}</ul>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel titulo="Actividad diaria" subtitulo="Sesiones, visitas y acciones por día" className="lg:col-span-2">
          <LineasTemporales etiquetas={d.serie_diaria.map((s) => fechaCorta(s.fecha))} series={[
            { nombre: 'Visitas', valores: d.serie_diaria.map((s) => s.visitas), clase: 'stroke-brand' },
            { nombre: 'Acciones', valores: d.serie_diaria.map((s) => s.operaciones), clase: 'stroke-success' },
            { nombre: 'Sesiones', valores: d.serie_diaria.map((s) => s.sesiones), clase: 'stroke-warning' },
          ]} />
        </Panel>
        <div className="space-y-4">
          <Panel titulo="Dispositivos" subtitulo="Desde dónde se ingresa">
            <Dona items={d.dispositivos.map((x) => ({ etiqueta: DISPOSITIVO[x.nombre] ?? x.nombre, valor: x.n }))} />
          </Panel>
          <Panel titulo="Navegadores">
            <BarrasHorizontales items={d.navegadores.map((x) => ({ etiqueta: x.nombre, valor: x.n }))} />
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel titulo="Páginas más visitadas" subtitulo="Los identificadores se agrupan (:id)">
          <BarrasHorizontales items={d.top_urls.map((u) => ({ etiqueta: u.url, valor: u.visitas }))} />
        </Panel>
        <Panel titulo="Horarios de acceso" subtitulo="Cuándo se usa el sistema">
          <MapaDeCalor matriz={d.mapa_calor} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel titulo="Conversión de entregas" subtitulo="De la carga al resultado">
          <Embudo etapas={d.embudo_entregas} tonos={['var(--color-brand)', 'var(--color-success)', 'var(--color-error)']} />
        </Panel>
        <Panel titulo="Ciclo de las rutas" subtitulo="Cuántas llegan hasta el final">
          <Embudo etapas={d.embudo_rutas} />
        </Panel>
        <Panel titulo="Abandono de formularios" subtitulo="Abiertos vs. completados">
          <ul className="space-y-3">
            {d.abandono_formularios.map((f) => (
              <li key={f.flujo}>
                <div className="flex justify-between text-xs">
                  <span className="text-white">{f.flujo}</span>
                  <span className={cn('font-semibold', f.abandono_pct > 20 ? 'text-warning' : 'text-success')}>{f.abandono_pct.toString().replace('.', ',')} % abandono</span>
                </div>
                <p className="text-xs text-gray-mid">{nf.format(f.completados)} completados de {nf.format(f.inicios)} aperturas</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel titulo="Operaciones más lentas" subtitulo="Tiempo de respuesta (p95 = 1 de cada 20 tarda más)" className="lg:col-span-1">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-mid"><tr><th className="pb-1 font-medium">Operación</th><th className="pb-1 text-right font-medium">Prom.</th><th className="pb-1 text-right font-medium">P95</th></tr></thead>
            <tbody>
              {d.operaciones_lentas.slice(0, 6).map((o) => (
                <tr key={o.evento} className="border-t border-stroke">
                  <td className="py-1.5 text-white">{etiquetaEvento(o.evento)}<span className="ml-1 text-gray-mid">({nf.format(o.n)})</span></td>
                  <td className="py-1.5 text-right text-gray-mid">{seg(o.promedio_ms)}</td>
                  <td className={cn('py-1.5 text-right font-semibold', o.p95_ms >= 2000 ? 'text-warning' : 'text-white')}>{seg(o.p95_ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel titulo="Secciones menos usadas" subtitulo="Candidatas a revisar o simplificar">
          <BarrasHorizontales items={d.uso_por_seccion.slice(0, 6).map((s) => ({ etiqueta: s.seccion, valor: s.visitas }))} />
        </Panel>
        <Panel titulo="Recorridos más comunes" subtitulo="De qué pantalla a cuál">
          <ul className="space-y-1.5 text-xs">
            {d.flujo_navegacion.slice(0, 6).map((f) => (
              <li key={`${f.desde}>${f.hacia}`} className="flex items-center justify-between gap-2">
                <span className="truncate text-white">{f.desde} <span className="text-brand">→</span> {f.hacia}</span>
                <span className="shrink-0 font-semibold text-gray-mid">{nf.format(f.n)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel titulo="Acciones más frecuentes" subtitulo="Bitácora de eventos del sistema">
        <BarrasHorizontales items={d.eventos.map((e) => ({ etiqueta: etiquetaEvento(e.evento), valor: e.n }))} />
      </Panel>
    </>
  )
}
