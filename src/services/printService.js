/**
 * Servicio de impresión ESC/POS para tickets de 58mm.
 * Genera HTML optimizado para vista previa e impresión térmica.
 */
import { formatCurrency, formatDateTime, truncateText } from '../utils/formatters'
import { PAYMENT_METHOD_LABELS } from '../utils/constants'

/** Genera contenido del ticket en texto plano (ESC/POS) */
export function generateTicketText(sale, items, restaurantName = 'Maryos POS') {
  const lines = []
  const width = 32 // caracteres para 58mm

  const center = (text) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2))
    return ' '.repeat(pad) + text
  }

  const divider = '-'.repeat(width)

  lines.push(center(restaurantName))
  lines.push(center('TICKET DE VENTA'))
  lines.push(divider)
  lines.push(`Factura: #${sale.invoice_number}`)
  lines.push(`Fecha: ${formatDateTime(sale.created_at)}`)
  if (sale.restaurant_tables?.name || sale.table_name) {
    lines.push(`Mesa: ${sale.restaurant_tables?.name || sale.table_name}`)
  }
  lines.push(divider)

  items.forEach((item) => {
    lines.push(truncateText(item.product_name, width))
    if (item.notes) lines.push(`  Obs: ${truncateText(item.notes, 28)}`)
    const detail = `${item.quantity}x ${formatCurrency(item.unit_price)}`
    const sub = formatCurrency(item.subtotal)
    lines.push(`${detail.padEnd(22)}${sub.padStart(10)}`)
  })

  lines.push(divider)
  lines.push(`TOTAL:${formatCurrency(sale.total).padStart(26)}`)
  lines.push(`Pago: ${PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method}`)

  if (sale.payment_method === 'efectivo') {
    lines.push(`Recibido: ${formatCurrency(sale.cash_received)}`)
    lines.push(`Cambio: ${formatCurrency(sale.change_amount)}`)
  }

  lines.push(divider)
  lines.push(center('¡Gracias por su compra!'))
  lines.push('')

  return lines.join('\n')
}

/** Genera HTML para vista previa del ticket 58mm */
export function generateTicketHTML(sale, items, restaurantName = 'Maryos POS') {
  const text = generateTicketText(sale, items, restaurantName)
  const htmlLines = text
    .split('\n')
    .map((line) => `<div class="ticket-line">${line || '&nbsp;'}</div>`)
    .join('')

  return `
    <div class="ticket-preview">
      <div class="ticket-paper">${htmlLines}</div>
    </div>
  `
}

/** Abre ventana de impresión con vista previa */
export function printTicket(sale, items, restaurantName = 'Maryos POS') {
  const html = generateTicketHTML(sale, items, restaurantName)
  const printWindow = window.open('', '_blank', 'width=320,height=600')

  if (!printWindow) {
    alert('Permite ventanas emergentes para imprimir')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Factura #${sale.invoice_number}</title>
      <style>
        @page { size: 58mm auto; margin: 2mm; }
        body { font-family: 'Courier New', monospace; font-size: 11px; margin: 0; padding: 4mm; }
        .ticket-line { white-space: pre; line-height: 1.3; }
        .ticket-paper { width: 58mm; }
      </style>
    </head>
    <body>${html}<script>window.print();</script></body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Conexión Bluetooth ESC/POS (Web Bluetooth API).
 * Requiere HTTPS y navegador compatible (Chrome/Edge).
 */
export async function printViaBluetooth(ticketText) {
  if (!navigator.bluetooth) {
    throw new Error('Bluetooth no disponible en este navegador')
  }

  // Dispositivo genérico ESC/POS - ajustar UUID según impresora
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
  })

  const server = await device.gatt.connect()
  const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
  const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')

  const encoder = new TextEncoder()
  const data = encoder.encode(ticketText)
  await characteristic.writeValue(data)

  device.gatt.disconnect()
}
