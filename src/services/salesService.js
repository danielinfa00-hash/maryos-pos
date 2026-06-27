/**
 * Servicio de ventas y facturación.
 * Genera facturas, descuenta inventario y cierra pedidos.
 */
import { supabase, isSupabaseConfigured, handleSupabaseError } from '../supabase/client'
import {
  getLocalTable,
  insertLocal,
  getLocalData,
  setLocalData,
  nextInvoiceNumber,
  generateId,
} from './localStorage'
import { ORDER_STATUS, PAYMENT_METHOD } from '../utils/constants'
import { calculateChange } from '../utils/formatters'
import { closeTable } from './tablesService'
import { deductInventoryForSale } from './inventoryService'

/** Procesa el cobro de una mesa y genera factura */
export async function processSale({
  order,
  table,
  paymentMethod,
  cashReceived = 0,
}) {
  const items = order.order_items || []
  const subtotal = Number(order.subtotal) || 0
  const total = Number(order.total) || subtotal
  const changeAmount =
    paymentMethod === PAYMENT_METHOD.CASH
      ? calculateChange(total, cashReceived)
      : 0

  const saleRecord = {
    table_id: table.id,
    order_id: order.id,
    payment_method: paymentMethod,
    subtotal,
    total,
    cash_received: paymentMethod === PAYMENT_METHOD.CASH ? cashReceived : null,
    change_amount: paymentMethod === PAYMENT_METHOD.CASH ? changeAmount : null,
    status: 'paid',
    created_at: new Date().toISOString(),
  }

  let sale

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('sales')
      .insert(saleRecord)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'processSale')
    sale = data

    const saleItems = items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      subtotal: item.subtotal,
      notes: item.notes,
    }))

    await supabase.from('sale_items').insert(saleItems)

    await supabase
      .from('orders')
      .update({ status: ORDER_STATUS.PAID, closed_at: new Date().toISOString() })
      .eq('id', order.id)
  } else {
    const invoiceNumber = nextInvoiceNumber()
    sale = insertLocal('sales', {
      ...saleRecord,
      id: generateId('sale'),
      invoice_number: invoiceNumber,
    })

    items.forEach((item) => {
      insertLocal('sale_items', {
        id: generateId('si'),
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        notes: item.notes,
      })
    })

    const data = getLocalData()
    const orderIdx = data.orders.findIndex((o) => o.id === order.id)
    if (orderIdx >= 0) {
      data.orders[orderIdx].status = ORDER_STATUS.PAID
      data.orders[orderIdx].closed_at = new Date().toISOString()
    }
    setLocalData(data)
  }

  // Descuenta ingredientes según recetas
  await deductInventoryForSale(items)

  // Libera la mesa
  await closeTable(table.id)

  return { sale, changeAmount }
}

/** Obtiene ventas con filtros de fecha */
export async function fetchSales({ startDate, endDate, searchInvoice = '' } = {}) {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('sales')
      .select('*, restaurant_tables(name)')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data, error } = await query
    if (error) handleSupabaseError(error, 'fetchSales')

    if (searchInvoice) {
      return data.filter((s) =>
        String(s.invoice_number).includes(searchInvoice)
      )
    }
    return data
  }

  let sales = getLocalTable('sales').filter((s) => s.status === 'paid')

  if (startDate) {
    sales = sales.filter((s) => new Date(s.created_at) >= new Date(startDate))
  }
  if (endDate) {
    sales = sales.filter((s) => new Date(s.created_at) <= new Date(endDate))
  }
  if (searchInvoice) {
    sales = sales.filter((s) =>
      String(s.invoice_number).includes(searchInvoice)
    )
  }

  return sales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

/** Obtiene detalle completo de una factura */
export async function fetchSaleById(saleId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*), restaurant_tables(name)')
      .eq('id', saleId)
      .single()

    if (error) handleSupabaseError(error, 'fetchSaleById')
    return data
  }

  const sale = getLocalTable('sales').find((s) => s.id === saleId)
  if (!sale) return null

  const items = getLocalTable('sale_items').filter((i) => i.sale_id === saleId)
  const table = getLocalTable('restaurant_tables').find((t) => t.id === sale.table_id)
  return { ...sale, sale_items: items, restaurant_tables: table }
}

/** Estadísticas de ventas por rango */
export async function fetchSalesStats(startDate, endDate) {
  const sales = await fetchSales({ startDate, endDate })

  const stats = {
    totalSales: sales.length,
    totalAmount: sales.reduce((sum, s) => sum + Number(s.total), 0),
    cashAmount: sales
      .filter((s) => s.payment_method === PAYMENT_METHOD.CASH)
      .reduce((sum, s) => sum + Number(s.total), 0),
    transferAmount: sales
      .filter((s) => s.payment_method === PAYMENT_METHOD.TRANSFER)
      .reduce((sum, s) => sum + Number(s.total), 0),
  }

  return stats
}

/** Top productos más vendidos */
export async function fetchTopProducts(startDate, endDate, limit = 10) {
  const sales = await fetchSales({ startDate, endDate })
  const saleIds = sales.map((s) => s.id)

  let allItems = []

  if (isSupabaseConfigured) {
    if (saleIds.length === 0) return []
    const { data } = await supabase
      .from('sale_items')
      .select('*')
      .in('sale_id', saleIds)

    allItems = data || []
  } else {
    allItems = getLocalTable('sale_items').filter((i) => saleIds.includes(i.sale_id))
  }

  const productMap = {}
  allItems.forEach((item) => {
    const key = item.product_name
    if (!productMap[key]) {
      productMap[key] = { name: key, quantity: 0, total: 0 }
    }
    productMap[key].quantity += item.quantity
    productMap[key].total += Number(item.subtotal)
  })

  return Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
}

/** Ventas agrupadas por día para gráficas */
export async function fetchSalesByDay(startDate, endDate) {
  const sales = await fetchSales({ startDate, endDate })
  const dayMap = {}

  sales.forEach((sale) => {
    const day = new Date(sale.created_at).toLocaleDateString('es-CO')
    if (!dayMap[day]) dayMap[day] = { date: day, total: 0, count: 0 }
    dayMap[day].total += Number(sale.total)
    dayMap[day].count += 1
  })

  return Object.values(dayMap)
}
