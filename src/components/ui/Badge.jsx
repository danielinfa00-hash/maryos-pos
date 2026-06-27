/** Badge para estados (mesa, pedido, etc.) */
import { TABLE_STATUS_LABELS, ORDER_STATUS_LABELS } from '../../utils/constants'

const STATUS_CLASS = {
  libre: 'badge--success',
  ocupada: 'badge--warning',
  cuenta_solicitada: 'badge--danger',
  pendiente: 'badge--warning',
  preparando: 'badge--info',
  entregado: 'badge--success',
  cobrado: 'badge--neutral',
}

export default function Badge({ status, label }) {
  const text = label || TABLE_STATUS_LABELS[status] || ORDER_STATUS_LABELS[status] || status
  const className = STATUS_CLASS[status] || 'badge--neutral'

  return <span className={`badge ${className}`}>{text}</span>
}
