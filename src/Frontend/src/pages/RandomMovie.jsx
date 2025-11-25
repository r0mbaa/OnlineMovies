import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { moviesApi } from '../api'

const RandomMovie = () => {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRandom = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await moviesApi.getRandomMovie()
      setMovie(data)
    } catch (err) {
      setError(err.message || 'Не удалось получить случайный фильм')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRandom()
  }, [])

  return (
    <section className="single-movie-page">
      <div className="single-movie-header">
        <div>
          <p className="single-label">Экспромт для сегодняшнего вечера</p>
          <h1>Случайный фильм</h1>
        </div>
        <button type="button" className="ghost-action" onClick={loadRandom} disabled={loading}>
          {loading ? 'Ищем...' : 'Показать другой'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      {movie && (
        <div className="single-movie-card">
          <div className="single-media">
            {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} /> : <span>Нет постера</span>}
          </div>
          <div className="single-content">
            <p className="detail-genre">
              {(movie.genres || []).map((genre) => genre.name).join(', ') || 'Жанр не указан'} · {movie.releaseYear || '—'} ·{' '}
              {movie.durationMinutes ? `${movie.durationMinutes} мин` : '—'}
            </p>
            <h2>{movie.title}</h2>
            <p className="detail-description">{movie.description || 'Описание отсутствует.'}</p>
            <div className="detail-tags">
              {(movie.tags || []).map((tag) => (
                <span key={tag.id} className="movie-tag">
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="single-actions">
              <Link to={`/movies/${movie.movieId}`} className="primary-action">
                Подробнее
              </Link>
              <button type="button" className="ghost-action" onClick={loadRandom} disabled={loading}>
                {loading ? 'Ищем...' : 'Показать ещё'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default RandomMovie


