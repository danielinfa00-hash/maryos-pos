/**
 * Dashboard principal con indicadores del día.
 */
import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Banknote, Smartphone } from 'lucide-react'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'
import { fetchSalesStats, fetchTopProducts } from '../services/salesService'
import { fetchLowStockItems } from '../services/inventoryService'
import { formatCurrency, getDateRange } from '../utils/formatters'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [topProduct, setTopProduct] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { start, end } = getDateRange('hoy')
      const [salesStats, topProducts, lowItems] = await Promise.all([
        fetchSalesStats(start, end),
        fetchTopProducts(start, end, 1),
        fetchLowStockItems(),
      ])
      setStats(salesStats)
      setTopProduct(topProducts[0] || null)
      setLowStock(lowItems)
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <Loading />

  const indicators = [
    {
      icon: DollarSign,
      label: 'Ventas del día',
      value: formatCurrency(stats?.totalAmount),
      color: 'primary',
    },
    {
      icon: ShoppingBag,
      label: 'Pedidos del día',
      value: stats?.totalSales || 0,
      color: 'info',
    },
    {
      icon: Banknote,
      label: 'Efectivo',
      value: formatCurrency(stats?.cashAmount),
      color: 'success',
    },
    {
      icon: Smartphone,
      label: 'Transferencias',
      value: formatCurrency(stats?.transferAmount),
      color: 'warning',
    },
  ]

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Resumen de operaciones de hoy</p>
      </div>

      <div className="stats-grid">
        {indicators.map((item) => (
          <Card key={item.label} className={`stat-card stat-card--${item.color}`}>
            <item.icon size={28} />
            <div>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </div>
          </Card>
        ))}
      </div>

      <div className="dashboard__grid">
        <Card className="dashboard__card">
          <h3>Producto más vendido</h3>
          {topProduct ? (
            <div className="top-product">
              <strong>{topProduct.name}</strong>
              <span>{topProduct.quantity} unidades</span>
            </div>
          ) : (
            <p className="text-muted">Sin ventas hoy</p>
          )}
        </Card>

        {lowStock.length > 0 && (
          <Card className="dashboard__card dashboard__card--alert">
            <h3>⚠ Stock bajo</h3>
            <ul className="stock-alert-list">
              {lowStock.map((item) => (
                <li key={item.id}>
                  {item.name} — {item.current_stock} {item.unit}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
