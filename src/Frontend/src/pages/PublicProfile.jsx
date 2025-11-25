import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usersApi } from '../api'

const PublicProfile = ({ statuses }) => {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeStatusId, setActiveStatusId] = useState(statuses[0]?.statusId?.toString() || '')

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

  return (
    <section className="profile-page">
      <div className="profile-top">
        <div className="profile-info">
          <div className="profile-avatar-section">
            <div className="profile-avatar-frame">
              <div className="profile-avatar-preview">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.username} /> : <span>{profile.username?.charAt(0).toUpperCase()}</span>}
              </div>
            </div>
            <span className="profile-public-label">Публичный профиль</span>
          </div>
          <div className="profile-details">
            <div className="profile-identity">
              <h1>{profile.username}</h1>
              <small>Роль: {profile.role}</small>
            </div>
            <div className="profile-description-static">
              <h2>Описание профиля</h2>
              <p>{profile.profileDescription || 'Пользователь ещё ничего о себе не рассказал.'}</p>
            </div>
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


