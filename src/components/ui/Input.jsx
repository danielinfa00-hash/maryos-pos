/** Input de texto reutilizable con label opcional */
export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`form-field ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${error ? 'form-input--error' : ''}`} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
