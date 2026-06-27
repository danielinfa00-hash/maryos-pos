import { Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function Header({ onMenuClick, title }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={onMenuClick} aria-label="Menú">
          <Menu size={22} />
        </button>
        <h1 className="header__title">{title}</h1>
      </div>

      <div className="header__right">
        <button className="header__icon-btn" onClick={toggleTheme} aria-label="Cambiar tema">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}
