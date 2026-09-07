/**
 * Tipos del contrato de API (contrato_api_mvp2).
 * Se mantienen sincronizados con el backend FastAPI.
 */

export type Rol = 'admin' | 'chofer'

export interface ApiError {
  detail: string
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
  telefono_whatsapp: string
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
  telefono_whatsapp: string
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
  direccion_id: string
  /** Denormalizado para listados/detalle. */
  direccion_descripcion?: string
  descripcion: string
  bultos?: number
  peso_kg?: number
  fecha_estimada?: string
  observaciones?: string
  estado: EstadoEntrega
}

/** Body para POST /entregas y PUT /entregas/{id}. */
export interface EntregaInput {
  cliente_id: string
  direccion_id: string
  descripcion: string
  bultos?: number
  peso_kg?: number
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
  fecha_desde?: string
  fecha_hasta?: string
  search?: string
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
}

export interface Ruta {
  id: string
  nombre: string
  estado: EstadoRuta
  total_km?: number
  tiempo_estimado_min?: number
  es_plantilla: boolean
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
  estado?: EstadoRuta
  chofer_id?: string
  solo_plantillas?: boolean
  fecha_programada?: string
  pagina?: number
  por_pagina?: number
}

/* ---------- Sprint 3: operación, tracking y flota ---------- */
export interface UbicacionChofer {
  latitud: number
  longitud: number
  actualizada_en: string
}

export interface SeguimientoParada {
  orden: number
  cliente: string
  direccion: string
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
