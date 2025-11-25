import { Link, useNavigate } from 'react-router-dom'

const MovieCard = ({ movie }) => {
  const navigate = useNavigate()
  const {
    movieId,
    posterUrl,
    title,
    description,
    releaseYear,
    durationMinutes,
    genres = [],
    tags = [],
    score
  } = movie

  const formattedGenres = Array.isArray(genres) && genres.length > 0 ? genres.map((item) => item.name ?? item).join(', ') : 'Жанр не указан'

  const tagLabels = Array.isArray(tags) ? tags.map((item) => item.name ?? item) : []

  const openDetails = () => {
    navigate(`/movies/${movieId}`)
  }

  return (
    <article className="movie-card">
      <Link className="movie-poster" to={`/movies/${movieId}`}>
        {posterUrl ? <img src={posterUrl} alt={title} loading="lazy" /> : <div className="poster-placeholder">Нет постера</div>}
        {typeof score === 'number' && (
          <span className="movie-rating">
            <span aria-hidden>★</span>
            {score.toFixed(1)}
          </span>
        )}
      </Link>
      <div className="movie-content">
        <div className="movie-meta">
          <span>{formattedGenres}</span>
          <span>
            {releaseYear || '—'} · {durationMinutes ? `${durationMinutes} мин` : '—'}
          </span>
        </div>
        <h3>{title}</h3>
        <p>{description || 'Описание отсутствует.'}</p>
        <div className="movie-tags">
          {tagLabels.map((tag) => (
            <span key={tag} className="movie-tag">
              {tag}
            </span>
          ))}
        </div>
        <button type="button" className="movie-cta" onClick={openDetails}>
          Подробнее
        </button>
      </div>
    </article>
  )
}

export default MovieCard

