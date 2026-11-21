import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { env } from '@/config/env'
import { useAuthStore } from '@/store/authStore'
import { registrarNavegacion } from '@/features/metricas/api'

/**
 * Registra cada cambio de pantalla de un usuario con sesión iniciada (métricas de navegación).
 * No renderiza nada. Las URL con identificadores se normalizan en el backend (/admin/rutas/:id).
 * No se usa en modo mock (no hay backend que reciba los datos).
 */
export function AnalyticsTracker() {
  const { pathname } = useLocation()
  const token = useAuthStore((s) => s.token)
  const anterior = useRef<string | null>(null)

  useEffect(() => {
    if (!token || env.useMock) {
      anterior.current = null
      return
    }
    // /login y /setup no son pantallas de la aplicación: al iniciar sesión se empieza a contar desde la primera pantalla real
    if (pathname === '/login' || pathname === '/setup' || pathname === anterior.current) return
    registrarNavegacion(pathname, anterior.current)
    anterior.current = pathname
  }, [pathname, token])

  return null
}
