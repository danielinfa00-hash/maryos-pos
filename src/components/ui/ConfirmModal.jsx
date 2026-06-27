import Modal from './Modal'
import Button from './Button'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar',
  message = '¿Estás seguro?',
  confirmText = 'Confirmar',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmText}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}
