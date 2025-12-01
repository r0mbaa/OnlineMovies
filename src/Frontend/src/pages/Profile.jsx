import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../api/client'

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
  onRemoveFromList,
  onRateMovie,
  onChangePassword
}) => {
  const navigate = useNavigate()
  const [description, setDescription] = useState(user?.profileDescription || '')
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [descFeedback, setDescFeedback] = useState('')
  const [activeStatusId, setActiveStatusId] = useState(statuses[0]?.statusId?.toString() || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [ratingDrafts, setRatingDrafts] = useState({})
  const [listFeedback, setListFeedback] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    setActiveStatusId((prev) => {
      if (statuses.some((status) => String(status.statusId) === prev)) {
        return prev
      }
      return statuses[0]?.statusId?.toString() || ''
    })
  }, [statuses])

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

  const activeStatusEntries = groupedByStatus[Number(activeStatusId)] || []
  const activeStatusName = statuses.find((s) => String(s.statusId) === activeStatusId)?.name || 'Список'

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

  const handleRemoveMovie = async (movieId) => {
    try {
      await onRemoveFromList?.(movieId)
      setListFeedback('Фильм удалён из списка')
    } catch (err) {
      setListFeedback(err.message || 'Не удалось удалить фильм')
    }
  }

  const handleRateMovie = async (movieId) => {
    const draft = ratingDrafts[movieId] || {}
    if (!draft.score) return
    try {
      await onRateMovie?.({
        movieId,
        score: Number(draft.score),
        comment: draft.comment?.trim() || undefined
      })
      setRatingDrafts((prev) => ({ ...prev, [movieId]: { score: '', comment: '' } }))
    } catch (err) {
      setListFeedback(err.message || 'Не удалось сохранить оценку')
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordFeedback('')

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordFeedback('Заполните все поля')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback('Новые пароли не совпадают')
      return
    }

    setIsChangingPassword(true)
    try {
      await onChangePassword?.({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      })
      setPasswordFeedback('Пароль изменён')
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (err) {
      setPasswordFeedback(err.message || 'Не удалось изменить пароль')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handlePasswordFieldChange = (field) => (event) => {
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const avatarUrl = resolveAvatarUrl(user.avatarUrl)

  return (
    <section className="profile-page">
      <div className="profile-top">
        <div className="profile-info">
          <div className="profile-avatar-section">
            <div className="profile-avatar-frame">
              <div className="profile-avatar-preview">
                {avatarUrl ? <img src={avatarUrl} alt={user.username} /> : <span>{user.username?.charAt(0).toUpperCase()}</span>}
              </div>
            </div>
            <div className="profile-avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
                hidden
              />
              <button type="button" className="ghost-action" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}>
                {avatarUploading ? 'Загрузка...' : 'Изменить'}
              </button>
            </div>
          </div>
          <div className="profile-details">
            <div className="profile-identity">
              <h1>{user.username}</h1>
              <p>{user.email}</p>
              <small>Роль: {user.role}</small>
            </div>
              <div className="profile-security">
                <button
                  type="button"
                  className="ghost-action"
                  onClick={() => {
                    setShowPasswordForm((prev) => !prev)
                    setPasswordFeedback('')
                  }}
                >
                  {showPasswordForm ? 'Скрыть' : 'Изменить пароль'}
                </button>
                {showPasswordForm && (
                  <form className="profile-password-form" onSubmit={handlePasswordSubmit}>
                    <label>
                      Старый пароль
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={passwordForm.oldPassword}
                        onChange={handlePasswordFieldChange('oldPassword')}
                        placeholder="Введите текущий пароль"
                      />
                    </label>
                    <label>
                      Новый пароль
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordFieldChange('newPassword')}
                        placeholder="Введите новый пароль"
                      />
                    </label>
                    <label>
                      Повторите новый пароль
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordFieldChange('confirmPassword')}
                        placeholder="Повторите новый пароль"
                      />
                    </label>
                    <div className="profile-password-actions">
                      <button type="submit" className="primary-action" disabled={isChangingPassword}>
                        {isChangingPassword ? 'Сохраняем...' : 'Сохранить пароль'}
                      </button>
                      {passwordFeedback && <p className="profile-feedback">{passwordFeedback}</p>}
                    </div>
                  </form>
                )}
                {!showPasswordForm && passwordFeedback && <p className="profile-feedback">{passwordFeedback}</p>}
              </div>
            <form className="profile-description-form" onSubmit={handleDescriptionSubmit}>
              <label htmlFor="profileDescription">Описание профиля</label>
              <textarea
                id="profileDescription"
                name="profileDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Расскажите о любимых жанрах, режиссёрах и т.д."
                rows="4"
              />
              <div className="profile-description-actions">
                <button type="submit" className="primary-action" disabled={isSavingDescription}>
                  {isSavingDescription ? 'Сохраняем...' : 'Сохранить'}
                </button>
                {descFeedback && <p className="profile-feedback">{descFeedback}</p>}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="profile-lists">
        <div className="profile-status-tabs">
          {statuses.map((status) => (
            <button
              key={status.statusId}
              type="button"
              className={`profile-tab${activeStatusId === String(status.statusId) ? ' active' : ''}`}
              onClick={() => setActiveStatusId(String(status.statusId))}
            >
              {status.name}
              <span>{groupedByStatus[status.statusId]?.length || 0}</span>
            </button>
          ))}
        </div>
        <div className="profile-status-block">
          <div className="profile-status-header">
            <h3>{activeStatusName}</h3>
          </div>
          {listFeedback && <p className="profile-feedback">{listFeedback}</p>}
          <div className="profile-list-grid">
            {activeStatusEntries.length === 0 ? (
              <p className="profile-list-empty">В этом статусе пока нет фильмов.</p>
            ) : (
              activeStatusEntries.map((entry) => {
                const movie = entry.movie
                return (
                  <div key={entry.movieId} className="profile-list-card">
                    <div className="list-card-media">
                      {movie?.posterUrl ? <img src={movie.posterUrl} alt={entry.movieTitle} /> : <span>Нет постера</span>}
                    </div>
                    <div className="list-card-content">
                      <div className="list-card-header">
                        <div>
                          <h3>{entry.movieTitle}</h3>
                          <p>
                            {movie?.releaseYear || '—'} · {movie?.durationMinutes ? `${movie.durationMinutes} мин` : '—'}
                          </p>
                        </div>
                        <div className="list-card-score">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Оценка"
                            value={ratingDrafts[entry.movieId]?.score || ''}
                            onChange={(event) =>
                              setRatingDrafts((prev) => ({
                                ...prev,
                                [entry.movieId]: { ...(prev[entry.movieId] || {}), score: event.target.value }
                              }))
                            }
                          />
                          <button type="button" onClick={() => handleRateMovie(entry.movieId)} disabled={!ratingDrafts[entry.movieId]?.score}>
                            OK
                          </button>
                        </div>
                      </div>
                      <p className="list-card-comment">
                        Комментарий:
                        <input
                          type="text"
                          placeholder="Добавьте заметку"
                          value={ratingDrafts[entry.movieId]?.comment || ''}
                          onChange={(event) =>
                            setRatingDrafts((prev) => ({
                              ...prev,
                              [entry.movieId]: { ...(prev[entry.movieId] || {}), comment: event.target.value }
                            }))
                          }
                        />
                      </p>
                      <div className="list-card-actions">
                        <button type="button" className="profile-link" onClick={() => navigate(`/movies/${entry.movieId}`)}>
                          Открыть
                        </button>
                        <button type="button" className="profile-remove" onClick={() => handleRemoveMovie(entry.movieId)}>
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Profile

