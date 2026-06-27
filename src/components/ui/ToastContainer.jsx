/** Contenedor de toasts de notificación */
import { useNotification } from '../../contexts/NotificationContext'

export default function ToastContainer() {
  const { toasts } = useNotification()

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
