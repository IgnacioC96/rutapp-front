/**
 * Tipos del contrato de API (contrato_api_mvp2).
 * Se mantienen sincronizados con el backend FastAPI.
 */

export type Rol = 'admin' | 'chofer'

/** Detalle por campo de un 422 (validación de Pydantic). */
export interface ApiErrorDetalle {
  campo: string
  mensaje: string
  tipo?: string
}

/**
 * Formato de error del backend: { error, mensaje, detalle? }.
 * `detail` se mantiene solo por compatibilidad con el mock.
 */
export interface ApiError {
  error?: string
  mensaje?: string
  detalle?: ApiErrorDetalle[]
  detail?: string
}

/* ---------- Auth ---------- */
export interface LoginRequest {
  email: string
  password: string
  rol: Rol
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  rol: Rol
  nombre: string
}

export interface CurrentUser {
  id?: string
  nombre: string
  email?: string
  rol: Rol
}

/* ---------- Setup (primer admin) ---------- */
/** Body de POST /auth/setup — crea el primer administrador. */
export interface SetupRequest {
  nombre: string
  email: string
  password: string
  rol: 'admin'
}

/** Respuesta 201 de POST /auth/setup. */
export interface SetupResponse {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
}

/* ---------- Paginación genérica ---------- */
export interface Paginated<T> {
  total: number
  pagina: number
  por_pagina: number
  [key: string]: unknown | T[]
}

/* ---------- Clientes ---------- */
export interface Direccion {
  id?: string
  descripcion: string
  referencia?: string
  es_principal: boolean
  /** Coordenadas seleccionadas desde el mapa (opcionales para clientes existentes). */
  latitud?: number
  longitud?: number
}

export interface Cliente {
  id: string
  nombre: string
  /** El backend lo normaliza y lo devuelve como +5491123456789. */
  telefono_whatsapp: string
  email?: string | null
  direcciones: Direccion[]
  cuit?: string
  notas?: string
  total_entregas?: number
  activo: boolean
}

/** Respuesta de GET /clientes (listado paginado). */
export interface ClientesListResponse {
  total: number
  pagina: number
  por_pagina: number
  clientes: Cliente[]
}

/** Body para POST /clientes y PUT /clientes/{id}. */
export interface ClienteInput {
  nombre: string
  /** Se envía tal cual lo escribe el usuario (formato argentino); lo normaliza el backend. */
  telefono_whatsapp: string
  email?: string
  direcciones: Direccion[]
  cuit?: string
  notas?: string
}

/** Query params de GET /clientes. */
export interface ClientesQuery {
  search?: string
  pagina?: number
  por_pagina?: number
}

/* ---------- Entregas ---------- */
export type EstadoEntrega = 'pendiente' | 'en_curso' | 'completada' | 'cancelada'

export interface Entrega {
  id: string
  cliente_id: string
  /** Denormalizado para listados/detalle. */
  cliente_nombre?: string
  /** Teléfono (WhatsApp) del cliente, denormalizado. */
  cliente_telefono?: string
  direccion_id: string
  /** Denormalizado para listados/detalle. */
  direccion_descripcion?: string
  descripcion: string
  bultos?: number
  peso_kg?: number
  largo_cm?: number | null
  ancho_cm?: number | null
  alto_cm?: number | null
  fecha_estimada?: string
  observaciones?: string
  estado: EstadoEntrega
  /** Solo lo devuelve el backend al admin; para el chofer viene siempre null. */
  codigo_confirmacion?: string | null
}

/** Body para POST /entregas y PUT /entregas/{id}. */
export interface EntregaInput {
  cliente_id: string
  direccion_id: string
  descripcion: string
  bultos?: number
  peso_kg?: number
  largo_cm?: number
  ancho_cm?: number
  alto_cm?: number
  fecha_estimada?: string
  observaciones?: string
}

/** Respuesta de GET /entregas (listado paginado). */
export interface EntregasListResponse {
  total: number
  pagina: number
  por_pagina: number
  entregas: Entrega[]
}

/** Query params de GET /entregas. */
export interface EntregasQuery {
  estado?: EstadoEntrega
  cliente_id?: string
  /** Fecha estimada exacta (YYYY-MM-DD). */
  fecha_estimada?: string
  /** Rango inclusivo (YYYY-MM-DD). Si desde > hasta el backend responde 400. */
  fecha_desde?: string
  fecha_hasta?: string
  search?: string
  pagina?: number
  por_pagina?: number
}

/** Query params de GET /entregas/pendientes-hoy. */
export interface EntregasPendientesHoyQuery {
  /** Suma las pendientes con fecha anterior a hoy (hora de Argentina). */
  incluir_atrasadas?: boolean
  pagina?: number
  por_pagina?: number
}

/* ---------- Usuarios (ABM de choferes / admins) ---------- */
export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  telefono?: string
  activo: boolean
  /** El back NO lo devuelve hoy; queda opcional por si se agrega. */
  creado_en?: string
}

/** Body para POST /auth/usuarios. */
export interface UsuarioInput {
  nombre: string
  email: string
  password: string
  rol: Rol
  telefono?: string
}

