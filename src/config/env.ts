/**
 * Configuración de entorno centralizada.
 * La URL de la API se inyecta por variable de entorno (.env.*),
 * para que el mismo código corra en local, demo o producción.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  /** Si es true, usa el mock en memoria en vez del backend real. */
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  /** Si es true, el mock arranca sin usuarios (para probar la pantalla /setup). */
  mockSinAdmin: import.meta.env.VITE_MOCK_SIN_ADMIN === 'true',
} as const