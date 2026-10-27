import useThemeStore from '../store/themeStore.js'

/**
 * useTheme — thin wrapper around the theme store.
 * Returns { theme, themes, setTheme }.
 */
export function useTheme() {
  const { theme, themes, setTheme } = useThemeStore()
  return { theme, themes, setTheme }
}
