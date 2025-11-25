import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../api/client'
import { moviesApi } from '../api'

const resolveAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null
  return avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`
}

const Profile = ({
  user,
  statuses,
  userMovies,
  onUpdateDescription,
  onUploadAvatar,
  onAddToList,
  onRemoveFromList,
  onRateMovie
}) => {
  const navigate = useNavigate()
  const [description, setDescription] = useState(user?.profileDescription || '')
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [descFeedback, setDescFeedback] = useState('')
  const [catalog, setCatalog] = useState([])
  const [catalogError, setCatalogError] = useState('')
  const [selectedStatusId, setSelectedStatusId] = useState('')
  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [listFeedback, setListFeedback] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [ratingValue, setRatingValue] = useState('')
  const [ratingComment, setRatingComment] = useState('')

  useEffect(() => {
    setDescription(user?.profileDescription || '')
  }, [user?.profileDescription])

  useEffect(() => {
    let isMounted = true
    moviesApi
      .getMovies()
      .then((data) => {
        if (isMounted) setCatalog(data || [])
      })
      .catch((err) => {
        if (isMounted) setCatalogError(err.message || 'Не удалось загрузить каталог фильмов')
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setListFeedback('')
  }, [selectedStatusId])

  if (!user) {
    return (
      <section className="profile-page guest">
        <div className="profile-card">
          <h2>Это личный кабинет</h2>
          <p>Войдите или зарегистрируйтесь, чтобы управлять своими списками фильмов и данными профиля.</p>
          <div className="detail-actions">
            <button type="button" className="primary-action" onClick={() => navigate('/login')}>
              Войти
            </button>
            <button type="button" className="ghost-action" onClick={() => navigate('/register')}>
              Создать аккаунт
            </button>
          </div>
        </div>
      </section>
    )
  }

  const groupedByStatus = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.statusId] = userMovies.filter((item) => item.statusId === status.statusId)
      return acc
    }, {})
  }, [statuses, userMovies])

  const handleDescriptionSubmit = async (event) => {
    event.preventDefault()
    setIsSavingDescription(true)
    setDescFeedback('')
    try {
      await onUpdateDescription?.({ profileDescription: description })
      setDescFeedback('Описание сохранено')
    } catch (err) {
      setDescFeedback(err.message || 'Не удалось сохранить описание')
    } finally {
      setIsSavingDescription(false)
    }
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      await onUploadAvatar?.(file)
    } catch (err) {
      setDescFeedback(err.message || 'Не удалось загрузить аватар')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleAddMovie = async () => {
    if (!selectedMovieId || !selectedStatusId) return
    try {
      await onAddToList?.({
        movieId: Number(selectedMovieId),
        statusId: Number(selectedStatusId)
      })
      setListFeedback('Фильм добавлен')
      setSelectedMovieId('')
    } catch (err) {
      setListFeedback(err.message || 'Не удалось добавить фильм')
    }
  }

  const handleRemoveMovie = async (movieId) => {
    try {
      await onRemoveFromList?.(movieId)
    } catch (err) {
      setListFeedback(err.message || 'Не удалось удалить фильм')
    }
  }

  const handleRateMovie = async (movieId) => {
    if (!ratingValue) return
    try {
      await onRateMovie?.({
        movieId,
        score: Number(ratingValue),
        comment: ratingComment.trim() || undefined
      })
      setRatingValue('')
      setRatingComment('')
    } catch (err) {
      setListFeedback(err.message || 'Не удалось сохранить оценку')
    }
  }

  const avatarUrl = resolveAvatarUrl(user.avatarUrl)

  return (
    <section className="profile-page">
      <div className="profile-top">
        <div className="profile-info">
          <div className="profile-avatar-preview">
            {avatarUrl ? <img src={avatarUrl} alt={user.username} /> : <span>{user.username?.charAt(0).toUpperCase()}</span>}
            <label className="profile-upload">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} disabled={avatarUploading} />
              {avatarUploading ? 'Загрузка...' : 'Изменить'}
            </label>
          </div>
          <div>
            <h1>{user.username}</h1>
            <p>{user.email}</p>
            <small>Роль: {user.role}</small>
          </div>
        </div>
        <div className="profile-stats">
          {statuses.map((status) => (
            <div key={status.statusId}>
              <span>{status.name}</span>
              <strong>{groupedByStatus[status.statusId]?.length || 0}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-content">
        <form className="profile-form" onSubmit={handleDescriptionSubmit}>
          <h2>Описание профиля</h2>
          <textarea
            name="profileDescription"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Расскажите о любимых жанрах, режиссёрах и т.д."
            rows="4"
          />
          <button type="submit" className="primary-action" disabled={isSavingDescription}>
            {isSavingDescription ? 'Сохраняем...' : 'Сохранить'}
          </button>
          {descFeedback && <p className="profile-feedback">{descFeedback}</p>}
        </form>

        <div className="profile-lists">
          <div className="profile-add">
            <h2>Управление списками</h2>
            <div className="profile-add-controls">
              <select value={selectedStatusId} onChange={(event) => setSelectedStatusId(event.target.value)}>
                <option value="">Выберите статус</option>
                {statuses.map((status) => (
                  <option key={status.statusId} value={status.statusId}>
                    {status.name}
                  </option>
                ))}
              </select>
              <select value={selectedMovieId} onChange={(event) => setSelectedMovieId(event.target.value)}>
                <option value="">Выберите фильм</option>
                {catalog.map((movie) => (
                  <option key={movie.movieId} value={movie.movieId}>
                    {movie.title}
                  </option>
                ))}
              </select>
              <button type="button" className="ghost-action" onClick={handleAddMovie} disabled={!selectedMovieId || !selectedStatusId}>
                Добавить
              </button>
            </div>
            {catalogError && <p className="error-text">{catalogError}</p>}
            {listFeedback && <p className="profile-feedback">{listFeedback}</p>}
          </div>

          {statuses.map((status) => {
            const entries = groupedByStatus[status.statusId] || []
            return (
              <div key={status.statusId} className="profile-status-block">
                <div className="profile-tabs">
                  <h3>{status.name}</h3>
                  <span>{entries.length} фильмов</span>
                </div>
                <div className="profile-list-grid">
                  {entries.length === 0 ? (
                    <p className="profile-list-empty">В этом статусе пока нет фильмов.</p>
                  ) : (
                    entries.map((entry) => {
                      const movie = entry.movie
                      return (
                        <div key={entry.movieId} className="profile-list-card">
                          <div className="list-card-media">
                            {movie?.posterUrl ? <img src={movie.posterUrl} alt={entry.movieTitle} /> : <span>Нет постера</span>}
                          </div>
                          <div className="list-card-content">
                            <h3>{entry.movieTitle}</h3>
                            <p>
                              {movie?.releaseYear || '—'} · {movie?.durationMinutes ? `${movie.durationMinutes} мин` : '—'}
                            </p>
                            {entry.score && <p>Оценка: {entry.score}/10</p>}
                            {entry.comment && <p className="profile-comment">Комментарий: {entry.comment}</p>}
                            <div className="list-card-actions">
                              <button type="button" className="profile-link" onClick={() => navigate(`/movies/${entry.movieId}`)}>
                                Открыть
                              </button>
                              <button type="button" className="profile-remove" onClick={() => handleRemoveMovie(entry.movieId)}>
                                Удалить
                              </button>
                            </div>
                            <div className="profile-rate">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                placeholder="Оценка"
                                value={ratingValue}
                                onChange={(event) => setRatingValue(event.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="Комментарий"
                                value={ratingComment}
                                onChange={(event) => setRatingComment(event.target.value)}
                              />
                              <button type="button" onClick={() => handleRateMovie(entry.movieId)} disabled={!ratingValue}>
                                Оценить
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Profile

