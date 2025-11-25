import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { recommendationsApi } from '../api'

const RecommendedMovie = ({ user }) => {
  const [items, setItems] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await recommendationsApi.getMovieRecommendations()
      setItems(data || [])
      setIndex(0)
    } catch (err) {
      setError(err.message || 'Не удалось загрузить рекомендации')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadRecommendations()
    }
  }, [user])

  if (!user) {
    return (
      <section className="single-movie-page">
        <div className="single-movie-header">
          <div>
            <p className="single-label">Только для авторизованных</p>
            <h1>Персональные рекомендации</h1>
          </div>
        </div>
        <p>Войдите в систему, чтобы мы могли подобрать фильмы в зависимости от ваших жанровых предпочтений и списка просмотров.</p>
      </section>
    )
  }

  const current = items[index]

  return (
    <section className="single-movie-page">
      <div className="single-movie-header">
        <div>
          <p className="single-label">На основе ваших предпочтений</p>
          <h1>Рекомендованный фильм</h1>
        </div>
        <div className="single-actions">
          <button type="button" className="ghost-action" onClick={loadRecommendations} disabled={loading}>
            {loading ? 'Обновляем...' : 'Обновить список'}
          </button>
          <button
            type="button"
            className="ghost-action"
            onClick={() => setIndex((prev) => (items.length ? (prev + 1) % items.length : 0))}
            disabled={loading || items.length === 0}
          >
            Следующий
          </button>
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      {!error && items.length === 0 && !loading && <p>Мы пока не можем сформировать рекомендации. Заполните жанровые предпочтения в профиле.</p>}
      {current && (
        <div className="single-movie-card">
          <div className="single-media">
            {current.movie.posterUrl ? <img src={current.movie.posterUrl} alt={current.movie.title} /> : <span>Нет постера</span>}
          </div>
          <div className="single-content">
            <p className="detail-genre">
              {(current.movie.genres || []).map((genre) => genre.name).join(', ') || 'Жанр не указан'} · {current.movie.releaseYear || '—'} ·{' '}
              {current.movie.durationMinutes ? `${current.movie.durationMinutes} мин` : '—'}
            </p>
            <h2>{current.movie.title}</h2>
            <p className="detail-description">{current.movie.description || 'Описание отсутствует.'}</p>
            <p className="single-score">Совпадение: {(current.score * 100).toFixed(0)}%</p>
            <div className="detail-tags">
              {(current.movie.tags || []).map((tag) => (
                <span key={tag.id} className="movie-tag">
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="single-actions">
              <Link to={`/movies/${current.movie.movieId}`} className="primary-action">
                Подробнее
              </Link>
              <button
                type="button"
                className="ghost-action"
                onClick={() => setIndex((prev) => (items.length ? (prev + 1) % items.length : 0))}
                disabled={loading || items.length === 0}
              >
                Следующий фильм
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default RecommendedMovie


