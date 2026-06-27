/**
 * Panel de productos para agregar al pedido.
 * Incluye categorías, buscador y grid de productos.
 */
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import * as productsService from '../../services/productsService'
import { formatCurrency } from '../../utils/formatters'
import Loading from '../ui/Loading'

export default function ProductPanel({ onAddProduct }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [cats, prods] = await Promise.all([
        productsService.fetchCategories(),
        productsService.fetchProducts(),
      ])
      setCategories(cats)
      setProducts(prods)
      if (cats.length) setSelectedCategory(cats[0].id)
      setLoading(false)
    }
    load()
  }, [])

  const filteredProducts = products.filter((p) => {
    const matchCategory = !selectedCategory || p.category_id === selectedCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  if (loading) return <Loading message="Cargando productos..." />

  return (
    <div className="product-panel">
      <div className="product-panel__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="product-panel__categories">
        <button
          className={`category-chip ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="product-panel__grid">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            className={`product-item ${!product.is_available ? 'product-item--soldout' : ''}`}
            disabled={!product.is_available}
            onClick={() => onAddProduct(product)}
          >
            <span className="product-item__name">{product.name}</span>
            <span className="product-item__price">{formatCurrency(product.price)}</span>
            {!product.is_available && <span className="product-item__badge">Agotado</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
