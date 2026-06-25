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

/* ---------- Rutas ---------- */
export type EstadoRuta =
  | 'pendiente'
  | 'asignada'
  | 'en_curso'
  | 'completada'
  | 'finalizada'

export interface Parada {
  orden: number
  entrega_id: string
  cliente: string
  direccion: string
  tiempo_desde_anterior_min: number
}

export interface Ruta {
  id: string
  nombre: string
  estado: EstadoRuta
  total_km?: number
  tiempo_estimado_min?: number
  paradas: Parada[]
}