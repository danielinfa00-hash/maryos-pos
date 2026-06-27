/**
 * Contexto de tema (claro/oscuro).
 * Persiste la preferencia en localStorage para recordar al usuario.
 */
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'maryos_theme'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'light'
  })

  // Aplica clase al documento para CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const value = {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Hook para consumir el tema desde cualquier componente */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return context
}
