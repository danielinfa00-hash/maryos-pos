/**
 * Módulo de caja diaria: apertura, movimientos y cierre.
 */
import { useEffect, useState } from 'react'
import * as cashService from '../services/cashService'
import { CASH_MOVEMENT } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import Input from '../components/ui/Input'
import Loading from '../components/ui/Loading'
import { useNotification } from '../contexts/NotificationContext'

export default function CashPage() {
  const [session, setSession] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const { notify } = useNotification()

  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [movModal, setMovModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [movAmount, setMovAmount] = useState('')
  const [movDesc, setMovDesc] = useState('')
  const [movType, setMovType] = useState(CASH_MOVEMENT.INCOME)
  const [openingCash, setOpeningCash] = useState(false)
  const [closingCash, setClosingCash] = useState(false)
  const [savingMov, setSavingMov] = useState(false)

  const load = async () => {
    setLoading(true)
    const openSession = await cashService.fetchOpenCashSession()
    setSession(openSession)
    if (openSession) {
      const sum = await cashService.calculateCashSummary(openSession)
      setSummary(sum)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleOpen = async () => {
    setOpeningCash(true)
    try {
      await cashService.openCashSession(Number(openingAmount))
      notify.success('Caja abierta')
      setOpenModal(false)
      load()
    } catch (err) {
      notify.error(err.message)
    } finally {
      setOpeningCash(false)
    }
  }

  const handleClose = async () => {
    setClosingCash(true)
    try {
      const result = await cashService.closeCashSession(session.id, Number(closingAmount), closingNotes)
      notify.success(`Caja cerrada. Diferencia: ${formatCurrency(result.difference)}`)
      setCloseModal(false)
      setClosingNotes('')
      load()
    } catch (err) {
      notify.error(err.message)
    } finally {
      setClosingCash(false)
    }
  }

  const handleMovement = async () => {
    setSavingMov(true)
    try {
      await cashService.addCashMovement(session.id, movType, Number(movAmount), movDesc)
      notify.success('Movimiento registrado')
      setMovModal(false)
      load()
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSavingMov(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="cash-page">
      <div className="page-header page-header--actions">
        <div>
          <h2>Caja</h2>
          <p>Control de efectivo diario</p>
        </div>
        {!session ? (
          <Button onClick={() => setOpenModal(true)}>Abrir caja</Button>
        ) : (
          <div className="cash-actions">
            <Button variant="secondary" onClick={() => setMovModal(true)}>Registrar movimiento</Button>
            <Button variant="danger" onClick={() => setCloseModal(true)}>Cerrar caja</Button>
          </div>
        )}
      </div>

      {!session ? (
        <Card className="cash-empty">
          <p>No hay caja abierta. Abre la caja para comenzar el día.</p>
        </Card>
      ) : (
        <div className="stats-grid">
          <Card className="stat-card stat-card--primary">
            <small>Monto inicial</small>
            <strong>{formatCurrency(session.opening_amount)}</strong>
          </Card>
          <Card className="stat-card stat-card--success">
            <small>Total ventas</small>
            <strong>{formatCurrency(summary?.totalSales)}</strong>
          </Card>
          <Card className="stat-card stat-card--info">
            <small>Efectivo</small>
            <strong>{formatCurrency(summary?.totalCash)}</strong>
          </Card>
          <Card className="stat-card stat-card--warning">
            <small>Transferencias</small>
            <strong>{formatCurrency(summary?.totalTransfer)}</strong>
          </Card>
          <Card className="stat-card">
            <small>Efectivo esperado</small>
            <strong>{formatCurrency(summary?.expectedCash)}</strong>
          </Card>
        </div>
      )}

      <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title="Abrir caja"
        footer={<><Button variant="secondary" onClick={() => setOpenModal(false)}>Cancelar</Button><Button onClick={handleOpen} loading={openingCash}>Abrir</Button></>}>
        <Input label="Monto inicial" type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} />
      </Modal>

      <Modal isOpen={closeModal} onClose={() => setCloseModal(false)} title="Cerrar caja"
        footer={<><Button variant="secondary" onClick={() => setCloseModal(false)}>Cancelar</Button><Button onClick={handleClose} loading={closingCash}>Cerrar caja</Button></>}>
        <p>Efectivo esperado: <strong>{formatCurrency(summary?.expectedCash)}</strong></p>
        <Input label="Efectivo contado" type="number" value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} />
        <Input label="Notas (opcional)" value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} placeholder="Observaciones del cierre..." />
      </Modal>

      <Modal isOpen={movModal} onClose={() => setMovModal(false)} title="Registrar movimiento"
        footer={<><Button variant="secondary" onClick={() => setMovModal(false)}>Cancelar</Button><Button onClick={handleMovement} loading={savingMov}>Guardar</Button></>}>
        <div className="form-field">
          <label className="form-label">Tipo</label>
          <select value={movType} onChange={(e) => setMovType(e.target.value)} className="form-input">
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>
        <Input label="Monto" type="number" value={movAmount} onChange={(e) => setMovAmount(e.target.value)} />
        <Input label="Descripción" value={movDesc} onChange={(e) => setMovDesc(e.target.value)} />
      </Modal>
    </div>
  )
}
