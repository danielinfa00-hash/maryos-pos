import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Package,
  BookOpen,
  History,
  Wallet,
  BarChart3,
  Settings,
  X,
} from 'lucide-react'
import { NAV_ITEMS } from '../../utils/constants'

const ICONS = {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Package,
  BookOpen,
  History,
  Wallet,
  BarChart3,
  Settings,
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <img src="/logo.png" alt="Maryos POS Logo" className="sidebar__logo-img" />
          <div>
            <strong>Maryos POS</strong>
            <small>Sistema de restaurante</small>
          </div>
          <button className="sidebar__close-mobile" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon]
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                onClick={onClose}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
