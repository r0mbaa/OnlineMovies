import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import movies from '../data/movies.json'

const listLabels = {
  watched: 'Просмотрено',
  watchLater: 'Буду смотреть',
  rated: 'Оценено'
}

const MovieDetails = ({ user, userLists, onAddToList, onRemoveFromList }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const movieId = Number(id)

  const movie = useMemo(() => movies.find((item) => item.id === movieId), [movieId, movies])

  useEffect(() => {
    console.log('[Movies] Requesting movie data', { endpoint: `/api/movies/${id}`, id: movieId })
  }, [id, movieId])

  if (!movie) {
    return (
      <section className="movie-detail missing">
        <div className="detail-card">
          <h2>Фильм не найден</h2>
          <p>Мы не смогли найти фильм с идентификатором {id}. Попробуйте выбрать другой фильм из каталога.</p>
          <div className="detail-actions">
            <button type="button" className="ghost-action" onClick={() => navigate(-1)}>
              Вернуться назад
            </button>
            <Link to="/" className="primary-action detail-link">
              На главную
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const toggleList = (listKey) => {
    if (!user) {
      console.log('[Lists] Anonymous user attempted to modify list, redirecting to login')
      navigate('/login')
      return
    }

    const isInList = userLists[listKey]?.includes(movieId)
    console.log('[Lists] Toggling movie list membership', {
      list: listKey,
      movieId,
      action: isInList ? 'remove' : 'add'
    })
    if (isInList) {
      onRemoveFromList(listKey, movieId)
    } else {
      onAddToList(listKey, movieId)
    }
  }

  return (
    <section className="movie-detail">
      <button type="button" className="ghost-action back-button" onClick={() => navigate(-1)}>
        ← Назад к списку
      </button>
      <div className="detail-card">
        <div className="detail-media">
          <img src={movie.poster} alt={movie.title} />
        </div>
        <div className="detail-content">
          <p className="detail-genre">
            {movie.genre} · {movie.year} · {movie.duration} мин
          </p>
          <h1>{movie.title}</h1>
          <p className="detail-description">{movie.description}</p>
          <div className="detail-meta">
            <div>
              <span className="detail-label">Рейтинг</span>
              <strong>{movie.rating.toFixed(1)}</strong>
            </div>
            <div>
              <span className="detail-label">Теги</span>
              <div className="detail-tags">
                {movie.tags.map((tag) => (
                  <span key={tag} className="movie-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className="primary-action"
              onClick={() => console.log('[Movies] Play trailer request sent to /api/movies/trailer', { movieId })}
            >
              Смотреть трейлер
            </button>
            <button type="button" className="ghost-action" onClick={() => navigate('/')}>
              На главную
            </button>
          </div>

          <div className="detail-lists">
            <h2>Добавить в коллекцию</h2>
            <div className="detail-list-buttons">
              {Object.entries(listLabels).map(([key, label]) => {
                const active = userLists[key]?.includes(movieId)
                return (
                  <button
                    key={key}
                    type="button"
                    className={`list-toggle${active ? ' active' : ''}`}
                    onClick={() => toggleList(key)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {!user && <p className="detail-hint">Войдите в аккаунт, чтобы сохранять фильмы в списки.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MovieDetails

