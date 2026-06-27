/**
 * Servicio de categorías y productos del menú.
 */
import { supabase, isSupabaseConfigured, handleSupabaseError } from '../supabase/client'
import { getLocalTable, insertLocal, updateLocal, generateId } from './localStorage'

/** Obtiene categorías activas */
export async function fetchCategories() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) handleSupabaseError(error, 'fetchCategories')
    return data
  }

  return getLocalTable('categories').sort((a, b) => a.sort_order - b.sort_order)
}

/** Obtiene productos, opcionalmente filtrados por categoría */
export async function fetchProducts(categoryId = null) {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('products')
      .select('*, categories(name)')
      .order('sort_order')

    if (categoryId) query = query.eq('category_id', categoryId)

    const { data, error } = await query
    if (error) handleSupabaseError(error, 'fetchProducts')
    return data
  }

  let products = getLocalTable('products')
  if (categoryId) products = products.filter((p) => p.category_id === categoryId)
  return products.sort((a, b) => a.sort_order - b.sort_order)
}

/** Busca productos por nombre */
export async function searchProducts(term) {
  const products = await fetchProducts()
  const lower = term.toLowerCase()
  return products.filter((p) => p.name.toLowerCase().includes(lower))
}

/** Marca producto como disponible o agotado */
export async function toggleProductAvailability(id, isAvailable) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_available: isAvailable })
      .eq('id', id)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'toggleProductAvailability')
    return data
  }

  return updateLocal('products', id, { is_available: isAvailable })
}

/** Crea un producto nuevo */
export async function createProduct(product) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('products').insert(product).select().single()
    if (error) handleSupabaseError(error, 'createProduct')
    return data
  }

  return insertLocal('products', { ...product, id: generateId('prod') })
}

/** Actualiza un producto */
export async function updateProduct(id, updates) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'updateProduct')
    return data
  }

  return updateLocal('products', id, updates)
}
