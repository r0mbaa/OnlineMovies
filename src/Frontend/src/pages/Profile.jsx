import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import movies from '../data/movies.json'

const listTabs = [
  { key: 'watched', label: 'Просмотрено' },
  { key: 'watchLater', label: 'Буду смотреть' },
  { key: 'rated', label: 'Оценено' }
]

const Profile = ({ user, onUpdateUser, userLists, onAddToList, onRemoveFromList }) => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', bio: '' })
  const [activeTab, setActiveTab] = useState('watched')
  const [selectedMovie, setSelectedMovie] = useState('')

  useEffect(() => {
    console.log('[Profile] Opening profile page', { user: user?.email ?? 'guest' })
  }, [user])

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', bio: user.bio || '' })
    }
  }, [user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log('[Profile] Preparing request to update profile', form)
    onUpdateUser(form)
  }

  const handleAddMovie = () => {
    if (!selectedMovie) return
    const movieId = Number(selectedMovie)
    console.log('[Lists] Adding movie via profile form', { list: activeTab, movieId })
    onAddToList(activeTab, movieId)
    setSelectedMovie('')
  }

  const activeMovies = useMemo(() => {
    const ids = userLists[activeTab] || []
    return ids
      .map((movieId) => movies.find((item) => item.id === movieId))
      .filter(Boolean)
  }, [activeTab, userLists, movies])

  useEffect(() => {
    setSelectedMovie('')
  }, [activeTab])

  if (!user) {
    return (
      <section className="profile-page guest">
        <div className="profile-card">
          <h2>Это личный кабинет</h2>
          <p>Войдите или зарегистрируйтесь, чтобы управлять своими списками фильмов и данными профиля.</p>
          <div className="detail-actions">
            <button
              type="button"
              className="primary-action"
              onClick={() => {
                console.log('[Profile] Redirecting guest to login')
                navigate('/login')
              }}
            >
              Войти
            </button>
            <button
              type="button"
              className="ghost-action"
              onClick={() => {
                console.log('[Profile] Redirecting guest to register')
                navigate('/register')
              }}
            >
              Создать аккаунт
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="profile-page">
      <div className="profile-top">
        <div className="profile-info">
          <h1>Профиль {user.name}</h1>
          <p>Редактируйте данные, а также управляйте личными подборками фильмов.</p>
        </div>
        <div className="profile-stats">
          {listTabs.map((tab) => (
            <div key={tab.key}>
              <span>{tab.label}</span>
              <strong>{userLists[tab.key]?.length || 0}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-content">
        <form className="profile-form" onSubmit={handleSubmit}>
          <h2>Личные данные</h2>
          <label>
            Имя
            <input name="name" value={form.name} onChange={handleChange} placeholder="Имя" required />
          </label>
          <label>
            Электронная почта
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@mail.com" required />
          </label>
          <label>
            О себе
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Расскажите пару слов о ваших любимых жанрах"
              rows="4"
            />
          </label>
          <button type="submit" className="primary-action">
            Сохранить изменения
          </button>
        </form>

        <div className="profile-lists">
          <div className="profile-tabs">
            {listTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`profile-tab${tab.key === activeTab ? ' active' : ''}`}
                onClick={() => {
                  console.log('[Lists] Switching list tab', tab)
                  setActiveTab(tab.key)
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="profile-add">
            <select
              value={selectedMovie}
              onChange={(event) => setSelectedMovie(event.target.value)}
            >
              <option value="">Добавить фильм в раздел «{listTabs.find((tab) => tab.key === activeTab)?.label}»</option>
              {movies
                .filter((movie) => !(userLists[activeTab] || []).includes(movie.id))
                .map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
            </select>
            <button type="button" className="ghost-action" onClick={handleAddMovie} disabled={!selectedMovie}>
              Добавить
            </button>
          </div>

          <div className="profile-list-grid">
            {activeMovies.length === 0 ? (
              <p className="profile-list-empty">Здесь пока пусто. Добавьте фильмы, чтобы начать.</p>
            ) : (
              activeMovies.map((movie) => (
                <div key={movie.id} className="profile-list-card">
                  <div className="list-card-media">
                    <img src={movie.poster} alt={movie.title} />
                  </div>
                  <div className="list-card-content">
                    <h3>{movie.title}</h3>
                    <p>
                      {movie.genre} · {movie.year}
                    </p>
                    <div className="list-card-actions">
                      <button type="button" className="profile-link" onClick={() => navigate(`/movies/${movie.id}`)}>
                        Открыть страницу
                      </button>
                      <button
                        type="button"
                        className="profile-remove"
                        onClick={() => {
                          console.log('[Lists] Removing movie from tab', { list: activeTab, movieId: movie.id })
                          onRemoveFromList(activeTab, movie.id)
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Profile

