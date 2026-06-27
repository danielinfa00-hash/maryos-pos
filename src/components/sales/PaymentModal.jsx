/**
 * Modal de cobro / facturación.
 * Soporta efectivo (con cambio) y transferencia.
 */
import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { PAYMENT_METHOD, PAYMENT_METHOD_LABELS } from '../../utils/constants'
import { formatCurrency, calculateChange } from '../../utils/formatters'

export default function PaymentModal({ isOpen, onClose, total, onConfirm, loading }) {
  const [method, setMethod] = useState(PAYMENT_METHOD.CASH)
  const [cashReceived, setCashReceived] = useState('')

  const change = calculateChange(total, cashReceived)
  const canConfirm =
    method === PAYMENT_METHOD.TRANSFER ||
    (method === PAYMENT_METHOD.CASH && Number(cashReceived) >= total)

  const handleConfirm = () => {
    if (loading) return
    onConfirm({
      paymentMethod: method,
      cashReceived: method === PAYMENT_METHOD.CASH ? Number(cashReceived) : 0,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cobrar mesa"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || loading}>
            {loading ? 'Procesando...' : 'Confirmar cobro'}
          </Button>
        </>
      }
    >
      <div className="payment-modal">
        <div className="payment-modal__total">
          <span>Total a pagar</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        <div className="payment-modal__methods">
          {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`payment-method ${method === key ? 'active' : ''}`}
              onClick={() => setMethod(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {method === PAYMENT_METHOD.CASH && (
          <div className="payment-modal__cash">
            <Input
              label="Valor recibido"
              type="number"
              min={0}
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="0"
            />
            <div className="payment-modal__change">
              <span>Cambio</span>
              <strong>{formatCurrency(change)}</strong>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
