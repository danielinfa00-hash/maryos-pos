/**
 * Panel del pedido actual (lado derecho).
 * Permite modificar cantidades, observaciones y cobrar.
 */
import { useState } from 'react'
import { Minus, Plus, Trash2, MessageSquare } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { formatCurrency } from '../../utils/formatters'

export default function OrderPanel({
  order,
  table,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onCheckout,
}) {
  const [notesModal, setNotesModal] = useState({ open: false, item: null, notes: '' })

  const items = order?.order_items || []

  const openNotes = (item) => {
    setNotesModal({ open: true, item, notes: item.notes || '' })
  }

  const saveNotes = async () => {
    await onUpdateNotes(notesModal.item.id, notesModal.notes)
    setNotesModal({ open: false, item: null, notes: '' })
  }

  return (
    <div className="order-panel">
      <div className="order-panel__header">
        <h2>{table?.name}</h2>
        <Badge status={order?.status || 'pendiente'} />
      </div>

      <div className="order-panel__items">
        {items.length === 0 ? (
          <p className="order-panel__empty">Agrega productos al pedido</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="order-item">
              <div className="order-item__info">
                <strong>{item.product_name}</strong>
                {item.notes && (
                  <small className="order-item__notes">Obs: {item.notes}</small>
                )}
                <span>{formatCurrency(item.unit_price)} c/u</span>
              </div>

              <div className="order-item__controls">
                <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                  <Minus size={16} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                  <Plus size={16} />
                </button>
                <button onClick={() => openNotes(item)} title="Observaciones">
                  <MessageSquare size={16} />
                </button>
                <button onClick={() => onRemoveItem(item.id)} className="danger">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="order-item__subtotal">
                {formatCurrency(item.subtotal)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="order-panel__footer">
        <div className="order-panel__total">
          <span>Total</span>
          <strong>{formatCurrency(order?.total || 0)}</strong>
        </div>
        <Button
          disabled={items.length === 0}
          onClick={onCheckout}
          className="order-panel__checkout"
        >
          Cobrar mesa
        </Button>
      </div>

      <Modal
        isOpen={notesModal.open}
        onClose={() => setNotesModal({ open: false, item: null, notes: '' })}
        title="Observaciones"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNotesModal({ open: false, item: null, notes: '' })}>
              Cancelar
            </Button>
            <Button onClick={saveNotes}>Guardar</Button>
          </>
        }
      >
        <Input
          label="Observación del producto"
          value={notesModal.notes}
          onChange={(e) => setNotesModal((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Ej: Sin cebolla, extra queso..."
        />
      </Modal>
    </div>
  )
}
