import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { profileApi, usersApi } from '../api'
import { API_BASE_URL } from '../api/client'

const resolveAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null
  return avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`
}

const PublicProfile = ({ statuses, currentUser }) => {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeStatusId, setActiveStatusId] = useState(statuses[0]?.statusId?.toString() || '')
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [profileFeedback, setProfileFeedback] = useState('')
  const [savingDescription, setSavingDescription] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [identityForm, setIdentityForm] = useState({ username: '', email: '', role: 'user' })
  const [identityLoading, setIdentityLoading] = useState(false)
  const [identityMessage, setIdentityMessage] = useState('')
  const fileInputRef = useRef(null)
  const canEdit = currentUser?.role === 'admin'

  useEffect(() => {
    setActiveStatusId((prev) => {
      if (statuses.some((status) => String(status.statusId) === prev)) {
        return prev
      }
      return statuses[0]?.statusId?.toString() || ''
    })
  }, [statuses])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [profileData, moviesData] = await Promise.all([
          usersApi.getPublicProfile(username),
          usersApi.getPublicMovies(username)
        ])
        if (!isMounted) return
        setProfile(profileData)
        setDescriptionDraft(profileData.profileDescription || '')
        setMovies(moviesData || [])
      } catch (err) {
        if (!isMounted) return
        setError(err.message || 'Не удалось загрузить профиль')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [username])

  useEffect(() => {
    if (!canEdit || !profile?.userId) {
      return
    }

    let ignore = false

    const loadIdentity = async () => {
      try {
        setIdentityLoading(true)
        setIdentityMessage('')
        const adminDetails = await usersApi.getUser(profile.userId)
        if (ignore) return
        setIdentityForm({
          username: adminDetails.username || '',
          email: adminDetails.email || '',
          role: adminDetails.role || 'user'
        })
      } catch (err) {
        if (ignore) return
        setIdentityMessage(err.message || 'Не удалось загрузить данные пользователя.')
      } finally {
        if (!ignore) {
          setIdentityLoading(false)
        }
      }
    }

    loadIdentity()
    return () => {
      ignore = true
    }
  }, [canEdit, profile?.userId])

  const groupedByStatus = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.statusId] = movies.filter((item) => item.statusId === status.statusId)
      return acc
    }, {})
  }, [statuses, movies])

  const activeStatusEntries = groupedByStatus[Number(activeStatusId)] || []
  const activeStatusName = statuses.find((s) => String(s.statusId) === activeStatusId)?.name || 'Список'

  if (loading) {
    return (
      <section className="profile-page">
        <p>Загружаем профиль...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="profile-page">
        <p className="error-text">{error}</p>
        <button type="button" className="ghost-action" onClick={() => navigate(-1)}>
          Назад
        </button>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="profile-page">
        <p>Профиль не найден.</p>
        <button type="button" className="ghost-action" onClick={() => navigate(-1)}>
          Назад
        </button>
      </section>
    )
  }

  const handleAdminDescriptionSave = async (event) => {
    event.preventDefault()
    if (!canEdit || !profile) return
    setSavingDescription(true)
    setProfileFeedback('')
    try {
      const updated = await profileApi.updateDescriptionForUser(profile.userId, { profileDescription: descriptionDraft })
      setProfile((prev) => (prev ? { ...prev, profileDescription: updated.profileDescription } : updated))
      setProfileFeedback('Описание обновлено')
    } catch (err) {
      setProfileFeedback(err.message || 'Не удалось сохранить описание.')
    } finally {
      setSavingDescription(false)
    }
  }

  const handleAdminAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !canEdit || !profile) return
    setAvatarUploading(true)
    setProfileFeedback('')
    try {
      const updated = await profileApi.uploadAvatarForUser(profile.userId, file)
      setProfile((prev) => (prev ? { ...prev, avatarUrl: updated.avatarUrl } : updated))
      setProfileFeedback('Аватар обновлён')
    } catch (err) {
      setProfileFeedback(err.message || 'Не удалось загрузить аватар.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleIdentityChange = (event) => {
    const { name, value } = event.target
    setIdentityForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleIdentitySubmit = async (event) => {
    event.preventDefault()
    if (!canEdit || !profile) return
    setIdentityLoading(true)
    setIdentityMessage('')
    try {
      const payload = {
        username: identityForm.username.trim(),
        email: identityForm.email.trim(),
        role: identityForm.role
      }
      const updated = await usersApi.updateUser(profile.userId, payload)
      setProfile((prev) => (prev ? { ...prev, username: updated.username, role: updated.role } : prev))
      setIdentityForm({
        username: updated.username,
        email: updated.email,
        role: updated.role
      })
      setIdentityMessage('Данные обновлены')
      if (updated.username && updated.username !== profile.username) {
        navigate(`/profiles/${updated.username}`, { replace: true })
      }
    } catch (err) {
      setIdentityMessage(err.message || 'Не удалось обновить данные.')
    } finally {
      setIdentityLoading(false)
    }
  }

  const avatarUrl = resolveAvatarUrl(profile?.avatarUrl)

  const handleDeleteUser = async () => {
    if (!canEdit || !profile) return
    const confirmed = window.confirm(`Удалить пользователя «${profile.username}»? Его данные будут потеряны.`)
    if (!confirmed) {
      return
    }

    setDeletingUser(true)
    setProfileFeedback('')
    try {
      await usersApi.deleteUser(profile.userId)
      navigate('/users')
    } catch (err) {
      setProfileFeedback(err.message || 'Не удалось удалить пользователя.')
    } finally {
      setDeletingUser(false)
    }
  }

  return (
    <section className="profile-page">
      <div className="profile-top">
        <div className="profile-info">
          <div className="profile-avatar-section">
            <div className="profile-avatar-frame">
              <div className="profile-avatar-preview">
                {avatarUrl ? <img src={avatarUrl} alt={profile.username} /> : <span>{profile.username?.charAt(0).toUpperCase()}</span>}
              </div>
            </div>
            <span className="profile-public-label">Публичный профиль</span>
            {canEdit && (
              <div className="profile-avatar-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAdminAvatarChange}
                  hidden
                  disabled={avatarUploading}
                />
                <button type="button" className="ghost-action" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}>
                  {avatarUploading ? 'Загрузка...' : 'Изменить аватар'}
                </button>
              </div>
            )}
          </div>
          <div className="profile-details">
            <div className="profile-identity">
              <h1>{profile.username}</h1>
              <small>Роль: {profile.role}</small>
            </div>
            {canEdit ? (
              <form className="profile-description-form" onSubmit={handleAdminDescriptionSave}>
                <label htmlFor="adminProfileDescription">Описание профиля</label>
                <textarea
                  id="adminProfileDescription"
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  rows="4"
                />
                <div className="profile-description-actions">
                  <button type="submit" className="primary-action" disabled={savingDescription}>
                    {savingDescription ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                  {profileFeedback && <p className="profile-feedback">{profileFeedback}</p>}
                </div>
              </form>
            ) : (
              <div className="profile-description-static">
                <h2>Описание профиля</h2>
                <p>{profile.profileDescription || 'Пользователь ещё ничего о себе не рассказал.'}</p>
              </div>
            )}
            {canEdit && (
              <form className="profile-identity-form" onSubmit={handleIdentitySubmit}>
                <div className="profile-identity-grid">
                  <label>
                    <span>Никнейм</span>
                    <input name="username" value={identityForm.username} onChange={handleIdentityChange} required />
                  </label>
                  <label>
                    <span>Email</span>
                    <input name="email" type="email" value={identityForm.email} onChange={handleIdentityChange} required />
                  </label>
                  <label>
                    <span>Роль</span>
                    <select name="role" value={identityForm.role} onChange={handleIdentityChange}>
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </label>
                </div>
                <div className="profile-description-actions">
                  <button type="submit" className="ghost-action" disabled={identityLoading}>
                    {identityLoading ? 'Обновляем...' : 'Обновить данные'}
                  </button>
                  {identityMessage && <p className="profile-feedback">{identityMessage}</p>}
                </div>
              </form>
            )}
            {canEdit && (
              <div className="profile-description-actions">
                <button type="button" className="profile-remove" onClick={handleDeleteUser} disabled={deletingUser}>
                  {deletingUser ? 'Удаляем…' : 'Удалить пользователя'}
                </button>
              </div>
            )}
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
            <Link to="/" className="profile-link">
              Вернуться на главную
            </Link>
          </div>
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
                        {entry.score && <div className="list-card-score-static">Оценка: {entry.score}</div>}
                      </div>
                      {entry.comment && (
                        <p className="list-card-comment read-only">
                          Комментарий: <span>{entry.comment}</span>
                        </p>
                      )}
                      <div className="list-card-actions">
                        <Link className="profile-link" to={`/movies/${entry.movieId}`}>
                          Открыть
                        </Link>
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

export default PublicProfile


