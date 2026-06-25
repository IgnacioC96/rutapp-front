import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurrentUser, Rol } from '@/types/api'

interface AuthState {
  token: string | null
  user: CurrentUser | null
  /** Guarda la sesión tras un login exitoso. */
  setSession: (token: string, user: CurrentUser) => void
  /** Limpia la sesión (logout o token expirado). */
  clearSession: () => void
  isAuthenticated: () => boolean
  hasRole: (rol: Rol) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
      isAuthenticated: () => Boolean(get().token),
      hasRole: (rol) => get().user?.rol === rol,
    }),
    {
      name: 'rutapp-auth',
      // Solo persistimos token y usuario, no las funciones.
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)