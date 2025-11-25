import { Link, useLocation } from 'react-router-dom'
import ProfileMenu from './ProfileMenu'

const Header = ({ user, onLogout, theme, onToggleTheme }) => {
  const location = useLocation()
  const isDark = theme === 'dark'

  const isAdmin = user?.role === 'admin'

  const navItems = [
    { label: 'Главная', to: '/' },
    { label: 'Пользователи', to: '/users' },
    { label: 'Рекомендации', to: '/recommendations' },
    ...(user ? [{ label: 'Профиль', to: '/profile' }] : [])
  ]

  const quickLinks = [
    { label: 'Случайный фильм', to: '/random' },
    { label: 'Рекомендации дня', to: '/recommendations' },
    ...(isAdmin ? [{ label: '+ Создать фильм', to: '/admin/movies/new', accent: true }] : [])
  ]

  return (
    <header className="app-header">
      <div className="header-main">
        <Link to="/" className="brand">
          <span className="brand-icon">OM</span>
          <span className="brand-text">OnlineMovies</span>
        </Link>

        <nav className="app-nav">
          {navItems.map((item) =>
            item.to.startsWith('#') ? (
              <a key={item.to} className="nav-link" href={item.to}>
                {item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                className={`nav-link${location.pathname === item.to ? ' active' : ''}`}
                to={item.to}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className={`theme-toggle${isDark ? ' dark' : ' light'}`}
            onClick={onToggleTheme}
            aria-pressed={isDark}
            aria-label={`Переключить тему на ${isDark ? 'светлую' : 'тёмную'}`}
          >
            <svg className="theme-icon" viewBox="0 0 24 24" role="img" aria-hidden>
              <circle className="sun" cx="12" cy="12" r="5" />
              <path className="sun" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              <path className="moon" d="M21 12.79A9 9 0 1111.21 3 7.001 7.001 0 0021 12.79z" />
            </svg>
            <span className="theme-label">{isDark ? 'Ночь' : 'День'}</span>
          </button>
          <ProfileMenu user={user} onLogout={onLogout} />
        </div>
      </div>

      <div className="header-toolbar">
        <div className="toolbar-links">
          {quickLinks.map((link) => (
            <Link key={link.to} className={`header-quick-link${link.accent ? ' accent' : ''}`} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="toolbar-info">
          <span>База фильмов, подборки и социальные функции в одном месте</span>
        </div>
      </div>
    </header>
  )
}

export default Header

