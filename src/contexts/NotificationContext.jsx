/**
 * Contexto de notificaciones toast.
 * Muestra mensajes de éxito, error e info de forma global.
 */
import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

let toastId = 0

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const notify = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }

  return (
    <NotificationContext.Provider value={{ toasts, notify }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotification debe usarse dentro de NotificationProvider')
  return context
}
