/** Indicador de carga centrado */
export default function Loading({ message = 'Cargando...' }) {
  return (
    <div className="loading">
      <div className="loading__spinner" />
      <p>{message}</p>
    </div>
  )
}
