/**
 * Vista principal de mesas.
 * CRUD de mesas y navegación al pedido.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTables } from '../contexts/TablesContext'
import { useNotification } from '../contexts/NotificationContext'
import TableCard from '../components/tables/TableCard'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import Input from '../components/ui/Input'
import Loading from '../components/ui/Loading'
import EmptyState from '../components/ui/EmptyState'
import * as ordersService from '../services/ordersService'
import * as tablesService from '../services/tablesService'

export default function TablesPage() {
  const navigate = useNavigate()
  const { tables, loading, loadTables, createTable, updateTable, removeTable } = useTables()
  const { notify } = useNotification()

  const [modal, setModal] = useState({ open: false, mode: 'create', table: null, name: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTables()
  }, [loadTables])

  const openCreateModal = () => {
    setModal({ open: true, mode: 'create', table: null, name: '' })
  }

  const openEditModal = (table) => {
    setModal({ open: true, mode: 'edit', table, name: table.name })
  }

  const handleSave = async () => {
    if (!modal.name.trim()) return notify.error('Ingresa un nombre')
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createTable(modal.name.trim())
        notify.success('Mesa creada')
      } else {
        await updateTable(modal.table.id, { name: modal.name.trim() })
        notify.success('Mesa actualizada')
      }
      setModal({ open: false, mode: 'create', table: null, name: '' })
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await removeTable(deleteTarget.id)
      notify.success('Mesa eliminada')
      setDeleteTarget(null)
    } catch (err) {
      notify.error(err.message)
    }
  }

  const handleOpenTable = async (table) => {
    try {
      let order = await ordersService.fetchActiveOrderByTable(table.id)
      if (!order) {
        order = await ordersService.createOrder(table.id)
      }
      navigate(`/mesas/${table.id}`, { state: { table, order } })
    } catch (err) {
      notify.error(err.message)
    }
  }

  const handleRequestBill = async (table) => {
    try {
      await tablesService.requestBill(table.id)
      await loadTables()
      notify.info('Cuenta solicitada')
    } catch (err) {
      notify.error(err.message)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="tables-page">
      <div className="page-header page-header--actions">
        <div>
          <h2>Mesas</h2>
          <p>Gestiona mesas y pedidos</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={18} /> Nueva mesa
        </Button>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          title="No hay mesas"
          description="Crea tu primera mesa para comenzar"
          action={<Button onClick={openCreateModal}>Crear mesa</Button>}
        />
      ) : (
        <div className="tables-grid">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onOpen={handleOpenTable}
              onEdit={openEditModal}
              onDelete={(table) => setDeleteTarget(table)}
              onRequestBill={handleRequestBill}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', table: null, name: '' })}
        title={modal.mode === 'create' ? 'Nueva mesa' : 'Editar mesa'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false, mode: 'create', table: null, name: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>Guardar</Button>
          </>
        }
      >
        <Input
          label="Nombre de la mesa"
          value={modal.name}
          onChange={(e) => setModal((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ej: Mesa 5"
          autoFocus
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar mesa"
        message={`¿Eliminar ${deleteTarget?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </div>
  )
}
