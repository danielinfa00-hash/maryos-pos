/**
 * Módulo de inventario por ingredientes.
 * CRUD, entradas, salidas, ajustes y alertas de stock bajo.
 */
import { useEffect, useState } from 'react'
import { Plus, AlertTriangle, Trash2 } from 'lucide-react'
import * as inventoryService from '../services/inventoryService'
import { INVENTORY_MOVEMENT } from '../utils/constants'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import Input from '../components/ui/Input'
import Loading from '../components/ui/Loading'
import { useNotification } from '../contexts/NotificationContext'

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingItem, setSavingItem] = useState(false)
  const [savingMov, setSavingMov] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { notify } = useNotification()

  const [itemModal, setItemModal] = useState({ open: false, item: null, name: '', unit: 'unidad', min_stock: 0 })
  const [movModal, setMovModal] = useState({ open: false, item: null, type: 'entrada', quantity: '', reference: '' })

  const load = async () => {
    setLoading(true)
    const [inv, mov] = await Promise.all([
      inventoryService.fetchInventoryItems(),
      inventoryService.fetchInventoryMovements(),
    ])
    setItems(inv)
    setMovements(mov.slice(0, 20))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const isLowStock = (item) => Number(item.current_stock) <= Number(item.min_stock)

  const saveItem = async () => {
    setSavingItem(true)
    try {
      if (itemModal.item) {
        await inventoryService.updateInventoryItem(itemModal.item.id, {
          name: itemModal.name,
          unit: itemModal.unit,
          min_stock: Number(itemModal.min_stock),
        })
        notify.success('Ingrediente actualizado')
      } else {
        await inventoryService.createInventoryItem({
          name: itemModal.name,
          unit: itemModal.unit,
          min_stock: Number(itemModal.min_stock),
          current_stock: 0,
          is_active: true,
        })
        notify.success('Ingrediente creado')
      }
      setItemModal({ open: false, item: null, name: '', unit: 'unidad', min_stock: 0 })
      load()
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSavingItem(false)
    }
  }

  const saveMovement = async () => {
    setSavingMov(true)
    try {
      await inventoryService.registerInventoryMovement({
        inventoryItemId: movModal.item.id,
        movementType: movModal.type,
        quantity: Number(movModal.quantity),
        reference: movModal.reference,
        userId: null,
      })
      notify.success('Movimiento registrado')
      setMovModal({ open: false, item: null, type: 'entrada', quantity: '', reference: '' })
      load()
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSavingMov(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="inventory-page">
      <div className="page-header page-header--actions">
        <div>
          <h2>Inventario</h2>
          <p>Gestión de ingredientes</p>
        </div>
        <Button onClick={() => setItemModal({ open: true, item: null, name: '', unit: 'unidad', min_stock: 0 })}>
          <Plus size={18} /> Nuevo ingrediente
        </Button>
      </div>

      <div className="inventory-grid">
        {items.map((item) => (
          <Card key={item.id} className={`inventory-card ${isLowStock(item) ? 'inventory-card--low' : ''}`}>
            <div className="inventory-card__header">
              <strong>{item.name}</strong>
              {isLowStock(item) && <AlertTriangle size={18} className="text-warning" />}
            </div>
            <p>Stock: {item.current_stock} {item.unit}</p>
            <p>Mínimo: {item.min_stock} {item.unit}</p>
            <div className="inventory-card__actions">
              <Button size="sm" variant="secondary" onClick={() => setMovModal({ open: true, item, type: INVENTORY_MOVEMENT.ENTRY, quantity: '', reference: '' })}>
                Entrada
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setMovModal({ open: true, item, type: INVENTORY_MOVEMENT.ADJUSTMENT, quantity: '', reference: '' })}>
                Ajuste
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setItemModal({ open: true, item, name: item.name, unit: item.unit, min_stock: item.min_stock })}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(item)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="movements-table">
        <h3>Historial reciente</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ingrediente</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.created_at).toLocaleString('es-CO')}</td>
                <td>{m.inventory_items?.name || items.find((i) => i.id === m.inventory_item_id)?.name}</td>
                <td>{m.movement_type}</td>
                <td>{m.quantity}</td>
                <td>{m.reference || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        isOpen={itemModal.open}
        onClose={() => setItemModal({ open: false, item: null, name: '', unit: 'unidad', min_stock: 0 })}
        title={itemModal.item ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        footer={<><Button variant="secondary" onClick={() => setItemModal({ open: false, item: null, name: '', unit: 'unidad', min_stock: 0 })}>Cancelar</Button><Button onClick={saveItem} loading={savingItem}>Guardar</Button></>}
      >
        <Input label="Nombre" value={itemModal.name} onChange={(e) => setItemModal((p) => ({ ...p, name: e.target.value }))} />
        <Input label="Unidad" value={itemModal.unit} onChange={(e) => setItemModal((p) => ({ ...p, unit: e.target.value }))} />
        <Input label="Stock mínimo" type="number" value={itemModal.min_stock} onChange={(e) => setItemModal((p) => ({ ...p, min_stock: e.target.value }))} />
      </Modal>

      <Modal
        isOpen={movModal.open}
        onClose={() => setMovModal({ open: false, item: null, type: 'entrada', quantity: '', reference: '' })}
        title={`Movimiento: ${movModal.item?.name}`}
        footer={<><Button variant="secondary" onClick={() => setMovModal({ open: false, item: null, type: 'entrada', quantity: '', reference: '' })}>Cancelar</Button><Button onClick={saveMovement} loading={savingMov}>Registrar</Button></>}
      >
        <div className="form-field">
          <label className="form-label">Tipo</label>
          <select value={movModal.type} onChange={(e) => setMovModal((p) => ({ ...p, type: e.target.value }))} className="form-input">
            <option value="entrada">Entrada</option>
            <option value="ajuste">Ajuste</option>
            <option value="perdida">Pérdida</option>
          </select>
        </div>
        <Input label="Cantidad" type="number" value={movModal.quantity} onChange={(e) => setMovModal((p) => ({ ...p, quantity: e.target.value }))} />
        <Input label="Referencia" value={movModal.reference} onChange={(e) => setMovModal((p) => ({ ...p, reference: e.target.value }))} />
      </Modal>
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await inventoryService.deleteInventoryItem(deleteTarget.id); notify.success('Ingrediente eliminado'); setDeleteTarget(null); load(); }}
        title="Eliminar ingrediente"
        message={`¿Eliminar ${deleteTarget?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </div>
  )
}
