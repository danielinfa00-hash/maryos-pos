/**
 * Utilidades de formato para moneda, fechas y números.
 * Mantener la presentación consistente en toda la app.
 */

/** Formatea un número como moneda colombiana (COP) */
export function formatCurrency(amount) {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Formatea fecha: 25/06/2026 */
export function formatDate(dateString) {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString))
}

/** Formatea hora: 14:30 */
export function formatTime(dateString) {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateString))
}

/** Formatea fecha y hora completas */
export function formatDateTime(dateString) {
  if (!dateString) return '-'
  return `${formatDate(dateString)} ${formatTime(dateString)}`
}

/** Calcula el cambio en pagos en efectivo */
export function calculateChange(total, cashReceived) {
  const totalNum = Number(total) || 0
  const received = Number(cashReceived) || 0
  return Math.max(0, received - totalNum)
}

/** Genera rango de fechas para filtros */
export function getDateRange(preset) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  switch (preset) {
    case 'hoy':
      start.setHours(0, 0, 0, 0)
      break
    case 'semana': {
      const day = start.getDay()
      const diff = day === 0 ? 6 : day - 1
      start.setDate(start.getDate() - diff)
      start.setHours(0, 0, 0, 0)
      break
    }
    case 'mes':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    default:
      start.setHours(0, 0, 0, 0)
  }

  return { start: start.toISOString(), end: end.toISOString() }
}

/** Trunca texto para tickets de 58mm */
export function truncateText(text, maxLength = 32) {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}
