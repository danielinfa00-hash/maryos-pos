/**
 * Estadísticas con gráficas Recharts.
 */
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { fetchSalesStats, fetchTopProducts, fetchSalesByDay } from '../services/salesService'
import { formatCurrency, getDateRange } from '../utils/formatters'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

const PERIODS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
]

export default function StatisticsPage() {
  const [period, setPeriod] = useState('semana')
  const [stats, setStats] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [dailySales, setDailySales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { start, end } = getDateRange(period)
      const [s, top, daily] = await Promise.all([
        fetchSalesStats(start, end),
        fetchTopProducts(start, end, 10),
        fetchSalesByDay(start, end),
      ])
      setStats(s)
      setTopProducts(top)
      setDailySales(daily)
      setLoading(false)
    }
    load()
  }, [period])

  if (loading) return <Loading />

  const paymentData = [
    { name: 'Efectivo', value: stats?.cashAmount || 0 },
    { name: 'Transferencia', value: stats?.transferAmount || 0 },
  ]

  return (
    <div className="stats-page">
      <div className="page-header page-header--actions">
        <div>
          <h2>Estadísticas</h2>
          <p>Análisis de ventas</p>
        </div>
        <div className="filter-chips">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`category-chip ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <Card className="stat-card"><small>Pedidos</small><strong>{stats?.totalSales || 0}</strong></Card>
        <Card className="stat-card"><small>Total vendido</small><strong>{formatCurrency(stats?.totalAmount)}</strong></Card>
        <Card className="stat-card"><small>Efectivo</small><strong>{formatCurrency(stats?.cashAmount)}</strong></Card>
        <Card className="stat-card"><small>Transferencias</small><strong>{formatCurrency(stats?.transferAmount)}</strong></Card>
      </div>

      <div className="charts-grid">
        <Card className="chart-card">
          <h3>Ventas por día</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3>Métodos de pago</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {paymentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card chart-card--wide">
          <h3>Top 10 productos</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
