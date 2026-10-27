import { create } from 'zustand'

const THEMES = ['light', 'dark-grey', 'black', 'dark-blue']
const DEFAULT_THEME = 'dark-grey'
const STORAGE_KEY = 'archive-theme'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function loadSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return THEMES.includes(saved) ? saved : DEFAULT_THEME
}

/**
 * Theme store — persists the selected theme to localStorage and applies it
 * to the <html> element via data-theme attribute.
 */
const useThemeStore = create((set) => {
  // Apply saved theme immediately on store creation
  const initial = loadSavedTheme()
  applyTheme(initial)

  return {
    theme: initial,
    themes: THEMES,

    setTheme: (name) => {
      if (!THEMES.includes(name)) return
      localStorage.setItem(STORAGE_KEY, name)
      applyTheme(name)
      set({ theme: name })
    },
  }
})

export default useThemeStore
