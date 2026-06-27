/**
 * Tarjeta visual de una mesa.
 * Muestra estado, total acumulado y cantidad de productos.
 */
import { Edit2, Trash2, Receipt } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { formatCurrency } from '../../utils/formatters'
import { TABLE_STATUS } from '../../utils/constants'

export default function TableCard({
  table,
  onOpen,
  onEdit,
  onDelete,
  onRequestBill,
}) {
  const isFree = table.status === TABLE_STATUS.FREE

  return (
    <Card className={`table-card table-card--${table.status}`} hoverable={!isFree}>
      <div className="table-card__header">
        <h3>{table.name}</h3>
        <Badge status={table.status} />
      </div>

      <div className="table-card__stats">
        <div>
          <small>Total</small>
          <strong>{formatCurrency(table.total_amount)}</strong>
        </div>
        <div>
          <small>Productos</small>
          <strong>{table.item_count || 0}</strong>
        </div>
      </div>

      <div className="table-card__actions">
        {isFree ? (
          <Button size="sm" onClick={() => onOpen(table)}>
            Abrir mesa
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={() => onOpen(table)}>
              Ver pedido
            </Button>
            {table.status !== TABLE_STATUS.BILL_REQUESTED && (
              <Button variant="secondary" size="sm" onClick={() => onRequestBill(table)}>
                <Receipt size={14} /> Cuenta
              </Button>
            )}
          </>
        )}
        <Button variant="ghost" size="sm" onClick={() => onEdit(table)}>
          <Edit2 size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(table)}>
          <Trash2 size={14} />
        </Button>
      </div>
    </Card>
  )
}
