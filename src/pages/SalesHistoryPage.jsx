/**
 * Historial de ventas con filtros y búsqueda.
 */
import { useEffect, useState } from 'react'
import { Search, Eye, Printer } from 'lucide-react'
import { fetchSales, fetchSaleById } from '../services/salesService'
import { formatCurrency, formatDateTime, getDateRange } from '../utils/formatters'
import { PAYMENT_METHOD_LABELS } from '../utils/constants'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Loading from '../components/ui/Loading'
import InvoicePreview from '../components/sales/InvoicePreview'

const FILTERS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mes' },
]

const PAGE_SIZE = 15

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('hoy')
  const [search, setSearch] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [page, setPage] = useState(1)

  const loadSales = async () => {
    setLoading(true)
    const { start, end } = getDateRange(filter)
    const data = await fetchSales({ startDate: start, endDate: end, searchInvoice: search })
    setSales(data)
    setLoading(false)
  }

  useEffect(() => {
    setPage(1)
  }, [filter, search])

  useEffect(() => {
    loadSales()
  }, [filter, search])

  const totalPages = Math.ceil(sales.length / PAGE_SIZE)
  const paginatedSales = sales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const viewSale = async (saleId) => {
    const detail = await fetchSaleById(saleId)
    setSelectedSale(detail)
  }

  if (loading) return <Loading />

  return (
    <div className="history-page">
      <div className="page-header">
        <h2>Historial de Ventas</h2>
        <p>Consulta y reimprime facturas</p>
      </div>

      <div className="history-filters">
        <div className="filter-chips">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`category-chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="history-search">
          <Search size={18} />
          <input
            placeholder="Buscar por # factura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="sales-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Fecha</th>
              <th>Mesa</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr><td colSpan={6} className="text-muted">Sin ventas en este periodo</td></tr>
            ) : (
              paginatedSales.map((sale) => (
                <tr key={sale.id}>
                  <td>#{sale.invoice_number}</td>
                  <td>{formatDateTime(sale.created_at)}</td>
                  <td>{sale.restaurant_tables?.name || '-'}</td>
                  <td>{formatCurrency(sale.total)}</td>
                  <td>{PAYMENT_METHOD_LABELS[sale.payment_method]}</td>
                  <td>
                    <Button size="sm" variant="ghost" onClick={() => viewSale(sale.id)}>
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="pagination__info">Página {page} de {totalPages}</span>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={Boolean(selectedSale)}
        onClose={() => setSelectedSale(null)}
        title={`Factura #${selectedSale?.invoice_number}`}
      >
        {selectedSale && (
          <InvoicePreview
            sale={selectedSale}
            items={selectedSale.sale_items || []}
            restaurantName="Maryos POS"
          />
        )}
      </Modal>
    </div>
  )
}
