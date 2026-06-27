import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import * as recipesService from '../services/recipesService'
import * as productsService from '../services/productsService'
import * as inventoryService from '../services/inventoryService'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import Loading from '../components/ui/Loading'
import EmptyState from '../components/ui/EmptyState'
import { useNotification } from '../contexts/NotificationContext'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [recipeItems, setRecipeItems] = useState({})
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const { notify } = useNotification()

  const [createModal, setCreateModal] = useState(false)
  const [addItemModal, setAddItemModal] = useState({ open: false, recipeId: null })
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedInv, setSelectedInv] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [recs, prods, inv] = await Promise.all([
      recipesService.fetchRecipes(),
      productsService.fetchProducts(),
      inventoryService.fetchInventoryItems(),
    ])
    setRecipes(recs)
    setProducts(prods)
    setInventory(inv)

    const itemsMap = {}
    for (const r of recs) {
      itemsMap[r.id] = await recipesService.fetchRecipeItems(r.id)
    }
    setRecipeItems(itemsMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!selectedProduct) return notify.error('Selecciona un producto')
    setSaving(true)
    try {
      await recipesService.createRecipe(selectedProduct)
      notify.success('Receta creada')
      setCreateModal(false)
      setSelectedProduct('')
      load()
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async () => {
    if (!selectedInv || !quantity) return notify.error('Completa los campos')
    setSaving(true)
    try {
      await recipesService.addRecipeItem(addItemModal.recipeId, selectedInv, quantity)
      notify.success('Ingrediente agregado')
      setAddItemModal({ open: false, recipeId: null })
      setSelectedInv('')
      setQuantity('1')
      load()
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRecipe = async () => {
    if (!deleteTarget) return
    try {
      await recipesService.deleteRecipe(deleteTarget.id)
      notify.success('Receta eliminada')
      setDeleteTarget(null)
      load()
    } catch (err) {
      notify.error(err.message)
    }
  }

  if (loading) return <Loading />

  const productsWithoutRecipe = products.filter(
    (p) => !recipes.find((r) => r.product_id === p.id)
  )

  return (
    <div className="recipes-page">
      <div className="page-header page-header--actions">
        <div>
          <h2>Recetas</h2>
          <p>Define los ingredientes de cada producto</p>
        </div>
        <Button onClick={() => setCreateModal(true)} disabled={productsWithoutRecipe.length === 0}>
          <Plus size={18} /> Nueva receta
        </Button>
      </div>

      {recipes.length === 0 ? (
        <EmptyState
          title="No hay recetas"
          description="Crea recetas para asociar ingredientes a productos"
          action={productsWithoutRecipe.length > 0 ? <Button onClick={() => setCreateModal(true)}>Crear receta</Button> : null}
        />
      ) : (
        <div className="recipes-grid">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="recipe-card">
              <div className="recipe-card__header">
                <h3>{recipe.products?.name || recipe.name}</h3>
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(recipe)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="recipe-card__items">
                {(!recipeItems[recipe.id] || recipeItems[recipe.id].length === 0) ? (
                  <p className="text-muted">Sin ingredientes</p>
                ) : (
                  recipeItems[recipe.id].map((item) => (
                    <div key={item.id} className="recipe-item-row">
                      <span>{item.inventory_items?.name || '?'}</span>
                      <span>{item.quantity} {item.inventory_items?.unit || ''}</span>
                    </div>
                  ))
                )}
              </div>
              <Button size="sm" variant="secondary" onClick={() => setAddItemModal({ open: true, recipeId: recipe.id })}>
                <Plus size={14} /> Agregar ingrediente
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Nueva receta"
        footer={<><Button variant="secondary" onClick={() => setCreateModal(false)}>Cancelar</Button><Button onClick={handleCreate} loading={saving}>Crear</Button></>}
      >
        <div className="form-field">
          <label className="form-label">Producto</label>
          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="form-input">
            <option value="">Seleccionar producto...</option>
            {productsWithoutRecipe.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        isOpen={addItemModal.open}
        onClose={() => setAddItemModal({ open: false, recipeId: null })}
        title="Agregar ingrediente"
        footer={<><Button variant="secondary" onClick={() => setAddItemModal({ open: false, recipeId: null })}>Cancelar</Button><Button onClick={handleAddItem} loading={saving}>Agregar</Button></>}
      >
        <div className="form-field">
          <label className="form-label">Ingrediente</label>
          <select value={selectedInv} onChange={(e) => setSelectedInv(e.target.value)} className="form-input">
            <option value="">Seleccionar ingrediente...</option>
            {inventory.map((i) => (
              <option key={i.id} value={i.id}>{i.name} (stock: {i.current_stock} {i.unit})</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Cantidad</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0.001" step="0.001" className="form-input" />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRecipe}
        title="Eliminar receta"
        message={`¿Eliminar la receta de ${deleteTarget?.products?.name || deleteTarget?.name}?`}
        confirmText="Eliminar"
      />
    </div>
  )
}
