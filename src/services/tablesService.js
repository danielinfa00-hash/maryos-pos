/**
 * Servicio de mesas (restaurant_tables).
 * Capa de datos: los componentes NO consultan Supabase directamente.
 */
import { supabase, isSupabaseConfigured, handleSupabaseError } from '../supabase/client'
import {
  getLocalTable,
  insertLocal,
  updateLocal,
  deleteLocal,
  generateId,
} from './localStorage'
import { TABLE_STATUS } from '../utils/constants'

/** Obtiene todas las mesas activas ordenadas */
export async function fetchTables() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) handleSupabaseError(error, 'fetchTables')
    return data
  }

  return getLocalTable('restaurant_tables').sort((a, b) => a.sort_order - b.sort_order)
}

/** Crea una nueva mesa */
export async function createTable(name) {
  let nextSortOrder = 1
  try {
    const currentTables = await fetchTables()
    if (currentTables && currentTables.length > 0) {
      const maxSortOrder = Math.max(...currentTables.map(t => t.sort_order || 0))
      nextSortOrder = isFinite(maxSortOrder) ? maxSortOrder + 1 : currentTables.length + 1
    }
  } catch (e) {
    console.error('Error calculating sort_order:', e)
  }

  const record = {
    name,
    status: TABLE_STATUS.FREE,
    total_amount: 0,
    item_count: 0,
    sort_order: nextSortOrder,
    is_active: true,
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert(record)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'createTable')
    return data
  }

  return insertLocal('restaurant_tables', { ...record, id: generateId('table') })
}

/** Actualiza nombre o estado de una mesa */
export async function updateTable(id, updates) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'updateTable')
    return data
  }

  return updateLocal('restaurant_tables', id, updates)
}

/** Elimina (desactiva) una mesa */
export async function deleteTable(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ is_active: false })
      .eq('id', id)

    if (error) handleSupabaseError(error, 'deleteTable')
    return true
  }

  deleteLocal('restaurant_tables', id)
  return true
}

/** Abre una mesa (cambia a ocupada) */
export async function openTable(id) {
  return updateTable(id, { status: TABLE_STATUS.OCCUPIED })
}

/** Cierra/libera una mesa */
export async function closeTable(id) {
  return updateTable(id, {
    status: TABLE_STATUS.FREE,
    total_amount: 0,
    item_count: 0,
  })
}

/** Solicita la cuenta */
export async function requestBill(id) {
  return updateTable(id, { status: TABLE_STATUS.BILL_REQUESTED })
}

/** Sincroniza totales de la mesa desde el pedido activo */
export async function syncTableTotals(tableId, total, itemCount) {
  return updateTable(tableId, {
    total_amount: total,
    item_count: itemCount,
  })
}
