import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { moviesApi } from '../api'

const MovieDetails = ({ user, statuses, userMovies, onAddToList, onRemoveFromList, onRateMovie }) => {
  const { id } = useParams()
  const movieId = Number(id)
  const navigate = useNavigate()

  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatusId, setSelectedStatusId] = useState('')
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  const [adminActionMessage, setAdminActionMessage] = useState('')
  const [deletingMovie, setDeletingMovie] = useState(false)

  const entry = useMemo(() => userMovies.find((item) => item.movieId === movieId), [userMovies, movieId])
  
  // Проверяем, находится ли фильм в статусе "Просмотрено"
  const isWatched = useMemo(() => {
    if (!entry || !statuses.length) return false
    const watchedStatus = statuses.find((s) => s.name === 'Просмотрено')
    return watchedStatus && entry.statusId === watchedStatus.statusId
  }, [entry, statuses])

  useEffect(() => {
    setSelectedStatusId(entry?.statusId?.toString() || '')
    setRating(entry?.score?.toString() || '')
    setComment(entry?.comment || '')
  }, [entry])

  useEffect(() => {
    let isMounted = true

    const loadMovie = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await moviesApi.getMovie(movieId)
        if (isMounted) setMovie(data)
      } catch (err) {
        if (isMounted) setError(err.message || 'Фильм не найден')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMovie()
    return () => {
      isMounted = false
    }
  }, [movieId])

  if (loading) {
    return (
      <section className="movie-detail">
        <p>Загружаем данные фильма...</p>
      </section>
    )
  }

  if (error || !movie) {
    return (
      <section className="movie-detail missing">
        <div className="detail-card">
          <h2>Фильм не найден</h2>
          <p>{error || `Мы не нашли фильм с идентификатором ${id}.`}</p>
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

  const handleSaveStatus = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!selectedStatusId) return

    await onAddToList?.({
      movieId,
      statusId: Number(selectedStatusId)
    })
  }

  const handleRemove = async () => {
    await onRemoveFromList?.(movieId)
  }

  const handleRate = async () => {
    if (!rating) return
    await onRateMovie?.({
      movieId,
      score: Number(rating),
      comment: comment.trim() || undefined
    })
  }

  const handleDeleteMovie = async () => {
    if (!user?.role || user.role !== 'admin') {
      return
    }
    const confirmed = window.confirm(`Удалить фильм «${movie.title}»? Действие необратимо.`)
    if (!confirmed) {
      return
    }

    setDeletingMovie(true)
    setAdminActionMessage('')
    try {
      await moviesApi.deleteMovie(movieId)
      navigate('/')
    } catch (err) {
      setAdminActionMessage(err.message || 'Не удалось удалить фильм.')
    } finally {
      setDeletingMovie(false)
    }
  }

  return (
    <section className="movie-detail">
      <button type="button" className="ghost-action back-button" onClick={() => navigate(-1)}>
        ← Назад к списку
      </button>
      <div className="detail-card">
        <div className="detail-media">
          {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} /> : <span>Нет постера</span>}
        </div>
        <div className="detail-content">
          <p className="detail-genre">
            {(movie.genres || []).map((genre) => genre.name).join(', ') || 'Жанр не указан'} · {movie.releaseYear || '—'} ·{' '}
            {movie.durationMinutes ? `${movie.durationMinutes} мин` : '—'}
          </p>
          <h1>{movie.title}</h1>
          <p className="detail-description">{movie.description || 'Описание отсутствует.'}</p>
          <div className="detail-meta">
            <div>
              <span className="detail-label">Страны</span>
              <div className="detail-tags">
                {(movie.countries || []).map((country) => (
                  <span key={country.id} className="movie-tag">
                    {country.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="detail-label">Теги</span>
              <div className="detail-tags">
                {(movie.tags || []).map((tag) => (
                  <span key={tag.id} className="movie-tag">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <button type="button" className="primary-action" onClick={() => window.open(movie.trailers?.[0]?.url || '#', '_blank')}>
              Смотреть трейлер
            </button>
            <button type="button" className="ghost-action" onClick={() => navigate('/')}>
              На главную
            </button>
            {user?.role === 'admin' && (
              <>
                <button type="button" className="ghost-action" onClick={() => navigate(`/admin/movies/${movieId}/edit`)}>
                  Редактировать
                </button>
                <button type="button" className="profile-remove" onClick={handleDeleteMovie} disabled={deletingMovie}>
                  {deletingMovie ? 'Удаляем...' : 'Удалить фильм'}
                </button>
              </>
            )}
          </div>
          {adminActionMessage && <p className="error-text">{adminActionMessage}</p>}

          <div className="detail-lists">
            <h2>Управление фильмом</h2>
            {user ? (
              <>
                <div className="detail-list-controls">
                  <select value={selectedStatusId} onChange={(event) => setSelectedStatusId(event.target.value)}>
                    <option value="">Выберите статус</option>
                    {statuses.map((status) => (
                      <option key={status.statusId} value={status.statusId}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="primary-action" onClick={handleSaveStatus} disabled={!selectedStatusId}>
                    Сохранить статус
                  </button>
                  {entry && (
                    <button type="button" className="ghost-action" onClick={handleRemove}>
                      Удалить из списка
                    </button>
                  )}
                </div>
                {/* Показываем форму оценки только если фильм в статусе "Просмотрено" */}
                {isWatched && (
                  <div className="detail-rate">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="Оценка"
                      value={rating}
                      onChange={(event) => setRating(event.target.value)}
                    />
                    <input placeholder="Комментарий" value={comment} onChange={(event) => setComment(event.target.value)} />
                    <button type="button" onClick={handleRate} disabled={!rating}>
                      Оценить
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="detail-hint">Войдите в аккаунт, чтобы сохранять фильм в личных списках.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MovieDetails

