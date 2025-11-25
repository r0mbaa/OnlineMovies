import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../api/client'

const resolveAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null
  return avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`
}

const ProfileMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const avatarLetter = useMemo(() => {
    if (!user?.username) return 'G'
    return user.username.charAt(0).toUpperCase()
  }, [user])

  const avatarSrc = useMemo(() => resolveAvatarUrl(user?.avatarUrl), [user?.avatarUrl])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    console.log('[Auth] Triggering logout from profile menu')
    onLogout?.()
    setOpen(false)
    navigate('/')
  }

  const goToAuth = (path) => {
    console.log('[Auth] Redirecting to auth page', { destination: path })
    setOpen(false)
    navigate(path)
  }

  const goToProfile = () => {
    console.log('[Profile] Navigating to profile from dropdown')
    setOpen(false)
    navigate('/profile')
  }

  return (
    <div ref={containerRef} className={`profile-menu${open ? ' open' : ''}`}>
      <button
        type="button"
        className="profile-button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarSrc ? (
          <img className="profile-avatar" src={avatarSrc} alt={user?.username} />
        ) : (
          <span className="profile-avatar" aria-hidden>
            {avatarLetter}
          </span>
        )}
        <span className="profile-labels">
          <strong>{user?.username || 'Гость'}</strong>
          <small>{user?.email || 'Не авторизован'}</small>
        </span>
        <svg className="profile-caret" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M5.5 7.5L10 12.5L14.5 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="profile-dropdown" role="menu" aria-hidden={!open}>
        {user ? (
          <>
            <div className="profile-summary">
              <p>{user.email}</p>
              <span className="profile-status">Статус: онлайн</span>
            </div>
            <button type="button" className="profile-action" onClick={goToProfile}>
              Профиль
            </button>
            <button type="button" className="profile-action secondary" onClick={handleLogout}>
              Выйти
            </button>
          </>
        ) : (
          <>
            <div className="profile-summary">
              <p>Вы вошли как гость</p>
              <span className="profile-status">Войдите, чтобы сохранять любимые фильмы</span>
            </div>
            <button type="button" className="profile-action" onClick={() => goToAuth('/login')}>
              Войти
            </button>
            <button type="button" className="profile-action secondary" onClick={() => goToAuth('/register')}>
              Регистрация
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ProfileMenu

