/**
 * Vista previa de factura / ticket 58mm.
 */
import { generateTicketText } from '../../services/printService'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { PAYMENT_METHOD_LABELS } from '../../utils/constants'
import Button from '../ui/Button'
import { Printer } from 'lucide-react'
import { printTicket } from '../../services/printService'

export default function InvoicePreview({ sale, items, restaurantName, onPrint }) {
  if (!sale) return null

  const ticketText = generateTicketText(sale, items, restaurantName)

  const handlePrint = () => {
    printTicket(sale, items, restaurantName)
    onPrint?.()
  }

  return (
    <div className="invoice-preview">
      <div className="invoice-preview__header">
        <h3>Factura #{sale.invoice_number}</h3>
        <p>{formatDateTime(sale.created_at)}</p>
      </div>

      <div className="invoice-preview__details">
        <p><strong>Método:</strong> {PAYMENT_METHOD_LABELS[sale.payment_method]}</p>
        <p><strong>Total:</strong> {formatCurrency(sale.total)}</p>
      </div>

      <div className="ticket-preview">
        <pre className="ticket-paper">{ticketText}</pre>
      </div>

      <Button onClick={handlePrint}>
        <Printer size={16} /> Imprimir ticket
      </Button>
    </div>
  )
}
