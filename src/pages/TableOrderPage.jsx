/**
 * Vista de pedido por mesa.
 * Panel izquierdo: productos | Panel derecho: pedido actual
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProductPanel from '../components/orders/ProductPanel'
import OrderPanel from '../components/orders/OrderPanel'
import PaymentModal from '../components/sales/PaymentModal'
import InvoicePreview from '../components/sales/InvoicePreview'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import * as ordersService from '../services/ordersService'
import * as tablesService from '../services/tablesService'
import { processSale } from '../services/salesService'
import { useNotification } from '../contexts/NotificationContext'
import { useTables } from '../contexts/TablesContext'

export default function TableOrderPage() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const { notify } = useNotification()
  const { loadTables } = useTables()

  const [table, setTable] = useState(null)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [completedSale, setCompletedSale] = useState(null)

  const refreshOrder = useCallback(async () => {
    const [tableData, orderData] = await Promise.all([
      tablesService.fetchTables().then((t) => t.find((x) => x.id === tableId)),
      ordersService.fetchActiveOrderByTable(tableId),
    ])
    setTable(tableData)
    setOrder(orderData)
  }, [tableId])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await refreshOrder()
      setLoading(false)
    }
    init()
  }, [refreshOrder])

  const handleAddProduct = async (product) => {
    try {
      if (!order) {
        const newOrder = await ordersService.createOrder(tableId)
        const updated = await ordersService.addOrderItem(newOrder.id, product)
        setOrder(updated)
      } else {
        const updated = await ordersService.addOrderItem(order.id, product)
        setOrder(updated)
      }
      await loadTables()
      notify.success(`${product.name} agregado`)
    } catch (err) {
      notify.error(err.message)
    }
  }

  const handleUpdateQuantity = async (itemId, quantity) => {
    const updated = await ordersService.updateOrderItemQuantity(itemId, quantity)
    setOrder(updated)
    await loadTables()
  }

  const handleRemoveItem = async (itemId) => {
    const updated = await ordersService.removeOrderItem(itemId)
    setOrder(updated)
    await loadTables()
  }

  const handleUpdateNotes = async (itemId, notes) => {
    await ordersService.updateOrderItemNotes(itemId, notes)
    await refreshOrder()
    notify.success('Observación guardada')
  }

  const handlePayment = async ({ paymentMethod, cashReceived }) => {
    setProcessing(true)
    try {
      const result = await processSale({
        order,
        table,
        paymentMethod,
        cashReceived,
        userId: null,
      })

      const saleDetail = {
        ...result.sale,
        restaurant_tables: table,
        table_name: table.name,
      }

      setCompletedSale({
        sale: saleDetail,
        items: order.order_items,
      })
      setPaymentOpen(false)
      await loadTables()
      notify.success('Venta registrada correctamente')
    } catch (err) {
      notify.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <Loading />

  if (!table) {
    return (
      <div className="empty-state">
        <p>Mesa no encontrada</p>
        <Button onClick={() => navigate('/mesas')}>Volver a mesas</Button>
      </div>
    )
  }

  return (
    <div className="table-order-page">
      <div className="table-order-page__products">
        <ProductPanel onAddProduct={handleAddProduct} />
      </div>
      <div className="table-order-page__order">
        <OrderPanel
          order={order}
          table={table}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onUpdateNotes={handleUpdateNotes}
          onCheckout={() => setPaymentOpen(true)}
        />
      </div>

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={order?.total || 0}
        onConfirm={handlePayment}
        loading={processing}
      />

      <Modal
        isOpen={Boolean(completedSale)}
        onClose={() => {
          setCompletedSale(null)
          navigate('/mesas')
        }}
        title="Factura generada"
        footer={
          <Button onClick={() => { setCompletedSale(null); navigate('/mesas') }}>
            Volver a mesas
          </Button>
        }
      >
        {completedSale && (
          <InvoicePreview
            sale={completedSale.sale}
            items={completedSale.items}
            restaurantName="Maryos POS"
          />
        )}
      </Modal>
    </div>
  )
}
