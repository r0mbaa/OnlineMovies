import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { directoriesApi, recommendationsApi, userGenreInterestsApi } from '../api'

const RecommendedMovie = ({ user }) => {
  const navigate = useNavigate()
  const [genres, setGenres] = useState([])
  const [genreRatings, setGenreRatings] = useState({})
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [preferencesFeedback, setPreferencesFeedback] = useState('')
  const [preferencesError, setPreferencesError] = useState('')
  const [savingPreferences, setSavingPreferences] = useState(false)

  const [recommendations, setRecommendations] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState('')

  const loadGenres = async () => {
    try {
      const list = await directoriesApi.getGenres()
      setGenres((list || []).sort((a, b) => a.name.localeCompare(b.name, 'ru')))
    } catch (err) {
      setPreferencesError(err.message || 'Не удалось загрузить список жанров')
    }
  }

  const loadUserPreferences = async () => {
    if (!user) {
      setGenreRatings({})
      return
    }
    try {
      setRatingsLoading(true)
      const interests = await userGenreInterestsApi.get()
      const mapped = {}
      ;(interests || []).forEach((interest) => {
        mapped[interest.genreId] = Math.round((interest.weight || 0) * 10)
      })
      setGenreRatings(mapped)
    } catch (err) {
      setPreferencesError(err.message || 'Не удалось загрузить предпочтения')
      setGenreRatings({})
    } finally {
      setRatingsLoading(false)
    }
  }

  useEffect(() => {
    loadGenres()
  }, [])

  useEffect(() => {
    loadUserPreferences()
  }, [user])

  const displayedGenres = useMemo(() => genres, [genres])

  const handleRatingChange = (genreId, value) => {
    setGenreRatings((prev) => ({ ...prev, [genreId]: Number(value) }))
  }

  const handleResetPreferences = () => {
    setGenreRatings({})
    setPreferencesFeedback('')
    setPreferencesError('')
  }

  const handleSavePreferences = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setPreferencesError('')
    setPreferencesFeedback('')
    const interests = displayedGenres
      .map((genre) => {
        const rating = Number(genreRatings[genre.genreId] || 0)
        if (rating <= 0) {
          return null
        }
        return {
          genreId: genre.genreId,
          weight: Number((rating / 10).toFixed(2))
        }
      })
      .filter(Boolean)

    if (!interests.length) {
      setPreferencesError('Поставьте оценки хотя бы одному жанру (1–10). Значение 0 означает отсутствие интереса.')
      return
    }

    try {
      setSavingPreferences(true)
      await userGenreInterestsApi.update({ interests })
      setPreferencesFeedback('Предпочтения сохранены.')
    } catch (err) {
      setPreferencesError(err.message || 'Не удалось сохранить предпочтения')
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleFetchRecommendations = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setRecommendationsError('')
    try {
      setRecommendationsLoading(true)
      const data = await recommendationsApi.getMovieRecommendations()
      setRecommendations(data || [])
      setCurrentIndex(0)
    } catch (err) {
      setRecommendations([])
      setRecommendationsError(err.message || 'Не удалось получить рекомендации')
    } finally {
      setRecommendationsLoading(false)
    }
  }

  const handleNextRecommendation = () => {
    if (!recommendations.length) return
    setCurrentIndex((prev) => (prev + 1) % recommendations.length)
  }

  if (!user) {
    return (
      <section className="single-movie-page">
        <div className="single-movie-header">
          <div>
            <p className="single-label">Только для авторизованных</p>
            <h1>Персональные рекомендации</h1>
          </div>
        </div>
        <p>Войдите в систему, чтобы оценить жанры и получить персональный фильм.</p>
      </section>
    )
  }

  const current = recommendations[currentIndex]

  return (
    <section className="recommendations-page">
      <div className="preferences-card">
        <div className="preferences-header">
          <p className="search-kicker">Шаг 1</p>
          <h1>Оцените жанры от 0 до 10</h1>
          <p>0 — жанр не интересен, 10 — любимый. Мы конвертируем оценки в веса для рекомендательной системы.</p>
        </div>
        {ratingsLoading && <p>Загружаем ваши текущие предпочтения…</p>}
        {preferencesError && <p className="error-text">{preferencesError}</p>}
        <div className="preferences-grid">
          {displayedGenres.map((genre) => {
            const value = genreRatings[genre.genreId] ?? 0
            return (
              <div key={genre.genreId} className="preference-tile">
                <div className="preference-label">
                  <span>{genre.name}</span>
                  <strong>{value}</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={value}
                  onChange={(event) => handleRatingChange(genre.genreId, event.target.value)}
                />
                <div className="preference-scale">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="preference-actions">
          <button type="button" className="primary-action" onClick={handleSavePreferences} disabled={savingPreferences}>
            {savingPreferences ? 'Сохраняем…' : 'Сохранить предпочтения'}
          </button>
          <button type="button" className="ghost-action" onClick={handleResetPreferences} disabled={savingPreferences}>
            Сбросить оценки
          </button>
          {preferencesFeedback && <p className="success-text">{preferencesFeedback}</p>}
        </div>
      </div>

      <div className="recommendations-result-card">
        <div className="single-movie-header">
          <div>
            <p className="single-label">Шаг 2</p>
            <h1>Получите рекомендацию</h1>
          </div>
          <div className="single-actions">
            <button type="button" className="primary-action" onClick={handleFetchRecommendations} disabled={recommendationsLoading}>
              {recommendationsLoading ? 'Подбираем…' : 'Получить рекомендации'}
            </button>
            <button type="button" className="ghost-action" onClick={handleNextRecommendation} disabled={!recommendations.length}>
              Следующий фильм
            </button>
          </div>
        </div>
        {recommendationsError && <p className="error-text">{recommendationsError}</p>}
        {!recommendationsError && !recommendationsLoading && recommendations.length === 0 && (
          <p>Сохраните жанры и нажмите «Получить рекомендации», чтобы увидеть подходящий фильм.</p>
        )}
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
                <button type="button" className="ghost-action" onClick={handleNextRecommendation} disabled={!recommendations.length}>
                  Следующий фильм
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default RecommendedMovie



