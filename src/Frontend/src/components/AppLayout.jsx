import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'

const AppLayout = ({ user, onLogout, theme, onToggleTheme }) => {
  const location = useLocation()

  return (
    <div className="app-shell">
      <Header user={user} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
      <main className="page-wrapper" data-route={location.pathname}>
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout

