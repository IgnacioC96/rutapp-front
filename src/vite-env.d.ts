/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API. Dev: "/api/v1" (proxy). Prod: URL completa del backend. */
  readonly VITE_API_URL: string
  /** "true" para usar el mock en memoria sin backend. */
  readonly VITE_USE_MOCK?: string
  /** "true" para que el mock arranque SIN usuarios (probar pantalla /setup). */
  readonly VITE_MOCK_SIN_ADMIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}