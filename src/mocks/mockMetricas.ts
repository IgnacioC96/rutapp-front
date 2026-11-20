import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { MetricasDashboard } from '@/types/api'
import { delay, makeResponse } from './mockHelpers'

/**
 * Datos de ejemplo del tablero de métricas (30 días de uso simulado), para mostrar el dashboard
 * en modo mock sin backend. Los endpoints de captura (navegación y cierre de sesión) responden 204.
 */
const DASHBOARD: MetricasDashboard = {
  "desde": "2026-10-22",
  "hasta": "2026-11-20",
  "zona_horaria": "America/Argentina/Buenos_Aires",
  "kpis": {
    "visitas": 1840,
    "sesiones": 210,
    "usuarios_activos": 7,
    "logins": 210,
    "logins_fallidos": 21,
    "duracion_promedio_min": 41.5,
    "duracion_mediana_min": 24.6,
    "operaciones": 1357,
    "operaciones_por_sesion": 6.5,
    "registros_creados": 578,
    "registros_modificados": 78,
    "registros_eliminados": 5,
    "busquedas": 10,
    "entregas_creadas": 450,
    "entregas_confirmadas": 386,
    "entregas_no_realizadas": 64,
    "conversion_entregas_pct": 85.8,
    "tasa_no_entrega_pct": 14.2,
    "rutas_creadas": 82,
    "rutas_cerradas": 82,
    "abandono_formularios_pct": 15.7
  },
  "top_urls": [
    {
      "url": "/seguimiento/:codigo",
      "visitas": 680
    },
    {
      "url": "/admin/entregas/nueva",
      "visitas": 514
    },
    {
      "url": "/admin/rutas/:id",
      "visitas": 152
    },
    {
      "url": "/admin",
      "visitas": 139
    },
    {
      "url": "/admin/rutas/nueva",
      "visitas": 112
    },
    {
      "url": "/chofer",
      "visitas": 82
    },
    {
      "url": "/admin/clientes/nuevo",
      "visitas": 55
    },
    {
      "url": "/admin/rutas",
      "visitas": 51
    },
    {
      "url": "/admin/entregas",
      "visitas": 26
    },
    {
      "url": "/admin/clientes",
      "visitas": 11
    }
  ],
  "uso_por_seccion": [
    {
      "seccion": "Plantillas",
      "visitas": 1
    },
    {
      "seccion": "Flota",
      "visitas": 5
    },
    {
      "seccion": "Choferes",
      "visitas": 8
    },
    {
      "seccion": "Clientes",
      "visitas": 66
    },
    {
      "seccion": "Vista del chofer",
      "visitas": 82
    },
    {
      "seccion": "Panel principal",
      "visitas": 139
    },
    {
      "seccion": "Rutas",
      "visitas": 315
    },
    {
      "seccion": "Entregas",
      "visitas": 540
    },
    {
      "seccion": "Seguimiento público",
      "visitas": 680
    }
  ],
  "mapa_calor": [
    [
      0,
      0,
      0,
      0,
      0,
      0,
      79,
      32,
      48,
      29,
      28,
      7,
      0,
      4,
      0,
      0,
      8,
      30,
      34,
      49,
      5,
      0,
      0,
      0
    ],
    [
      0,
      0,
      0,
      0,
      0,
      0,
      26,
      34,
      36,
      45,
      37,
      19,
      7,
      1,
      0,
      0,
      0,
      36,
      58,
      20,
      0,
      0,
      0,
      0
    ],
    [
      0,
      0,
      0,
      0,
      0,
      0,
      28,
      31,
      53,
      56,
      27,
      11,
      1,
      0,
      0,
      0,
      2,
      45,
      27,
      23,
      4,
      0,
      0,
      0
    ],
    [
      0,
      0,
      0,
      0,
      0,
      0,
      60,
      25,
      34,
      59,
      42,
      33,
      5,
      0,
      0,
      0,
      13,
      26,
      47,
      26,
      0,
      0,
      0,
      0
    ],
    [
      0,
      0,
      0,
      0,
      0,
      0,
      62,
      38,
      47,
      78,
      48,
      9,
      0,
      0,
      0,
      0,
      16,
      8,
      16,
      0,
      0,
      0,
      0,
      0
    ],
    [
      0,
      0,
      0,
      0,
      0,
      0,
      16,
      17,
      17,
      29,
      4,
      3,
      6,
      0,
      0,
      0,
      0,
      0,
      8,
      12,
      0,
      0,
      0,
      0
    ],
    [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      9,
      5,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      31,
      10,
      0,
      0,
      0,
      0,
      0
    ]
  ],
  "sesiones_por_rol": [
    {
      "rol": "admin",
      "sesiones": 128,
      "usuarios": 3,
      "duracion_prom_min": 12
    },
    {
      "rol": "chofer",
      "sesiones": 82,
      "usuarios": 4,
      "duracion_prom_min": 88
    }
  ],
  "dispositivos": [
    {
      "nombre": "escritorio",
      "n": 107
    },
    {
      "nombre": "movil",
      "n": 94
    },
    {
      "nombre": "tablet",
      "n": 9
    }
  ],
  "navegadores": [
    {
      "nombre": "Chrome",
      "n": 136
    },
    {
      "nombre": "Safari",
      "n": 40
    },
    {
      "nombre": "Edge",
      "n": 20
    },
    {
      "nombre": "Firefox",
      "n": 10
    },
    {
      "nombre": "Samsung Internet",
      "n": 4
    }
  ],
  "serie_diaria": [
    {
      "fecha": "2026-10-22",
      "sesiones": 6,
      "visitas": 64,
      "operaciones": 48
    },
    {
      "fecha": "2026-10-23",
      "sesiones": 7,
      "visitas": 72,
      "operaciones": 53
    },
    {
      "fecha": "2026-10-24",
      "sesiones": 3,
      "visitas": 15,
      "operaciones": 11
    },
    {
      "fecha": "2026-10-25",
      "sesiones": 1,
      "visitas": 10,
      "operaciones": 8
    },
    {
      "fecha": "2026-10-26",
      "sesiones": 11,
      "visitas": 106,
      "operaciones": 73
    },
    {
      "fecha": "2026-10-27",
      "sesiones": 6,
      "visitas": 56,
      "operaciones": 39
    },
    {
      "fecha": "2026-10-28",
      "sesiones": 12,
      "visitas": 106,
      "operaciones": 69
    },
    {
      "fecha": "2026-10-29",
      "sesiones": 9,
      "visitas": 87,
      "operaciones": 54
    },
    {
      "fecha": "2026-10-30",
      "sesiones": 6,
      "visitas": 36,
      "operaciones": 34
    },
    {
      "fecha": "2026-10-31",
      "sesiones": 4,
      "visitas": 28,
      "operaciones": 21
    },
    {
      "fecha": "2026-11-01",
      "sesiones": 3,
      "visitas": 21,
      "operaciones": 17
    },
    {
      "fecha": "2026-11-02",
      "sesiones": 8,
      "visitas": 73,
      "operaciones": 62
    },
    {
      "fecha": "2026-11-03",
      "sesiones": 6,
      "visitas": 87,
      "operaciones": 69
    },
    {
      "fecha": "2026-11-04",
      "sesiones": 8,
      "visitas": 70,
      "operaciones": 52
    },
    {
      "fecha": "2026-11-05",
      "sesiones": 10,
      "visitas": 82,
      "operaciones": 67
    },
    {
      "fecha": "2026-11-06",
      "sesiones": 6,
      "visitas": 34,
      "operaciones": 25
    },
    {
      "fecha": "2026-11-07",
      "sesiones": 5,
      "visitas": 59,
      "operaciones": 41
    },
    {
      "fecha": "2026-11-08",
      "sesiones": 2,
      "visitas": 25,
      "operaciones": 17
    },
    {
      "fecha": "2026-11-09",
      "sesiones": 8,
      "visitas": 58,
      "operaciones": 39
    },
    {
      "fecha": "2026-11-10",
      "sesiones": 9,
      "visitas": 85,
      "operaciones": 65
    },
    {
      "fecha": "2026-11-11",
      "sesiones": 9,
      "visitas": 66,
      "operaciones": 55
    },
    {
      "fecha": "2026-11-12",
      "sesiones": 12,
      "visitas": 94,
      "operaciones": 75
    },
    {
      "fecha": "2026-11-13",
      "sesiones": 8,
      "visitas": 71,
      "operaciones": 59
    },
    {
      "fecha": "2026-11-14",
      "sesiones": 1,
      "visitas": 10,
      "operaciones": 9
    },
    {
      "fecha": "2026-11-15",
      "sesiones": 0,
      "visitas": 0,
      "operaciones": 0
    },
    {
      "fecha": "2026-11-16",
      "sesiones": 10,
      "visitas": 116,
      "operaciones": 89
    },
    {
      "fecha": "2026-11-17",
      "sesiones": 11,
      "visitas": 91,
      "operaciones": 69
    },
    {
      "fecha": "2026-11-18",
      "sesiones": 8,
      "visitas": 66,
      "operaciones": 56
    },
    {
      "fecha": "2026-11-19",
      "sesiones": 8,
      "visitas": 43,
      "operaciones": 23
    },
    {
      "fecha": "2026-11-20",
      "sesiones": 13,
      "visitas": 109,
      "operaciones": 58
    }
  ],
  "eventos": [
    {
      "evento": "CREAR_ENTREGA",
      "tipo": "crear",
      "n": 450
    },
    {
      "evento": "CONFIRMAR_ENTREGA",
      "tipo": "operacion",
      "n": 386
    },
    {
      "evento": "LOGIN",
      "tipo": "sesion",
      "n": 210
    },
    {
      "evento": "LOGOUT",
      "tipo": "sesion",
      "n": 119
    },
    {
      "evento": "RUTA_CERRADA",
      "tipo": "operacion",
      "n": 82
    },
    {
      "evento": "CREAR_RUTA",
      "tipo": "crear",
      "n": 82
    },
    {
      "evento": "ASIGNAR_RUTA",
      "tipo": "operacion",
      "n": 82
    },
    {
      "evento": "INICIAR_RUTA",
      "tipo": "operacion",
      "n": 82
    },
    {
      "evento": "NOTA_PARADA",
      "tipo": "editar",
      "n": 66
    },
    {
      "evento": "ENTREGA_NO_REALIZADA",
      "tipo": "operacion",
      "n": 64
    },
    {
      "evento": "CREAR_CLIENTE",
      "tipo": "crear",
      "n": 42
    },
    {
      "evento": "LOGIN_FALLIDO",
      "tipo": "sesion",
      "n": 21
    }
  ],
  "flujo_navegacion": [
    {
      "desde": "/admin/entregas/nueva",
      "hacia": "/admin/rutas/nueva",
      "n": 82
    },
    {
      "desde": "/admin/rutas/nueva",
      "hacia": "/admin/rutas/:id",
      "n": 82
    },
    {
      "desde": "/admin/clientes/nuevo",
      "hacia": "/admin/entregas/nueva",
      "n": 55
    },
    {
      "desde": "/admin",
      "hacia": "/admin/entregas/nueva",
      "n": 52
    },
    {
      "desde": "/admin",
      "hacia": "/admin/rutas",
      "n": 48
    },
    {
      "desde": "/admin/entregas/nueva",
      "hacia": "/admin/clientes/nuevo",
      "n": 47
    },
    {
      "desde": "/admin/rutas",
      "hacia": "/admin/rutas/:id",
      "n": 37
    },
    {
      "desde": "/admin/rutas/:id",
      "hacia": "/admin/entregas/nueva",
      "n": 22
    },
    {
      "desde": "/admin/rutas/:id",
      "hacia": "/admin/entregas",
      "n": 21
    },
    {
      "desde": "/admin",
      "hacia": "/admin/usuarios",
      "n": 8
    }
  ],
  "operaciones_lentas": [
    {
      "evento": "CREAR_RUTA",
      "n": 82,
      "promedio_ms": 3238,
      "p95_ms": 8128
    },
    {
      "evento": "CREAR_USUARIO",
      "n": 2,
      "promedio_ms": 392,
      "p95_ms": 506
    },
    {
      "evento": "REORDENAR_PARADAS",
      "n": 10,
      "promedio_ms": 258,
      "p95_ms": 380
    },
    {
      "evento": "ASIGNAR_RUTA",
      "n": 82,
      "promedio_ms": 211,
      "p95_ms": 342
    },
    {
      "evento": "CONFIRMAR_ENTREGA",
      "n": 386,
      "promedio_ms": 197,
      "p95_ms": 322
    },
    {
      "evento": "INICIAR_RUTA",
      "n": 82,
      "promedio_ms": 192,
      "p95_ms": 301
    },
    {
      "evento": "CREAR_ENTREGA",
      "n": 450,
      "promedio_ms": 168,
      "p95_ms": 296
    },
    {
      "evento": "ENTREGA_NO_REALIZADA",
      "n": 64,
      "promedio_ms": 161,
      "p95_ms": 274
    }
  ],
  "abandono_formularios": [
    {
      "flujo": "Nuevo cliente",
      "inicios": 55,
      "completados": 42,
      "abandono_pct": 23.6
    },
    {
      "flujo": "Nueva entrega",
      "inicios": 514,
      "completados": 450,
      "abandono_pct": 12.5
    },
    {
      "flujo": "Nueva ruta",
      "inicios": 112,
      "completados": 82,
      "abandono_pct": 26.8
    }
  ],
  "embudo_rutas": [
    {
      "etapa": "Creadas",
      "cantidad": 82
    },
    {
      "etapa": "Asignadas",
      "cantidad": 82
    },
    {
      "etapa": "Iniciadas",
      "cantidad": 82
    },
    {
      "etapa": "Cerradas",
      "cantidad": 82
    }
  ],
  "embudo_entregas": [
    {
      "etapa": "Creadas",
      "cantidad": 450
    },
    {
      "etapa": "Confirmadas",
      "cantidad": 386
    },
    {
      "etapa": "No realizadas",
      "cantidad": 64
    }
  ]
}

export function matchesMetricas(url: string): boolean {
  return url.includes('/metricas/')
}

export function handleMetricas(
  config: InternalAxiosRequestConfig,
  url: string,
  method: string,
): Promise<AxiosResponse> {
  if (method === 'get' && url.endsWith('/metricas/dashboard')) {
    return delay(makeResponse(config, 200, DASHBOARD))
  }
  return delay(makeResponse(config, 204, null))
}
