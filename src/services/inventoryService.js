/**
 * Servicio de inventario, recetas y movimientos.
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
import { INVENTORY_MOVEMENT } from '../utils/constants'

/** Obtiene todos los ingredientes */
export async function fetchInventoryItems() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) handleSupabaseError(error, 'fetchInventoryItems')
    return data
  }

  return getLocalTable('inventory_items')
}

/** Ingredientes con stock bajo (alertas) */
export async function fetchLowStockItems() {
  const items = await fetchInventoryItems()
  return items.filter((i) => Number(i.current_stock) <= Number(i.min_stock))
}

/** Crea un ingrediente */
export async function createInventoryItem(item) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'createInventoryItem')
    return data
  }

  return insertLocal('inventory_items', { ...item, id: generateId('inv') })
}

/** Actualiza un ingrediente */
export async function updateInventoryItem(id, updates) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'updateInventoryItem')
    return data
  }

  return updateLocal('inventory_items', id, updates)
}

/** Registra un movimiento de inventario (entrada, ajuste, pérdida) */
export async function registerInventoryMovement({
  inventoryItemId,
  movementType,
  quantity,
  reference = '',
}) {
  const items = await fetchInventoryItems()
  const item = items.find((i) => i.id === inventoryItemId)
  if (!item) throw new Error('Ingrediente no encontrado')

  const prevStock = Number(item.current_stock)
  let delta = Number(quantity)

  // Entrada suma, venta/pérdida resta, ajuste puede ser +/- según signo
  if (movementType === INVENTORY_MOVEMENT.SALE || movementType === INVENTORY_MOVEMENT.LOSS) {
    delta = -Math.abs(delta)
  } else if (movementType === INVENTORY_MOVEMENT.ENTRY) {
    delta = Math.abs(delta)
  }

  const newStock = Math.max(0, prevStock + delta)

  const movement = {
    inventory_item_id: inventoryItemId,
    movement_type: movementType,
    quantity: Math.abs(quantity),
    previous_stock: prevStock,
    new_stock: newStock,
    reference,
    created_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured) {
    await supabase.from('inventory_movements').insert(movement)
    await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', inventoryItemId)
  } else {
    insertLocal('inventory_movements', { ...movement, id: generateId('mov') })
    updateLocal('inventory_items', inventoryItemId, { current_stock: newStock })
  }

  return { ...item, current_stock: newStock }
}

/** Historial de movimientos de un ingrediente */
export async function fetchInventoryMovements(inventoryItemId = null) {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('inventory_movements')
      .select('*, inventory_items(name)')
      .order('created_at', { ascending: false })

    if (inventoryItemId) query = query.eq('inventory_item_id', inventoryItemId)

    const { data, error } = await query
    if (error) handleSupabaseError(error, 'fetchInventoryMovements')
    return data
  }

  let movements = getLocalTable('inventory_movements')
  if (inventoryItemId) {
    movements = movements.filter((m) => m.inventory_item_id === inventoryItemId)
  }
  return movements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

/**
 * Descuenta inventario al cobrar según recetas.
 * En modo demo usa recetas simplificadas por nombre de producto.
 */
export async function deductInventoryForSale(orderItems) {
  // Recetas demo simplificadas (en producción vienen de recipe_items)
  // Los nombres deben coincidir EXACTAMENTE con product.name en mayúsculas
  const demoRecipes = {
    'PERRO ESPECIAL': [
      { name: 'Pan', qty: 1 },
      { name: 'Salchicha', qty: 1 },
      { name: 'Queso Mozzarella', qty: 20 },
      { name: 'Tocineta', qty: 1 },
    ],
    'DOBLE': [
      { name: 'Pan', qty: 1 },
      { name: 'Carne', qty: 200 },
      { name: 'Queso Amarillo', qty: 30 },
    ],
    'SENCILLA': [
      { name: 'Pan', qty: 1 },
      { name: 'Carne', qty: 120 },
    ],
  }

  const items = await fetchInventoryItems()

  for (const orderItem of orderItems) {
    const recipe = demoRecipes[orderItem.product_name]
    if (!recipe) continue

    for (const ingredient of recipe) {
      const invItem = items.find((i) => i.name === ingredient.name)
      if (!invItem) continue

      const totalQty = ingredient.qty * orderItem.quantity
      await registerInventoryMovement({
        inventoryItemId: invItem.id,
        movementType: INVENTORY_MOVEMENT.SALE,
        quantity: totalQty,
        reference: `Venta: ${orderItem.product_name}`,
      })
    }
  }
}

/** Elimina un ingrediente (desactiva) */
export async function deleteInventoryItem(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', id)

    if (error) handleSupabaseError(error, 'deleteInventoryItem')
    return true
  }

  const data = getLocalData()
  data.inventory_items = data.inventory_items.filter((i) => i.id !== id)
  setLocalData(data)
  return true
}
