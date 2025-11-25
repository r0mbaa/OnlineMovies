import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard'
import { moviesApi, recommendationsApi } from '../api'

const Home = ({ user }) => {
  const [movies, setMovies] = useState([])
  const [heroMovie, setHeroMovie] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recommendationsError, setRecommendationsError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadMovies = async () => {
      try {
        setLoading(true)
        setError('')
        const [list, randomMovie] = await Promise.all([moviesApi.getMovies(), moviesApi.getRandomMovie()])
        if (!isMounted) return
        setMovies(list || [])
        setHeroMovie(randomMovie || null)
      } catch (err) {
        if (!isMounted) return
        setError(err.message || 'Не удалось загрузить каталог')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMovies()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setRecommendations([])
      setRecommendationsError('')
      return
    }

    let isMounted = true

    const loadRecommendations = async () => {
      try {
        setRecommendationsError('')
        const data = await recommendationsApi.getMovieRecommendations()
        if (isMounted) {
          setRecommendations(data || [])
        }
      } catch (err) {
        if (isMounted) {
          setRecommendations([])
          setRecommendationsError(err.message || 'Не удалось получить рекомендации')
        }
      }
    }

    loadRecommendations()
    return () => {
      isMounted = false
    }
  }, [user])

  return (
    <div className="home-page">
      <section id="hero" className="hero-section">
        {heroMovie ? (
          <div className="hero-card">
            <div className="hero-content">
              <p className="hero-label">Случайный выбор</p>
              <h1>{heroMovie.title}</h1>
              <p className="hero-meta">
                {heroMovie.releaseYear || '—'} · {heroMovie.durationMinutes ? `${heroMovie.durationMinutes} мин` : 'Продолжительность неизвестна'}
              </p>
              <p className="hero-description">{heroMovie.description || 'Описание недоступно.'}</p>
              <div className="hero-actions">
                <Link className="primary-action" to={`/movies/${heroMovie.movieId}`}>
                  Смотреть детали
                </Link>
                <Link className="ghost-action" to="/random">
                  Другой фильм
                </Link>
              </div>
            </div>
            {heroMovie.posterUrl && (
              <aside className="hero-media">
                <img src={heroMovie.posterUrl} alt={heroMovie.title} loading="lazy" />
              </aside>
            )}
          </div>
        ) : (
          <div className="hero-placeholder">
            <p>Загружаем случайный фильм...</p>
          </div>
        )}
      </section>

      <section id="trending" className="movies-section">
        <div className="section-header">
          <h2>Каталог фильмов</h2>
          <p>Список, возвращаемый сервером (`GET /api/movies`).</p>
        </div>
        {loading ? (
          <p>Загрузка фильмов...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : movies.length === 0 ? (
          <p>Каталог пока пуст.</p>
        ) : (
          <div className="movie-row">
            <div className="movie-row-content">
              {movies.map((movie) => (
                <MovieCard key={movie.movieId} movie={movie} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="recommendations" className="movies-section">
        <div className="section-header">
          <h2>Персональные рекомендации</h2>
          {user ? <p>Сформированы на основе весов жанров и личного списка.</p> : <p>Войдите, чтобы получать персональные рекомендации.</p>}
        </div>
        {!user ? (
          <p>Авторизуйтесь, и мы начнём формировать подборки.</p>
        ) : recommendationsError ? (
          <p className="error-text">{recommendationsError}</p>
        ) : recommendations.length === 0 ? (
          <p>Пока ничего не подобрали. Добавьте жанровые предпочтения в профиле.</p>
        ) : (
          <div className="movie-row">
            <div className="movie-row-content">
              {recommendations.map((item) => (
                <MovieCard key={item.movie.movieId} movie={{ ...item.movie, score: item.score }} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Home


