/**
 * Layout principal con sidebar + header + contenido.
 * Envuelve todas las páneas autenticadas.
 */
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import ToastContainer from '../components/ui/ToastContainer'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/mesas': 'Mesas',
  '/ventas': 'Ventas',
  '/inventario': 'Inventario',
  '/historial': 'Historial de Ventas',
  '/caja': 'Caja',
  '/estadisticas': 'Estadísticas',
  '/configuracion': 'Configuración',
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Bloquea scroll del body cuando sidebar está abierto en mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  // Cierra sidebar al navegar (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const getTitle = () => {
    if (location.pathname.startsWith('/mesas/')) return 'Pedido de Mesa'
    return PAGE_TITLES[location.pathname] || 'Maryos POS'
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Header title={getTitle()} onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