/** Query params de GET /auth/usuarios (devuelve un array plano). */
export interface UsuariosQuery {
  rol?: Rol
}

/* ---------- Rutas ---------- */
export type EstadoRuta =
  | 'pendiente'
  | 'asignada'
  | 'en_curso'
  | 'completada'
  | 'finalizada'

export interface Parada {
  /** ID de la parada en el backend nuevo. */
  id?: string
  /** ID interno de la parada, requerido para persistir su posición. */
  parada_id?: string
  orden: number
  entrega_id?: string | null
  cliente?: string | null
  direccion?: string | null
  tiempo_desde_anterior_min?: number
  distancia_desde_anterior_km?: number
  completada?: boolean
  latitud?: number
  longitud?: number
  es_parada_extra?: boolean
  descripcion_extra?: string | null
  direccion_extra?: string | null
  /** Teléfono (WhatsApp) del cliente; lo ven el admin y el chofer asignado. */
  cliente_telefono?: string | null
  /** Nota que escribe el chofer. La ve el admin; el cliente nunca. */
  nota_chofer?: string | null
  /** true si el chofer la marcó como "no entregada". */
  omitida?: boolean
  motivo_omision?: MotivoNoEntrega | null
}

export type MotivoNoEntrega =
  | 'nadie_recibio'
  | 'cliente_ausente'
  | 'direccion_incorrecta'
  | 'rechazada'
  | 'otro'

/** Body de PATCH /rutas/{id}/entregas/{entrega_id}/no-entregada. */
export interface NoEntregadaInput {
  motivo: MotivoNoEntrega
  nota?: string
}

/** Body de PATCH /rutas/{id}/paradas/{parada_id}/nota (null o vacío la borra, máx. 1000). */
export interface NotaParadaInput {
  nota: string | null
}

export interface Ruta {
  id: string
  nombre: string
  estado: EstadoRuta
  total_km?: number
  tiempo_estimado_min?: number
  es_plantilla: boolean
  /** Código del enlace público de seguimiento. */
  codigo_seguimiento?: string | null
  /** Día operativo para el que se planificó la ruta (YYYY-MM-DD). */
  fecha_programada?: string
  origen_descripcion?: string
  origen_latitud?: number
  origen_longitud?: number
  chofer_id?: string | null
  creada_en: string
  iniciada_en?: string | null
  finalizada_en?: string | null
  paradas: Parada[]
}

/** Body para POST /rutas. */
export interface RutaInput {
  nombre: string
  entregas_ids: string[]
  origen_descripcion?: string
  origen_latitud?: number
  origen_longitud?: number
  guardar_plantilla?: boolean
  fecha_programada?: string
}

/** Body para PATCH /rutas/{id}/asignar. */
export interface RutaAsignarInput {
  chofer_id: string
}

/** Body de PATCH /rutas/{id}/paradas. */
export interface ReordenarParadasInput {
  paradas: { parada_id: string; orden: number }[]
}

/** Body de POST /rutas/{id}/paradas/extra. */
export interface ParadaExtraInput {
  descripcion: string
  direccion?: string
  orden?: number
  latitud?: number
  longitud?: number
}

/** Respuesta de GET /rutas (listado paginado). */
export interface RutasListResponse {
  total: number
  pagina: number
  por_pagina: number
  rutas: Ruta[]
}

/** Query params de GET /rutas. */
export interface RutasQuery {
  chofer_id?: string
  solo_plantillas?: boolean
  fecha_programada?: string
}

/* ---------- Sprint 3: operación, tracking y flota ---------- */
export interface UbicacionChofer {
  latitud: number
  longitud: number
  actualizada_en: string
}

export interface SeguimientoParada {
  orden: number
  /** Ahora viene como "Parada 3 de 8": ya no se exponen datos del cliente. */
  cliente: string
  /** Viene vacía; no mostrarla. */
  direccion?: string
  completada: boolean
}

export interface SeguimientoRuta {
  codigo: string
  ruta_nombre: string
  estado: EstadoRuta
  chofer_nombre: string
  progreso: number
  proxima_parada?: SeguimientoParada
  ultima_actualizacion?: string
  // Coordenadas del chofer actualizadas cada 15 segundos
  chofer_latitud?: number
  chofer_longitud?: number
}

export interface Vehiculo {
  id: string
  patente: string
  marca_modelo: string
  capacidad_kg: number
  estado: 'disponible' | 'en_ruta' | 'mantenimiento'
  chofer_id?: string | null
  chofer_nombre?: string | null
}

/** Body de POST /vehiculos. El estado inicial lo determina el backend. */
export interface VehiculoCreateInput {
  patente: string
  marca_modelo: string
  capacidad_kg: number
  chofer_id?: string
}

/** Body de PUT /vehiculos/{id}. La patente no se puede modificar. */
export interface VehiculoUpdateInput {
  marca_modelo?: string
  capacidad_kg?: number
  estado?: Vehiculo['estado']
  chofer_id?: string | null
}

export interface VehiculosQuery {
  estado?: Vehiculo['estado']
  chofer_id?: string
}
