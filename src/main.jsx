/**
 * Punto de entrada de la aplicación React.
 * Monta el árbol de componentes en #root.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/variables.css'
import './styles/global.css'
import './styles/components.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
