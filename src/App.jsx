import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { TablesProvider } from './contexts/TablesContext'
import MainLayout from './layouts/MainLayout'
import Loading from './components/ui/Loading'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TablesPage = lazy(() => import('./pages/TablesPage'))
const TableOrderPage = lazy(() => import('./pages/TableOrderPage'))
const SalesPage = lazy(() => import('./pages/SalesPage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const RecipesPage = lazy(() => import('./pages/RecipesPage'))
const SalesHistoryPage = lazy(() => import('./pages/SalesHistoryPage'))
const CashPage = lazy(() => import('./pages/CashPage'))
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function SuspenseWrapper({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <TablesProvider>
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
                <Route path="mesas" element={<SuspenseWrapper><TablesPage /></SuspenseWrapper>} />
                <Route path="mesas/:tableId" element={<SuspenseWrapper><TableOrderPage /></SuspenseWrapper>} />
                <Route path="ventas" element={<SuspenseWrapper><SalesPage /></SuspenseWrapper>} />
                <Route path="inventario" element={<SuspenseWrapper><InventoryPage /></SuspenseWrapper>} />
                <Route path="recetas" element={<SuspenseWrapper><RecipesPage /></SuspenseWrapper>} />
                <Route path="historial" element={<SuspenseWrapper><SalesHistoryPage /></SuspenseWrapper>} />
                <Route path="caja" element={<SuspenseWrapper><CashPage /></SuspenseWrapper>} />
                <Route path="estadisticas" element={<SuspenseWrapper><StatisticsPage /></SuspenseWrapper>} />
                <Route path="configuracion" element={<SuspenseWrapper><SettingsPage /></SuspenseWrapper>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TablesProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
