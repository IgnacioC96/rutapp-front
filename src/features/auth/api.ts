import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import type {
  CurrentUser,
  LoginRequest,
  LoginResponse,
  SetupRequest,
  SetupResponse,
} from '@/types/api'

/** POST /auth/login — devuelve el JWT y datos básicos del usuario. */
async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
  return data
}

/** POST /auth/setup — crea el primer administrador (solo si no hay usuarios). */
async function setup(payload: SetupRequest): Promise<SetupResponse> {
  const { data } = await apiClient.post<SetupResponse>('/auth/setup', payload)
  return data
}

/** GET /auth/me — usuario autenticado actual. */
export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get<CurrentUser>('/auth/me')
  return data
}

/** POST /auth/logout — invalida el token en el backend. */
async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

/** Hook de login: en éxito guarda la sesión en el store. */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data.access_token, { nombre: data.nombre, rol: data.rol })
    },
  })
}

/** Hook de setup inicial: crea el primer administrador. */
export function useSetup() {
  return useMutation({
    mutationFn: setup,
  })
}

/** Hook de logout: limpia la sesión local aunque el backend falle. */
export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession)
  return useMutation({
    mutationFn: logout,
    onSettled: () => clearSession(),
  })
}