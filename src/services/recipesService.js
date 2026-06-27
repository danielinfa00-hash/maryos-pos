import { supabase, isSupabaseConfigured, handleSupabaseError } from '../supabase/client'
import { getLocalTable, insertLocal, updateLocal, deleteLocal, generateId } from './localStorage'
import * as productsService from './productsService'
import * as inventoryService from './inventoryService'

export async function fetchRecipes() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, products(name)')
      .order('name')

    if (error) handleSupabaseError(error, 'fetchRecipes')
    return data
  }

  const recipes = getLocalTable('recipes')
  const products = await productsService.fetchProducts()
  return recipes.map((r) => ({
    ...r,
    products: products.find((p) => p.id === r.product_id) || { name: 'Desconocido' },
  }))
}

export async function fetchRecipeItems(recipeId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('recipe_items')
      .select('*, inventory_items(name, unit)')
      .eq('recipe_id', recipeId)

    if (error) handleSupabaseError(error, 'fetchRecipeItems')
    return data
  }

  const items = getLocalTable('recipe_items').filter((i) => i.recipe_id === recipeId)
  const inv = await inventoryService.fetchInventoryItems()
  return items.map((i) => ({
    ...i,
    inventory_items: inv.find((x) => x.id === i.inventory_item_id) || { name: 'Desconocido', unit: '' },
  }))
}

export async function createRecipe(productId) {
  const products = await productsService.fetchProducts()
  const product = products.find((p) => p.id === productId)
  const record = {
    product_id: productId,
    name: product?.name || 'Receta',
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('recipes')
      .insert(record)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'createRecipe')
    return data
  }

  return insertLocal('recipes', { ...record, id: generateId('recipe') })
}

export async function addRecipeItem(recipeId, inventoryItemId, quantity) {
  const record = { recipe_id: recipeId, inventory_item_id: inventoryItemId, quantity: Number(quantity) }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('recipe_items')
      .insert(record)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'addRecipeItem')
    return data
  }

  return insertLocal('recipe_items', { ...record, id: generateId('ri') })
}

export async function deleteRecipeItem(itemId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('recipe_items').delete().eq('id', itemId)
    if (error) handleSupabaseError(error, 'deleteRecipeItem')
    return true
  }

  deleteLocal('recipe_items', itemId)
  return true
}

export async function deleteRecipe(recipeId) {
  if (isSupabaseConfigured) {
    await supabase.from('recipe_items').delete().eq('recipe_id', recipeId)
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
    if (error) handleSupabaseError(error, 'deleteRecipe')
    return true
  }

  const data = getLocalTable('recipe_items')
  const filtered = data.filter((i) => i.recipe_id !== recipeId)
  const localStorage = await import('./localStorage')
  deleteLocal('recipes', recipeId)

  const allData = localStorage.getLocalData()
  allData.recipe_items = filtered
  localStorage.setLocalData(allData)
  return true
}
