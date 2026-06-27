/** Estado vacío cuando no hay datos */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={48} strokeWidth={1.5} />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
