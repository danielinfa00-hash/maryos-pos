/**
 * Vista de ventas / cocina.
 * Muestra pedidos pendientes y en preparación.
 */
import { useEffect, useState } from 'react'
import * as ordersService from '../services/ordersService'
import Loading from '../components/ui/Loading'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { ORDER_STATUS } from '../utils/constants'
import { useNotification } from '../contexts/NotificationContext'

export default function SalesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { notify } = useNotification()

  const loadKitchen = async () => {
    setLoading(true)
    const data = await ordersService.fetchKitchenOrders()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    loadKitchen()
    const interval = setInterval(loadKitchen, 15000)
    return () => clearInterval(interval)
  }, [])

  const updateStatus = async (itemId, status) => {
    await ordersService.updateOrderItemStatus(itemId, status)
    notify.success('Estado actualizado')
    loadKitchen()
  }

  if (loading) return <Loading />

  return (
    <div className="sales-page">
      <div className="page-header">
        <h2>Pedidos en cocina</h2>
        <p>Organiza pedidos por estado</p>
      </div>

      {items.length === 0 ? (
        <p className="text-muted">No hay pedidos pendientes</p>
      ) : (
        <div className="kitchen-grid">
          {items.map((item) => (
            <div key={item.id} className="kitchen-card">
              <div className="kitchen-card__header">
                <strong>{item.product_name}</strong>
                <Badge status={item.status} />
              </div>
              {item.notes && <p className="kitchen-card__notes">Obs: {item.notes}</p>}
              <span>Cantidad: {item.quantity}</span>
              <div className="kitchen-card__actions">
                {item.status === ORDER_STATUS.PENDING && (
                  <Button size="sm" onClick={() => updateStatus(item.id, ORDER_STATUS.PREPARING)}>
                    Preparar
                  </Button>
                )}
                {item.status === ORDER_STATUS.PREPARING && (
                  <Button size="sm" onClick={() => updateStatus(item.id, ORDER_STATUS.DELIVERED)}>
                    Entregado
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
