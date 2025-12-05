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
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [modalRating, setModalRating] = useState('')
  const [modalComment, setModalComment] = useState('')

  const entry = useMemo(() => userMovies.find((item) => item.movieId === movieId), [userMovies, movieId])
  
  // Проверяем, находится ли фильм в статусе "Просмотрено"
  const isWatched = useMemo(() => {
    if (!entry || !statuses.length) return false
    const watchedStatus = statuses.find((s) => s.name === 'Просмотрено')
    return watchedStatus && entry.statusId === watchedStatus.statusId
  }, [entry, statuses])

  // Проверяем, находится ли фильм в статусе "Оценен"
  const isRated = useMemo(() => {
    if (!entry || !statuses.length) return false
    const ratedStatus = statuses.find((s) => s.name === 'Оценен')
    return ratedStatus && entry.statusId === ratedStatus.statusId
  }, [entry, statuses])

  // Фильтруем статусы, исключая "Оценен" из списка выбора
  const availableStatuses = useMemo(() => {
    return statuses.filter((s) => s.name !== 'Оценен')
  }, [statuses])

  useEffect(() => {
    setSelectedStatusId(entry?.statusId?.toString() || '')
    setRating(entry?.score?.toString() || '')
    setComment(entry?.comment || '')
    // Если фильм в статусе "Оценен", показываем его оценку и комментарий
    if (isRated) {
      setModalRating(entry?.score?.toString() || '')
      setModalComment(entry?.comment || '')
    }
  }, [entry, isRated])

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

  const handleOpenRatingModal = () => {
    setModalRating(entry?.score?.toString() || '')
    setModalComment(entry?.comment || '')
    setShowRatingModal(true)
  }

  const handleCloseRatingModal = () => {
    setShowRatingModal(false)
    setModalRating('')
    setModalComment('')
  }

  const handleSubmitRating = async () => {
    if (!modalRating) return
    await onRateMovie?.({
      movieId,
      score: Number(modalRating),
      comment: modalComment.trim() || undefined
    })
    handleCloseRatingModal()
  }

  const handleRemove = async () => {
    await onRemoveFromList?.(movieId)
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
                    {availableStatuses.map((status) => (
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
                {/* Показываем предложение оценить фильм, если он в статусе "Просмотрено" и еще не оценен */}
                {isWatched && !isRated && (
                  <div className="detail-rating-prompt">
                    <p>На основе того, что вы посмотрели этот фильм, не хотите ли вы его оценить?</p>
                    <button type="button" className="primary-action" onClick={handleOpenRatingModal}>
                      Оценить
                    </button>
                  </div>
                )}
                {/* Показываем информацию об оценке, если фильм уже оценен */}
                {isRated && (
                  <div className="detail-rating-info">
                    <p>
                      <strong>Ваша оценка:</strong> {entry?.score}/10
                    </p>
                    {entry?.comment && (
                      <p>
                        <strong>Комментарий:</strong> {entry.comment}
                      </p>
                    )}
                    <button type="button" className="ghost-action" onClick={handleOpenRatingModal}>
                      Изменить оценку
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

      {/* Модальное окно для оценки фильма */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={handleCloseRatingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Оценить фильм</h2>
              <button type="button" className="modal-close" onClick={handleCloseRatingModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <label>
                Оценка (1-10)
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={modalRating}
                  onChange={(e) => setModalRating(e.target.value)}
                  placeholder="Введите оценку от 1 до 10"
                  autoFocus
                />
              </label>
              <label>
                Комментарий (необязательно)
                <textarea
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
                  placeholder="Оставьте комментарий о фильме..."
                  rows="4"
                />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="ghost-action" onClick={handleCloseRatingModal}>
                Отмена
              </button>
              <button type="button" className="primary-action" onClick={handleSubmitRating} disabled={!modalRating}>
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default MovieDetails

