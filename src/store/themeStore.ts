import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/** Aplica (o quita) la clase `light` en <html> según el tema. */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
}

/** Tema inicial: lo guardado, o la preferencia del sistema operativo. */
function initialTheme(): Theme {
  const prefersLight =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: light)').matches
  return prefersLight ? 'light' : 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: initialTheme(),
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
    }),
    {
      name: 'rutapp-theme',
      // Al recargar la página, reaplica la clase en <html>.
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)
