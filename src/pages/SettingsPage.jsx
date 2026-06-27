import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import * as productsService from '../services/productsService'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Loading from '../components/ui/Loading'
import { useNotification } from '../contexts/NotificationContext'

export default function SettingsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { notify } = useNotification()

  const [productModal, setProductModal] = useState({ open: false, product: null, name: '', price: '', category_id: '', is_available: true })

  useEffect(() => {
    async function load() {
      const [prods, cats] = await Promise.all([
        productsService.fetchProducts(),
        productsService.fetchCategories(),
      ])
      setProducts(prods)
      setCategories(cats)
      setLoading(false)
    }
    load()
  }, [])

  const toggleAvailability = async (product) => {
    await productsService.toggleProductAvailability(product.id, !product.is_available)
    notify.success(product.is_available ? 'Producto marcado como agotado' : 'Producto disponible')
    const prods = await productsService.fetchProducts()
    setProducts(prods)
  }

  const openNewProduct = () => {
    setProductModal({
      open: true,
      product: null,
      name: '',
      price: '',
      category_id: categories[0]?.id || '',
      is_available: true,
    })
  }

  const openEditProduct = (product) => {
    setProductModal({
      open: true,
      product,
      name: product.name,
      price: String(product.price),
      category_id: product.category_id,
      is_available: product.is_available,
    })
  }

  const saveProduct = async () => {
    if (!productModal.name.trim() || !productModal.price || !productModal.category_id) {
      return notify.error('Completa todos los campos')
    }
    setSaving(true)
    try {
      const data = {
        name: productModal.name.trim(),
        price: Number(productModal.price),
        category_id: productModal.category_id,
        is_available: productModal.is_available,
      }
      if (productModal.product) {
        await productsService.updateProduct(productModal.product.id, data)
        notify.success('Producto actualizado')
      } else {
        await productsService.createProduct({ ...data, sort_order: Math.floor(Date.now() / 1000) })
        notify.success('Producto creado')
      }
      setProductModal({ open: false, product: null, name: '', price: '', category_id: '', is_available: true })
      const prods = await productsService.fetchProducts()
      setProducts(prods)
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="settings-page">
      <div className="page-header page-header--actions">
        <div>
          <h2>Configuración</h2>
          <p>Usuarios y gestión de productos</p>
        </div>
      </div>

      <div className="settings-grid">
        <Card>
          <div className="settings-card-header">
            <h3>Productos</h3>
            <Button size="sm" onClick={openNewProduct}><Plus size={16} /> Nuevo</Button>
          </div>
          <div className="settings-products">
            {products.map((p) => (
              <div key={p.id} className="settings-product-row">
                <div className="settings-product-info">
                  <span className={!p.is_available ? 'text-muted' : ''}>{p.name}</span>
                  <small>${p.price} · {p.categories?.name || 'Sin categoría'}</small>
                </div>
                <div className="settings-product-actions">
                  <Button size="sm" variant="ghost" onClick={() => openEditProduct(p)}><Pencil size={14} /></Button>
                  <Button
                    size="sm"
                    variant={p.is_available ? 'secondary' : 'primary'}
                    onClick={() => toggleAvailability(p)}
                  >
                    {p.is_available ? 'Agotado' : 'Disponible'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={productModal.open}
        onClose={() => setProductModal({ open: false, product: null, name: '', price: '', category_id: '', is_available: true })}
        title={productModal.product ? 'Editar producto' : 'Nuevo producto'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setProductModal({ open: false, product: null, name: '', price: '', category_id: '', is_available: true })}>Cancelar</Button>
            <Button onClick={saveProduct} loading={saving}>{productModal.product ? 'Guardar' : 'Crear'}</Button>
          </>
        }
      >
        <Input label="Nombre" value={productModal.name} onChange={(e) => setProductModal((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre del producto" />
        <Input label="Precio (COP)" type="number" value={productModal.price} onChange={(e) => setProductModal((p) => ({ ...p, price: e.target.value }))} placeholder="10000" />
        <div className="form-field">
          <label className="form-label">Categoría</label>
          <select value={productModal.category_id} onChange={(e) => setProductModal((p) => ({ ...p, category_id: e.target.value }))} className="form-input">
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      </Modal>
    </div>
  )
}
