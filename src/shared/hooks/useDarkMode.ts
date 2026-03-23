import { create } from 'zustand'

interface DarkModeState {
  isDark: boolean
  toggle: () => void
  init: () => void
}

export const useDarkMode = create<DarkModeState>((set) => ({
  isDark: false,

  toggle: () => {
    set((state) => {
      const next = !state.isDark
      localStorage.setItem('theme', next ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', next)
      return { isDark: next }
    })
  },

  init: () => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored ? stored === 'dark' : prefersDark
    document.documentElement.classList.toggle('dark', isDark)
    set({ isDark })
  },
}))
