import type { CurrentUser } from '@/types/api'
import { env } from '@/config/env'

/**
 * Usuarios de prueba para el MOCK (sin backend).
 * Borrá este archivo cuando conectes el backend real.
 */
export interface MockUser extends CurrentUser {
  id: string
  email: string
  password: string
  telefono?: string
  activo?: boolean
}

/** Usuarios semilla. Si VITE_MOCK_SIN_ADMIN=true, el mock arranca vacío
 *  para poder probar la pantalla de configuración inicial (/setup). */
const SEED_USERS: MockUser[] = [
  {
    id: 'u-admin-001',
    nombre: 'Carlos Admin',
    email: 'admin@rutapp.com',
    password: 'admin123',
    rol: 'admin',
    activo: true,
  },
  {
    id: 'u-chofer-001',
    nombre: 'Diego Chofer',
    email: 'chofer@rutapp.com',
    password: 'chofer123',
    rol: 'chofer',
    telefono: '+54 9 11 5555-0001',
    activo: true,
  },
  {
    id: 'u-chofer-002',
    nombre: 'Sofía Ramírez',
    email: 'sofia@rutapp.com',
    password: 'chofer123',
    rol: 'chofer',
    telefono: '+54 9 11 5555-0002',
    activo: true,
  },
]

export const mockUsers: MockUser[] = env.mockSinAdmin ? [] : [...SEED_USERS]
