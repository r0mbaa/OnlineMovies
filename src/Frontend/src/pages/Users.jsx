import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '../api'

const Users = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleSearch = async (event) => {
    event?.preventDefault()
    await load(query)
  }

  const load = async (searchQuery) => {
    try {
      setLoading(true)
      setError('')
      const data = await usersApi.searchProfiles(searchQuery || undefined)
      setResults(data || [])
    } catch (err) {
      setResults([])
      setError(err.message || 'Не удалось загрузить пользователей')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
  }, [])

  return (
    <section className="users-page">
      <div className="users-header">
        <div>
          <p className="search-kicker">Сообщество</p>
          <h1>Пользователи OnlineMovies</h1>
          <p>Находите друзей по кинематографическим вкусам и заглядывайте в их публичные подборки.</p>
        </div>
        <form className="profile-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Начните вводить ник"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setError('')
            }}
          />
          <button type="submit" className="ghost-action" disabled={loading}>
            {loading ? 'Ищем...' : 'Найти'}
          </button>
        </form>
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading && results.length === 0 ? (
        <p>Загружаем пользователей...</p>
      ) : results.length === 0 ? (
        <p>Пока никого не нашли. Попробуйте другой запрос.</p>
      ) : (
        <div className="profile-search-results">
          {results.map((item) => (
            <div key={item.userId} className="profile-search-card">
              <div className="profile-search-avatar">
                {item.avatarUrl ? <img src={item.avatarUrl} alt={item.username} /> : <span>{item.username?.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="profile-search-body">
                <h3>{item.username}</h3>
                <p>{item.profileDescription || 'Пользователь ещё не добавил описание.'}</p>
                <div className="profile-search-meta">
                  <span>Роль: {item.role}</span>
                  <Link to={`/profiles/${item.username}`} className="profile-link">
                    Открыть профиль
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Users


