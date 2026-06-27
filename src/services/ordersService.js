/**
 * Servicio de pedidos (orders + order_items).
 * Gestiona pedidos abiertos por mesa hasta el cobro.
 */
import { supabase, isSupabaseConfigured, handleSupabaseError } from '../supabase/client'
import {
  getLocalTable,
  insertLocal,
  updateLocal,
  generateId,
  getLocalData,
  setLocalData,
} from './localStorage'
import { ORDER_STATUS, TABLE_STATUS } from '../utils/constants'
import { syncTableTotals, updateTable } from './tablesService'

/** Busca el pedido activo (no cobrado) de una mesa */
export async function fetchActiveOrderByTable(tableId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('table_id', tableId)
      .neq('status', ORDER_STATUS.PAID)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) handleSupabaseError(error, 'fetchActiveOrderByTable')
    return data
  }

  const orders = getLocalTable('orders')
  const order = orders
    .filter((o) => o.table_id === tableId && o.status !== ORDER_STATUS.PAID)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

  if (!order) return null

  const items = getLocalTable('order_items').filter((i) => i.order_id === order.id)
  return { ...order, order_items: items }
}

/** Crea un pedido nuevo al abrir mesa */
export async function createOrder(tableId) {
  const record = {
    table_id: tableId,
    status: ORDER_STATUS.PENDING,
    subtotal: 0,
    total: 0,
    opened_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('orders')
      .insert(record)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'createOrder')
    await updateTable(tableId, { status: TABLE_STATUS.OCCUPIED })
    return data
  }

  const order = insertLocal('orders', { ...record, id: generateId('order') })
  await updateTable(tableId, { status: TABLE_STATUS.OCCUPIED })
  return order
}

/** Recalcula totales del pedido */
function recalculateOrderTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0)
  return { subtotal, total: subtotal }
}

/** Agrega un producto al pedido */
export async function addOrderItem(orderId, product, quantity = 1, notes = '') {
  const subtotal = Number(product.price) * quantity
  const item = {
    order_id: orderId,
    product_id: product.id,
    product_name: product.name,
    unit_price: product.price,
    quantity,
    subtotal,
    notes,
    status: ORDER_STATUS.PENDING,
    created_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('order_items')
      .insert(item)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'addOrderItem')
    return refreshOrderTotals(orderId)
  }

  insertLocal('order_items', { ...item, id: generateId('oi') })
  return refreshOrderTotals(orderId)
}

/** Actualiza cantidad de un ítem */
export async function updateOrderItemQuantity(itemId, quantity) {
  if (quantity < 1) return removeOrderItem(itemId)

  if (isSupabaseConfigured) {
    const { data: item, error: fetchErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (fetchErr) handleSupabaseError(fetchErr, 'updateOrderItemQuantity')

    const subtotal = Number(item.unit_price) * quantity
    const { error } = await supabase
      .from('order_items')
      .update({ quantity, subtotal })
      .eq('id', itemId)

    if (error) handleSupabaseError(error, 'updateOrderItemQuantity')
    return refreshOrderTotals(item.order_id)
  }

  const items = getLocalTable('order_items')
  const item = items.find((i) => i.id === itemId)
  if (!item) return null

  const subtotal = Number(item.unit_price) * quantity
  updateLocal('order_items', itemId, { quantity, subtotal })
  return refreshOrderTotals(item.order_id)
}

/** Elimina un ítem del pedido */
export async function removeOrderItem(itemId) {
  if (isSupabaseConfigured) {
    const { data: item } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('id', itemId)
      .single()

    const { error } = await supabase.from('order_items').delete().eq('id', itemId)
    if (error) handleSupabaseError(error, 'removeOrderItem')
    return refreshOrderTotals(item.order_id)
  }

  const items = getLocalTable('order_items')
  const item = items.find((i) => i.id === itemId)
  const data = getLocalData()
  data.order_items = data.order_items.filter((i) => i.id !== itemId)
  setLocalData(data)
  return refreshOrderTotals(item?.order_id)
}

/** Actualiza observaciones de un ítem */
export async function updateOrderItemNotes(itemId, notes) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('order_items')
      .update({ notes })
      .eq('id', itemId)

    if (error) handleSupabaseError(error, 'updateOrderItemNotes')
    return true
  }

  updateLocal('order_items', itemId, { notes })
  return true
}

/** Cambia estado de un ítem (cocina) */
export async function updateOrderItemStatus(itemId, status) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', itemId)

    if (error) handleSupabaseError(error, 'updateOrderItemStatus')
    return true
  }

  updateLocal('order_items', itemId, { status })
  return true
}

/** Recalcula y persiste totales del pedido y mesa */
async function refreshOrderTotals(orderId) {
  let items = []
  let order = null

  if (isSupabaseConfigured) {
    const { data: orderData } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    order = orderData
    items = orderData?.order_items || []
  } else {
    order = getLocalTable('orders').find((o) => o.id === orderId)
    items = getLocalTable('order_items').filter((i) => i.order_id === orderId)
  }

  const totals = recalculateOrderTotals(items)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  if (isSupabaseConfigured) {
    await supabase
      .from('orders')
      .update({ ...totals, updated_at: new Date().toISOString() })
      .eq('id', orderId)
  } else {
    updateLocal('orders', orderId, totals)
  }

  if (order?.table_id) {
    await syncTableTotals(order.table_id, totals.total, itemCount)
  }

  return { ...order, ...totals, order_items: items, item_count: itemCount }
}

/** Obtiene pedidos pendientes para cocina */
export async function fetchKitchenOrders() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, orders(table_id, restaurant_tables(name))')
      .in('status', [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING])
      .order('created_at')

    if (error) handleSupabaseError(error, 'fetchKitchenOrders')
    return data
  }

  return getLocalTable('order_items').filter((i) =>
    [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING].includes(i.status)
  )
}
